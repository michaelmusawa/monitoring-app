"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { trackers as dummyTrackers } from "@/lib/data/data";

/**
 * ProjectCalendar (Gantt-like workplan)
 *
 * - Groups tasks by category
 * - Renders a simple timeline scale spanning min(startDate) -> max(endDate)
 * - Each task is rendered as a horizontal bar with left/width computed from dates
 * - Shows: progress bar, estimated vs actual hours, category and project summaries
 *
 * Uses dummy data from data.ts for trackers.
 */

type RawTask = {
  id: string;
  title: string;
  category?: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  estimatedHours?: number;
  // If trackers are available we will compute actualHoursUsed from trackers (sum of hours recorded)
  actualHoursUsed?: number; // actual time spent so far (initial mock; may be updated from trackers)
  progress: number; // 0-100
  status?: string;
  // Links this workplan task to checklist parameter IDs so trackers' task entries can be correlated.
  relatedParameterIds?: string[];
};

function parseISO(dateStr: string) {
  const d = new Date(dateStr);
  // normalize to start of day UTC to keep calculations consistent
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

export function ProjectCalendar({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<RawTask[]>([]);

  useEffect(() => {
    // Fetch tasks from the dynamic import (keeping this as is)
    let mounted = true;

    async function loadAll() {
      try {
        const { getProjectTasks } =
          await import("@/lib/actions/migrated/getProjectTasks");
        const data: RawTask[] = (await getProjectTasks()) || [];

        // Use dummy trackers from data.ts, filtered by projectId
        const filteredTrackers = dummyTrackers.filter(
          (t) => t.projectId === projectId,
        );

        // Build a map: parameterId -> array of percentComplete values (ordered by tracker submission order)
        const paramPercents: Record<string, number[]> = {};
        filteredTrackers.forEach((t) => {
          const tasks = t.tasks || [];
          tasks.forEach((task: any) => {
            if (!task || !task.parameterId) return;
            const pid = String(task.parameterId);
            if (!paramPercents[pid]) paramPercents[pid] = [];
            // use percentComplete as reported in the tracker task
            paramPercents[pid].push(Number(task.percentComplete ?? 0));
          });
        });

        // Enrich tasks: for tasks that reference checklist parameter IDs (relatedParameterIds),
        // compute progress from latest tracker item percents and derive actualHoursUsed as
        // (avgPercent / 100) * estimatedHours. If a task has no relatedParameterIds, fall back
        // to existing mock values.
        const enriched = data.map((task) => {
          const related = (task.relatedParameterIds || []) as string[];
          let computedPercent = Number(task.progress ?? 0);

          if (related.length > 0) {
            // For each related parameter, take the latest reported percent if available,
            // otherwise 0. Then average across related parameters.
            const perParamPercents = related.map((pid) => {
              const arr = paramPercents[pid] ?? [];
              if (arr.length === 0) return 0;
              // Use the last reported percent (assumes trackers are in chronological order)
              return arr[arr.length - 1];
            });
            const sum = perParamPercents.reduce((s, v) => s + v, 0);
            computedPercent =
              Math.round((sum / perParamPercents.length) * 10) / 10;
          }

          // Derive actual hours used as a proxy: avgPercent of estimatedHours
          const estimated = Number(task.estimatedHours ?? 0);
          const actualHoursUsed =
            Math.round((computedPercent / 100) * estimated * 10) / 10;

          // If computedPercent is 100, mark status completed
          const status = computedPercent >= 100 ? "completed" : task.status;

          return {
            ...task,
            progress: computedPercent,
            actualHoursUsed,
            status,
          };
        });

        if (!mounted) return;
        setTasks(enriched);
      } catch {
        if (!mounted) return;
        setTasks([]);
      }
    }

    loadAll();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  // Compute global timeline range
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      const today = parseISO(new Date().toISOString());
      return { minDate: today, maxDate: today, totalDays: 1 };
    }
    const starts = tasks.map((t) => parseISO(t.startDate));
    const ends = tasks.map((t) => parseISO(t.endDate));
    const min = new Date(Math.min(...starts.map((d) => d.getTime())));
    const max = new Date(Math.max(...ends.map((d) => d.getTime())));
    const total = Math.max(1, daysBetween(min, max) + 1);
    return { minDate: min, maxDate: max, totalDays: total };
  }, [tasks]);

  // Group tasks by category
  const grouped = useMemo(() => {
    const map: Record<
      string,
      {
        tasks: RawTask[];
        sumEstimated: number;
        sumActual: number;
        avgProgress: number;
      }
    > = {};
    tasks.forEach((t) => {
      const cat = t.category || "Uncategorized";
      if (!map[cat])
        map[cat] = { tasks: [], sumEstimated: 0, sumActual: 0, avgProgress: 0 };
      map[cat].tasks.push(t);
      map[cat].sumEstimated += Number(t.estimatedHours || 0);
      map[cat].sumActual += Number(t.actualHoursUsed || 0);
    });
    // compute avg progress per category
    Object.keys(map).forEach((cat) => {
      const arr = map[cat].tasks;
      map[cat].avgProgress =
        arr.length === 0
          ? 0
          : Math.round(
              (arr.reduce((s, it) => s + (it.progress || 0), 0) / arr.length) *
                10,
            ) / 10;
      // sort tasks by start date
      map[cat].tasks.sort(
        (a, b) =>
          parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime(),
      );
    });
    return map;
  }, [tasks]);

  // Helper to compute left and width percentages for a task bar relative to timeline
  const computeBar = (task: RawTask) => {
    const s = parseISO(task.startDate);
    const e = parseISO(task.endDate);
    const offset = daysBetween(minDate, s);
    const duration = Math.max(1, daysBetween(s, e) + 1);
    const left = (offset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return { left, width, duration };
  };

  // Render timeline ticks (weeks)
  const ticks = useMemo(() => {
    const weeks = Math.max(1, Math.ceil(totalDays / 7));
    const arr: { label: string; left: number }[] = [];
    for (let i = 0; i <= weeks; i++) {
      const tickDate = new Date(minDate.getTime());
      tickDate.setDate(minDate.getDate() + i * 7);
      const left = (daysBetween(minDate, tickDate) / totalDays) * 100;
      arr.push({
        label: tickDate.toISOString().slice(0, 10),
        left: Math.min(100, Math.max(0, left)),
      });
    }
    return arr;
  }, [minDate, totalDays]);

  // Project-level summary (totals)
  const projectSummary = useMemo(() => {
    const totalEstimated = tasks.reduce(
      (s, t) => s + Number(t.estimatedHours || 0),
      0,
    );
    const totalActual = tasks.reduce(
      (s, t) => s + Number(t.actualHoursUsed || 0),
      0,
    );
    const avgProgress =
      tasks.length === 0
        ? 0
        : Math.round(
            (tasks.reduce((s, t) => s + (t.progress || 0), 0) / tasks.length) *
              10,
          ) / 10;
    return { totalEstimated, totalActual, avgProgress };
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workplan (Gantt-like)</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Project summary */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Timeline</div>
            <div className="font-medium">
              {minDate.toISOString().slice(0, 10)} →{" "}
              {maxDate.toISOString().slice(0, 10)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Estimated hours</div>
            <div className="font-medium">
              {projectSummary.totalEstimated} hrs
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Actual hours used
            </div>
            <div className="font-medium">{projectSummary.totalActual} hrs</div>
            <div className="text-sm text-muted-foreground mt-1">
              Avg progress
            </div>
            <div className="font-medium">{projectSummary.avgProgress}%</div>
          </div>
        </div>

        {/* Timeline header (ticks) */}
        <div className="relative h-8 border-b mb-2">
          {ticks.map((t, idx) => (
            <div
              key={idx}
              className="absolute top-0 text-xs text-muted-foreground"
              style={{ left: `${t.left}%`, transform: "translateX(-50%)" }}
            >
              {t.label}
            </div>
          ))}
        </div>

        {/* Categories and task bars */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, data]) => (
            <div
              key={category}
              className="border rounded-lg p-3 bg-white dark:bg-zinc-950 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold">{category}</div>
                  <div className="text-xs text-muted-foreground">
                    {data.tasks.length} tasks • {data.sumEstimated} hrs planned
                    • {data.sumActual} hrs used
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    Category progress
                  </div>
                  <div className="font-medium">{data.avgProgress}%</div>
                </div>
              </div>

              <div className="relative border-t border-b py-4">
                {/* background grid */}
                <div className="absolute inset-0 flex">
                  {/* we render a subtle grid using 20 columns */}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 border-r last:border-r-0 border-zinc-100 dark:border-zinc-800"
                    />
                  ))}
                </div>

                {/* task rows */}
                <div className="relative space-y-3">
                  {data.tasks.map((task) => {
                    const { left, width, duration } = computeBar(task);
                    const barTop = 0;
                    const hoursInfo = `${task.actualHoursUsed ?? 0}/${
                      task.estimatedHours ?? 0
                    } hrs`;
                    return (
                      <div key={task.id} className="relative pl-2 pr-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-medium">
                            {task.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {hoursInfo}
                          </div>
                        </div>

                        <div className="relative h-10">
                          {/* task schedule bar */}
                          <div
                            className="absolute h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              top: `${barTop}px`,
                            }}
                            title={`${task.startDate} → ${task.endDate} • ${duration} days`}
                          >
                            {/* inner progress */}
                            <div
                              className="h-full bg-blue-500 rounded-l-md"
                              style={{
                                width: `${Math.max(6, task.progress)}%`,
                                opacity: 0.95,
                              }}
                            />
                          </div>

                          {/* small overlay showing actual/estimated as thin strip */}
                          <div
                            className="absolute h-1 rounded bg-amber-400"
                            style={{
                              left: `${left}%`,
                              width: `${Math.min(
                                100,
                                (Number(task.actualHoursUsed || 0) /
                                  Math.max(
                                    1,
                                    Number(task.estimatedHours || 1),
                                  )) *
                                  width,
                              )}%`,
                              top: "25px",
                            }}
                          />
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                          <div>
                            {task.status?.replace("-", " ") ?? "status unknown"}
                          </div>
                          <div>{task.progress}% completed</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
