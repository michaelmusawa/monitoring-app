"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Edit3,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  Paperclip,
  X,
  SlidersHorizontal,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  TrackerCaptureModal,
  type TrackerCaptureData,
} from "@/components/trackers/TrackerCaptureModal";
import {
  ReportEditorDialog,
  type ReportDraft,
} from "@/components/trackers/ReportEditorDialog";
import { AttachmentsField } from "../trackers/AttachmentsField";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrackerItem {
  parameterId: string;
  weight: number;
  label: string;
  category: string;
  status: string;
  percentComplete: number;
  challenges?: string;
  recommendations?: string;
  attachments?: string[] | null;
}

export interface TrackerSubmission {
  id: string;
  projectId: string;
  title: string;
  submittedBy: string;
  submittedAt: string;
  overallPercent: number;
  items: TrackerItem[];
}

type ItemStatus = "ONGOING" | "STALLED" | "COMPLETED";
type Baselines = Record<string, number>;

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ItemStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  ONGOING: {
    label: "Ongoing",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  STALLED: {
    label: "Stalled",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const computeOverall = (items: TrackerItem[]) => {
  const totalWeight = items.reduce((sum, it) => sum + it.weight, 0);
  if (totalWeight === 0) return 0;
  return (
    items.reduce((sum, it) => sum + it.weight * it.percentComplete, 0) /
    totalWeight
  );
};

const getProgressColor = (pct: number) => {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-blue-500";
  if (pct >= 25) return "bg-amber-500";
  return "bg-red-500";
};

// Collect all attachment URLs from a tracker submission
const collectAttachments = (submission: TrackerSubmission): string[] => {
  const urls: string[] = [];
  submission.items.forEach((item) => {
    if (item.attachments && item.attachments.length > 0) {
      urls.push(...item.attachments);
    }
  });
  return urls;
};

// Build checklist items payload from tracker items for the AI prompt
const buildChecklistPayload = (submission: TrackerSubmission) =>
  submission.items.map((item) => ({
    parameterId: item.parameterId,
    weight: item.weight,
    label: item.label,
    category: item.category,
    percent: item.percentComplete,
  }));

// Build categories summary for the AI prompt
const buildCategorySummary = (submission: TrackerSubmission) => {
  const grouped: Record<string, { total: number; sum: number }> = {};
  submission.items.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = { total: 0, sum: 0 };
    grouped[item.category].total++;
    grouped[item.category].sum += item.percentComplete;
  });
  return Object.entries(grouped).map(([name, data]) => ({
    name,
    latestPercent: data.sum / data.total,
  }));
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as ItemStatus] ?? STATUS_CONFIG.ONGOING;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        cfg.color,
        cfg.bg,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          getProgressColor(value),
        )}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// ─── Tracker Card ─────────────────────────────────────────────────────────────

function TrackerCard({
  sub,
  canEdit,
  projectId,
  onView,
  onEdit,
}: {
  sub: TrackerSubmission;
  canEdit: boolean;
  projectId: string;
  onView: () => void;
  onEdit: () => void;
}) {
  const statusCounts = useMemo(() => {
    const counts = { COMPLETED: 0, ONGOING: 0, STALLED: 0 };
    sub.items.forEach((it) => {
      if (it.status in counts) counts[it.status as ItemStatus]++;
    });
    return counts;
  }, [sub.items]);

  return (
    <div
      onClick={onView}
      className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md transition-all duration-200"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate">{sub.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {sub.submittedBy} ·{" "}
            {new Date(sub.submittedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-bold tabular-nums">
            {sub.overallPercent.toFixed(1)}
          </span>
          <span className="text-sm text-zinc-500">%</span>
        </div>
      </div>

      <ProgressBar value={sub.overallPercent} className="mb-3" />

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(Object.entries(statusCounts) as [ItemStatus, number][]).map(
          ([status, count]) =>
            count > 0 && (
              <span
                key={status}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border",
                  STATUS_CONFIG[status].color,
                  STATUS_CONFIG[status].bg,
                )}
              >
                {STATUS_CONFIG[status].icon}
                {count} {STATUS_CONFIG[status].label}
              </span>
            ),
        )}
        <span className="text-xs text-zinc-400 ml-auto">
          {sub.items.length} items
        </span>
      </div>

      <div
        className="flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={onView}
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
        </Button>
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={onEdit}
          >
            <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit
          </Button>
        )}
        <Link
          href={`/projects/${projectId}/trackers/${sub.id}`}
          className="ml-auto"
        >
          <Button size="sm" variant="ghost" className="h-8 text-xs">
            Open <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── View Mode ────────────────────────────────────────────────────────────────

