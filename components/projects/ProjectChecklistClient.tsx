// components/projects/ProjectChecklistClient.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Save,
  RefreshCw,
  Download,
  Search,
  BarChart3,
  Users,
  FileText,
  Eye,
  EyeOff,
  MoreVertical,
  History,
  CheckSquare,
  Square,
  CalendarDays,
  X,
  Info,
  Plus,
  CheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  parameterId: string;
  weight: number;
  label: string;
  category: string;
}

export interface CustomParam {
  id: string;
  label: string;
  category: string;
  isPending: string;
  addedBy: string;
  addedAt: string;
}

export interface Checklist {
  id: string;
  projectId: string;
  status: string;
  version: number;
  lastModified: string;
  lastModifiedBy: string;
  editReason?: string;
  items: ChecklistItem[];
  taskAnnotations?: TaskAnnotation[];
  customItems?: CustomParam[];
}

export interface StandardParam {
  id: string;
  label: string;
  category: string;
  description?: string;
}

export interface HistoryEntry {
  id: string;
  status: string;
  changedBy: string;
  reason?: string;
  createdAt: string;
}

export interface TaskAnnotation {
  parameterId: string;
  oldValue: number;
  newValue: number;
  reason: string;
}

// ─── Permission helper ────────────────────────────────────────────────────────

function hasPermission(perms: string[], required: string | string[]): boolean {
  if (typeof required === "string") return perms.includes(required);
  return required.some((p) => perms.includes(p));
}

// Simple custom checkbox that avoids nesting a <button> inside another <button>
function SimpleCheckbox({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onCheckedChange();
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) onCheckedChange();
        }
      }}
      className={cn(
        "size-4 shrink-0 rounded-[4px] border shadow-xs transition-all cursor-pointer",
        checked
          ? "bg-primary border-primary text-primary-foreground flex items-center justify-center"
          : "bg-background border-input",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {checked && <CheckIcon className="w-3 h-3 text-white" />}
    </div>
  );
}

// ─── Phase definitions ────────────────────────────────────────────────────────

const PHASES = [
  {
    id: "Draft",
    label: "Draft",
    description: "Select checklist tasks",
    icon: <FileText className="w-4 h-4" />,
    color: "bg-blue-500",
    allowsTaskSelection: true,
    allowsWeightAssignment: false,
    isReviewPhase: false,
  },
  {
    id: "DraftReview",
    label: "Draft Review",
    description: "Review selected tasks",
    icon: <Users className="w-4 h-4" />,
    color: "bg-amber-500",
    allowsTaskSelection: true,
    allowsWeightAssignment: false,
    isReviewPhase: true,
  },
  {
    id: "WeightsAssignment",
    label: "Weights Assignment",
    description: "Assign weights to categories and tasks",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "bg-purple-500",
    allowsTaskSelection: false,
    allowsWeightAssignment: true,
    isReviewPhase: false,
  },
  {
    id: "WeightsReview",
    label: "Weights Review",
    description: "Review and adjust weights",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "bg-emerald-500",
    allowsTaskSelection: false,
    allowsWeightAssignment: true,
    isReviewPhase: true,
  },
  {
    id: "Approved",
    label: "Approved",
    description: "Finalized and ready for tracking",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "bg-green-500",
    allowsTaskSelection: false,
    allowsWeightAssignment: false,
    isReviewPhase: false,
  },
];

// ─── Sub‑components ───────────────────────────────────────────────────────────

