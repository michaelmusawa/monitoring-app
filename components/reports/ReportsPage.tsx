"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  FileText,
  TrendingUp,
  CalendarDays,
  ChevronRight,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectSummaryData {
  project: {
    id: string;
    name: string;
    status: string;
    sector: string;
    description?: string;
    createdAt: string;
  };
  checklist: {
    status: string;
    totalItems: number;
    selectedItems: number;
    totalWeight: number;
    approvedAt?: string;
  } | null;
  latestTracker: {
    overallPercent: number;
    submittedAt: string;
    completedItems: number;
    totalItems: number;
  } | null;
  workplan: {
    totalItems: number;
    datedItems: number;
    plannedStart?: string;
    plannedEnd?: string;
  };
  trackerCount: number;
}

interface ChecklistReportData {
  checklist: {
    status: string;
    version: number;
    lastModifiedBy: string;
    lastModified: string;
    editReason?: string;
  };
  history: {
    id: string;
    status: string;
    changedBy: string;
    reason?: string;
    createdAt: string;
  }[];
  categories: {
    name: string;
    items: {
      parameterId: string;
      label: string;
      weight: number;
    }[];
    totalWeight: number;
  }[];
  totalWeight: number;
  totalItems: number;
}

interface TrackerProgressData {
  submissions: {
    id: string;
    title: string;
    submittedBy: string;
    submittedAt: string;
    overallPercent: number;
    stalledCount: number;
    completedCount: number;
    ongoingCount: number;
    totalItems: number;
  }[];
  categories: {
    name: string;
    // Latest % per category across tracker submissions
    progressHistory: { submittedAt: string; avgPercent: number }[];
    latestPercent: number;
  }[];
  projectComplete: boolean;
}

interface WorkplanActualData {
  items: {
    parameterId: string;
    label: string;
    category: string;
    weight: number;
    plannedStartDate: string;
    plannedEndDate: string;
    plannedDays: number;
    latestPercent: number;
    status: "ahead" | "ontrack" | "behind" | "notstarted";
  }[];
  categories: {
    name: string;
    avgPlannedDays: number;
    avgLatestPercent: number;
    status: "ahead" | "ontrack" | "behind" | "notstarted";
  }[];
  overallLatestPercent: number;
  projectPlannedStart: string;
  projectPlannedEnd: string;
  totalPlannedDays: number;
}

type ReportId =
  | "summary"
  | "checklist"
  | "tracker-progress"
  | "workplan-actual";

type UserRole = "sector" | "me" | "viewer";

// ─── Role access matrix ───────────────────────────────────────────────────────