function TrackerView({ submission }: { submission: TrackerSubmission }) {
  const grouped = useMemo(() => {
    const g: Record<string, TrackerItem[]> = {};
    submission.items.forEach((it) => {
      if (!g[it.category]) g[it.category] = [];
      g[it.category].push(it);
    });
    return g;
  }, [submission.items]);

  const overall = computeOverall(submission.items);

  return (
    <div className="space-y-5">
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-600">
            Overall Progress
          </span>
          <span className="text-xl font-bold">{overall.toFixed(1)}%</span>
        </div>
        <ProgressBar value={overall} />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {(["COMPLETED", "ONGOING", "STALLED"] as ItemStatus[]).map((s) => {
            const count = submission.items.filter(
              (it) => it.status === s,
            ).length;
            return (
              <div
                key={s}
                className={cn(
                  "rounded-lg p-3 border text-center",
                  STATUS_CONFIG[s].bg,
                )}
              >
                <p className={cn("text-lg font-bold", STATUS_CONFIG[s].color)}>
                  {count}
                </p>
                <p className={cn("text-xs", STATUS_CONFIG[s].color)}>
                  {STATUS_CONFIG[s].label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <Accordion
        type="multiple"
        defaultValue={Object.keys(grouped)}
        className="space-y-2"
      >
        {Object.entries(grouped).map(([category, items]) => {
          const catPct =
            items.reduce((s, it) => s + it.percentComplete, 0) / items.length;
          return (
            <AccordionItem
              key={category}
              value={category}
              className="border rounded-xl px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-3">
                  <span className="font-medium text-sm">{category}</span>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={catPct} className="w-20" />
                    <span className="text-xs text-zinc-500 w-10 text-right">
                      {catPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pb-2">
                  {items.map((it, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{it.label}</p>
                          <p className="text-xs text-zinc-500">
                            Weight: {it.weight}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge status={it.status} />
                          <span className="text-sm font-semibold tabular-nums">
                            {it.percentComplete}%
                          </span>
                        </div>
                      </div>
                      <ProgressBar value={it.percentComplete} />
                      {it.challenges && (
                        <div className="text-xs bg-red-50 border border-red-100 rounded p-2">
                          <span className="font-semibold text-red-700">
                            Challenges:{" "}
                          </span>
                          <span className="text-red-600">{it.challenges}</span>
                        </div>
                      )}
                      {it.recommendations && (
                        <div className="text-xs bg-blue-50 border border-blue-100 rounded p-2">
                          <span className="font-semibold text-blue-700">
                            Recommendations:{" "}
                          </span>
                          <span className="text-blue-600">
                            {it.recommendations}
                          </span>
                        </div>
                      )}
                      {it.attachments && it.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {it.attachments.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 underline hover:text-blue-800"
                            >
                              <Paperclip className="w-3 h-3" />
                              {url.split("/").pop()}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// ─── Tracker Form ─────────────────────────────────────────────────────────────

function TrackerForm({
  submission,
  onChange,
  baselines = {},
}: {
  submission: TrackerSubmission;
  onChange: (s: TrackerSubmission) => void;
  baselines?: Baselines;
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const categories = useMemo(
    () => [
      "ALL",
      ...Array.from(new Set(submission.items.map((it) => it.category))),
    ],
    [submission.items],
  );

  const updateItem = (index: number, patch: Partial<TrackerItem>) => {
    const item = submission.items[index];
    const minPct = baselines[item.parameterId] ?? 0;
    if (patch.percentComplete !== undefined) {
      patch.percentComplete = Math.max(
        minPct,
        Math.min(100, patch.percentComplete),
      );
    }
    const items = submission.items.map((it, i) =>
      i === index ? { ...it, ...patch } : it,
    );
    onChange({ ...submission, items, overallPercent: computeOverall(items) });
  };

  const toggleExpand = (idx: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const expandAll = () =>
    setExpandedItems(new Set(submission.items.map((_, i) => i)));
  const collapseAll = () => setExpandedItems(new Set());

  const filteredItems = useMemo(() => {
    return submission.items
      .map((it, i) => ({ it, i }))
      .filter(({ it }) => {
        const matchesSearch =
          !search ||
          it.label.toLowerCase().includes(search.toLowerCase()) ||
          it.category.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          filterStatus === "ALL" || it.status === filterStatus;
        const matchesCategory =
          filterCategory === "ALL" || it.category === filterCategory;
        return matchesSearch && matchesStatus && matchesCategory;
      });
  }, [submission.items, search, filterStatus, filterCategory]);

  const overall = computeOverall(submission.items);
  const completedCount = submission.items.filter(
    (it) => it.status === "COMPLETED",
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <Input
          value={submission.title}
          onChange={(e) => onChange({ ...submission, title: e.target.value })}
          placeholder="Tracker title..."
        />
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Overall Progress
          </span>
          <span className="text-lg font-bold">{overall.toFixed(1)}%</span>
        </div>
        <ProgressBar value={overall} />
        <div className="flex items-center gap-3 pt-1 text-xs text-zinc-500">
          <span>
            {completedCount}/{submission.items.length} completed
          </span>
          <span>·</span>
          <span>
            {submission.items.filter((it) => it.status === "STALLED").length}{" "}
            stalled
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-36">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="ONGOING">Ongoing</SelectItem>
            <SelectItem value="STALLED">Stalled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c === "ALL" ? "All categories" : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {filteredItems.length} of {submission.items.length} items
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={expandAll}
          >
            <ChevronDown className="w-3 h-3 mr-1" /> Expand all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={collapseAll}
          >
            <ChevronUp className="w-3 h-3 mr-1" /> Collapse all
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-zinc-400 text-sm">
            No items match your filters
          </div>
        )}
        {filteredItems.map(({ it, i }) => {
          const isExpanded = expandedItems.has(i);
          return (
            <div
              key={i}
              className={cn(
                "border rounded-xl overflow-hidden transition-all",
                it.status === "STALLED" && "border-red-200",
                it.status === "COMPLETED" && "border-emerald-200",
              )}
            >
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                onClick={() => toggleExpand(i)}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    it.status === "COMPLETED" && "bg-emerald-500",
                    it.status === "ONGOING" && "bg-blue-500",
                    it.status === "STALLED" && "bg-red-500",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{it.label}</p>
                  <p className="text-xs text-zinc-400">{it.category}</p>
                </div>

                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Select
                    value={it.status}
                    onValueChange={(val) => updateItem(i, { status: val })}
                  >
                    <SelectTrigger className="h-7 text-xs w-28 border-0 bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONGOING">Ongoing</SelectItem>
                      <SelectItem value="STALLED">Stalled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-1.5 w-28">
                    <ProgressBar
                      value={it.percentComplete}
                      className="flex-1"
                    />
                    <span className="text-xs font-semibold tabular-nums w-8 text-right">
                      {it.percentComplete}%
                    </span>
                  </div>
                </div>

                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-zinc-400 shrink-0 transition-transform",
                    isExpanded && "rotate-180",
                  )}
                />
              </div>

              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                  {(() => {
                    const minPct = baselines[it.parameterId] ?? 0;
                    const isLocked = minPct >= 100;
                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-zinc-600">
                              % Complete
                            </label>
                            {minPct > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                <AlertCircle className="w-3 h-3" />
                                Min {minPct}% (inherited)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[it.percentComplete]}
                              onValueChange={([v]) =>
                                updateItem(i, { percentComplete: v })
                              }
                              min={minPct}
                              max={100}
                              step={1}
                              className="w-32"
                              disabled={isLocked}
                            />
                            <Input
                              type="number"
                              min={minPct}
                              max={100}
                              value={it.percentComplete}
                              onChange={(e) =>
                                updateItem(i, {
                                  percentComplete: Number(e.target.value),
                                })
                              }
                              className="w-16 h-7 text-xs text-center"
                              disabled={isLocked}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">
                        Challenges
                      </label>
                      <Textarea
                        value={it.challenges ?? ""}
                        onChange={(e) =>
                          updateItem(i, { challenges: e.target.value })
                        }
                        placeholder="Any blockers or challenges..."
                        rows={3}
                        className="text-sm resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-600 mb-1">
                        Recommendations
                      </label>
                      <Textarea
                        value={it.recommendations ?? ""}
                        onChange={(e) =>
                          updateItem(i, { recommendations: e.target.value })
                        }
                        placeholder="Suggested next steps..."
                        rows={3}
                        className="text-sm resize-none"
                      />
                    </div>
                  </div>

                  <AttachmentsField
                    attachments={it.attachments ?? []}
                    onChange={(val) => updateItem(i, { attachments: val })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectTrackers({
  projectId,
  projectName,
  projectSector,
  projectLocation,
  submissions: initialSubmissions,
  hasApprovedChecklist,
  userRole,
}: {
  projectId: string;
  projectName?: string;
  projectSector?: string;
  projectLocation?: string;
  submissions: TrackerSubmission[];
  hasApprovedChecklist: boolean;
  userRole: string;
}) {
  const user = userRole;
  const canCreate = user === "sector";
  const canEdit = user === "me";

  const router = useRouter();
  const [submissions, setSubmissions] =
    useState<TrackerSubmission[]>(initialSubmissions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [current, setCurrent] = useState<TrackerSubmission | null>(null);
  const [currentBaselines, setCurrentBaselines] = useState<Baselines>({});
  const [saving, setSaving] = useState(false);
  // true  → current tracker is unsaved (only in local state); Save does POST
  // false → current tracker already exists in DB; Save does PUT
  const [isNewTracker, setIsNewTracker] = useState(false);

  // ── Report Generation State ──
  const [captureOpen, setCaptureOpen] = useState(false);
  const [reportEditorOpen, setReportEditorOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<ReportDraft | null>(null);
  const [currentAttachments, setCurrentAttachments] = useState<string[]>([]);

  const sortedSubmissions = useMemo(
    () =>
      [...submissions].sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      ),
    [submissions],
  );

  const buildBaselines = (sub: TrackerSubmission): Baselines => {
    const map: Baselines = {};
    sub.items.forEach((it) => {
      map[it.parameterId] = it.percentComplete;
    });
    return map;
  };

  const latestSaved = sortedSubmissions[sortedSubmissions.length - 1] ?? null;

  const openView = (sub: TrackerSubmission) => {
    setCurrent(sub);
    setCurrentBaselines({});
    setMode("view");
    setDialogOpen(true);
  };

  const openEdit = (sub: TrackerSubmission) => {
    const idx = sortedSubmissions.findIndex((s) => s.id === sub.id);
    const prev = idx > 0 ? sortedSubmissions[idx - 1] : null;
    setCurrentBaselines(prev ? buildBaselines(prev) : {});
    setCurrent({ ...sub, items: sub.items.map((it) => ({ ...it })) });
    setMode("edit");
    setDialogOpen(true);
  };

  const openCreate = async () => {
    if (!hasApprovedChecklist) {
      toast.error("Cannot create tracker: no approved checklist yet.");
      return;
    }

    setSaving(true);
    try {
      // ── Fetch checklist items from the server to seed the form ──────────────
      // This is a read-only GET — nothing is written to the DB yet.
      const checklistRes = await fetch(`/api/projects/${projectId}/checklist`);
      if (!checklistRes.ok) throw new Error("Could not load checklist");
      const checklist = await checklistRes.json();
      const checklistItems: TrackerItem[] = (checklist?.items ?? []).map(
        (ci: any) => ({
          parameterId: ci.parameterId ?? ci.id ?? String(Math.random()),
          weight: ci.weight ?? 1,
          label: ci.label,
          category: ci.category,
          status: "ONGOING",
          percentComplete: 0,
          challenges: "",
          recommendations: "",
          attachments: null,
        }),
      );

      if (checklistItems.length === 0) {
        toast.error("Checklist has no items yet.");
        return;
      }

      // ── Build an in-memory draft — NOT persisted yet ───────────────────────
      const title = `Tracker — ${new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;

      // Seed percentages/status from the latest saved tracker if one exists
      const seededItems: TrackerItem[] = checklistItems.map((ci) => {
        const prev = latestSaved?.items.find(
          (p) => p.parameterId === ci.parameterId,
        );
        return prev
          ? {
              ...ci,
              percentComplete: prev.percentComplete,
              status: prev.status,
            }
          : ci;
      });

      const draft: TrackerSubmission = {
        id: "__new__", // sentinel — replaced on first save
        projectId,
        title,
        submittedBy: "",
        submittedAt: new Date().toISOString(),
        overallPercent: computeOverall(seededItems),
        items: seededItems,
      };

      setCurrent(draft);
      setCurrentBaselines(latestSaved ? buildBaselines(latestSaved) : {});
      setIsNewTracker(true);
      setMode("edit");
      setDialogOpen(true);
    } catch {
      toast.error("Could not load checklist items");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // If this was an unsaved new tracker, just discard it — nothing was written
    setIsNewTracker(false);
    setDialogOpen(false);
    setCurrent(null);
  };

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    try {
      if (isNewTracker) {
        // ── First save: create in DB ─────────────────────────────────────────
        const res = await fetch(`/api/projects/${projectId}/trackers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: current.title,
            items: current.items.map((it) => ({
              ...it,
              percentComplete: Number(it.percentComplete),
            })),
          }),
        });
        if (!res.ok) throw new Error("Failed to create tracker");
        const created: TrackerSubmission = await res.json();
        setSubmissions((prev) => [created, ...prev]);
        setIsNewTracker(false);
        toast.success("Tracker created successfully");
        setDialogOpen(false);
        router.refresh();
      } else {
        // ── Subsequent saves: update existing record ─────────────────────────
        const res = await fetch(`/api/projects/${projectId}/trackers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: current.id,
            title: current.title,
            items: current.items.map((it) => ({
              ...it,
              percentComplete: Number(it.percentComplete),
            })),
          }),
        });
        if (!res.ok) throw new Error("Save failed");
        const updated: TrackerSubmission = await res.json();
        setSubmissions((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
        toast.success("Tracker saved successfully");
        setDialogOpen(false);
        router.refresh();
      }
    } catch {
      toast.error("Failed to save tracker");
    } finally {
      setSaving(false);
    }
  };

  // ── Report flow: open capture modal ──────────────────────────────────────────

  const handleOpenCaptureForReport = () => {
    if (!current) return;
    // Collect attachments from the current tracker for later preview
    setCurrentAttachments(collectAttachments(current));
    setDialogOpen(false); // close tracker dialog
    setCaptureOpen(true); // open capture modal
  };

  // ── Report flow: after capture saved → generate report ────────────────────────

  const handleCaptureComplete = async (captureData: TrackerCaptureData) => {
    if (!current) return;
    setCaptureOpen(false);
    setGeneratingReport(true);

    try {
      // 1. Save capture metadata
      await fetch(`/api/projects/${projectId}/tracker-capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(captureData),
      });

      // 2. Generate report
      const res = await fetch(
        `/api/projects/${projectId}/reports/status-report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectName: projectName ?? "Project",
            projectSector: projectSector ?? "General",
            location: projectLocation ?? "Kenya",
            trackerData: {
              overallPercent: current.overallPercent,
              categories: buildCategorySummary(current),
            },
            checklistItems: buildChecklistPayload(current),
            // Full items so the route can derive findings, challenges & recommendations
            trackerItems: current.items,
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }

      const draft: ReportDraft = await res.json();
      setCurrentDraft(draft);
      setReportEditorOpen(true);
      toast.success("Report generated successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Report generation failed",
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  // ── View existing draft report ────────────────────────────────────────────────

  const handleViewExistingDraft = async (sub: TrackerSubmission) => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/reports/status-report`,
      );
      if (!res.ok) return;
      const draft = await res.json();
      if (draft) {
        setCurrentDraft(draft);
        setCurrentAttachments(collectAttachments(sub));
        setReportEditorOpen(true);
      } else {
        toast.info(
          "No draft report exists yet. Generate one by reviewing the tracker.",
        );
      }
    } catch {
      toast.error("Failed to load report draft");
    }
  };

  const latestOverall = latestSaved?.overallPercent ?? null;
  const projectComplete =
    latestSaved !== null &&
    latestSaved.items.length > 0 &&
    latestSaved.items.every((it) => it.percentComplete >= 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Project Trackers</h2>
          {submissions.length > 0 && (
            <p className="text-sm text-zinc-500">
              {submissions.length} submission
              {submissions.length !== 1 ? "s" : ""}
              {latestOverall !== null && (
                <>
                  {" "}
                  · Latest:{" "}
                  <span className="font-medium text-zinc-700">
                    {latestOverall.toFixed(1)}%
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* ME officer: view existing report draft */}
          {canEdit && latestSaved && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewExistingDraft(latestSaved)}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Draft Report
            </Button>
          )}

          {canCreate && !projectComplete && (
            <Button size="sm" onClick={openCreate} disabled={saving}>
              <Plus className="w-4 h-4 mr-2" />
              {saving ? "Creating..." : "Add Tracker"}
            </Button>
          )}
        </div>
      </div>

      {/* Project complete banner */}
      {projectComplete && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Project Complete
            </p>
            <p className="text-xs text-emerald-600">
              All checklist items have reached 100%.
            </p>
          </div>
        </div>
      )}

      {/* Generating report overlay */}
      {generatingReport && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 animate-pulse">
          <Loader2 className="w-5 h-5 text-blue-600 shrink-0 animate-spin" />
          <div>
            <p className="text-sm font-semibold text-blue-800">
              Generating monitoring report…
            </p>
            <p className="text-xs text-blue-600">
              AI is drafting the report. This takes about 20–30 seconds.
            </p>
          </div>
        </div>
      )}

      {/* Cards */}
      {submissions.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center">
          <BarChart3 className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="font-medium text-zinc-500">No trackers yet</p>
          {canCreate && hasApprovedChecklist && (
            <p className="text-sm text-zinc-400 mt-1">
              Click "Add Tracker" to get started
            </p>
          )}
          {!hasApprovedChecklist && (
            <p className="text-sm text-amber-500 mt-1">
              An approved checklist is required before adding trackers
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {submissions.map((sub) => (
            <TrackerCard
              key={sub.id}
              sub={sub}
              canEdit={canEdit}
              projectId={projectId}
              onView={() => openView(sub)}
              onEdit={() => openEdit(sub)}
            />
          ))}
        </div>
      )}

      {/* ── Tracker View/Edit Dialog ── */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle>
              {mode === "edit" ? "Edit Tracker" : "Tracker Details"}
            </DialogTitle>
            <DialogDescription className="truncate">
              {current?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {current ? (
              mode === "view" ? (
                <TrackerView submission={current} />
              ) : (
                <TrackerForm
                  submission={current}
                  onChange={(updated) => setCurrent(updated)}
                  baselines={currentBaselines}
                />
              )
            ) : (
              <div className="text-center py-8 text-zinc-400">
                No tracker selected
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0 bg-white dark:bg-zinc-950">
            {mode === "edit" ? (
              <div className="flex gap-2 w-full justify-end">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                {canEdit && current && (
                  <Button variant="outline" onClick={() => openEdit(current)}>
                    <Edit3 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                )}

                {/* Generate Report button — ME officer only, view mode */}
                {canEdit && current && (
                  <Button
                    onClick={handleOpenCaptureForReport}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={generatingReport}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="ml-auto"
                >
                  Close
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Capture Modal ── */}
      {captureOpen && current && (
        <TrackerCaptureModal
          open={captureOpen}
          onClose={() => setCaptureOpen(false)}
          projectId={projectId}
          submissionId={current.id}
          submissionTitle={current.title}
          onComplete={handleCaptureComplete}
        />
      )}

      {/* ── Report Editor Dialog ── */}
      {reportEditorOpen && currentDraft && (
        <ReportEditorDialog
          open={reportEditorOpen}
          onClose={() => setReportEditorOpen(false)}
          draft={currentDraft}
          projectId={projectId}
          attachments={currentAttachments}
          onSaved={(updated) => setCurrentDraft(updated)}
        />
      )}
    </div>
  );
}