function AddCustomItemForm({
  existingCategories,
  onAdd,
  onCancel,
}: {
  existingCategories: string[];
  onAdd: (label: string, category: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState(existingCategories[0] ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [useNewCategory, setUseNewCategory] = useState(false);

  const finalCategory = useNewCategory ? newCategory.trim() : category;

  return (
    <div className="space-y-3 pt-1 border-t border-primary/20 mt-3">
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">
          Task label
        </Label>
        <Input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Install CCTV cameras"
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
          }}
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">
          Category
        </Label>
        {!useNewCategory ? (
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 text-sm border border-input rounded-md px-3 py-2 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              {existingCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUseNewCategory(true)}
            >
              New category
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name..."
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUseNewCategory(false)}
            >
              Use existing
            </Button>
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          disabled={!label.trim() || !finalCategory}
          onClick={() => onAdd(label.trim(), finalCategory)}
        >
          Add Task
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ReasonDialog({
  open,
  paramLabel,
  oldValue,
  newValue,
  isTaskSelection,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  paramLabel: string;
  oldValue: number;
  newValue: number;
  isTaskSelection: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const changeDescription = isTaskSelection
    ? oldValue === 0
      ? "Added task"
      : "Removed task"
    : `Weight changed from ${oldValue} → ${newValue}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-500" />
            Reason for Change
          </DialogTitle>
          <DialogDescription>
            Provide a reason for your change to{" "}
            <span className="font-medium text-foreground">{paramLabel}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Change: </span>
            <span className="font-medium">{changeDescription}</span>
          </div>
          <Textarea
            placeholder="Explain why you made this change..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim()}
          >
            Apply Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskChangeBadge({ annotation }: { annotation: TaskAnnotation }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline"
      >
        <Info className="w-3 h-3" />
        ME officer changed this
        <ChevronDown
          className={cn(
            "w-3 h-3 transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded && (
        <div className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-3 py-2 text-xs space-y-1">
          <div className="flex gap-2">
            <span className="text-muted-foreground">Before:</span>
            <span className="font-medium line-through text-red-600">
              {annotation.oldValue}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">After:</span>
            <span className="font-medium text-green-600">
              {annotation.newValue}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground">Reason:</span>
            <span className="italic">{annotation.reason}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkplanDateEditor({
  projectId,
  items,
}: {
  projectId: string;
  items: {
    parameterId: string;
    label: string;
    category: string;
    weight: number;
  }[];
}) {
  const [dates, setDates] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/projects/${projectId}/workplan`)
      .then((r) => (r.ok ? r.json() : []))
      .then(
        (
          saved: {
            parameterId: string;
            plannedStartDate: string;
            plannedEndDate: string;
          }[],
        ) => {
          const map: Record<string, { start: string; end: string }> = {};
          items.forEach((it) => {
            const existing = saved.find(
              (s) => s.parameterId === it.parameterId,
            );
            map[it.parameterId] = {
              start: existing?.plannedStartDate?.slice(0, 10) ?? "",
              end: existing?.plannedEndDate?.slice(0, 10) ?? "",
            };
          });
          setDates(map);
          setLoaded(true);
        },
      )
      .catch(() => {
        const map: Record<string, { start: string; end: string }> = {};
        items.forEach((it) => {
          map[it.parameterId] = { start: "", end: "" };
        });
        setDates(map);
        setLoaded(true);
      });
  }, [projectId, items]);

  const setField = (pid: string, field: "start" | "end", value: string) => {
    setDates((prev) => ({ ...prev, [pid]: { ...prev[pid], [field]: value } }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    items.forEach((it) => {
      const { start, end } = dates[it.parameterId] ?? {};
      if (!start || !end) {
        errs[it.parameterId] = "Both dates required";
      } else if (new Date(start) > new Date(end)) {
        errs[it.parameterId] = "Start must be before end";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Fix date errors before saving");
      return;
    }
    setSaving(true);
    try {
      const payload = items.map((it) => ({
        projectId,
        parameterId: it.parameterId,
        label: it.label,
        category: it.category,
        weight: it.weight,
        plannedStartDate: dates[it.parameterId].start,
        plannedEndDate: dates[it.parameterId].end,
      }));
      const res = await fetch(`/api/projects/${projectId}/workplan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) throw new Error();
      toast.success("Workplan dates saved");
    } catch {
      toast.error("Failed to save workplan dates");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <Skeleton className="h-40 w-full" />;

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No weighted items found. Assign weights to items first, then set their
        planned dates here.
      </div>
    );
  }

  const grouped: Record<string, typeof items> = {};
  items.forEach((it) => {
    if (!grouped[it.category]) grouped[it.category] = [];
    grouped[it.category].push(it);
  });

  const filled = items.filter(
    (it) => dates[it.parameterId]?.start && dates[it.parameterId]?.end,
  ).length;
  const totalErrors = Object.keys(errors).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filled}</span> /{" "}
            {items.length} items have planned dates
          </p>
          {totalErrors > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalErrors} error{totalErrors > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {saving ? "Saving..." : "Save Dates"}
        </Button>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
        <CalendarDays className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          Set the planned start and end date for each checklist item. These
          dates will be used to build the project Gantt chart and timeline view.
        </p>
      </div>

      <Accordion
        type="multiple"
        defaultValue={Object.keys(grouped)}
        className="space-y-3"
      >
        {Object.entries(grouped).map(([category, catItems]) => {
          const catErrors = catItems.filter(
            (it) => errors[it.parameterId],
          ).length;
          const catFilled = catItems.filter(
            (it) => dates[it.parameterId]?.start && dates[it.parameterId]?.end,
          ).length;

          return (
            <AccordionItem
              key={category}
              value={category}
              className="border rounded-lg"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="text-left">
                    <div className="font-semibold">{category}</div>
                    <div className="text-sm text-muted-foreground">
                      {catItems.length} items • {catFilled} dated
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {catErrors > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {catErrors} error{catErrors > 1 ? "s" : ""}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-4 pb-4 space-y-3">
                  {catItems.map((it) => {
                    const err = errors[it.parameterId];
                    const hasDates =
                      dates[it.parameterId]?.start &&
                      dates[it.parameterId]?.end;
                    return (
                      <div
                        key={it.parameterId}
                        className={cn(
                          "rounded-lg border p-3 space-y-2 transition-colors",
                          err
                            ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                            : hasDates
                              ? "border-green-200 bg-green-50/50 dark:bg-green-950/10"
                              : "border-border",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{it.label}</p>
                            <p className="text-xs text-muted-foreground">
                              Weight: {it.weight} pts
                            </p>
                          </div>
                          {err ? (
                            <span className="text-xs text-red-600 flex items-center gap-1 shrink-0">
                              <AlertCircle className="w-3 h-3" /> {err}
                            </span>
                          ) : hasDates ? (
                            <span className="text-xs text-green-600 flex items-center gap-1 shrink-0">
                              <CheckCircle className="w-3 h-3" /> Dated
                            </span>
                          ) : null}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Planned start
                            </Label>
                            <Input
                              type="date"
                              value={dates[it.parameterId]?.start ?? ""}
                              onChange={(e) =>
                                setField(
                                  it.parameterId,
                                  "start",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Planned end
                            </Label>
                            <Input
                              type="date"
                              value={dates[it.parameterId]?.end ?? ""}
                              onChange={(e) =>
                                setField(it.parameterId, "end", e.target.value)
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProjectChecklistClient({
  projectId,
  checklist: initialChecklist,
  standardParams,
  userPermissions,
}: Props) {
  const router = useRouter();

  // ── Permissions ─────────────────────────────────────────────────────────────
  const canView = hasPermission(userPermissions, "checklist:view");
  const canCreateDraft = hasPermission(
    userPermissions,
    "checklist:create_draft",
  );
  const canEditTasks = hasPermission(userPermissions, "checklist:edit_tasks");
  const canEditWeights = hasPermission(
    userPermissions,
    "checklist:edit_weights",
  );
  const canSubmitReview = hasPermission(
    userPermissions,
    "checklist:submit_review",
  );
  const canReview = hasPermission(userPermissions, "checklist:review");
  const canApplyChanges = hasPermission(
    userPermissions,
    "checklist:apply_changes",
  );
  const canSave = hasPermission(userPermissions, "checklist:save");
  const canReset = hasPermission(userPermissions, "checklist:reset");
  const canExport = hasPermission(userPermissions, "checklist:export");
  const canAddCustom = hasPermission(userPermissions, "checklist:add_custom");
  const canDeleteCustom = hasPermission(
    userPermissions,
    "checklist:delete_custom",
  );

  // ── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<Checklist | null>(
    initialChecklist,
  );
  // localItems now holds effective weight (0–100 for the whole project)
  const [localItems, setLocalItems] = useState<Record<string, number>>({});
  // New state for two-level weights (only meaningful in weight phases)
  const [categoryWeights, setCategoryWeights] = useState<
    Record<string, number>
  >({});
  const [itemLocalWeights, setItemLocalWeights] = useState<
    Record<string, number>
  >({});
  const [customParams, setCustomParams] = useState<CustomParam[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const baselineItems = useRef<Record<string, number>>({});
  const [committedChanges, setCommittedChanges] = useState<
    Record<string, TaskAnnotation>
  >({});
  const [pendingTaskChanges, setPendingTaskChanges] = useState<Set<string>>(
    new Set(),
  );
  const [reasonDialog, setReasonDialog] = useState<{
    open: boolean;
    parameterId: string;
    paramLabel: string;
    oldValue: number;
    newValue: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showIncludedOnly, setShowIncludedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("items");
  const [isCreating, setIsCreating] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ── Derived from checklist status ─────────────────────────────────────────
  const currentPhase = useMemo(
    () => PHASES.find((p) => p.id === checklist?.status) || PHASES[0],
    [checklist?.status],
  );
  const isReviewPhase = currentPhase.isReviewPhase;

  const effectiveCanEdit =
    (canEditTasks && currentPhase.allowsTaskSelection) ||
    (canEditWeights && currentPhase.allowsWeightAssignment);

  const showWorkplanTab =
    (currentPhase.id === "WeightsAssignment" ||
      currentPhase.id === "WeightsReview") &&
    canEditWeights;

  // ── Sync local state from checklist ─────────────────────────────────────
  useEffect(() => {
    if (checklist) {
      const map: Record<string, number> = {};
      checklist.items.forEach((item) => {
        map[item.parameterId] = item.weight;
      });

      // Handle custom items
      if (checklist.customItems && checklist.customItems.length > 0) {
        setCustomParams(checklist.customItems);
        checklist.customItems.forEach((cp) => {
          if (!(cp.id in map)) map[cp.id] = 0; // will be set below
        });
      } else {
        setCustomParams([]);
      }

      // For weight phases, derive the two-level state from effective weights
      if (
        currentPhase.allowsWeightAssignment &&
        (checklist.status === "WeightsAssignment" ||
          checklist.status === "WeightsReview" ||
          checklist.status === "Approved")
      ) {
        // Build category -> items map from the flat list
        const itemsByCategory: Record<
          string,
          { id: string; weight: number }[]
        > = {};
        const allParams = [
          ...standardParams.map((p) => ({ id: p.id, category: p.category })),
          ...(checklist.customItems || []).map((c) => ({
            id: c.id,
            category: c.category,
          })),
        ];
        checklist.items.forEach((item) => {
          const param = allParams.find((p) => p.id === item.parameterId);
          if (param) {
            if (!itemsByCategory[param.category])
              itemsByCategory[param.category] = [];
            itemsByCategory[param.category].push({
              id: item.parameterId,
              weight: item.weight,
            });
          }
        });

        const newCatWeights: Record<string, number> = {};
        const newItemLocal: Record<string, number> = {};

        Object.entries(itemsByCategory).forEach(([cat, items]) => {
          const totalCat = items.reduce((sum, it) => sum + it.weight, 0);
          newCatWeights[cat] = totalCat;
          items.forEach((it) => {
            newItemLocal[it.id] =
              totalCat > 0 ? (it.weight / totalCat) * 100 : 0;
          });
        });

        setCategoryWeights(newCatWeights);
        setItemLocalWeights(newItemLocal);
      }

      setLocalItems(map);
      baselineItems.current = { ...map };

      // Task annotations
      if (checklist.taskAnnotations && checklist.taskAnnotations.length > 0) {
        const committed: Record<string, TaskAnnotation> = {};
        checklist.taskAnnotations.forEach((a) => {
          committed[a.parameterId] = a;
        });
        setCommittedChanges(committed);
      } else {
        setCommittedChanges({});
      }
      setPendingTaskChanges(new Set());
    }
  }, [checklist, standardParams]);

  // ── Automatically recompute effective weights when sliders change ──────
  useEffect(() => {
    if (checklist && currentPhase.allowsWeightAssignment) {
      // Build list of all parameter IDs (standard + custom)
      const allParamIds = new Set([
        ...standardParams.map((p) => p.id),
        ...customParams.map((c) => c.id),
      ]);
      const newLocalItems: Record<string, number> = {};
      allParamIds.forEach((pid) => {
        const cat =
          standardParams.find((p) => p.id === pid)?.category ??
          customParams.find((c) => c.id === pid)?.category;
        if (cat && categoryWeights[cat] !== undefined) {
          const localWeight = itemLocalWeights[pid] ?? 0;
          const effective = (categoryWeights[cat] * localWeight) / 100;
          newLocalItems[pid] = Math.round(effective * 100) / 100; // keep 2 decimals
        } else {
          // not yet categorised? just keep existing
          newLocalItems[pid] = localItems[pid] ?? 0;
        }
      });
      setLocalItems(newLocalItems);
    }
  }, [
    categoryWeights,
    itemLocalWeights,
    standardParams,
    customParams,
    currentPhase.allowsWeightAssignment,
    checklist,
  ]);

  // Load history when tab opens
  useEffect(() => {
    if (activeTab === "history" && checklist) {
      setLoadingHistory(true);
      fetch(`/api/projects/${projectId}/checklist/history`)
        .then((res) => res.json())
        .then((data) => setHistory(data))
        .catch(() => toast.error("Failed to load history"))
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab, projectId, checklist]);

  // ── Pending changes detection ────────────────────────────────────────────
  const hasUncommittedChanges = useMemo(() => {
    if (!isReviewPhase || !canApplyChanges) return false;
    for (const [pid, val] of Object.entries(localItems)) {
      const baseline = baselineItems.current[pid] ?? 0;
      if (Math.abs(val - baseline) > 0.001 && !committedChanges[pid])
        return true;
    }
    return false;
  }, [localItems, committedChanges, isReviewPhase, canApplyChanges]);

  const hasCommittedChanges = Object.keys(committedChanges).length > 0;

  const hasPendingChanges = useMemo(() => {
    if (isReviewPhase && canApplyChanges) return false;
    for (const [pid, val] of Object.entries(localItems)) {
      const baseline = baselineItems.current[pid] ?? 0;
      if (Math.abs(val - baseline) > 0.001) return true;
    }
    return false;
  }, [localItems, isReviewPhase, canApplyChanges]);

  // ── Task selection (for Draft phases) ────────────────────────────────────
  const toggleTaskInclude = (paramId: string) => {
    if (!effectiveCanEdit || !currentPhase.allowsTaskSelection) return;
    const isIncluded = (localItems[paramId] ?? 0) > 0;
    const newValue = isIncluded ? 0 : 1;
    setLocalItems((prev) => ({ ...prev, [paramId]: newValue }));
    if (isReviewPhase && canApplyChanges) {
      setPendingTaskChanges((prev) => {
        const next = new Set(prev);
        next.add(paramId);
        return next;
      });
      setCommittedChanges((prev) => {
        const next = { ...prev };
        delete next[paramId];
        return next;
      });
    }
  };

  // ── Category weight adjustment ───────────────────────────────────────────
  const setCategoryWeight = (category: string, weight: number) => {
    if (!effectiveCanEdit || !currentPhase.allowsWeightAssignment) return;
    const totalOthers = Object.entries(categoryWeights).reduce(
      (sum, [cat, w]) => (cat === category ? sum : sum + w),
      0,
    );
    const maxAllowed = 100 - totalOthers;
    const newWeight = Math.max(0, Math.min(weight, maxAllowed));
    setCategoryWeights((prev) => ({ ...prev, [category]: newWeight }));
  };

  // ── Item local weight adjustment ─────────────────────────────────────────
  const setItemLocalWeight = (
    paramId: string,
    newLocalWeight: number,
    category: string,
  ) => {
    if (!effectiveCanEdit || !currentPhase.allowsWeightAssignment) return;
    // Find all items in this category
    const catItems = [
      ...standardParams.filter((p) => p.category === category).map((p) => p.id),
      ...customParams.filter((c) => c.category === category).map((c) => c.id),
    ];
    const sumOthers = catItems.reduce(
      (sum, id) => (id === paramId ? sum : sum + (itemLocalWeights[id] ?? 0)),
      0,
    );
    const maxAllowed = 100 - sumOthers;
    const capped = Math.max(0, Math.min(newLocalWeight, maxAllowed));
    setItemLocalWeights((prev) => ({ ...prev, [paramId]: capped }));
  };

  // ── Apply change (review phase) ──────────────────────────────────────────
  const handleApplyChange = (paramId: string, paramLabel: string) => {
    const oldValue = baselineItems.current[paramId] ?? 0;
    const newValue = localItems[paramId] ?? 0;
    setReasonDialog({
      open: true,
      parameterId: paramId,
      paramLabel,
      oldValue,
      newValue,
    });
  };

  const handleReasonConfirm = (reason: string) => {
    if (!reasonDialog) return;
    const { parameterId, oldValue, newValue } = reasonDialog;
    setCommittedChanges((prev) => ({
      ...prev,
      [parameterId]: { parameterId, oldValue, newValue, reason },
    }));
    setPendingTaskChanges((prev) => {
      const next = new Set(prev);
      next.delete(parameterId);
      return next;
    });
    setReasonDialog(null);
    toast.success("Change applied");
  };

  const handleReasonCancel = () => {
    if (!reasonDialog) return;
    const { parameterId, oldValue } = reasonDialog;
    setLocalItems((prev) => ({ ...prev, [parameterId]: oldValue }));
    setPendingTaskChanges((prev) => {
      const next = new Set(prev);
      next.delete(parameterId);
      return next;
    });
    setReasonDialog(null);
  };

  // ── Save (computes effective weights) ────────────────────────────────────
  const handleSave = async (newStatus?: string) => {
    if (!checklist) return;
    if (isReviewPhase && canApplyChanges && hasUncommittedChanges) {
      toast.error(
        "Apply all your changes (click the Apply checkbox) before saving.",
      );
      return;
    }
    setSaving(true);
    try {
      let items: any[] = [];
      if (currentPhase.allowsWeightAssignment) {
        // Build items from two-level weights
        const allParams = [
          ...standardParams.map((p) => ({
            id: p.id,
            label: p.label,
            category: p.category,
          })),
          ...customParams.map((c) => ({
            id: c.id,
            label: c.label,
            category: c.category,
          })),
        ];
        allParams.forEach((param) => {
          const catWeight = categoryWeights[param.category] ?? 0;
          const localWeight = itemLocalWeights[param.id] ?? 0;
          const effectiveWeight = (catWeight * localWeight) / 100;
          if (effectiveWeight > 0) {
            items.push({
              parameterId: param.id,
              weight: effectiveWeight,
              label: param.label,
              category: param.category,
            });
          }
        });
      } else {
        // In task selection phases, localItems already holds selection (0/1)
        items = Object.entries(localItems)
          .filter(([, w]) => w > 0)
          .map(([parameterId, weight]) => {
            const std = standardParams.find((p) => p.id === parameterId);
            const custom = customParams.find((p) => p.id === parameterId);
            return {
              parameterId,
              weight,
              label: std?.label || custom?.label || "",
              category: std?.category || custom?.category || "",
            };
          });
      }
      const res = await fetch(`/api/projects/${projectId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistId: checklist.id,
          status: newStatus || checklist.status,
          items,
          taskAnnotations: Object.values(committedChanges),
          customItems: customParams,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setChecklist(updated);
      setCommittedChanges({});
      setPendingTaskChanges(new Set());
      toast.success("Checklist saved");
      router.refresh();
    } catch {
      toast.error("Failed to save checklist");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!canReset) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/checklist`);
      if (!res.ok) throw new Error();
      const fresh = await res.json();
      setChecklist(fresh);
      const map: Record<string, number> = {};
      fresh.items.forEach((item: ChecklistItem) => {
        map[item.parameterId] = item.weight;
      });
      setLocalItems(map);
      baselineItems.current = { ...map };
      setCommittedChanges({});
      setPendingTaskChanges(new Set());
      toast.info("Reset to last saved state");
    } catch {
      toast.error("Could not refresh checklist");
    }
  };

  const handleExport = () => {
    if (!canExport) return;
    const data = {
      projectId,
      checklist,
      items: Object.entries(localItems)
        .filter(([, w]) => w > 0)
        .map(([parameterId, weight]) => ({ parameterId, weight })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checklist-${projectId}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Checklist exported");
  };

  const handleCreateDraft = async () => {
    if (!canCreateDraft) return;
    setIsCreating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to create draft");
      const newChecklist = await res.json();
      setChecklist(newChecklist);
      setLocalItems({});
      baselineItems.current = {};
      toast.success("Draft checklist created");
    } catch {
      toast.error("Could not create draft");
    } finally {
      setIsCreating(false);
    }
  };

  // ⚠️ All hooks are now called – early returns are safe

  if (!canView) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <p className="text-muted-foreground">
          You do not have permission to view the checklist.
        </p>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">No Checklist Yet</h2>
        <p className="text-muted-foreground mb-6">
          This project does not have a checklist. Click below to start a draft
          based on the project template.
        </p>
        {canCreateDraft && (
          <Button onClick={handleCreateDraft} disabled={isCreating}>
            {isCreating ? "Creating..." : "Start Draft"}
          </Button>
        )}
      </div>
    );
  }

  const isReadOnly = currentPhase.id === "Approved";

  // ── Statistics (based on effective weights) ──────────────────────────────
  const stats = useMemo(() => {
    const totalParams = standardParams.length + customParams.length;
    const includedParams = Object.values(localItems).filter(
      (w) => w > 0,
    ).length;
    const totalWeight = Object.values(localItems).reduce(
      (sum, w) => sum + w,
      0,
    );
    const categoryStats: Record<
      string,
      { included: number; total: number; weight: number }
    > = {};

    // Group all items by category
    const allItems = [
      ...standardParams,
      ...customParams.map((c) => ({
        id: c.id,
        label: c.label,
        category: c.category,
      })),
    ];
    const grouped = allItems.reduce(
      (acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
      },
      {} as Record<string, typeof allItems>,
    );

    Object.entries(grouped).forEach(([cat, params]) => {
      const included = params.filter((p) => (localItems[p.id] ?? 0) > 0).length;
      const weight = params.reduce(
        (sum, p) => sum + (localItems[p.id] ?? 0),
        0,
      );
      categoryStats[cat] = { included, total: params.length, weight };
    });

    return { totalParams, includedParams, totalWeight, categoryStats };
  }, [standardParams, customParams, localItems]);

  const remainingCategoryWeight = currentPhase.allowsWeightAssignment
    ? Math.max(
        0,
        100 - Object.values(categoryWeights).reduce((a, b) => a + b, 0),
      )
    : null;

  // ── Filtered & grouped params for display ────────────────────────────────
  const filteredParams = useMemo(() => {
    let params: { id: string; label: string; category: string }[] = [
      ...standardParams,
      ...customParams.map((cp) => ({
        id: cp.id,
        label: cp.label,
        category: cp.category,
      })),
    ];

    // In weight phases, only show items that are included (effective weight > 0)
    if (currentPhase.allowsWeightAssignment) {
      params = params.filter((p) => (localItems[p.id] ?? 0) > 0);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      params = params.filter(
        (p) =>
          p.label.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }

    if (showIncludedOnly && currentPhase.allowsTaskSelection) {
      params = params.filter((p) => (localItems[p.id] ?? 0) > 0);
    }

    return params;
  }, [
    standardParams,
    customParams,
    currentPhase,
    searchQuery,
    showIncludedOnly,
    localItems,
  ]);

  const groupedParams = useMemo(() => {
    const groups: Record<string, typeof filteredParams> = {};
    filteredParams.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    Object.keys(groups).forEach((cat) =>
      groups[cat].sort((a, b) => a.id.localeCompare(b.id)),
    );
    return groups;
  }, [filteredParams]);

  const weightedItems = useMemo(
    () =>
      checklist?.items
        .filter((i) => i.weight > 0)
        .map((i) => ({
          parameterId: i.parameterId,
          label: i.label,
          category: i.category,
          weight: i.weight,
        })) ?? [],
    [checklist?.items],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {reasonDialog && (
        <ReasonDialog
          open={reasonDialog.open}
          paramLabel={reasonDialog.paramLabel}
          oldValue={reasonDialog.oldValue}
          newValue={reasonDialog.newValue}
          isTaskSelection={currentPhase.allowsTaskSelection}
          onConfirm={handleReasonConfirm}
          onCancel={handleReasonCancel}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Project Checklist
          </h1>
          <p className="text-muted-foreground">{currentPhase.description}</p>
        </div>
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {canExport && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            )}
            {currentPhase.allowsTaskSelection && effectiveCanEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIncludedOnly(!showIncludedOnly)}
              >
                {showIncludedOnly ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {showIncludedOnly ? "Show All" : "Included Only"}
              </Button>
            )}
            {canReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={
                  !hasPendingChanges &&
                  !hasCommittedChanges &&
                  !hasUncommittedChanges
                }
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Reset
              </Button>
            )}
            {canSave && !isReviewPhase && (
              <Button
                onClick={() => handleSave()}
                disabled={saving || !hasPendingChanges}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Review mode banner */}
      {isReviewPhase && canApplyChanges && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-sm text-amber-800 dark:text-amber-300">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Review mode</p>
            <p className="text-amber-700 dark:text-amber-400">
              Any changes you make will show an <strong>Apply</strong> checkbox
              on that task. Click it to record your change with a reason before
              sending back.
            </p>
          </div>
        </div>
      )}

      {hasUncommittedChanges && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          You have changes that haven't been applied yet. Click the{" "}
          <strong>Apply</strong> checkbox on each changed task to record a
          reason.
        </div>
      )}

      {/* Phase progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
            <div className="relative flex justify-between">
              {PHASES.map((phase, idx) => {
                const isCurrent = phase.id === checklist.status;
                const isCompleted =
                  PHASES.findIndex((p) => p.id === checklist.status) > idx;
                return (
                  <div
                    key={phase.id}
                    className="flex flex-col items-center relative z-10"
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2",
                        isCurrent &&
                          "border-primary bg-primary text-primary-foreground",
                        isCompleted &&
                          "border-primary bg-primary text-primary-foreground",
                        !isCurrent &&
                          !isCompleted &&
                          "border-muted bg-background text-muted-foreground",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        phase.icon
                      )}
                    </div>
                    <div className="text-center mt-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          (isCurrent || isCompleted) && "text-primary",
                        )}
                      >
                        {phase.label}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-[120px]">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category weight indicator (only in weight phases) */}
      {currentPhase.allowsWeightAssignment && (
        <Card className="bg-muted/20">
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Category Weights</h3>
              <div className="text-sm">
                Total:{" "}
                <span className="font-bold">
                  {Object.values(categoryWeights).reduce((a, b) => a + b, 0)} /
                  100
                </span>
              </div>
            </div>
            {Object.keys(groupedParams).map((category) => {
              const weight = categoryWeights[category] ?? 0;
              return (
                <div key={category} className="flex items-center gap-4">
                  <span className="w-32 text-sm truncate">{category}</span>
                  <Slider
                    value={[weight]}
                    onValueChange={([v]) => setCategoryWeight(category, v)}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) =>
                      setCategoryWeight(category, +e.target.value)
                    }
                    className="w-20"
                    min={0}
                    max={100}
                  />
                </div>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const cats = Object.keys(groupedParams);
                const equal = Math.floor(100 / cats.length);
                const dist: Record<string, number> = {};
                cats.forEach(
                  (c, i) =>
                    (dist[c] =
                      i === cats.length - 1
                        ? 100 - equal * (cats.length - 1)
                        : equal),
                );
                setCategoryWeights(dist);
              }}
            >
              Auto‑distribute equally
            </Button>
            {remainingCategoryWeight !== null &&
              remainingCategoryWeight > 0 && (
                <p className="text-sm text-muted-foreground">
                  Remaining for categories: {remainingCategoryWeight.toFixed(0)}
                </p>
              )}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="items">Edit Checklist</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            {showWorkplanTab && (
              <TabsTrigger value="workplan">
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                Set Dates
              </TabsTrigger>
            )}
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="font-bold">
                {stats.includedParams}
                {currentPhase.allowsTaskSelection && `/${stats.totalParams}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentPhase.allowsTaskSelection
                  ? "Selected Tasks"
                  : "Total Tasks"}
              </p>
            </div>
            {currentPhase.allowsWeightAssignment && (
              <div className="text-center">
                <p className="font-bold">{stats.totalWeight.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Total Weight</p>
              </div>
            )}
            <div className="text-center">
              <p className="font-bold">{Object.keys(groupedParams).length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>

          {!isReadOnly && effectiveCanEdit && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExport}>
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => toast.info("Print coming soon")}
                  >
                    Print Checklist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {isReadOnly ? (
            <Card>
              <CardHeader>
                <CardTitle>Finalized Checklist</CardTitle>
                <CardDescription>
                  This checklist has been approved and is now active for
                  tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Checklist Approved
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    This checklist is now in tracking mode. No further edits are
                    allowed.
                  </p>
                  <Button variant="outline" asChild>
                    <Link href={`/projects/${projectId}?tab=trackers`}>
                      Go to Trackers
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {Object.entries(groupedParams).map(([category, params]) => {
                const catStat = stats.categoryStats[category] || {
                  included: 0,
                  total: params.length,
                  weight: 0,
                };
                const allIncluded =
                  currentPhase.allowsTaskSelection &&
                  params.every((p) => (localItems[p.id] ?? 0) > 0);

                return (
                  <AccordionItem
                    key={category}
                    value={category}
                    className="border rounded-lg"
                  >
                    <AccordionTrigger className="px-6 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-4">
                          {currentPhase.allowsTaskSelection &&
                            effectiveCanEdit && (
                              <SimpleCheckbox
                                checked={allIncluded}
                                onCheckedChange={() => {
                                  const newValue = allIncluded ? 0 : 1;
                                  const newItems = { ...localItems };
                                  params.forEach((p) => {
                                    newItems[p.id] = newValue;
                                  });
                                  setLocalItems(newItems);
                                  if (isReviewPhase && canApplyChanges) {
                                    params.forEach((p) => {
                                      const baseline =
                                        baselineItems.current[p.id] ?? 0;
                                      if (newValue !== baseline) {
                                        setPendingTaskChanges((prev) => {
                                          const next = new Set(prev);
                                          next.add(p.id);
                                          return next;
                                        });
                                      }
                                    });
                                  }
                                }}
                                disabled={!effectiveCanEdit}
                              />
                            )}
                          <div className="text-left">
                            <div className="font-semibold">{category}</div>
                            <div className="text-sm text-muted-foreground">
                              {params.length} items
                              {currentPhase.allowsTaskSelection &&
                                ` • ${catStat.included} selected`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {currentPhase.allowsWeightAssignment && (
                            <Badge variant="outline" className="font-mono">
                              {categoryWeights[category] ?? 0} pts
                            </Badge>
                          )}
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-6 pb-4 space-y-3">
                        {params.map((param) => {
                          const effectiveWeight = localItems[param.id] ?? 0;
                          const included = effectiveWeight > 0;
                          const baseline = baselineItems.current[param.id] ?? 0;
                          const isDirty =
                            Math.abs(effectiveWeight - baseline) > 0.001;
                          const isApplied = !!committedChanges[param.id];
                          const isPending =
                            pendingTaskChanges.has(param.id) && isDirty;
                          const annotation = checklist.taskAnnotations?.find(
                            (a) => a.parameterId === param.id,
                          );

                          // For weight phases, we need the local weight inside the category
                          const localWeight = itemLocalWeights[param.id] ?? 0;
                          const catWeight = categoryWeights[category] ?? 0;

                          return (
                            <div
                              key={param.id}
                              className={cn(
                                "flex flex-col gap-2 p-3 border rounded-lg transition-colors",
                                isPending &&
                                  "border-amber-300 bg-amber-50 dark:bg-amber-950/20",
                                isApplied &&
                                  "border-green-300 bg-green-50 dark:bg-green-950/20",
                              )}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1">
                                  {currentPhase.allowsTaskSelection &&
                                    effectiveCanEdit && (
                                      <Checkbox
                                        checked={included}
                                        onCheckedChange={() =>
                                          toggleTaskInclude(param.id)
                                        }
                                        className="mt-1"
                                        disabled={!effectiveCanEdit}
                                      />
                                    )}
                                  <div className="space-y-1">
                                    <Label
                                      className={cn(
                                        "font-medium cursor-pointer",
                                        !currentPhase.allowsTaskSelection &&
                                          "cursor-default",
                                      )}
                                    >
                                      {param.id} — {param.label}
                                    </Label>
                                    {!standardParams.find(
                                      (p) => p.id === param.id,
                                    ) && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs text-primary border-primary/30 ml-2"
                                      >
                                        Custom
                                      </Badge>
                                    )}
                                    {annotation && (
                                      <TaskChangeBadge
                                        annotation={annotation}
                                      />
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {currentPhase.allowsWeightAssignment &&
                                  included ? (
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <div className="text-lg font-bold">
                                          {localWeight}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          local
                                        </div>
                                      </div>
                                      {effectiveCanEdit ? (
                                        <>
                                          <div className="w-32">
                                            <Slider
                                              value={[localWeight]}
                                              onValueChange={([v]) =>
                                                setItemLocalWeight(
                                                  param.id,
                                                  v,
                                                  category,
                                                )
                                              }
                                              max={100}
                                              step={1}
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                              <span>0</span>
                                              <span>
                                                {100 -
                                                  Object.keys(itemLocalWeights)
                                                    .filter(
                                                      (id) =>
                                                        id !== param.id &&
                                                        groupedParams[
                                                          category
                                                        ]?.some(
                                                          (p) => p.id === id,
                                                        ),
                                                    )
                                                    .reduce(
                                                      (sum, id) =>
                                                        sum +
                                                        (itemLocalWeights[id] ??
                                                          0),
                                                      0,
                                                    )}
                                              </span>
                                            </div>
                                          </div>
                                          <Input
                                            type="number"
                                            value={localWeight}
                                            onChange={(e) =>
                                              setItemLocalWeight(
                                                param.id,
                                                +e.target.value,
                                                category,
                                              )
                                            }
                                            className="w-20"
                                            min={0}
                                            max={100}
                                          />
                                          <div className="text-right min-w-[60px]">
                                            <div className="text-sm font-mono">
                                              {effectiveWeight.toFixed(2)}%
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              effective
                                            </div>
                                          </div>
                                        </>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="font-mono"
                                        >
                                          {effectiveWeight.toFixed(1)} pts
                                        </Badge>
                                      )}
                                    </div>
                                  ) : included &&
                                    currentPhase.allowsTaskSelection ? (
                                    <Badge
                                      variant="outline"
                                      className="text-green-600 border-green-200 bg-green-50"
                                    >
                                      <CheckSquare className="w-3 h-3 mr-1" />{" "}
                                      Selected
                                    </Badge>
                                  ) : currentPhase.allowsTaskSelection ? (
                                    <Badge
                                      variant="outline"
                                      className="text-muted-foreground"
                                    >
                                      <Square className="w-3 h-3 mr-1" /> Not
                                      Selected
                                    </Badge>
                                  ) : null}

                                  {isReviewPhase &&
                                    canApplyChanges &&
                                    isDirty &&
                                    !isApplied && (
                                      <div className="flex items-center gap-1.5 ml-2">
                                        <Checkbox
                                          id={`apply-${param.id}`}
                                          checked={false}
                                          onCheckedChange={() =>
                                            handleApplyChange(
                                              param.id,
                                              param.label,
                                            )
                                          }
                                          className="border-amber-400 data-[state=checked]:bg-amber-500"
                                        />
                                        <Label
                                          htmlFor={`apply-${param.id}`}
                                          className="text-xs font-medium text-amber-700 dark:text-amber-400 cursor-pointer"
                                        >
                                          Apply
                                        </Label>
                                      </div>
                                    )}
                                  {isReviewPhase &&
                                    canApplyChanges &&
                                    isApplied && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-green-700 border-green-300 bg-green-50 dark:bg-green-950/20 text-xs"
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />{" "}
                                        Applied
                                      </Badge>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          {/* Add custom task (only during Draft) */}
          {currentPhase.id === "Draft" && canAddCustom && (
            <div className="mt-4 border border-dashed border-primary/30 rounded-xl p-4 bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Add Custom Task
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tasks added here are project‑specific. They become permanent
                    once the ME officer approves this draft.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddCustom((v) => !v)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Custom Task
                </Button>
              </div>
              {showAddCustom && (
                <AddCustomItemForm
                  existingCategories={[
                    ...Object.keys(groupedParams),
                    ...Array.from(new Set(customParams.map((p) => p.category))),
                  ]}
                  onAdd={(label, category) => {
                    const newParam: any = {
                      id: `custom-${uuidv4()}`,
                      label,
                      category,
                      isPending: true,
                      addedBy: "",
                      addedAt: new Date().toISOString(),
                    };
                    setCustomParams((prev) => [...prev, newParam]);
                    setLocalItems((prev) => ({ ...prev, [newParam.id]: 1 }));
                    setShowAddCustom(false);
                    toast.success(`Custom task "${label}" added`);
                  }}
                  onCancel={() => setShowAddCustom(false)}
                />
              )}
              {customParams.length > 0 && (
                <div className="space-y-2 mt-3">
                  {customParams.map((cp) => (
                    <div
                      key={cp.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg border border-primary/20 bg-white dark:bg-card"
                    >
                      <Badge
                        variant="outline"
                        className="text-xs text-primary border-primary/30 shrink-0"
                      >
                        Custom
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {cp.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cp.category}
                        </p>
                      </div>
                      {canDeleteCustom && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCustomParams((prev) =>
                              prev.filter((p) => p.id !== cp.id),
                            );
                            setLocalItems((prev) => {
                              const next = { ...prev };
                              delete next[cp.id];
                              return next;
                            });
                          }}
                          className="shrink-0 hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Checklist Preview</CardTitle>
              <CardDescription>
                How your checklist will appear to reviewers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedParams).map(([category, params]) => {
                  const included = params.filter(
                    (p) => (localItems[p.id] ?? 0) > 0,
                  );
                  if (included.length === 0) return null;
                  const catWeight = currentPhase.allowsWeightAssignment
                    ? (categoryWeights[category] ?? 0)
                    : null;
                  const catEffective =
                    catWeight !== null
                      ? included.reduce(
                          (sum, p) => sum + (localItems[p.id] ?? 0),
                          0,
                        )
                      : included.reduce(
                          (sum, p) => sum + (localItems[p.id] ?? 0),
                          0,
                        );

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                          {category}
                          {catWeight !== null && ` (${catWeight}% of project)`}
                        </h3>
                        <Badge variant="outline">
                          {catEffective.toFixed(1)} pts
                        </Badge>
                      </div>
                      {included.map((p) => {
                        const weight = localItems[p.id] ?? 0;
                        const localWeight = itemLocalWeights[p.id] ?? 0;
                        const effective = weight;
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{p.label}</p>
                              {currentPhase.allowsWeightAssignment && (
                                <p className="text-sm text-muted-foreground">
                                  Local: {localWeight}% → Effective:{" "}
                                  {effective.toFixed(2)}%
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold">
                                {effective.toFixed(2)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                points
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workplan Dates Tab */}
        {showWorkplanTab && (
          <TabsContent value="workplan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Set Planned Dates
                </CardTitle>
                <CardDescription>
                  Set the planned start and end date for each checklist item.
                  These dates will appear on the project Gantt chart. Items must
                  have a weight assigned before they appear here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkplanDateEditor
                  projectId={projectId}
                  items={weightedItems}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Checklist History</CardTitle>
              <CardDescription>Previous versions and changes</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <Skeleton className="h-40 w-full" />
              ) : history.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No history entries yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-4 p-4 border rounded-lg"
                    >
                      <div className="p-2 rounded-full bg-primary/10">
                        <History className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          Changed to {entry.status} by {entry.changedBy}
                        </p>
                        {entry.reason && (
                          <p className="text-sm text-muted-foreground">
                            Reason: {entry.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Footer */}
      {!isReadOnly && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {canSave && !isReviewPhase && (
                  <Button
                    onClick={() => handleSave()}
                    disabled={saving || !hasPendingChanges}
                    className="sm:flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                )}

                {canSubmitReview && checklist.status === "Draft" && (
                  <Button
                    variant="outline"
                    onClick={() => handleSave("DraftReview")}
                    disabled={saving}
                  >
                    Submit for Draft Review
                  </Button>
                )}

                {canReview && checklist.status === "DraftReview" && (
                  <Button
                    variant="outline"
                    onClick={() => handleSave("Draft")}
                    disabled={
                      saving || hasUncommittedChanges || !hasCommittedChanges
                    }
                  >
                    Send Back to Draft
                  </Button>
                )}

                {canReview && checklist.status === "DraftReview" && (
                  <Button
                    variant="default"
                    onClick={() => handleSave("WeightsAssignment")}
                    disabled={saving || hasUncommittedChanges}
                  >
                    Approve Draft → Weights
                  </Button>
                )}

                {canSubmitReview &&
                  checklist.status === "WeightsAssignment" && (
                    <Button
                      variant="outline"
                      onClick={() => handleSave("WeightsReview")}
                      disabled={saving}
                    >
                      Submit for Weights Review
                    </Button>
                  )}

                {canReview && checklist.status === "WeightsReview" && (
                  <Button
                    variant="outline"
                    onClick={() => handleSave("WeightsAssignment")}
                    disabled={
                      saving || hasUncommittedChanges || !hasCommittedChanges
                    }
                  >
                    Send Back to Weights
                  </Button>
                )}

                {canReview && checklist.status === "WeightsReview" && (
                  <Button
                    variant="default"
                    onClick={() => handleSave("Approved")}
                    disabled={saving || hasUncommittedChanges}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve & Finalize
                  </Button>
                )}
              </div>

              {hasUncommittedChanges && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  Click <strong>Apply</strong> on each changed task before
                  proceeding
                </div>
              )}

              {isReviewPhase &&
                canApplyChanges &&
                !hasCommittedChanges &&
                !hasUncommittedChanges && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4" />
                    No changes made. You can approve directly or make changes
                    and apply them.
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
