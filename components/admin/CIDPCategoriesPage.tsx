"use client";

/**
 * CIDPCategoriesPage
 *
 * Three-role workflow for CIDP Key Output project categories:
 *
 *  ADMIN   → uploads PDF, extracts categories, triggers AI name cleaning
 *  SECTOR  → reviews/edits/adds categories, saves draft, submits for ME review
 *  ME      → reviews submitted categories, can approve or request changes
 *            (per-field change suggestions each with a mandatory reason)
 *  SECTOR  → sees exactly what changed and why, acknowledges, re-edits, re-submits
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Upload,
  Loader2,
  FileText,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock,
  MessageSquare,
  Eye,
  Filter,
  Search,
  ArrowUpDown,
  Building2,
  Target,
  Wallet,
} from "lucide-react";
import {
  addCategory,
  acknowledgeChanges,
  approveCategories,
  batchCreateCategories,
  deleteCategory,
  getCategories,
  getCategoryWithNotes,
  requestChanges,
  submitForReview,
  updateCategory,
  type CategoryStatus,
  type FieldChange,
  type ProjectCategory,
  type ReviewNote,
} from "@/lib/actions/categoryActions";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SECTORS } from "@/lib/data/data";

// ─── Config ───────────────────────────────────────────────────────────────────

const FASTAPI_BASE =
  process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
const EXTRACT_URL = `${FASTAPI_BASE}/extract-cidp-categories`;
const CLEAN_URL = `${FASTAPI_BASE}/clean-category-names`;

// Role passed as prop — in production derive from session
type Role = "ADMIN" | "SECTOR" | "ME";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBudget(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n.toLocaleString()}`;
}

function formatTarget(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

const STATUS_CONFIG: Record<
  CategoryStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    label: "Draft",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <Pencil className="w-3 h-3" />,
  },
  PENDING_REVIEW: {
    label: "Pending Review",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  CHANGES_REQUESTED: {
    label: "Changes Requested",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    icon: <MessageSquare className="w-3 h-3" />,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

const FIELD_LABELS: Record<string, string> = {
  name: "Category Name",
  sector: "Sector",
  target: "Target",
  budget: "Budget (KSh)",
};

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CategoryStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
        cfg.color,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Extraction preview table ─────────────────────────────────────────────────

interface ExtractedItem {
  name: string;
  sector: string | null;
  target: number | null;
  budget: number | null;
}

function ExtractionPreview({
  items,
  onSave,
  onDiscard,
}: {
  items: ExtractedItem[];
  onSave: () => Promise<void>;
  onDiscard: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const preview = items.slice(0, 8);
  const remaining = items.length - preview.length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
        <div>
          <p className="text-sm font-semibold">
            {items.length} categories extracted
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review before saving to database
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            disabled={saving}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Discard
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" /> Save all {items.length}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground w-8">
                #
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                Category Name
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                Sector
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                Target
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                Budget
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {preview.map((item, i) => (
              <tr key={i} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                  {i + 1}
                </td>
                <td className="px-4 py-2.5 font-medium max-w-xs truncate">
                  {item.name}
                </td>
                <td className="px-4 py-2.5">
                  {item.sector ? (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                      {item.sector}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {formatTarget(item.target)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {formatBudget(item.budget)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {remaining > 0 && (
        <div className="px-4 py-3 border-t border-border/60 text-xs text-muted-foreground text-center">
          …and {remaining} more categories not shown
        </div>
      )}
    </div>
  );
}

// ─── ReviewNotesPanel ─────────────────────────────────────────────────────────

function ReviewNotesPanel({
  notes,
  onAcknowledge,
}: {
  notes: ReviewNote[];
  onAcknowledge: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const open = notes.filter((n) => n.resolvedAt === null);
  if (open.length === 0) return null;

  const handleAck = async () => {
    setLoading(true);
    try {
      await onAcknowledge();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-600" />
          <p className="text-sm font-semibold text-orange-800">
            {open.length} change{open.length !== 1 ? "s" : ""} requested by ME
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-orange-300 text-orange-700 hover:bg-orange-100"
          onClick={handleAck}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "Acknowledge & Edit"
          )}
        </Button>
      </div>
      <div className="space-y-2">
        {open.map((note) => (
          <div
            key={note.id}
            className="bg-white rounded-lg border border-orange-200 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  {FIELD_LABELS[note.field] ?? note.field}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="line-through text-muted-foreground">
                    {note.originalValue}
                  </span>
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground rotate-90" />
                  <span className="font-medium text-orange-700">
                    {note.suggestedValue}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600 bg-orange-50 rounded p-2">
              <span className="font-medium">Reason: </span>
              {note.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MEReviewDrawer ───────────────────────────────────────────────────────────

interface PendingChange {
  field: "name" | "target" | "budget" | "sector";
  suggestedValue: string;
  reason: string;
}

function MEReviewDrawer({
  category,
  onApprove,
  onSendBack,
  onClose,
}: {
  category: ProjectCategory;
  onApprove: () => Promise<void>;
  onSendBack: (changes: FieldChange[]) => Promise<void>;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [approving, setApproving] = useState(false);
  const [sending, setSending] = useState(false);
  const [changes, setChanges] = useState<Record<string, PendingChange>>({});

  const fields: Array<{
    key: "name" | "target" | "budget" | "sector";
    label: string;
    value: string;
    type: "text" | "number";
  }> = [
    { key: "name", label: "Category Name", value: category.name, type: "text" },
    {
      key: "sector",
      label: "Sector",
      value: category.sector ?? "",
      type: "text",
    },
    {
      key: "target",
      label: "Target (5-yr sum)",
      value: String(category.target ?? ""),
      type: "number",
    },
    {
      key: "budget",
      label: "Budget (KSh)",
      value: String(category.budget ?? ""),
      type: "number",
    },
  ];

  function setChange(
    field: "name" | "target" | "budget" | "sector",
    val: string,
    reason: string,
    original: string,
  ) {
    setChanges((prev) => ({
      ...prev,
      [field]: {
        field,
        suggestedValue: val,
        reason,
        originalValue: original,
      } as any,
    }));
  }

  function removeChange(field: string) {
    setChanges((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  }

  const handleApprove = async () => {
    setApproving(true);
    try {
      await onApprove();
    } finally {
      setApproving(false);
    }
  };

  const handleSendBack = async () => {
    const changeList: FieldChange[] = Object.values(changes).map((c: any) => ({
      field: c.field,
      originalValue: c.originalValue ?? "",
      suggestedValue: c.suggestedValue,
      reason: c.reason,
    }));
    if (changeList.length === 0) {
      toast.error("Add at least one change with a reason before sending back.");
      return;
    }
    const missingReason = changeList.find((c) => !c.reason.trim());
    if (missingReason) {
      toast.error(
        `Provide a reason for the "${FIELD_LABELS[missingReason.field]}" change.`,
      );
      return;
    }
    setSending(true);
    try {
      await onSendBack(changeList);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-background w-full max-w-xl sm:rounded-2xl shadow-2xl border border-border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-semibold">Review Category</p>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">
              {category.name}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("view")}
              className={cn(
                "flex-1 text-xs py-2 rounded-lg border transition-colors",
                mode === "view"
                  ? "border-primary bg-primary/5 text-primary font-semibold"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" /> View
            </button>
            <button
              onClick={() => setMode("edit")}
              className={cn(
                "flex-1 text-xs py-2 rounded-lg border transition-colors",
                mode === "edit"
                  ? "border-orange-400 bg-orange-50 text-orange-700 font-semibold"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <MessageSquare className="w-3.5 h-3.5 inline mr-1" /> Suggest
              Changes
            </button>
          </div>

          {mode === "view" ? (
            /* ── View mode ── */
            <div className="space-y-3">
              {fields.map((f) => (
                <div
                  key={f.key}
                  className="rounded-lg border border-border p-3"
                >
                  <p className="text-xs text-muted-foreground font-medium">
                    {f.label}
                  </p>
                  <p className="text-sm font-semibold mt-0.5">
                    {f.key === "budget"
                      ? formatBudget(category.budget)
                      : f.key === "target"
                        ? formatTarget(category.target)
                        : f.value || "—"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            /* ── Edit/suggest mode ── */
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Suggest changes below. Each change requires a reason before
                sending back.
              </p>
              {fields.map((f) => {
                const pending = changes[f.key];
                return (
                  <div
                    key={f.key}
                    className={cn(
                      "rounded-xl border p-3 space-y-2 transition-colors",
                      pending
                        ? "border-orange-300 bg-orange-50/50"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {f.label}
                      </p>
                      {pending && (
                        <button
                          onClick={() => removeChange(f.key)}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-muted-foreground line-through shrink-0">
                        {f.key === "budget"
                          ? formatBudget(category.budget)
                          : f.key === "target"
                            ? formatTarget(category.target)
                            : f.value || "—"}
                      </span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <Input
                        type={f.type}
                        placeholder={`New ${f.label.toLowerCase()}…`}
                        className="h-7 text-xs"
                        value={pending?.suggestedValue ?? ""}
                        onChange={(e) =>
                          setChange(
                            f.key,
                            e.target.value,
                            pending?.reason ?? "",
                            f.value,
                          )
                        }
                      />
                    </div>
                    {pending?.suggestedValue && (
                      <div>
                        <Textarea
                          placeholder="Reason for this change (required)…"
                          className="text-xs min-h-[60px] resize-none"
                          value={pending.reason}
                          onChange={(e) =>
                            setChange(
                              f.key,
                              pending.suggestedValue,
                              e.target.value,
                              f.value,
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-border flex gap-2">
          <Button
            className="flex-1"
            onClick={handleApprove}
            disabled={approving || sending}
          >
            {approving ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            Approve
          </Button>
          {mode === "edit" && Object.keys(changes).length > 0 && (
            <Button
              variant="outline"
              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
              onClick={handleSendBack}
              disabled={approving || sending}
            >
              {sending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              )}
              Send Back ({Object.keys(changes).length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CategoryRow ──────────────────────────────────────────────────────────────

function CategoryRow({
  category,
  role,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onReviewOpen,
}: {
  category: ProjectCategory;
  role: string;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (data: Partial<ProjectCategory>) => Promise<void>;
  onDelete: () => Promise<void>;
  onReviewOpen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...category });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canEdit =
    role === "viewer" ||
    (role === "sector" &&
      (category.status === "DRAFT" || category.status === "CHANGES_REQUESTED"));

  const hasOpenNotes =
    category.reviewNotes?.some((n) => n.resolvedAt === null) ?? false;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        name: draft.name,
        sector: draft.sector ?? undefined,
        target: draft.target ?? undefined,
        budget: draft.budget ?? undefined,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this category?")) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "border rounded-xl overflow-hidden transition-all",
        isSelected ? "border-primary/60 shadow-sm" : "border-border",
        hasOpenNotes && "border-orange-300",
      )}
    >
      {/* Row summary */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors",
          isSelected && "bg-primary/3",
        )}
        onClick={() => {
          onSelect();
          setExpanded((e) => !e);
        }}
      >
        <button className="shrink-0 text-muted-foreground">
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform",
              expanded && "rotate-90",
            )}
          />
        </button>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{category.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {category.sector ?? "No sector"}
          </p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-xs font-semibold font-mono">
              {formatTarget(category.target)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-xs font-semibold font-mono">
              {formatBudget(category.budget)}
            </p>
          </div>
        </div>

        {/* Status + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={category.status} />
          {role === "me" && category.status === "PENDING_REVIEW" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onReviewOpen();
              }}
            >
              Review
            </Button>
          )}
          {hasOpenNotes && role === "SECTOR" && (
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4 bg-muted/20">
          {/* Review notes for SECTOR */}
          {role === "sector" &&
            category.reviewNotes &&
            category.reviewNotes.length > 0 && (
              <ReviewNotesPanel
                notes={category.reviewNotes}
                onAcknowledge={async () => {
                  await acknowledgeChanges(category.id);
                  toast.success(
                    "Changes acknowledged — you can now re-edit and re-submit.",
                  );
                }}
              />
            )}

          {/* Edit form */}
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    Category Name
                  </label>
                  <Input
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, name: e.target.value }))
                    }
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    Sector
                  </label>
                  <Input
                    value={draft.sector ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, sector: e.target.value }))
                    }
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    Target (5-yr sum)
                  </label>
                  <Input
                    type="number"
                    value={draft.target ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        target: Number(e.target.value) || null,
                      }))
                    }
                    className="mt-1 h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    Budget (KSh)
                  </label>
                  <Input
                    type="number"
                    value={draft.budget ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        budget: Number(e.target.value) || null,
                      }))
                    }
                    className="mt-1 h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDraft({ ...category });
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            /* Read-only detail view */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: <Building2 className="w-3.5 h-3.5" />,
                  label: "Sector",
                  value: category.sector ?? "—",
                },
                {
                  icon: <Target className="w-3.5 h-3.5" />,
                  label: "Target",
                  value: formatTarget(category.target),
                },
                {
                  icon: <Wallet className="w-3.5 h-3.5" />,
                  label: "Budget",
                  value: formatBudget(category.budget),
                },
                {
                  icon: <Clock className="w-3.5 h-3.5" />,
                  label: "Updated",
                  value: new Date(category.updatedAt).toLocaleDateString(),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-background rounded-lg border border-border p-2.5"
                >
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    {item.icon}
                    <span className="text-xs">{item.label}</span>
                  </div>
                  <p className="text-sm font-semibold truncate">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Row actions */}
          {canEdit && !editing && (
            <div className="flex items-center gap-2 justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3 mr-1" />
                )}
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setEditing(true)}
              >
                <Pencil className="w-3 h-3 mr-1" /> Edit
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AddCategoryForm ──────────────────────────────────────────────────────────

function AddCategoryForm({
  onAdd,
}: {
  onAdd: (data: {
    name: string;
    sector?: string;
    target?: number;
    budget?: number;
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sector, setSector] = useState(""); // empty string = no sector
  const [target, setTarget] = useState("");
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        name: name.trim(),
        sector: sector.trim() === "" ? undefined : sector.trim(),
        target: target ? Number(target) : undefined,
        budget: budget ? Number(budget) : undefined,
      });
      setName("");
      setSector("");
      setTarget("");
      setBudget("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-xl py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
      >
        <Plus className="w-4 h-4" /> Add category manually
      </button>
    );
  }

  // Filter out "ALL" from sector options for category assignment
  const sectorOptions = SECTORS.filter((s) => s !== "ALL");

  return (
    <div className="border border-primary/30 rounded-xl p-4 space-y-3 bg-primary/3">
      <p className="text-sm font-semibold">New Category</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground font-medium">
            Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 h-8 text-sm"
            placeholder="Category name"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">
            Sector
          </label>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="mt-1 h-8 text-sm">
              <SelectValue placeholder="Select sector" />
            </SelectTrigger>
            <SelectContent>
              {sectorOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">
            Target (5-yr sum)
          </label>
          <Input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium">
            Budget (KSh)
          </label>
          <Input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="mt-1 h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface CIDPCategoriesPageProps {
  userRole: string;
  userEmail?: string;
  // Server-loaded initial categories (optional, for SSR usage)
  initialCategories?: ProjectCategory[];
}

export default function CIDPCategoriesPage({
  userRole,
  userEmail,
  initialCategories = [],
}: CIDPCategoriesPageProps) {
  const [categories, setCategories] =
    useState<ProjectCategory[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);

  // Extraction state (ADMIN only)
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [step, setStep] = useState("");
  const [extracted, setExtracted] = useState<ExtractedItem[] | null>(null);
  const [extractErr, setExtractErr] = useState<string | null>(null);

  // Filter/search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CategoryStatus | "ALL">(
    "ALL",
  );
  const [sectorFilter, setSectorFilter] = useState<string>("ALL");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ME review drawer
  const [reviewTarget, setReviewTarget] = useState<ProjectCategory | null>(
    null,
  );

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      // Enrich with review notes for SECTOR view
      if (userRole === "sector") {
        const enriched = await Promise.all(
          data.map(async (c) => {
            if (c.status === "CHANGES_REQUESTED") {
              const full = await getCategoryWithNotes(c.id);
              return full ?? c;
            }
            return c;
          }),
        );
        setCategories(enriched);
      } else {
        setCategories(data);
      }
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  useEffect(() => {
    if (initialCategories.length === 0) loadCategories();
  }, [loadCategories, initialCategories.length]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const sectors = Array.from(
    new Set(categories.map((c) => c.sector).filter(Boolean)),
  ) as string[];

  const filtered = categories.filter((c) => {
    if (
      search &&
      !c.name.toLowerCase().includes(search.toLowerCase()) &&
      !(c.sector ?? "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (sectorFilter !== "ALL" && c.sector !== sectorFilter) return false;
    return true;
  });

  const pendingReviewCount = categories.filter(
    (c) => c.status === "PENDING_REVIEW",
  ).length;
  const changesRequestedCount = categories.filter(
    (c) => c.status === "CHANGES_REQUESTED",
  ).length;
  const approvedCount = categories.filter(
    (c) => c.status === "APPROVED",
  ).length;

  // ── Extraction (ADMIN) ────────────────────────────────────────────────────

  const handleExtract = async () => {
    if (!file) return;
    setExtracting(true);
    setExtractErr(null);
    setExtracted(null);

    try {
      setStep("Extracting categories from PDF…");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(EXTRACT_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Extraction failed (${res.status})`);
      const data = await res.json();
      console.log("data", data);
      if (!data.categories?.length)
        throw new Error("No categories found in this PDF.");

      let items: ExtractedItem[] = data.categories
        .map((c: any) => ({
          name: String(c.name ?? "").trim(),
          sector: c.sector ?? null,
          target: c.target != null ? Number(c.target) : null,
          budget: c.budget != null ? Number(c.budget) : null,
        }))
        .filter((c: ExtractedItem) => c.name.length > 0);

      // AI name cleaning
      setStep(`Cleaning ${items.length} names with AI…`);
      try {
        const cleanRes = await fetch(CLEAN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: items.map((i) => i.name) }),
        });
        if (cleanRes.ok) {
          const cleanData = await cleanRes.json();
          if (
            Array.isArray(cleanData.cleaned) &&
            cleanData.cleaned.length === items.length
          ) {
            items = items.map((item, i) => ({
              ...item,
              name: cleanData.cleaned[i] || item.name,
            }));
          }
        }
      } catch {
        // soft fail
      }

      setExtracted(items);
    } catch (err: any) {
      setExtractErr(err.message || "Extraction failed");
    } finally {
      setExtracting(false);
      setStep("");
    }
  };

  const handleSaveExtracted = async () => {
    if (!extracted) return;
    await batchCreateCategories(extracted, userEmail);
    toast.success(`${extracted.length} categories saved`);
    setExtracted(null);
    setFile(null);
    await loadCategories();
  };

  // ── Category mutations ────────────────────────────────────────────────────

  const handleUpdate = async (id: string, data: Partial<ProjectCategory>) => {
    await updateCategory(id, data as any);
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c)),
    );
    toast.success("Category updated");
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    toast.success("Category deleted");
  };

  const handleAdd = async (data: {
    name: string;
    sector?: string;
    target?: number;
    budget?: number;
  }) => {
    const created = await addCategory(data, userEmail);
    setCategories((prev) => [created, ...prev]);
    toast.success("Category added");
  };

  // ── Workflow actions ──────────────────────────────────────────────────────

  const handleSubmitSelected = async () => {
    if (selectedIds.size === 0) return;
    await submitForReview([...selectedIds], userEmail);
    setCategories((prev) =>
      prev.map((c) =>
        selectedIds.has(c.id) &&
        (c.status === "DRAFT" || c.status === "CHANGES_REQUESTED")
          ? { ...c, status: "PENDING_REVIEW" }
          : c,
      ),
    );
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} categories submitted for review`);
  };

  const handleSubmitAll = async () => {
    const eligible = categories
      .filter((c) => c.status === "DRAFT" || c.status === "CHANGES_REQUESTED")
      .map((c) => c.id);
    if (eligible.length === 0) {
      toast.info("No draft categories to submit");
      return;
    }
    await submitForReview(eligible, userEmail);
    setCategories((prev) =>
      prev.map((c) =>
        eligible.includes(c.id) ? { ...c, status: "PENDING_REVIEW" } : c,
      ),
    );
    toast.success(`${eligible.length} categories submitted for review`);
  };

  const handleApprove = async (id: string) => {
    await approveCategories([id], userEmail);
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "APPROVED" } : c)),
    );
    setReviewTarget(null);
    toast.success("Category approved");
  };

  const handleRequestChanges = async (id: string, changes: FieldChange[]) => {
    await requestChanges(id, changes, userEmail);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: "CHANGES_REQUESTED" } : c,
      ),
    );
    setReviewTarget(null);
    toast.success("Changes requested — sector will be notified");
  };

  const handleApproveAll = async () => {
    const pending = categories
      .filter((c) => c.status === "PENDING_REVIEW")
      .map((c) => c.id);
    if (pending.length === 0) return;
    await approveCategories(pending, userEmail);
    setCategories((prev) =>
      prev.map((c) =>
        pending.includes(c.id) ? { ...c, status: "APPROVED" } : c,
      ),
    );
    toast.success(`${pending.length} categories approved`);
  };

  // ── Selection ─────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold">CIDP Project Categories</h1>
            <p className="text-xs text-muted-foreground">
              {categories.length} categories · {approvedCount} approved
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Role badge */}
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border font-medium",
                userRole === "me" && "bg-blue-50 text-blue-700 border-blue-200",
                userRole === "sector" &&
                  "bg-purple-50 text-purple-700 border-purple-200",
                userRole === "viewer" &&
                  "bg-slate-100 text-slate-700 border-slate-200",
              )}
            >
              {userRole}
            </span>

            {/* Sector: submit all */}
            {userRole === "sector" && (
              <Button size="sm" onClick={handleSubmitAll}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Submit All for Review
              </Button>
            )}

            {/* ME: approve all */}
            {userRole === "me" && pendingReviewCount > 0 && (
              <Button size="sm" onClick={handleApproveAll}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Approve All ({pendingReviewCount})
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Stats banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Draft",
              value: categories.filter((c) => c.status === "DRAFT").length,
              color: "text-slate-700",
              bg: "bg-slate-50",
            },
            {
              label: "Pending Review",
              value: pendingReviewCount,
              color: "text-amber-700",
              bg: "bg-amber-50",
            },
            {
              label: "Changes Req.",
              value: changesRequestedCount,
              color: "text-orange-700",
              bg: "bg-orange-50",
            },
            {
              label: "Approved",
              value: approvedCount,
              color: "text-emerald-700",
              bg: "bg-emerald-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={cn("rounded-xl border border-border p-3", stat.bg)}
            >
              <p className={cn("text-2xl font-bold font-mono", stat.color)}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ADMIN: PDF Upload section */}
        {userRole === "viewer" && (
          <div className="border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Extract from CIDP PDF</h2>
            </div>

            {!extracted ? (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium">
                    CIDP PDF file
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      setFile(e.target.files?.[0] ?? null);
                      setExtractErr(null);
                    }}
                    className="mt-1 w-full text-sm border border-border rounded-lg px-3 py-2 bg-background file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:bg-primary file:text-primary-foreground"
                  />
                </div>
                <Button onClick={handleExtract} disabled={!file || extracting}>
                  {extracting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      {step || "Working…"}
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Extract
                    </>
                  )}
                </Button>
              </div>
            ) : null}

            {extractErr && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {extractErr}
              </div>
            )}

            {extracted && (
              <ExtractionPreview
                items={extracted}
                onSave={handleSaveExtracted}
                onDiscard={() => setExtracted(null)}
              />
            )}
          </div>
        )}

        {/* Changes-requested alert for SECTOR */}
        {userRole === "sector" && changesRequestedCount > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-orange-200 bg-orange-50">
            <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800">
                {changesRequestedCount} categor
                {changesRequestedCount !== 1 ? "ies have" : "y has"} changes
                requested
              </p>
              <p className="text-xs text-orange-700 mt-0.5">
                Expand each highlighted category to see what the ME changed and
                why.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-700"
              onClick={() => setStatusFilter("CHANGES_REQUESTED")}
            >
              Show only
            </Button>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none"
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="CHANGES_REQUESTED">Changes Requested</option>
            <option value="APPROVED">Approved</option>
          </select>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none"
          >
            <option value="ALL">All sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {(search || statusFilter !== "ALL" || sectorFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
                setSectorFilter("ALL");
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bulk submit bar */}
        {userRole === "sector" && selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-primary/5">
            <p className="text-sm font-medium">{selectedIds.size} selected</p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
              <Button size="sm" onClick={handleSubmitSelected}>
                <Send className="w-3.5 h-3.5 mr-1" /> Submit for Review
              </Button>
            </div>
          </div>
        )}

        {/* Category list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No categories found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((cat) => (
              <div key={cat.id} className="flex items-start gap-2">
                {/* Checkbox for SECTOR bulk select */}
                {userRole === "sector" &&
                  (cat.status === "DRAFT" ||
                    cat.status === "CHANGES_REQUESTED") && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(cat.id)}
                      onChange={() => toggleSelect(cat.id)}
                      className="mt-4 shrink-0"
                    />
                  )}
                <div className="flex-1 min-w-0">
                  <CategoryRow
                    category={cat}
                    role={userRole}
                    isSelected={selectedIds.has(cat.id)}
                    onSelect={() => {}}
                    onUpdate={(data) => handleUpdate(cat.id, data)}
                    onDelete={() => handleDelete(cat.id)}
                    onReviewOpen={() => setReviewTarget(cat)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECTOR / ADMIN: Add category manually */}
        {(userRole === "sector" || userRole === "viewer") && !loading && (
          <AddCategoryForm onAdd={handleAdd} />
        )}
      </main>

      {/* ME Review Drawer */}
      {reviewTarget && userRole === "me" && (
        <MEReviewDrawer
          category={reviewTarget}
          onApprove={() => handleApprove(reviewTarget.id)}
          onSendBack={(changes) =>
            handleRequestChanges(reviewTarget.id, changes)
          }
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
