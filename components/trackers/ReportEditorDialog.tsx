"use client";

import React, { useState, useCallback } from "react";
import {
  X,
  FileText,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Image as ImageIcon,
  Edit3,
  Save,
  Eye,
  RefreshCw,
  Printer,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScopeItem {
  label: string;
  percent: number;
}
interface ScopeCategory {
  category: string;
  items: ScopeItem[];
}

export interface ReportContent {
  projectTitle: string;
  location: string;
  trackingDate: string;
  fundingSource: string;
  employer: string;
  employerRep: string;
  projectManager: string;
  fiscalYear: string;
  contractSum: string;
  overallPercent: number;
  workforceCount: number;
  workforceNote: string;
  commencementDate: string;
  plannedCompletion: string;
  contractDuration: string;
  costToCompletion: string;
  projectOverview: string;
  projectScope: ScopeCategory[];
  summaryOfCompleted: string[];
  ongoingWorks: string;
  pendingWorks: string;
  keyFindings: string[];
  challenges: string[];
  recommendations: string[];
  bestPractices: string[];
  lessonsLearnt: string[];
}

export interface ReportDraft {
  id: string;
  projectId: string;
  submissionId?: string;
  reportTitle: string;
  reportContent: ReportContent;
  status: "draft" | "final" | "finalized";
  generatedAt: string;
  updatedAt?: string;
}

interface AttachmentFile {
  url: string;
  name: string;
  isImage: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAttachmentInfo(url: string): AttachmentFile {
  const name = url.split("/").pop() || url;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(
    ext,
  );
  return { url, name, isImage };
}

function getCompletionColor(pct: number) {
  if (pct >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (pct >= 50) return "text-blue-700 bg-blue-50 border-blue-200";
  if (pct >= 25) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

// ─── Editable Field ───────────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className={cn("group", className)}>
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      {editing ? (
        <div className="flex gap-2 items-start">
          {multiline ? (
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="text-sm min-h-[80px] flex-1"
              autoFocus
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="text-sm h-8 flex-1"
              autoFocus
            />
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 shrink-0"
            onClick={() => setEditing(false)}
          >
            <Check className="w-4 h-4 text-emerald-600" />
          </Button>
        </div>
      ) : (
        <div className="flex items-start gap-2 group/field">
          <p
            className={cn(
              "text-sm text-zinc-800 flex-1 whitespace-pre-line",
              !value && "text-zinc-400 italic",
            )}
          >
            {value || "—"}
          </p>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover/field:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-100"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Editable Bullet List ─────────────────────────────────────────────────────

function EditableBulletList({
  label,
  items,
  onChange,
  accent,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  accent: string;
}) {
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const update = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i));
    setEditIdx(null);
  };
  const add = () => {
    onChange([...items, ""]);
    setEditIdx(items.length);
  };

  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start group/item">
            <span
              className={cn("mt-2 w-2 h-2 rounded-full shrink-0", accent)}
            />
            {editIdx === i ? (
              <>
                <Textarea
                  value={item}
                  onChange={(e) => update(i, e.target.value)}
                  className="text-sm flex-1 min-h-[60px] resize-none"
                  autoFocus
                />
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => setEditIdx(null)}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-red-400 hover:text-red-600"
                    onClick={() => remove(i)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-700 flex-1 leading-relaxed">
                  {item || <span className="text-zinc-400 italic">Empty</span>}
                </p>
                <button
                  onClick={() => setEditIdx(i)}
                  className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1 rounded hover:bg-zinc-100 shrink-0 mt-0.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                </button>
              </>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-zinc-500 pl-4"
          onClick={add}
        >
          + Add item
        </Button>
      </div>
    </div>
  );
}

// ─── Attachment Preview Panel ─────────────────────────────────────────────────

function AttachmentPanel({ attachments }: { attachments: string[] }) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const files = attachments.map(getAttachmentInfo);
  const images = files.filter((f) => f.isImage);
  const docs = files.filter((f) => !f.isImage);

  if (attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <Paperclip className="w-8 h-8 mb-2" />
        <p className="text-sm">No attachments from this tracker submission</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Images ({images.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {images.map((f, i) => (
              <button
                key={i}
                onClick={() =>
                  setSelectedUrl(selectedUrl === f.url ? null : f.url)
                }
                className={cn(
                  "relative aspect-video rounded-lg border-2 overflow-hidden bg-zinc-100 transition-all",
                  selectedUrl === f.url
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-transparent hover:border-zinc-300",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={f.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1.5 py-1">
                  <p className="text-white text-xs truncate">{f.name}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Lightbox */}
          {selectedUrl && (
            <div className="mt-3 rounded-xl border overflow-hidden bg-zinc-900 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedUrl}
                alt="Preview"
                className="w-full max-h-[400px] object-contain"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <a
                  href={selectedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedUrl(null)}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {docs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Documents ({docs.length})
          </p>
          <div className="space-y-1.5">
            {docs.map((f, i) => (
              <a
                key={i}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg border bg-white hover:bg-zinc-50 transition group"
              >
                <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-sm text-zinc-700 flex-1 truncate">
                  {f.name}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Scope Table ──────────────────────────────────────────────────────────────

function ScopeSection({ scope }: { scope: ScopeCategory[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(scope.map((s) => s.category)),
  );
  const toggle = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const getBar = (pct: number) => {
    let bg = "bg-red-400";
    if (pct === 100) bg = "bg-emerald-500";
    else if (pct >= 50) bg = "bg-blue-500";
    else if (pct > 0) bg = "bg-amber-400";
    return bg;
  };

  return (
    <div className="space-y-2">
      {scope.map((cat) => {
        const catAvg =
          cat.items.reduce((s, i) => s + i.percent, 0) /
          (cat.items.length || 1);
        const isExpanded = expanded.has(cat.category);
        return (
          <div key={cat.category} className="border rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(cat.category)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-50 hover:bg-zinc-100 transition text-left"
            >
              <span className="font-semibold text-sm">{cat.category}</span>
              <div className="flex items-center gap-3">
                <div className="w-20 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", getBar(catAvg))}
                    style={{ width: `${catAvg}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-zinc-500 w-10 text-right">
                  {catAvg.toFixed(0)}%
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </div>
            </button>
            {isExpanded && (
              <div className="divide-y">
                {cat.items.map((item, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 flex items-center gap-3 text-sm"
                  >
                    <span className="flex-1 text-zinc-700">{item.label}</span>
                    <div className="w-20 h-1.5 bg-zinc-200 rounded-full overflow-hidden shrink-0">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          getBar(item.percent),
                        )}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-semibold w-10 text-right shrink-0",
                        item.percent === 100
                          ? "text-emerald-600"
                          : item.percent === 0
                            ? "text-zinc-400"
                            : "text-blue-600",
                      )}
                    >
                      {item.percent}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Header Info Grid ─────────────────────────────────────────────────────────

function HeaderGrid({
  content,
  onChange,
}: {
  content: ReportContent;
  onChange: (patch: Partial<ReportContent>) => void;
}) {
  const field = (label: string, key: keyof ReportContent) => (
    <EditableField
      label={label}
      value={String(content[key] ?? "")}
      onChange={(v) => onChange({ [key]: v })}
    />
  );

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {field("Project Title", "projectTitle")}
      {field("Location", "location")}
      {field("Tracking Date", "trackingDate")}
      {field("Funding Source", "fundingSource")}
      {field("Employer", "employer")}
      {field("Employer's Representative", "employerRep")}
      {field("Project Manager", "projectManager")}
      {field("Fiscal Year", "fiscalYear")}
      {field("Contract Sum", "contractSum")}
      {field("Commencement Date", "commencementDate")}
      {field("Planned Completion", "plannedCompletion")}
      {field("Contract Duration", "contractDuration")}
      {field("Cost to Completion", "costToCompletion")}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-0.5">
          Workforce
        </p>
        <p className="text-sm text-zinc-800">
          {content.workforceCount ? `${content.workforceCount} personnel` : "—"}
          {content.workforceNote ? ` — ${content.workforceNote}` : ""}
        </p>
      </div>
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export function ReportEditorDialog({
  open,
  onClose,
  draft,
  projectId,
  attachments,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  draft: ReportDraft;
  projectId: string;
  attachments: string[];
  onSaved?: (updated: ReportDraft) => void;
}) {
  const [content, setContent] = useState<ReportContent>(draft.reportContent);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const patch = useCallback((partial: Partial<ReportContent>) => {
    setContent((prev) => ({ ...prev, ...partial }));
    setIsDirty(true);
  }, []);

  const handleSave = async (status: "draft" | "final" = "draft") => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/reports/status-report`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportTitle: draft.reportTitle,
            reportContent: content,
            status,
          }),
        },
      );
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      toast.success(
        status === "final" ? "Report finalized!" : "Draft saved successfully",
      );
      setIsDirty(false);
      onSaved?.(saved);
      if (status === "final") onClose();
    } catch {
      toast.error("Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  const completionBadge = getCompletionColor(content.overallPercent);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <DialogTitle className="text-base font-semibold truncate">
                  {draft.reportTitle}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 text-xs capitalize",
                    draft.status === "final"
                      ? "border-emerald-400 text-emerald-700"
                      : "border-amber-400 text-amber-700",
                  )}
                >
                  {draft.status}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-zinc-500">
                Generated{" "}
                {new Date(draft.generatedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}Click any field to edit inline
              </DialogDescription>
            </div>

            {/* Progress badge */}
            <div
              className={cn(
                "shrink-0 text-center px-4 py-2 rounded-xl border font-bold",
                completionBadge,
              )}
            >
              <span className="text-2xl">
                {content.overallPercent.toFixed(2)}
              </span>
              <span className="text-sm">%</span>
              <p className="text-xs font-normal mt-0.5">Completion</p>
            </div>
          </div>

          {/* Dirty indicator */}
          {isDirty && (
            <div className="flex items-center gap-1.5 mt-2 text-amber-600 text-xs">
              <AlertCircle className="w-3.5 h-3.5" />
              Unsaved changes
            </div>
          )}
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="report" className="h-full flex flex-col">
            <TabsList className="mx-6 mt-3 w-fit shrink-0">
              <TabsTrigger value="report">Report</TabsTrigger>
              <TabsTrigger value="scope">Project Scope</TabsTrigger>
              <TabsTrigger
                value="attachments"
                className="flex items-center gap-1.5"
              >
                <Paperclip className="w-3.5 h-3.5" />
                Attachments
                {attachments.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-1.5 rounded-full">
                    {attachments.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ── Report Tab ── */}
            <TabsContent
              value="report"
              className="flex-1 overflow-y-auto px-6 pb-6 mt-4 space-y-6"
            >
              {/* Header Info */}
              <section>
                <h3 className="text-sm font-bold text-zinc-700 border-b pb-2 mb-3">
                  Project Header
                </h3>
                <HeaderGrid content={content} onChange={patch} />
              </section>

              {/* Overview */}
              <section>
                <h3 className="text-sm font-bold text-zinc-700 border-b pb-2 mb-3">
                  Project Overview
                </h3>
                <EditableField
                  label="Overview narrative"
                  value={content.projectOverview}
                  onChange={(v) => patch({ projectOverview: v })}
                  multiline
                />
              </section>

              {/* Summary of Completed */}
              <section>
                <h3 className="text-sm font-bold text-zinc-700 border-b pb-2 mb-3">
                  Summary of Completed Works
                </h3>
                <EditableBulletList
                  label="Completed items"
                  items={content.summaryOfCompleted}
                  onChange={(v) => patch({ summaryOfCompleted: v })}
                  accent="bg-emerald-500"
                />
              </section>

              {/* Ongoing / Pending */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-700 border-b pb-2 mb-3">
                    Ongoing Works
                  </h3>
                  <EditableField
                    label="Ongoing works narrative"
                    value={content.ongoingWorks}
                    onChange={(v) => patch({ ongoingWorks: v })}
                    multiline
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-700 border-b pb-2 mb-3">
                    Pending Works
                  </h3>
                  <EditableField
                    label="Pending works narrative"
                    value={content.pendingWorks}
                    onChange={(v) => patch({ pendingWorks: v })}
                    multiline
                  />
                </div>
              </section>

              {/* Key Findings */}
              <section>
                <h3 className="text-sm font-bold text-zinc-700 border-b pb-2 mb-3">
                  Key Findings
                </h3>
                <EditableBulletList
                  label="Findings"
                  items={content.keyFindings}
                  onChange={(v) => patch({ keyFindings: v })}
                  accent="bg-blue-500"
                />
              </section>

              {/* Challenges */}
              <section>
                <h3 className="text-sm font-bold text-zinc-700 border-b pb-2 mb-3">
                  Challenges / Risks
                </h3>
                <EditableBulletList
                  label="Challenges"
                  items={content.challenges}
                  onChange={(v) => patch({ challenges: v })}
                  accent="bg-red-500"
                />
              </section>

              {/* Recommendations */}
              <section>
                <h3 className="text-sm font-bold text-zinc-700 border-b pb-2 mb-3">
                  Recommendations
                </h3>
                <EditableBulletList
                  label="Recommendations"
                  items={content.recommendations}
                  onChange={(v) => patch({ recommendations: v })}
                  accent="bg-violet-500"
                />
              </section>

              {/* Best Practices + Lessons Learnt */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-700 border-b pb-2 mb-3">
                    Best Practices Observed
                  </h3>
                  <EditableBulletList
                    label="Best practices"
                    items={content.bestPractices}
                    onChange={(v) => patch({ bestPractices: v })}
                    accent="bg-teal-500"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-700 border-b pb-2 mb-3">
                    Lessons Learnt
                  </h3>
                  <EditableBulletList
                    label="Lessons"
                    items={content.lessonsLearnt}
                    onChange={(v) => patch({ lessonsLearnt: v })}
                    accent="bg-amber-500"
                  />
                </div>
              </section>
            </TabsContent>

            {/* ── Scope Tab ── */}
            <TabsContent
              value="scope"
              className="flex-1 overflow-y-auto px-6 pb-6 mt-4"
            >
              <p className="text-xs text-zinc-500 mb-4">
                Showing project scope from the checklist items, grouped by
                category with their current completion percentages.
              </p>
              {content.projectScope?.length > 0 ? (
                <ScopeSection scope={content.projectScope} />
              ) : (
                <div className="text-center py-12 text-zinc-400 text-sm">
                  No scope data available
                </div>
              )}
            </TabsContent>

            {/* ── Attachments Tab ── */}
            <TabsContent
              value="attachments"
              className="flex-1 overflow-y-auto px-6 pb-6 mt-4"
            >
              <p className="text-xs text-zinc-500 mb-4">
                All attachments from the latest tracker submission. Click images
                to preview; click documents to open.
              </p>
              <AttachmentPanel attachments={attachments} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white dark:bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Close
          </Button>
          <div className="flex gap-2">
            {isDirty && (
              <Button
                variant="outline"
                onClick={() => handleSave("draft")}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving…" : "Save Draft"}
              </Button>
            )}
            <Button
              onClick={() => handleSave("final")}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Check className="w-4 h-4 mr-2" />
              Finalize Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
