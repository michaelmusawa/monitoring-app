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
import { v4 as uuid } from "uuid";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  parameterId: string;
  weight: number;
  label: string;
  category: string;
}

export interface CustomParam {
  id: string; // local uid, e.g. "custom-abc123"
  label: string;
  category: string;
  isPending: true; // always true until promoted
  addedBy: string; // user email
  addedAt: string; // ISO date
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
  /** Task-level change annotations sent back by ME officer */
  taskAnnotations?: TaskAnnotation[];
  /** Custom items added by sector officer — persisted in ChecklistCustomItem */
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

/**
 * A per-task annotation created by the ME officer when sending back.
 * Stored alongside the checklist (e.g. in a JSON column or separate table).
 */
export interface TaskAnnotation {
  parameterId: string;
  oldValue: number;
  newValue: number;
  reason: string;
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
    description: "Assign weights to selected tasks",
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

// ─── Add Custom Item Form ─────────────────────────────────────────────────────

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

// ─── Reason Dialog ────────────────────────────────────────────────────────────

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

  // Reset when opened
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

// ─── Task Change Annotation Badge ─────────────────────────────────────────────

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

// ─── Inline Workplan Date Editor ─────────────────────────────────────────────

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
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  checklist: Checklist | null;
  standardParams: StandardParam[];
  userRole: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProjectChecklistClient({
  projectId,
  checklist: initialChecklist,
  standardParams,
  userRole,
  userSector,
}: Props) {
  const router = useRouter();

  const [loading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<Checklist | null>(
    initialChecklist,
  );
  const [localItems, setLocalItems] = useState<Record<string, number>>({});

  // Custom items added by sector officer
  const [customParams, setCustomParams] = useState<CustomParam[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);

  /** The "baseline" weights as loaded from server — used to detect diffs */
  const baselineItems = useRef<Record<string, number>>({});

  /**
   * Per-task changes that the ME officer has annotated with reasons.
   * key = parameterId, value = { oldValue, newValue, reason }
   * These are "committed" (Apply clicked + reason given).
   */
  const [committedChanges, setCommittedChanges] = useState<
    Record<string, TaskAnnotation>
  >({});

  /**
   * Per-task changes that the ME officer made but hasn't applied yet
   * (checkbox not clicked). key = parameterId.
   */
  const [pendingTaskChanges, setPendingTaskChanges] = useState<Set<string>>(
    new Set(),
  );

  /** Dialog state: which parameterId is awaiting a reason */
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

  // ── Init local state from checklist ──────────────────────────────────────

  useEffect(() => {
    if (checklist) {
      const map: Record<string, number> = {};
      checklist.items.forEach((item) => {
        map[item.parameterId] = item.weight;
      });

      console.log("custom items", checklist.customItems);

      // Load custom items and ensure they have a weight entry
      if (checklist.customItems && checklist.customItems.length > 0) {
        setCustomParams(checklist.customItems);
        checklist.customItems.forEach((cp) => {
          if (!(cp.id in map)) map[cp.id] = 1;
        });
      } else {
        setCustomParams([]);
      }

      setLocalItems(map);
      baselineItems.current = { ...map };

      // Load existing task annotations if any (sent back by ME)
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
  }, [checklist]);

  // ── History ───────────────────────────────────────────────────────────────

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

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentPhase = useMemo(
    () => PHASES.find((p) => p.id === checklist?.status) || PHASES[0],
    [checklist?.status],
  );

  const isReviewPhase = currentPhase.isReviewPhase;

  const permissions = useMemo(() => {
    const phase = currentPhase.id;
    if (phase === "Approved")
      return { canEdit: false, canReview: false, canView: true };
    if (phase === "Draft")
      return {
        canEdit: userSector !== "Monitoring and Evaluation",
        canReview: false,
        canView: true,
      };
    if (phase === "DraftReview")
      return {
        canEdit: userSector === "Monitoring and Evaluation",
        canReview: userSector === "Monitoring and Evaluation",
        canView: true,
      };
    if (phase === "WeightsAssignment")
      return {
        canEdit: userSector !== "Monitoring and Evaluation",
        canReview: false,
        canView: true,
      };
    if (phase === "WeightsReview")
      return {
        canEdit: userSector === "Monitoring and Evaluation",
        canReview: userSector === "Monitoring and Evaluation",
        canView: true,
      };
    return { canEdit: false, canReview: false, canView: true };
  }, [currentPhase.id, userRole]);

  const effectiveCanEdit =
    permissions.canEdit &&
    (currentPhase.allowsTaskSelection || currentPhase.allowsWeightAssignment);

  const effectiveCanReview = permissions.canReview;

  const showWorkplanTab =
    currentPhase.id === "WeightsAssignment" &&
    userSector !== "Monitoring and Evaluation";

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

  /** True if any local item differs from baseline AND is not yet committed */
  const hasUncommittedChanges = useMemo(() => {
    if (!isReviewPhase || userSector !== "Monitoring and Evaluation")
      return false;
    for (const [pid, val] of Object.entries(localItems)) {
      const baseline = baselineItems.current[pid] ?? 0;
      if (val !== baseline && !committedChanges[pid]) return true;
    }
    return false;
  }, [localItems, committedChanges, isReviewPhase, userRole]);

  /** True if the ME officer has any committed changes queued to send back */
  const hasCommittedChanges = Object.keys(committedChanges).length > 0;

  /** For non-review phases: any local value different from baseline */
  const hasPendingChanges = useMemo(() => {
    if (isReviewPhase && userSector === "Monitoring and Evaluation")
      return false; // handled differently
    for (const [pid, val] of Object.entries(localItems)) {
      const baseline = baselineItems.current[pid] ?? 0;
      if (val !== baseline) return true;
    }
    return false;
  }, [localItems, isReviewPhase, userRole]);

  const filteredParams = useMemo(() => {
    // Merge standard params with custom params (shaped as StandardParam)
    const customAsStandard: StandardParam[] = customParams.map((cp) => ({
      id: cp.id,
      label: cp.label,
      category: cp.category,
    }));
    let params: StandardParam[] = [...standardParams, ...customAsStandard];

    if (
      currentPhase.id === "WeightsAssignment" ||
      currentPhase.id === "WeightsReview" ||
      currentPhase.id === "Approved"
    ) {
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
    const groups: Record<string, StandardParam[]> = {};
    filteredParams.forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    Object.keys(groups).forEach((cat) =>
      groups[cat].sort((a, b) => a.id.localeCompare(b.id)),
    );
    return groups;
  }, [filteredParams]);

  const stats = useMemo(() => {
    const totalParams = standardParams.length;
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
    Object.entries(groupedParams).forEach(([cat, params]) => {
      const included = params.filter((p) => (localItems[p.id] ?? 0) > 0).length;
      const weight = params.reduce(
        (sum, p) => sum + (localItems[p.id] ?? 0),
        0,
      );
      categoryStats[cat] = { included, total: params.length, weight };
    });
    return { totalParams, includedParams, totalWeight, categoryStats };
  }, [standardParams, groupedParams, localItems]);

  const remainingWeight = useMemo(() => {
    if (currentPhase.id !== "WeightsAssignment") return null;
    return Math.max(0, 100 - stats.totalWeight);
  }, [stats.totalWeight, currentPhase.id]);

  const getRemainingWeightForTask = (paramId: string) => {
    const total = Object.values(localItems).reduce(
      (sum, w) => sum + (w ?? 0),
      0,
    );
    const current = localItems[paramId] ?? 0;
    return 100 - (total - current);
  };

  // ── Edit handlers ─────────────────────────────────────────────────────────

  const toggleTaskInclude = (paramId: string) => {
    if (!effectiveCanEdit || !currentPhase.allowsTaskSelection) return;
    const isIncluded = (localItems[paramId] ?? 0) > 0;
    const newValue = isIncluded ? 0 : 1;
    setLocalItems((prev) => ({ ...prev, [paramId]: newValue }));
    // Mark as pending (unapplied) for review phases
    if (isReviewPhase && userRole !== "Monitoring and Evaluation") {
      setPendingTaskChanges((prev) => {
        const next = new Set(prev);
        next.add(paramId);
        return next;
      });
      // Remove from committed if re-editing
      setCommittedChanges((prev) => {
        const next = { ...prev };
        delete next[paramId];
        return next;
      });
    }
  };

  const setTaskWeight = (paramId: string, weight: number) => {
    if (!effectiveCanEdit || !currentPhase.allowsWeightAssignment) return;
    const totalWithoutCurrent = Object.entries(localItems).reduce(
      (sum, [id, w]) => (id === paramId ? sum : sum + (w ?? 0)),
      0,
    );
    const maxAllowed = 100 - totalWithoutCurrent;
    const newWeight = Math.max(0, Math.min(weight, maxAllowed));
    setLocalItems((prev) => ({ ...prev, [paramId]: newWeight }));
    if (isReviewPhase && userSector !== "Monitoring and Evaluation") {
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

  /**
   * Called when ME officer clicks "Apply" checkbox on a changed task.
   * Opens the reason dialog.
   */
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
    // Revert local change back to baseline
    const { parameterId, oldValue } = reasonDialog;
    setLocalItems((prev) => ({ ...prev, [parameterId]: oldValue }));
    setPendingTaskChanges((prev) => {
      const next = new Set(prev);
      next.delete(parameterId);
      return next;
    });
    setReasonDialog(null);
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async (newStatus?: string) => {
    if (!checklist) return;

    // In review phases, ME must apply (commit) all changes before sending back
    if (
      isReviewPhase &&
      userSector === "Monitoring and Evaluation" &&
      hasUncommittedChanges
    ) {
      toast.error(
        "Apply all your changes (click the Apply checkbox) before saving.",
      );
      return;
    }

    setSaving(true);
    try {
      const items = Object.entries(localItems)
        .filter(([, w]) => w > 0)
        .map(([parameterId, weight]) => {
          // Look up label/category in standard params first, then custom params
          const std = standardParams.find((p) => p.id === parameterId);
          const custom = customParams.find((p) => p.id === parameterId);
          return {
            parameterId,
            weight,
            label: std?.label || custom?.label || "",
            category: std?.category || custom?.category || "",
          };
        });

      const res = await fetch(`/api/projects/${projectId}/checklist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checklistId: checklist.id,
          status: newStatus || checklist.status,
          items,
          taskAnnotations: Object.values(committedChanges),
          customItems: customParams, // ← always send so server keeps them in sync
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

  // ─── Conditional renders ──────────────────────────────────────────────────

  if (!checklist) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">No Checklist Yet</h2>
        <p className="text-muted-foreground mb-6">
          This project does not have a checklist. Click below to start a draft
          based on the project template.
        </p>
        <Button onClick={handleCreateDraft} disabled={isCreating}>
          {isCreating ? "Creating..." : "Start Draft"}
        </Button>
      </div>
    );
  }

  if (
    !effectiveCanEdit &&
    !effectiveCanReview &&
    currentPhase.id !== "Approved"
  ) {
    return (
      <div className="p-8 text-center border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">View‑only Mode</h2>
        <p className="text-muted-foreground mb-6">
          You are viewing this checklist in the {currentPhase.label} phase. No
          edits are allowed.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}`}>Back to Project</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isReadOnly = currentPhase.id === "Approved";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Reason dialog */}
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
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            {currentPhase.allowsTaskSelection && effectiveCanEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIncludedOnly(!showIncludedOnly)}
              >
                {showIncludedOnly ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" /> Show All
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" /> Included Only
                  </>
                )}
              </Button>
            )}
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
            {effectiveCanEdit && !isReviewPhase && (
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

      {/* ME officer review banner */}
      {isReviewPhase && userRole === "me" && (
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

      {/* Uncommitted changes warning */}
      {hasUncommittedChanges && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          You have changes that haven't been applied yet. Click the{" "}
          <strong>Apply</strong> checkbox on each changed task to record a
          reason.
        </div>
      )}

      {/* Committed changes summary for ME */}
      {isReviewPhase && userRole === "me" && hasCommittedChanges && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 text-sm text-green-700 dark:text-green-400">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {Object.keys(committedChanges).length} change
          {Object.keys(committedChanges).length > 1 ? "s" : ""} applied and
          ready to send back.
        </div>
      )}

      {/* Phase Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
            <div className="relative flex justify-between">
              {PHASES.map((phase, idx) => {
                const isCurrent = phase.id === checklist.status;
                const isCompleted =
                  PHASES.findIndex((p) => p.id === checklist.status) > idx;
                const isFuture =
                  PHASES.findIndex((p) => p.id === checklist.status) < idx;
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
                        isFuture &&
                          "border-muted bg-background text-muted-foreground",
                        isReadOnly && "opacity-60",
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
                          isCurrent && "text-primary",
                          isCompleted && "text-primary",
                          isFuture && "text-muted-foreground",
                          isReadOnly && "opacity-60",
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

      {/* Remaining weight indicator */}
      {remainingWeight !== null && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <p className="text-sm">
              Remaining weight to assign:{" "}
              <span className="font-bold text-lg">{remainingWeight}</span> / 100
              {remainingWeight < 0 && (
                <span className="ml-2 text-red-600">(exceeded!)</span>
              )}
            </p>
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
            <TabsTrigger value="items">
              {isReadOnly
                ? "Checklist"
                : effectiveCanEdit
                  ? "Edit Checklist"
                  : "View Checklist"}
            </TabsTrigger>
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
                <p className="font-bold">{stats.totalWeight}</p>
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
                const catStat = stats.categoryStats[category];
                const allIncluded = params.every(
                  (p) => (localItems[p.id] ?? 0) > 0,
                );
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
                              <Checkbox
                                checked={allIncluded}
                                onCheckedChange={() => {
                                  const newValue = allIncluded ? 0 : 1;
                                  const newItems = { ...localItems };
                                  params.forEach((p) => {
                                    newItems[p.id] = newValue;
                                  });
                                  setLocalItems(newItems);
                                  if (isReviewPhase && userRole === "me") {
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
                                onClick={(e) => e.stopPropagation()}
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
                              {catStat.weight} pts
                            </Badge>
                          )}
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-6 pb-4 space-y-3">
                        {params.map((param) => {
                          const weight = localItems[param.id] ?? 0;
                          const included = weight > 0;
                          const maxWeight = getRemainingWeightForTask(param.id);
                          const baseline = baselineItems.current[param.id] ?? 0;
                          const isDirty = weight !== baseline;
                          const isApplied = !!committedChanges[param.id];
                          const isPending =
                            pendingTaskChanges.has(param.id) && isDirty;
                          const annotation =
                            // Show annotation for sector officer when checklist was sent back
                            userSector !== "Monitoring And Evaluation" &&
                            checklist.taskAnnotations?.find(
                              (a) => a.parameterId === param.id,
                            );

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
                                    {/* Custom badge — shown when this param is not in standardParams */}
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
                                    {param.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {param.description}
                                      </p>
                                    )}
                                    {/* Annotation visible to sector officer */}
                                    {annotation && (
                                      <TaskChangeBadge
                                        annotation={annotation}
                                      />
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  {/* Weight controls */}
                                  {currentPhase.allowsWeightAssignment &&
                                  included ? (
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <div className="text-lg font-bold">
                                          {weight}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          points
                                        </div>
                                      </div>
                                      {effectiveCanEdit ? (
                                        <>
                                          <div className="w-32">
                                            <Slider
                                              value={[weight]}
                                              onValueChange={([v]) =>
                                                setTaskWeight(param.id, v)
                                              }
                                              max={100}
                                              step={1}
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                              <span>0</span>
                                              <span>{maxWeight}</span>
                                            </div>
                                          </div>
                                          <Input
                                            type="number"
                                            value={weight}
                                            onChange={(e) =>
                                              setTaskWeight(
                                                param.id,
                                                +e.target.value,
                                              )
                                            }
                                            className="w-20"
                                            min={0}
                                            max={maxWeight}
                                          />
                                        </>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="font-mono"
                                        >
                                          {weight} pts
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

                                  {/* Apply checkbox — only shown in review phases for ME on changed tasks */}
                                  {isReviewPhase &&
                                    userSector ===
                                      "Monitoring And Evaluation" &&
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

                                  {/* Applied indicator */}
                                  {isReviewPhase &&
                                    userRole === "me" &&
                                    isApplied && (
                                      <Badge
                                        variant="outline"
                                        className="ml-2 text-green-700 border-green-300 bg-green-50 dark:bg-green-950/20 text-xs"
                                      >
                                        <CheckCircle className="w-3 h-3 mr-1" />
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

          {/* ── Add Custom Task (sector officer, Draft phase only) ── */}
          {currentPhase.id === "Draft" && userRole === "sector" && (
            <div className="mt-4 border border-dashed border-primary/30 rounded-xl p-4 bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Add Custom Task
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tasks added here are project-specific. They become permanent
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
                    const newParam: CustomParam = {
                      id: `custom-${uuid()}`,
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
                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{category}</h3>
                        <Badge variant="outline">
                          {included.reduce(
                            (sum, p) => sum + (localItems[p.id] ?? 0),
                            0,
                          )}{" "}
                          pts
                        </Badge>
                      </div>
                      {included.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{p.label}</p>
                            {p.description && (
                              <p className="text-sm text-muted-foreground">
                                {p.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">
                              {localItems[p.id]}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              points
                            </div>
                          </div>
                        </div>
                      ))}
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
                {/* Non-review phase: standard save */}
                {effectiveCanEdit && !isReviewPhase && (
                  <Button
                    onClick={() => handleSave()}
                    disabled={saving || !hasPendingChanges}
                    className="sm:flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                )}

                {/* Draft → DraftReview */}
                {userSector !== "Monitoring And Evaluation" &&
                  checklist.status === "Draft" && (
                    <Button
                      variant="outline"
                      onClick={() => handleSave("DraftReview")}
                      disabled={saving}
                    >
                      Submit for Draft Review
                    </Button>
                  )}

                {/* DraftReview: ME sends back */}
                {userSector === "Monitoring And Evaluation" &&
                  checklist.status === "DraftReview" && (
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

                {/* DraftReview: ME approves */}
                {userSector === "Monitoring And Evaluation" &&
                  checklist.status === "DraftReview" && (
                    <Button
                      variant="default"
                      onClick={() => handleSave("WeightsAssignment")}
                      disabled={saving || hasUncommittedChanges}
                    >
                      Approve Draft → Weights
                    </Button>
                  )}

                {/* WeightsAssignment → WeightsReview */}
                {userSector !== "Monitoring And Evaluation" &&
                  checklist.status === "WeightsAssignment" && (
                    <Button
                      variant="outline"
                      onClick={() => handleSave("WeightsReview")}
                      disabled={saving}
                    >
                      Submit for Weights Review
                    </Button>
                  )}

                {/* WeightsReview: ME sends back */}
                {userSector === "Monitoring And Evaluation" &&
                  checklist.status === "WeightsReview" && (
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

                {/* WeightsReview: ME approves */}
                {userSector === "Monitoring And Evaluation" &&
                  checklist.status === "WeightsReview" && (
                    <Button
                      variant="default"
                      onClick={() => handleSave("Approved")}
                      disabled={saving || hasUncommittedChanges}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve &
                      Finalize
                    </Button>
                  )}
              </div>

              {/* Helper messages */}
              {hasUncommittedChanges && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  Click <strong>Apply</strong> on each changed task before
                  proceeding
                </div>
              )}

              {isReviewPhase &&
                userSector === "Monitoring And Evaluation" &&
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
