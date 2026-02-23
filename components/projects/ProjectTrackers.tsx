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
  LayoutList,
  LayoutGrid,
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

// ─── Types ───────────────────────────────────────────────────────────────────

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

// Maps parameterId → minimum allowed percentComplete inherited from previous tracker
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

      {/* Progress bar */}
      <ProgressBar value={sub.overallPercent} className="mb-3" />

      {/* Status pills */}
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

      {/* Actions */}
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
      {/* Summary */}
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

      {/* By Category */}
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

    // Clamp percentComplete to never go below the inherited baseline
    if (patch.percentComplete !== undefined) {
      patch.percentComplete = Math.max(
        minPct,
        Math.min(100, patch.percentComplete),
      );
    }

    const items = submission.items.map((it, i) =>
      i === index ? { ...it, ...patch } : it,
    );
    onChange({
      ...submission,
      items,
      overallPercent: computeOverall(items),
    });
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
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <Input
          value={submission.title}
          onChange={(e) => onChange({ ...submission, title: e.target.value })}
          placeholder="Tracker title..."
        />
      </div>

      {/* Live summary */}
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

      {/* Filters + expand controls */}
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

      {/* Item list */}
      <div className="space-y-2">
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-zinc-400 text-sm">
            No items match your filters
          </div>
        )}
        {filteredItems.map(({ it, i }) => {
          const isExpanded = expandedItems.has(i);
          const cfg =
            STATUS_CONFIG[it.status as ItemStatus] ?? STATUS_CONFIG.ONGOING;

          return (
            <div
              key={i}
              className={cn(
                "border rounded-xl overflow-hidden transition-all",
                it.status === "STALLED" && "border-red-200",
                it.status === "COMPLETED" && "border-emerald-200",
              )}
            >
              {/* Collapsed header — always visible */}
              <div
                className={cn(
                  "flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                )}
                onClick={() => toggleExpand(i)}
              >
                {/* Status dot */}
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

                {/* Inline quick-edit: status + percent */}
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

              {/* Expanded body */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                  {/* Percent slider */}
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
                            {isLocked && (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                Fully completed
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
                        {/* Visual baseline marker */}
                        {minPct > 0 && minPct < 100 && (
                          <div className="relative h-1.5 w-full">
                            <div className="absolute inset-0 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                            {/* Locked (inherited) segment */}
                            <div
                              className="absolute inset-y-0 left-0 rounded-l-full bg-amber-300"
                              style={{ width: `${minPct}%` }}
                            />
                            {/* New progress segment */}
                            <div
                              className={cn(
                                "absolute inset-y-0 rounded-r-full",
                                getProgressColor(it.percentComplete),
                              )}
                              style={{
                                left: `${minPct}%`,
                                width: `${Math.max(0, it.percentComplete - minPct)}%`,
                              }}
                            />
                            {/* Baseline tick */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-amber-500 rounded"
                              style={{ left: `${minPct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Challenges + Recommendations side by side */}
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

                  {/* Attachments */}
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

// ─── Attachments Field ────────────────────────────────────────────────────────

function AttachmentsField({
  attachments,
  onChange,
}: {
  attachments: string[];
  onChange: (val: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const url = input.trim();
    if (!url) return;
    onChange([...attachments, url]);
    setInput("");
  };

  const remove = (idx: number) =>
    onChange(attachments.filter((_, i) => i !== idx));

  return (
    <div>
      <label className="block text-xs font-medium text-zinc-600 mb-1">
        Attachments
      </label>
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((url, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-800 border rounded-full px-2 py-0.5 text-xs"
            >
              <Paperclip className="w-3 h-3 text-zinc-400" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline max-w-[140px] truncate"
              >
                {url.split("/").pop() || url}
              </a>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-zinc-400 hover:text-red-500 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Paste URL and press Enter..."
          className="text-xs h-8"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs shrink-0"
          onClick={add}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProjectTrackers({
  projectId,
  submissions: initialSubmissions,
  hasApprovedChecklist,
  userEmail,
}: {
  projectId: string;
  submissions: TrackerSubmission[];
  hasApprovedChecklist: boolean;
  userEmail: string;
}) {
  // TODO: swap these with real auth
  const user = "ide@gmail.com";
  const canCreate = user === "mw@gmail.com" || user === "ide@gmail.com";
  const canEdit = user === "meofficer@gmail.com" || user === "ide@gmail.com";

  const router = useRouter();
  const [submissions, setSubmissions] =
    useState<TrackerSubmission[]>(initialSubmissions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [current, setCurrent] = useState<TrackerSubmission | null>(null);
  const [currentBaselines, setCurrentBaselines] = useState<Baselines>({});
  const [saving, setSaving] = useState(false);

  // Submissions sorted oldest → newest so index 0 = first ever tracker
  const sortedSubmissions = useMemo(
    () =>
      [...submissions].sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      ),
    [submissions],
  );

  // Build a baselines map from a given tracker's items
  const buildBaselines = (sub: TrackerSubmission): Baselines => {
    const map: Baselines = {};
    sub.items.forEach((it) => {
      map[it.parameterId] = it.percentComplete;
    });
    return map;
  };

  // The most recent (last) saved tracker
  const latestSaved = sortedSubmissions[sortedSubmissions.length - 1] ?? null;

  const openView = (sub: TrackerSubmission) => {
    setCurrent(sub);
    setCurrentBaselines({});
    setMode("view");
    setDialogOpen(true);
  };

  const openEdit = (sub: TrackerSubmission) => {
    // Baselines come from the tracker immediately before this one (if any)
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

    // Block creation if latest tracker still has items < 100% — project not done
    // (This is optional UX guard; remove if you want to allow multiple in-flight trackers)

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/trackers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Tracker — ${new Date().toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}`,
          // Pass latest tracker's items so the API can seed the new one
          seedItems: latestSaved
            ? latestSaved.items.map((it) => ({ ...it }))
            : [],
        }),
      });
      if (!res.ok) throw new Error("Failed to create tracker");
      const newSub: TrackerSubmission = await res.json();

      // If the API doesn't seed items server-side, do it client-side:
      // Carry forward all progress values from the latest tracker
      if (latestSaved && newSub.items.length > 0) {
        const seeded: TrackerSubmission = {
          ...newSub,
          items: newSub.items.map((it) => {
            const prev = latestSaved.items.find(
              (p) => p.parameterId === it.parameterId,
            );
            return prev
              ? {
                  ...it,
                  percentComplete: prev.percentComplete,
                  status: prev.status,
                  challenges: "",
                  recommendations: "",
                  attachments: null,
                }
              : it;
          }),
        };
        seeded.overallPercent = computeOverall(seeded.items);
        setSubmissions((prev) => [seeded, ...prev]);
        setCurrent(seeded);
        setCurrentBaselines(buildBaselines(latestSaved));
      } else {
        setSubmissions((prev) => [newSub, ...prev]);
        setCurrent(newSub);
        setCurrentBaselines({});
      }

      setMode("edit");
      setDialogOpen(true);
    } catch {
      toast.error("Could not create tracker");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    try {
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
      const updated = await res.json();
      setSubmissions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s)),
      );
      toast.success("Tracker saved successfully");
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to save tracker");
    } finally {
      setSaving(false);
    }
  };

  // Summary stats across all trackers
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
        {canCreate && !projectComplete && (
          <Button size="sm" onClick={openCreate} disabled={saving}>
            <Plus className="w-4 h-4 mr-2" />
            {saving ? "Creating..." : "Add Tracker"}
          </Button>
        )}
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
              All checklist items have reached 100%. No further trackers are
              needed.
            </p>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {submissions.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-12 text-center">
          <BarChart3 className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="font-medium text-zinc-500">No trackers yet</p>
          {canCreate && hasApprovedChecklist && (
            <p className="text-sm text-zinc-400 mt-1">
              Click &ldquo;Add Tracker&rdquo; to get started
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full justify-between">
                {canEdit && current && (
                  <Button variant="outline" onClick={() => openEdit(current)}>
                    <Edit3 className="w-4 h-4 mr-2" /> Edit
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
    </div>
  );
}
