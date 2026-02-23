"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Edit3,
  Info,
  Lock,
  Save,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkplanItem {
  id?: string;
  projectId: string;
  parameterId: string; // FK → ChecklistItem.parameterId
  label: string;
  category: string;
  weight: number;
  plannedStartDate: string; // ISO date "YYYY-MM-DD"
  plannedEndDate: string;
}

export interface TrackerSnapshot {
  id: string;
  submittedAt: string; // ISO datetime
  overallPercent: number;
}

interface ChecklistItem {
  parameterId: string;
  label: string;
  category: string;
  weight: number;
}

interface Props {
  projectId: string;
  checklistStatus: string; // e.g. "WeightsAssignment", "Approved" …
  userRole: "sector" | "me" | "viewer";
  // Passed from server — the approved checklist items (weight > 0 only)
  checklistItems: ChecklistItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(s: string) {
  const d = new Date(s);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtShort(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const BAR_COLOURS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
];

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyWorkplan({
  canEdit,
  checklistStatus,
}: {
  canEdit: boolean;
  checklistStatus: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <CalendarDays className="w-10 h-10 text-zinc-300" />
      <p className="font-medium text-zinc-500">No workplan yet</p>
      {canEdit ? (
        <p className="text-sm text-zinc-400 max-w-xs">
          Switch to the <span className="font-semibold">Edit Workplan</span> tab
          to set planned start and end dates for each checklist item.
        </p>
      ) : checklistStatus === "Draft" || checklistStatus === "DraftReview" ? (
        <p className="text-sm text-zinc-400 max-w-xs">
          The workplan can be set during the{" "}
          <span className="font-semibold">Weights Assignment</span> phase by the
          sector officer.
        </p>
      ) : (
        <p className="text-sm text-zinc-400">
          No workplan dates have been entered for this project.
        </p>
      )}
    </div>
  );
}

// ─── Workplan Editor ─────────────────────────────────────────────────────────

function WorkplanEditor({
  projectId,
  checklistItems,
  initialWorkplan,
  onSaved,
}: {
  projectId: string;
  checklistItems: ChecklistItem[];
  initialWorkplan: WorkplanItem[];
  onSaved: (items: WorkplanItem[]) => void;
}) {
  // Build a local map parameterId → dates
  const [dates, setDates] = useState<
    Record<string, { start: string; end: string }>
  >(() => {
    const map: Record<string, { start: string; end: string }> = {};
    checklistItems.forEach((ci) => {
      const existing = initialWorkplan.find(
        (w) => w.parameterId === ci.parameterId,
      );
      map[ci.parameterId] = {
        start: existing?.plannedStartDate ?? "",
        end: existing?.plannedEndDate ?? "",
      };
    });
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setField = (pid: string, field: "start" | "end", value: string) => {
    setDates((prev) => ({
      ...prev,
      [pid]: { ...prev[pid], [field]: value },
    }));
    // clear error on change
    setErrors((prev) => {
      const next = { ...prev };
      delete next[pid];
      return next;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    checklistItems.forEach((ci) => {
      const { start, end } = dates[ci.parameterId] ?? {};
      if (!start || !end) {
        errs[ci.parameterId] = "Both dates required";
      } else if (new Date(start) > new Date(end)) {
        errs[ci.parameterId] = "Start must be before end";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fix the date errors before saving");
      return;
    }
    setSaving(true);
    try {
      const payload: Omit<WorkplanItem, "id">[] = checklistItems.map((ci) => ({
        projectId,
        parameterId: ci.parameterId,
        label: ci.label,
        category: ci.category,
        weight: ci.weight,
        plannedStartDate: dates[ci.parameterId].start,
        plannedEndDate: dates[ci.parameterId].end,
      }));

      const res = await fetch(`/api/projects/${projectId}/workplan`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved: WorkplanItem[] = await res.json();
      onSaved(saved);
      toast.success("Workplan saved");
    } catch {
      toast.error("Failed to save workplan");
    } finally {
      setSaving(false);
    }
  };

  // Group by category
  const grouped = useMemo(() => {
    const g: Record<string, ChecklistItem[]> = {};
    checklistItems.forEach((ci) => {
      if (!g[ci.category]) g[ci.category] = [];
      g[ci.category].push(ci);
    });
    return g;
  }, [checklistItems]);

  const filled = checklistItems.filter(
    (ci) => dates[ci.parameterId]?.start && dates[ci.parameterId]?.end,
  ).length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          <span className="font-semibold text-zinc-700">{filled}</span> /{" "}
          {checklistItems.length} items have dates
        </p>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {saving ? "Saving…" : "Save Workplan"}
        </Button>
      </div>

      {/* Per-category groups */}
      <Accordion
        type="multiple"
        defaultValue={Object.keys(grouped)}
        className="space-y-2"
      >
        {Object.entries(grouped).map(([category, items]) => {
          const catErrors = items.filter((ci) => errors[ci.parameterId]).length;
          return (
            <AccordionItem
              key={category}
              value={category}
              className="border rounded-xl overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-3">
                  <span className="font-medium text-sm">{category}</span>
                  <div className="flex items-center gap-2">
                    {catErrors > 0 && (
                      <Badge
                        variant="destructive"
                        className="text-xs h-5 px-1.5"
                      >
                        {catErrors} error{catErrors > 1 ? "s" : ""}
                      </Badge>
                    )}
                    <span className="text-xs text-zinc-400">
                      {
                        items.filter(
                          (ci) =>
                            dates[ci.parameterId]?.start &&
                            dates[ci.parameterId]?.end,
                        ).length
                      }
                      /{items.length}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-4 pb-4 space-y-3">
                  {items.map((ci) => {
                    const err = errors[ci.parameterId];
                    return (
                      <div
                        key={ci.parameterId}
                        className={cn(
                          "rounded-lg border p-3 space-y-2",
                          err
                            ? "border-red-300 bg-red-50 dark:bg-red-950/20"
                            : "border-zinc-200 dark:border-zinc-800",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{ci.label}</p>
                            <p className="text-xs text-zinc-400">
                              Weight: {ci.weight}
                            </p>
                          </div>
                          {err && (
                            <span className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {err}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">
                              Start date
                            </label>
                            <Input
                              type="date"
                              value={dates[ci.parameterId]?.start ?? ""}
                              onChange={(e) =>
                                setField(
                                  ci.parameterId,
                                  "start",
                                  e.target.value,
                                )
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">
                              End date
                            </label>
                            <Input
                              type="date"
                              value={dates[ci.parameterId]?.end ?? ""}
                              onChange={(e) =>
                                setField(ci.parameterId, "end", e.target.value)
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

// ─── Gantt Chart ──────────────────────────────────────────────────────────────

function GanttChart({
  workplan,
  trackerSnapshots,
}: {
  workplan: WorkplanItem[];
  trackerSnapshots: TrackerSnapshot[];
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);

  // Global timeline bounds
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (workplan.length === 0) {
      const t = new Date();
      return { minDate: t, maxDate: t, totalDays: 1 };
    }
    const starts = workplan.map((w) => parseDate(w.plannedStartDate));
    const ends = workplan.map((w) => parseDate(w.plannedEndDate));
    const min = new Date(Math.min(...starts.map((d) => d.getTime())));
    const max = new Date(Math.max(...ends.map((d) => d.getTime())));
    return {
      minDate: min,
      maxDate: max,
      totalDays: Math.max(1, daysBetween(min, max) + 1),
    };
  }, [workplan]);

  // Build "today" marker
  const todayPct = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (today < minDate || today > maxDate) return null;
    return (daysBetween(minDate, today) / totalDays) * 100;
  }, [minDate, maxDate, totalDays]);

  // Tracker snapshot markers on the timeline
  const snapshotMarkers = useMemo(() => {
    return trackerSnapshots
      .map((s) => {
        const d = parseDate(s.submittedAt);
        if (d < minDate || d > maxDate) return null;
        return {
          pct: (daysBetween(minDate, d) / totalDays) * 100,
          label: `${fmtDate(s.submittedAt)}: ${s.overallPercent.toFixed(1)}%`,
          pctValue: s.overallPercent,
        };
      })
      .filter(Boolean) as { pct: number; label: string; pctValue: number }[];
  }, [trackerSnapshots, minDate, maxDate, totalDays]);

  // Weekly ticks
  const ticks = useMemo(() => {
    const out: { label: string; pct: number }[] = [];
    const weeks = Math.ceil(totalDays / 7);
    for (let i = 0; i <= weeks; i++) {
      const d = new Date(minDate);
      d.setDate(d.getDate() + i * 7);
      if (d > maxDate) break;
      out.push({
        label: fmtShort(d),
        pct: Math.min(100, (daysBetween(minDate, d) / totalDays) * 100),
      });
    }
    return out;
  }, [minDate, maxDate, totalDays]);

  // Group workplan by category
  const grouped = useMemo(() => {
    const g: Record<string, { items: WorkplanItem[]; colourIdx: number }> = {};
    let catIdx = 0;
    workplan.forEach((w) => {
      if (!g[w.category]) {
        g[w.category] = { items: [], colourIdx: catIdx++ % BAR_COLOURS.length };
      }
      g[w.category].items.push(w);
    });
    // Sort items within each category by start date
    Object.values(g).forEach((cat) => {
      cat.items.sort(
        (a, b) =>
          parseDate(a.plannedStartDate).getTime() -
          parseDate(b.plannedStartDate).getTime(),
      );
    });
    return g;
  }, [workplan]);

  // Latest tracker overall %
  const latestPct = useMemo(() => {
    if (trackerSnapshots.length === 0) return null;
    const sorted = [...trackerSnapshots].sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
    return sorted[0].overallPercent;
  }, [trackerSnapshots]);

  const computeBar = (w: WorkplanItem) => {
    const s = parseDate(w.plannedStartDate);
    const e = parseDate(w.plannedEndDate);
    const left = (daysBetween(minDate, s) / totalDays) * 100;
    const width = Math.max(0.5, ((daysBetween(s, e) + 1) / totalDays) * 100);
    return { left, width };
  };

  const computeCategoryBar = (items: WorkplanItem[]) => {
    const starts = items.map((w) => parseDate(w.plannedStartDate));
    const ends = items.map((w) => parseDate(w.plannedEndDate));
    const s = new Date(Math.min(...starts.map((d) => d.getTime())));
    const e = new Date(Math.max(...ends.map((d) => d.getTime())));
    const left = (daysBetween(minDate, s) / totalDays) * 100;
    const width = Math.max(0.5, ((daysBetween(s, e) + 1) / totalDays) * 100);
    return { left, width };
  };

  if (workplan.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="flex items-center gap-6 text-sm p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700">
        <div>
          <span className="text-zinc-500 text-xs">Timeline</span>
          <p className="font-medium">
            {fmtDate(minDate.toISOString())} → {fmtDate(maxDate.toISOString())}
          </p>
        </div>
        <div>
          <span className="text-zinc-500 text-xs">Duration</span>
          <p className="font-medium">{totalDays} days</p>
        </div>
        {latestPct !== null && (
          <div>
            <span className="text-zinc-500 text-xs">Latest progress</span>
            <p className="font-semibold text-blue-600">
              {latestPct.toFixed(1)}%
            </p>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded bg-zinc-300" />{" "}
            Planned
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded bg-blue-500 opacity-70" />{" "}
            Progress
          </span>
          {trackerSnapshots.length > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />{" "}
              Tracker submission
            </span>
          )}
        </div>
      </div>

      {/* Gantt grid */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Row label column + chart column */}
        <div className="flex">
          {/* Label sidebar */}
          <div className="w-48 shrink-0 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900" />

          {/* Timeline header */}
          <div className="flex-1 relative h-8 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
            {ticks.map((t, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 flex items-center"
                style={{ left: `${t.pct}%` }}
              >
                <div className="h-full w-px bg-zinc-200 dark:bg-zinc-700" />
                <span className="absolute top-1 left-1 text-[10px] text-zinc-400 whitespace-nowrap">
                  {t.label}
                </span>
              </div>
            ))}

            {/* Today marker in header */}
            {todayPct !== null && (
              <div
                className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
                style={{ left: `${todayPct}%` }}
              />
            )}
          </div>
        </div>

        {/* Category + item rows */}
        {Object.entries(grouped).map(([category, { items, colourIdx }]) => {
          const isCollapsed = collapsed.has(category);
          const catBar = computeCategoryBar(items);
          const colour = BAR_COLOURS[colourIdx];

          return (
            <div key={category}>
              {/* Category summary row */}
              <div
                className="flex cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                onClick={() =>
                  setCollapsed((prev) => {
                    const next = new Set(prev);
                    next.has(category)
                      ? next.delete(category)
                      : next.add(category);
                    return next;
                  })
                }
              >
                {/* Label */}
                <div className="w-48 shrink-0 border-r border-zinc-200 dark:border-zinc-700 px-3 py-2 flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 truncate">
                      {category}
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      {items.length} item{items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Category bar */}
                <div className="flex-1 relative h-10 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
                  {/* Grid lines */}
                  {ticks.map((t, i) => (
                    <div
                      key={i}
                      className="absolute inset-y-0 w-px bg-zinc-100 dark:bg-zinc-800"
                      style={{ left: `${t.pct}%` }}
                    />
                  ))}
                  {/* Today */}
                  {todayPct !== null && (
                    <div
                      className="absolute inset-y-0 w-px bg-blue-400 opacity-40 z-10"
                      style={{ left: `${todayPct}%` }}
                    />
                  )}
                  {/* Bar */}
                  <div
                    className="absolute top-2 h-6 rounded-md bg-zinc-200 dark:bg-zinc-700 overflow-hidden"
                    style={{
                      left: `${catBar.left}%`,
                      width: `${catBar.width}%`,
                    }}
                  >
                    {latestPct !== null && (
                      <div
                        className={cn("h-full opacity-50", colour)}
                        style={{ width: `${latestPct}%` }}
                      />
                    )}
                  </div>
                  {/* Snapshot markers */}
                  {snapshotMarkers.map((m, i) => (
                    <div
                      key={i}
                      className="absolute top-1 bottom-1 w-0.5 bg-amber-400 z-20 cursor-pointer"
                      style={{ left: `${m.pct}%` }}
                      onMouseEnter={(e) =>
                        setTooltip({
                          x: e.clientX,
                          y: e.clientY,
                          content: m.label,
                        })
                      }
                      onMouseLeave={() => setTooltip(null)}
                    />
                  ))}
                </div>
              </div>

              {/* Item rows */}
              {!isCollapsed &&
                items.map((w) => {
                  const bar = computeBar(w);
                  return (
                    <div key={w.parameterId} className="flex">
                      {/* Label */}
                      <div className="w-48 shrink-0 border-r border-zinc-200 dark:border-zinc-700 px-3 py-2 pl-8">
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 truncate">
                          {w.label}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {fmtDate(w.plannedStartDate)} →{" "}
                          {fmtDate(w.plannedEndDate)}
                        </p>
                      </div>

                      {/* Bar track */}
                      <div className="flex-1 relative h-10 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
                        {/* Grid */}
                        {ticks.map((t, i) => (
                          <div
                            key={i}
                            className="absolute inset-y-0 w-px bg-zinc-100 dark:bg-zinc-800"
                            style={{ left: `${t.pct}%` }}
                          />
                        ))}
                        {/* Today */}
                        {todayPct !== null && (
                          <div
                            className="absolute inset-y-0 w-px bg-blue-400 opacity-30"
                            style={{ left: `${todayPct}%` }}
                          />
                        )}
                        {/* Planned bar (background) */}
                        <div
                          className="absolute top-2.5 h-5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden cursor-pointer"
                          style={{
                            left: `${bar.left}%`,
                            width: `${bar.width}%`,
                          }}
                          onMouseEnter={(e) =>
                            setTooltip({
                              x: e.clientX,
                              y: e.clientY,
                              content: `${w.label}\n${fmtDate(w.plannedStartDate)} → ${fmtDate(w.plannedEndDate)}`,
                            })
                          }
                          onMouseLeave={() => setTooltip(null)}
                        >
                          {/* Progress overlay */}
                          {latestPct !== null && (
                            <div
                              className={cn("h-full opacity-75", colour)}
                              style={{ width: `${latestPct}%` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-zinc-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-pre-line"
          style={{ top: tooltip.y + 12, left: tooltip.x + 8 }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

// ─── Progress Curve ───────────────────────────────────────────────────────────

function ProgressCurve({
  snapshots,
  workplan,
}: {
  snapshots: TrackerSnapshot[];
  workplan: WorkplanItem[];
}) {
  const sorted = useMemo(
    () =>
      [...snapshots].sort(
        (a, b) =>
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      ),
    [snapshots],
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <TrendingUp className="w-8 h-8 text-zinc-300" />
        <p className="text-sm text-zinc-400">
          No tracker submissions yet. The progress curve will appear here once
          trackers are filled in.
        </p>
      </div>
    );
  }

  const HEIGHT = 200;
  const WIDTH = 100; // viewBox units (percentage-based)
  const PADDING = { top: 10, right: 4, bottom: 20, left: 6 };

  const plotW = WIDTH - PADDING.left - PADDING.right;
  const plotH = HEIGHT - PADDING.top - PADDING.bottom;

  // X: evenly spaced by submission index (simpler and cleaner than time-axis for few points)
  const points = sorted.map((s, i) => ({
    x:
      PADDING.left +
      (sorted.length === 1 ? plotW / 2 : (i / (sorted.length - 1)) * plotW),
    y: PADDING.top + plotH - (s.overallPercent / 100) * plotH,
    pct: s.overallPercent,
    label: fmtDate(s.submittedAt),
  }));

  const pathD =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points
          .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
          .join(" ");

  // Area fill
  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${PADDING.top + plotH} L ${points[0].x} ${PADDING.top + plotH} Z`
      : "";

  // Y-axis ticks at 0, 25, 50, 75, 100
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold">Overall progress over time</h3>
        <span className="text-xs text-zinc-400 ml-auto">
          {sorted.length} tracker submission{sorted.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ height: 220 }}
          preserveAspectRatio="none"
        >
          {/* Y grid + labels */}
          {yTicks.map((v) => {
            const y = PADDING.top + plotH - (v / 100) * plotH;
            return (
              <g key={v}>
                <line
                  x1={PADDING.left}
                  x2={WIDTH - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  strokeWidth={0.5}
                />
                <text
                  x={PADDING.left - 1}
                  y={y + 0.8}
                  fontSize={3.5}
                  textAnchor="end"
                  fill="currentColor"
                  opacity={0.4}
                >
                  {v}%
                </text>
              </g>
            );
          })}

          {/* Area */}
          {areaD && <path d={areaD} fill="rgb(59 130 246)" opacity={0.08} />}

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth={1}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Data points + labels */}
          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={1.5}
                fill="white"
                stroke="rgb(59 130 246)"
                strokeWidth={0.8}
              />
              <text
                x={p.x}
                y={p.y - 3}
                fontSize={3}
                textAnchor="middle"
                fill="rgb(59 130 246)"
                fontWeight="600"
              >
                {p.pct.toFixed(0)}%
              </text>
              {/* X label */}
              <text
                x={p.x}
                y={PADDING.top + plotH + 6}
                fontSize={3}
                textAnchor="middle"
                fill="currentColor"
                opacity={0.45}
              >
                {p.label}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line
            x1={PADDING.left}
            x2={PADDING.left}
            y1={PADDING.top}
            y2={PADDING.top + plotH}
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={0.5}
          />
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={PADDING.top + plotH}
            y2={PADDING.top + plotH}
            stroke="currentColor"
            strokeOpacity={0.15}
            strokeWidth={0.5}
          />
        </svg>
      </div>

      {/* Submission table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
              <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500">
                #
              </th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-zinc-500">
                Submitted
              </th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-500">
                Overall %
              </th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-zinc-500">
                Δ Change
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => {
              const prev = i > 0 ? sorted[i - 1].overallPercent : null;
              const delta = prev !== null ? s.overallPercent - prev : null;
              return (
                <tr
                  key={s.id}
                  className="border-b last:border-0 border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  <td className="px-4 py-2 text-zinc-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-2 text-zinc-600 dark:text-zinc-300">
                    {fmtDate(s.submittedAt)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {s.overallPercent.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-right text-xs">
                    {delta === null ? (
                      <span className="text-zinc-400">—</span>
                    ) : delta >= 0 ? (
                      <span className="text-emerald-600">
                        +{delta.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-red-500">{delta.toFixed(1)}%</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectCalendar({
  projectId,
  checklistStatus,
  userRole,
  checklistItems,
}: Props) {
  const [workplan, setWorkplan] = useState<WorkplanItem[]>([]);
  const [snapshots, setSnapshots] = useState<TrackerSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("gantt");

  const canEditWorkplan =
    userRole === "sector" && checklistStatus === "WeightsAssignment";

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [wpRes, trRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/workplan`),
          fetch(`/api/projects/${projectId}/trackers`),
        ]);
        const wp: WorkplanItem[] = wpRes.ok ? await wpRes.json() : [];
        const tr: TrackerSnapshot[] = trRes.ok ? await trRes.json() : [];
        setWorkplan(wp);
        setSnapshots(tr);
      } catch {
        toast.error("Failed to load calendar data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const hasWorkplan = workplan.length > 0;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-64 w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Workplan & Calendar</h2>
          <p className="text-sm text-zinc-500">
            {hasWorkplan
              ? `${workplan.length} items planned across ${
                  Object.keys(
                    workplan.reduce(
                      (acc, w) => ({ ...acc, [w.category]: true }),
                      {} as Record<string, boolean>,
                    ),
                  ).length
                } categories`
              : "No workplan dates set yet"}
          </p>
        </div>

        {/* Phase lock indicator */}
        {!canEditWorkplan && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700">
            <Lock className="w-3 h-3" />
            {checklistStatus === "WeightsAssignment"
              ? "Only sector officer can edit"
              : checklistStatus === "Draft" || checklistStatus === "DraftReview"
                ? "Editable during Weights Assignment"
                : "Workplan locked"}
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gantt">
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
            Gantt
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
            Progress Curve
          </TabsTrigger>
          {canEditWorkplan && (
            <TabsTrigger value="edit">
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Edit Workplan
            </TabsTrigger>
          )}
        </TabsList>

        {/* Gantt tab */}
        <TabsContent value="gantt" className="mt-4">
          {hasWorkplan ? (
            <GanttChart workplan={workplan} trackerSnapshots={snapshots} />
          ) : (
            <EmptyWorkplan
              canEdit={canEditWorkplan}
              checklistStatus={checklistStatus}
            />
          )}
        </TabsContent>

        {/* Progress curve tab */}
        <TabsContent value="progress" className="mt-4">
          <ProgressCurve snapshots={snapshots} workplan={workplan} />
        </TabsContent>

        {/* Edit workplan tab — sector only, WeightsAssignment only */}
        {canEditWorkplan && (
          <TabsContent value="edit" className="mt-4">
            {checklistItems.length === 0 ? (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                <Info className="w-4 h-4 shrink-0" />
                No checklist items found. Complete the checklist before setting
                workplan dates.
              </div>
            ) : (
              <WorkplanEditor
                projectId={projectId}
                checklistItems={checklistItems}
                initialWorkplan={workplan}
                onSaved={(saved) => {
                  setWorkplan(saved);
                  setActiveTab("gantt");
                }}
              />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