const REPORT_ACCESS: Record<ReportId, UserRole[]> = {
  summary: ["sector", "me", "viewer"],
  checklist: ["sector", "me"],
  "tracker-progress": ["sector", "me", "viewer"],
  "workplan-actual": ["me"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function progressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-blue-500";
  if (pct >= 25) return "bg-amber-400";
  return "bg-red-400";
}

function progressText(pct: number) {
  if (pct >= 80) return "text-emerald-700";
  if (pct >= 50) return "text-blue-700";
  if (pct >= 25) return "text-amber-700";
  return "text-red-700";
}

function ProgressBar({
  value,
  className,
  thin,
}: {
  value: number;
  className?: string;
  thin?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden",
        thin ? "h-1.5" : "h-2",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all",
          progressColor(value),
        )}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

const STATUS_CHIP: Record<string, { label: string; cls: string; dot: string }> =
  {
    ahead: {
      label: "Ahead",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
    },
    ontrack: {
      label: "On track",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
      dot: "bg-blue-500",
    },
    behind: {
      label: "Behind",
      cls: "bg-red-50 text-red-700 border-red-200",
      dot: "bg-red-500",
    },
    notstarted: {
      label: "Not started",
      cls: "bg-zinc-50 text-zinc-500 border-zinc-200",
      dot: "bg-zinc-400",
    },
  };

function StatusChip({ status }: { status: string }) {
  const cfg = STATUS_CHIP[status] ?? STATUS_CHIP.notstarted;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        cfg.cls,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─── Report: Project Summary ──────────────────────────────────────────────────

function ProjectSummaryReport({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/reports/summary`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <ReportSkeleton />;
  if (!data) return <ReportError />;

  const { project, checklist, latestTracker, workplan, trackerCount } = data;

  const checklistPhaseLabel: Record<string, string> = {
    Draft: "Draft",
    DraftReview: "Draft Review",
    WeightsAssignment: "Weights Assignment",
    WeightsReview: "Weights Review",
    Approved: "Approved ✓",
  };

  return (
    <div className="space-y-8 print:space-y-6">
      {/* Report header */}
      <ReportHeader
        title="Project Summary"
        subtitle="One-page overview across all phases"
        generatedAt={new Date().toISOString()}
      />

      {/* Project identity */}
      <Section title="Project Details">
        <Grid cols={2}>
          <Field label="Project Name" value={project.name} large />
          <Field label="Sector" value={project.sector} />
          <Field label="Status" value={project.status.replace("_", " ")} />
          <Field label="Created" value={fmtDate(project.createdAt)} />
          {project.description && (
            <div className="col-span-2">
              <Field label="Description" value={project.description} />
            </div>
          )}
        </Grid>
      </Section>

      {/* Stage pipeline */}
      <Section title="Project Stage">
        <div className="flex items-center gap-0">
          {[
            "Draft",
            "DraftReview",
            "WeightsAssignment",
            "WeightsReview",
            "Approved",
            "Tracking",
          ].map((stage, i, arr) => {
            const statusOrder = [
              "Draft",
              "DraftReview",
              "WeightsAssignment",
              "WeightsReview",
              "Approved",
            ];
            const currentIdx = statusOrder.indexOf(
              checklist?.status ?? "Draft",
            );
            const stageIdx = statusOrder.indexOf(stage);
            const isDone = stageIdx < currentIdx;
            const isCurrent = stageIdx === currentIdx;
            const label =
              stage === "DraftReview"
                ? "Draft Review"
                : stage === "WeightsAssignment"
                  ? "Weights"
                  : stage === "WeightsReview"
                    ? "Wt. Review"
                    : stage;
            return (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center gap-1 min-w-0">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0",
                      isDone && "bg-emerald-500 border-emerald-500 text-white",
                      isCurrent && "bg-blue-600 border-blue-600 text-white",
                      !isDone &&
                        !isCurrent &&
                        "bg-zinc-100 border-zinc-300 text-zinc-400",
                    )}
                  >
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] text-center leading-tight max-w-[56px]",
                      isCurrent
                        ? "text-blue-700 font-semibold"
                        : isDone
                          ? "text-emerald-600"
                          : "text-zinc-400",
                    )}
                  >
                    {label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-1 mt-[-14px]",
                      isDone ? "bg-emerald-400" : "bg-zinc-200",
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Section>

      {/* Stats grid */}
      <Section title="Key Metrics">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Checklist Phase"
            value={checklistPhaseLabel[checklist?.status ?? ""] ?? "—"}
            sub={
              checklist
                ? `${checklist.selectedItems}/${checklist.totalItems} items`
                : "No checklist"
            }
            color="blue"
          />
          <StatCard
            label="Total Weight"
            value={checklist ? `${checklist.totalWeight}/100` : "—"}
            sub="weight assigned"
            color={checklist?.totalWeight === 100 ? "emerald" : "amber"}
          />
          <StatCard
            label="Latest Progress"
            value={
              latestTracker
                ? `${latestTracker.overallPercent.toFixed(1)}%`
                : "—"
            }
            sub={
              latestTracker
                ? `${latestTracker.completedItems}/${latestTracker.totalItems} items done`
                : "No trackers yet"
            }
            color="violet"
          />
          <StatCard
            label="Tracker Submissions"
            value={String(trackerCount)}
            sub={
              latestTracker
                ? `Last: ${fmtShort(latestTracker.submittedAt)}`
                : "None yet"
            }
            color="zinc"
          />
        </div>
      </Section>

      {/* Progress snapshot */}
      {latestTracker && (
        <Section title="Progress Snapshot">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Overall completion</span>
              <span
                className={cn(
                  "font-bold tabular-nums",
                  progressText(latestTracker.overallPercent),
                )}
              >
                {latestTracker.overallPercent.toFixed(1)}%
              </span>
            </div>
            <ProgressBar value={latestTracker.overallPercent} />
            <p className="text-xs text-zinc-400 mt-1">
              Based on latest tracker submitted{" "}
              {fmtDate(latestTracker.submittedAt)}
            </p>
          </div>
        </Section>
      )}

      {/* Workplan */}
      <Section title="Workplan">
        {workplan.datedItems === 0 ? (
          <p className="text-sm text-zinc-400">No workplan dates set yet.</p>
        ) : (
          <Grid cols={2}>
            <Field
              label="Items with dates"
              value={`${workplan.datedItems} / ${workplan.totalItems}`}
            />
            {workplan.plannedStart && (
              <Field
                label="Planned Start"
                value={fmtDate(workplan.plannedStart)}
              />
            )}
            {workplan.plannedEnd && (
              <Field label="Planned End" value={fmtDate(workplan.plannedEnd)} />
            )}
            {workplan.plannedStart && workplan.plannedEnd && (
              <Field
                label="Total Duration"
                value={`${daysBetween(workplan.plannedStart, workplan.plannedEnd)} days`}
              />
            )}
          </Grid>
        )}
      </Section>
    </div>
  );
}

// ─── Report: Checklist ────────────────────────────────────────────────────────

function ChecklistReport({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ChecklistReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/reports/checklist`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <ReportSkeleton />;
  if (!data) return <ReportError />;

  const PHASE_ORDER = [
    "Draft",
    "DraftReview",
    "WeightsAssignment",
    "WeightsReview",
    "Approved",
  ];

  return (
    <div className="space-y-8">
      <ReportHeader
        title="Checklist Report"
        subtitle="Selected items, weights & approval trail"
        generatedAt={new Date().toISOString()}
      />

      {/* Meta */}
      <Section title="Checklist Status">
        <Grid cols={3}>
          <Field label="Current Phase" value={data.checklist.status} />
          <Field label="Version" value={`v${data.checklist.version}`} />
          <Field
            label="Last Modified"
            value={fmtDate(data.checklist.lastModified)}
          />
          <Field
            label="Last Modified By"
            value={data.checklist.lastModifiedBy}
          />
          <Field label="Total Items" value={String(data.totalItems)} />
          <Field label="Total Weight" value={`${data.totalWeight} / 100`} />
        </Grid>
        {data.checklist.editReason && (
          <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs font-semibold text-amber-700 mb-1">
              Last edit reason
            </p>
            <p className="text-sm text-amber-800">
              {data.checklist.editReason}
            </p>
          </div>
        )}
      </Section>

      {/* Items by category */}
      <Section title="Selected Items by Category">
        <div className="space-y-5">
          {data.categories.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">{cat.name}</h4>
                <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {cat.totalWeight} pts
                </span>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-zinc-500">
                        ID
                      </th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-zinc-500">
                        Item
                      </th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-zinc-500">
                        Weight
                      </th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-zinc-500">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.map((item, i) => (
                      <tr
                        key={item.parameterId}
                        className={cn(
                          "border-b last:border-0",
                          i % 2 === 0
                            ? "bg-white dark:bg-zinc-950"
                            : "bg-zinc-50/50 dark:bg-zinc-900/50",
                        )}
                      >
                        <td className="px-3 py-2 text-xs text-zinc-400 font-mono">
                          {item.parameterId}
                        </td>
                        <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                          {item.label}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">
                          {item.weight}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ProgressBar
                              value={item.weight}
                              className="w-16"
                              thin
                            />
                            <span className="text-xs text-zinc-500 w-8 text-right tabular-nums">
                              {item.weight}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Approval trail */}
      <Section title="Approval Trail">
        {data.history.length === 0 ? (
          <p className="text-sm text-zinc-400">No history entries yet.</p>
        ) : (
          <div className="relative pl-5">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-zinc-200 dark:bg-zinc-700" />
            <div className="space-y-4">
              {data.history.map((entry, i) => {
                const isLatest = i === data.history.length - 1;
                return (
                  <div
                    key={entry.id}
                    className="relative flex items-start gap-3"
                  >
                    <div
                      className={cn(
                        "absolute left-[-13px] w-3.5 h-3.5 rounded-full border-2 mt-0.5",
                        isLatest
                          ? "bg-blue-500 border-blue-500"
                          : "bg-white dark:bg-zinc-900 border-zinc-300",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-semibold">
                          → {entry.status}
                        </span>
                        <span className="text-xs text-zinc-500">
                          by {entry.changedBy}
                        </span>
                        <span className="text-xs text-zinc-400 ml-auto">
                          {fmtDate(entry.createdAt)}
                        </span>
                      </div>
                      {entry.reason && (
                        <p className="text-xs text-zinc-500 mt-0.5 italic">
                          "{entry.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── Report: Tracker Progress ─────────────────────────────────────────────────

function TrackerProgressReport({ projectId }: { projectId: string }) {
  const [data, setData] = useState<TrackerProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/reports/tracker-progress`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <ReportSkeleton />;
  if (!data) return <ReportError />;

  const sorted = [...data.submissions].sort(
    (a, b) =>
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  );

  // SVG progress curve
  const HEIGHT = 180;
  const W = 100;
  const PAD = { t: 12, r: 4, b: 22, l: 8 };
  const pw = W - PAD.l - PAD.r;
  const ph = HEIGHT - PAD.t - PAD.b;

  const points = sorted.map((s, i) => ({
    x: PAD.l + (sorted.length === 1 ? pw / 2 : (i / (sorted.length - 1)) * pw),
    y: PAD.t + ph - (s.overallPercent / 100) * ph,
    pct: s.overallPercent,
    label: fmtShort(s.submittedAt),
  }));

  const linePath =
    points.length > 1
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : points.length === 1
        ? `M ${points[0].x} ${points[0].y}`
        : "";

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${PAD.t + ph} L ${points[0].x} ${PAD.t + ph} Z`
      : "";

  return (
    <div className="space-y-8">
      <ReportHeader
        title="Tracker Progress Report"
        subtitle="Progress over time across all submissions"
        generatedAt={new Date().toISOString()}
      />

      {/* Overall curve */}
      <Section title="Overall Progress Curve">
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-400">No tracker submissions yet.</p>
        ) : (
          <div className="rounded-xl border bg-zinc-50 dark:bg-zinc-900 p-4">
            <svg
              viewBox={`0 0 ${W} ${HEIGHT}`}
              className="w-full"
              style={{ height: 200 }}
              preserveAspectRatio="none"
            >
              {[0, 25, 50, 75, 100].map((v) => {
                const y = PAD.t + ph - (v / 100) * ph;
                return (
                  <g key={v}>
                    <line
                      x1={PAD.l}
                      x2={W - PAD.r}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.07}
                      strokeWidth={0.5}
                    />
                    <text
                      x={PAD.l - 1}
                      y={y + 1}
                      fontSize={3}
                      textAnchor="end"
                      fill="currentColor"
                      opacity={0.35}
                    >
                      {v}%
                    </text>
                  </g>
                );
              })}
              {areaPath && (
                <path d={areaPath} fill="rgb(59 130 246)" opacity={0.07} />
              )}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="rgb(59 130 246)"
                  strokeWidth={1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={1.8}
                    fill="white"
                    stroke="rgb(59 130 246)"
                    strokeWidth={0.8}
                  />
                  <text
                    x={p.x}
                    y={p.y - 3.5}
                    fontSize={3.2}
                    textAnchor="middle"
                    fill="rgb(37 99 235)"
                    fontWeight="700"
                  >
                    {p.pct.toFixed(0)}%
                  </text>
                  <text
                    x={p.x}
                    y={PAD.t + ph + 7}
                    fontSize={2.8}
                    textAnchor="middle"
                    fill="currentColor"
                    opacity={0.4}
                  >
                    {p.label}
                  </text>
                </g>
              ))}
              <line
                x1={PAD.l}
                x2={PAD.l}
                y1={PAD.t}
                y2={PAD.t + ph}
                stroke="currentColor"
                strokeOpacity={0.12}
                strokeWidth={0.5}
              />
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={PAD.t + ph}
                y2={PAD.t + ph}
                stroke="currentColor"
                strokeOpacity={0.12}
                strokeWidth={0.5}
              />
            </svg>
          </div>
        )}
      </Section>

      {/* Submission table */}
      <Section title="Submission Log">
        {sorted.length === 0 ? (
          <p className="text-sm text-zinc-400">No submissions yet.</p>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500">
                    #
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500">
                    Title
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500">
                    Submitted
                  </th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-zinc-500">
                    By
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-zinc-500">
                    Overall %
                  </th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-zinc-500">
                    Δ
                  </th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-zinc-500">
                    Breakdown
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
                      className="border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300 max-w-[180px] truncate">
                        {s.title}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {fmtShort(s.submittedAt)}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 text-xs">
                        {s.submittedBy}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ProgressBar
                            value={s.overallPercent}
                            className="w-16"
                            thin
                          />
                          <span
                            className={cn(
                              "font-bold tabular-nums text-sm",
                              progressText(s.overallPercent),
                            )}
                          >
                            {s.overallPercent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-xs tabular-nums">
                        {delta === null ? (
                          <span className="text-zinc-400">—</span>
                        ) : delta >= 0 ? (
                          <span className="text-emerald-600 font-semibold">
                            +{delta.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-red-500 font-semibold">
                            {delta.toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-600">
                            {s.completedCount}✓
                          </span>
                          <span className="text-blue-500">
                            {s.ongoingCount}→
                          </span>
                          <span className="text-red-400">
                            {s.stalledCount}!
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Category breakdown */}
      {data.categories.length > 0 && (
        <Section title="Latest Progress by Category">
          <div className="space-y-3">
            {data.categories.map((cat) => (
              <div key={cat.name} className="flex items-center gap-4">
                <div className="w-40 shrink-0 text-sm text-zinc-600 dark:text-zinc-300 truncate">
                  {cat.name}
                </div>
                <ProgressBar value={cat.latestPercent} className="flex-1" />
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums w-12 text-right shrink-0",
                    progressText(cat.latestPercent),
                  )}
                >
                  {cat.latestPercent.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.projectComplete && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800">Project Complete</p>
            <p className="text-xs text-emerald-600">
              All items reached 100% completion.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report: Workplan vs Actual ───────────────────────────────────────────────

function WorkplanActualReport({ projectId }: { projectId: string }) {
  const [data, setData] = useState<WorkplanActualData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/reports/workplan-actual`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <ReportSkeleton />;
  if (!data) return <ReportError />;

  // Gantt helpers
  const totalDays = data.totalPlannedDays || 1;

  function barStyle(item: WorkplanActualData["items"][0]) {
    const start = daysBetween(data!.projectPlannedStart, item.plannedStartDate);
    const dur = daysBetween(item.plannedStartDate, item.plannedEndDate) + 1;
    const left = (start / totalDays) * 100;
    const width = Math.max(1, (dur / totalDays) * 100);
    return { left: `${left}%`, width: `${width}%` };
  }

  return (
    <div className="space-y-8">
      <ReportHeader
        title="Workplan vs Actual"
        subtitle="Planned dates compared against real tracker progress"
        generatedAt={new Date().toISOString()}
      />

      {/* Summary */}
      <Section title="Project Timeline">
        <Grid cols={3}>
          <Field
            label="Planned Start"
            value={fmtDate(data.projectPlannedStart)}
          />
          <Field label="Planned End" value={fmtDate(data.projectPlannedEnd)} />
          <Field label="Total Duration" value={`${totalDays} days`} />
          <Field
            label="Overall Latest Progress"
            value={`${data.overallLatestPercent.toFixed(1)}%`}
            large
          />
          <Field label="Items on Workplan" value={String(data.items.length)} />
        </Grid>
      </Section>

      {/* Category summary */}
      <Section title="By Category">
        <div className="space-y-3">
          {data.categories.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center gap-4 p-3 rounded-lg border bg-white dark:bg-zinc-950"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-medium text-sm truncate">
                    {cat.name}
                  </span>
                  <StatusChip status={cat.status} />
                </div>
                <ProgressBar value={cat.avgLatestPercent} />
              </div>
              <span
                className={cn(
                  "text-lg font-bold tabular-nums shrink-0 w-14 text-right",
                  progressText(cat.avgLatestPercent),
                )}
              >
                {cat.avgLatestPercent.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* Gantt — planned bars with progress overlay */}
      <Section title="Gantt — Planned vs Progress">
        <div className="rounded-xl border overflow-hidden">
          {/* Timeline header */}
          <div className="flex border-b bg-zinc-50 dark:bg-zinc-900">
            <div className="w-48 shrink-0 px-3 py-2 text-xs font-semibold text-zinc-500 border-r">
              Item
            </div>
            <div className="flex-1 relative h-8">
              {/* Tick marks at 0%, 25%, 50%, 75%, 100% */}
              {[0, 25, 50, 75, 100].map((v) => (
                <div
                  key={v}
                  className="absolute top-0 bottom-0 flex items-center"
                  style={{ left: `${v}%` }}
                >
                  <div className="h-full w-px bg-zinc-200 dark:bg-zinc-700" />
                  <span className="absolute top-1 left-1 text-[10px] text-zinc-400">
                    {v === 0
                      ? fmtShort(data.projectPlannedStart)
                      : v === 100
                        ? fmtShort(data.projectPlannedEnd)
                        : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Item rows */}
          {data.items.map((item) => {
            const style = barStyle(item);
            return (
              <div
                key={item.parameterId}
                className="flex border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
              >
                <div className="w-48 shrink-0 px-3 py-2.5 border-r">
                  <p className="text-xs font-medium truncate">{item.label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StatusChip status={item.status} />
                  </div>
                </div>
                <div className="flex-1 relative py-3 px-1">
                  {/* Planned bar */}
                  <div
                    className="absolute top-3 h-5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                    style={style}
                  >
                    {/* Progress fill */}
                    <div
                      className={cn(
                        "h-full opacity-80",
                        progressColor(item.latestPercent),
                      )}
                      style={{ width: `${item.latestPercent}%` }}
                    />
                  </div>
                  {/* % label to the right of bar */}
                  <span
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold tabular-nums",
                      progressText(item.latestPercent),
                    )}
                  >
                    {item.latestPercent.toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-2 rounded bg-zinc-200 dark:bg-zinc-700 border" />
            Planned duration
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-2 rounded bg-blue-500 opacity-80" />
            Actual progress
          </span>
        </div>
      </Section>

      {/* Detail table */}
      <Section title="Item Detail">
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-500">
                  Item
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-zinc-500">
                  Category
                </th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-zinc-500">
                  Planned Start
                </th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-zinc-500">
                  Planned End
                </th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-zinc-500">
                  Days
                </th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-zinc-500">
                  Progress
                </th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-zinc-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr
                  key={item.parameterId}
                  className={cn(
                    "border-b last:border-0",
                    i % 2 === 0
                      ? "bg-white dark:bg-zinc-950"
                      : "bg-zinc-50/50 dark:bg-zinc-900/50",
                  )}
                >
                  <td className="px-3 py-2.5 font-medium text-zinc-700 dark:text-zinc-300 max-w-[200px] truncate">
                    {item.label}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 text-xs">
                    {item.category}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-zinc-500">
                    {fmtShort(item.plannedStartDate)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs text-zinc-500">
                    {fmtShort(item.plannedEndDate)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs tabular-nums">
                    {item.plannedDays}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ProgressBar
                        value={item.latestPercent}
                        className="w-14"
                        thin
                      />
                      <span
                        className={cn(
                          "text-xs font-bold tabular-nums w-8 text-right",
                          progressText(item.latestPercent),
                        )}
                      >
                        {item.latestPercent.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <StatusChip status={item.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

// ─── Shared layout primitives ─────────────────────────────────────────────────

function ReportHeader({
  title,
  subtitle,
  generatedAt,
}: {
  title: string;
  subtitle: string;
  generatedAt: string;
}) {
  return (
    <div className="border-b pb-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
        Project Report
      </p>
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
        {title}
      </h2>
      <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
      <p className="text-xs text-zinc-400 mt-2">
        Generated {fmtDate(generatedAt)}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 2
          ? "grid-cols-1 sm:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-zinc-400 mb-0.5">{label}</p>
      <p
        className={cn(
          "font-medium text-zinc-800 dark:text-zinc-100",
          large && "text-lg font-bold",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: "blue" | "emerald" | "amber" | "violet" | "zinc";
}) {
  const cls = {
    blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900",
    emerald:
      "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900",
    amber:
      "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900",
    violet:
      "bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900",
    zinc: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
  }[color];
  const txt = {
    blue: "text-blue-700 dark:text-blue-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
    amber: "text-amber-700 dark:text-amber-300",
    violet: "text-violet-700 dark:text-violet-300",
    zinc: "text-zinc-700 dark:text-zinc-300",
  }[color];

  return (
    <div className={cn("rounded-xl border p-4", cls)}>
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className={cn("text-xl font-bold", txt)}>{value}</p>
      <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
      <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
      <div className="h-60 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
    </div>
  );
}

function ReportError() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="font-medium text-zinc-600">Failed to load report data</p>
      <p className="text-sm text-zinc-400">
        Check your connection and try again
      </p>
    </div>
  );
}

// ─── Report catalogue ─────────────────────────────────────────────────────────

const REPORTS = [
  {
    id: "summary" as ReportId,
    label: "Project Summary",
    description:
      "One-page overview of the entire project — stage, progress, workplan and key metrics.",
    icon: FileText,
    accentColor: "bg-blue-500",
    lightColor: "bg-blue-50 dark:bg-blue-950/30",
    textColor: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-200 dark:border-blue-800",
    roles: ["sector", "me", "viewer"] as UserRole[],
  },
  {
    id: "checklist" as ReportId,
    label: "Checklist Report",
    description:
      "All selected items, assigned weights, category breakdown, and the full approval trail.",
    icon: BarChart3,
    accentColor: "bg-violet-500",
    lightColor: "bg-violet-50 dark:bg-violet-950/30",
    textColor: "text-violet-700 dark:text-violet-300",
    borderColor: "border-violet-200 dark:border-violet-800",
    roles: ["sector", "me"] as UserRole[],
  },
  {
    id: "tracker-progress" as ReportId,
    label: "Tracker Progress",
    description:
      "Progress curve across all submissions, per-category breakdown, and submission log.",
    icon: TrendingUp,
    accentColor: "bg-emerald-500",
    lightColor: "bg-emerald-50 dark:bg-emerald-950/30",
    textColor: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    roles: ["sector", "me", "viewer"] as UserRole[],
  },
  {
    id: "workplan-actual" as ReportId,
    label: "Workplan vs Actual",
    description:
      "Planned dates vs real progress — Gantt view, category status, and item detail table.",
    icon: CalendarDays,
    accentColor: "bg-amber-500",
    lightColor: "bg-amber-50 dark:bg-amber-950/30",
    textColor: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-200 dark:border-amber-800",
    roles: ["me"] as UserRole[],
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage({
  projectId,
  projectName,
  userRole,
}: {
  projectId: string;
  projectName: string;
  userRole: UserRole;
}) {
  const [activeReport, setActiveReport] = useState<ReportId | null>(null);

  const accessibleReports = REPORTS.filter((r) => r.roles.includes(userRole));

  const active = REPORTS.find((r) => r.id === activeReport);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pt-20 lg:pt-8">
        {/* Top nav */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to project
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-sm text-zinc-400 truncate max-w-[200px]">
            {projectName}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Reports
          </span>
        </div>

        {activeReport === null ? (
          /* ── Report catalogue view ── */
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Reports
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Select a report to view. Access is based on your role
                <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                  {userRole === "me"
                    ? "ME Officer"
                    : userRole === "sector"
                      ? "Sector Officer"
                      : "Viewer"}
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {REPORTS.map((report) => {
                const hasAccess = report.roles.includes(userRole);
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => hasAccess && setActiveReport(report.id)}
                    disabled={!hasAccess}
                    className={cn(
                      "group relative text-left rounded-2xl border p-5 transition-all duration-200",
                      hasAccess
                        ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md cursor-pointer"
                        : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/50 opacity-50 cursor-not-allowed",
                    )}
                  >
                    {/* Accent strip */}
                    <div
                      className={cn(
                        "absolute left-0 top-4 bottom-4 w-1 rounded-full",
                        hasAccess ? report.accentColor : "bg-zinc-300",
                      )}
                    />

                    <div className="pl-3">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            hasAccess
                              ? report.lightColor
                              : "bg-zinc-100 dark:bg-zinc-800",
                          )}
                        >
                          <Icon
                            className={cn(
                              "w-4.5 h-4.5",
                              hasAccess ? report.textColor : "text-zinc-400",
                            )}
                          />
                        </div>
                        {!hasAccess && (
                          <Lock className="w-3.5 h-3.5 text-zinc-400 mt-1 shrink-0" />
                        )}
                        {hasAccess && (
                          <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
                        )}
                      </div>

                      <h3 className="font-semibold text-zinc-800 dark:text-zinc-100 mt-3 mb-1">
                        {report.label}
                      </h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">
                        {report.description}
                      </p>

                      {!hasAccess && (
                        <p className="text-xs text-zinc-400 mt-2">
                          Available to:{" "}
                          {report.roles
                            .map((r) =>
                              r === "me"
                                ? "ME Officer"
                                : r === "sector"
                                  ? "Sector Officer"
                                  : "Viewer",
                            )
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Report view ── */
          <div className="space-y-5">
            {/* Report header bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveReport(null)}
                className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                All reports
              </button>

              {active && (
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium",
                    active.lightColor,
                    active.borderColor,
                    active.textColor,
                  )}
                >
                  <active.icon className="w-3.5 h-3.5" />
                  {active.label}
                </div>
              )}
            </div>

            {/* Report content panel */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
              {activeReport === "summary" && (
                <ProjectSummaryReport projectId={projectId} />
              )}
              {activeReport === "checklist" && (
                <ChecklistReport projectId={projectId} />
              )}
              {activeReport === "tracker-progress" && (
                <TrackerProgressReport projectId={projectId} />
              )}
              {activeReport === "workplan-actual" && (
                <WorkplanActualReport projectId={projectId} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
