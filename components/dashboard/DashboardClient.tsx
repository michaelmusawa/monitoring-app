// components/dashboard/DashboardClient.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import {
  Layers,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Activity,
  ChevronRight,
  ArrowUpRight,
  Rocket,
  ClipboardList,
  Bell,
  FileText,
} from "lucide-react";
import ReportGenerator, {
  ReportProject,
} from "@/components/dashboard/ReportGenerator";
import { DashboardStats } from "./UnifiedDashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBudget(n: number) {
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n}`;
}

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 60) return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
}

// ─── Animated counter ────────────────────────────────────────────────────────

function Counter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(Date.now());
  const duration = 900;

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 text-zinc-100 text-xs px-3 py-2 rounded-lg shadow-xl border border-zinc-700">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accentBorder,
  accentIcon,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: React.ReactNode;
  accentBorder: string;
  accentIcon: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900 p-5 ${accentBorder}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentIcon}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
        {value}
      </p>
      <p className="text-sm font-medium text-zinc-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-zinc-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Queue card ───────────────────────────────────────────────────────────────

function QueueCard({
  label,
  count,
  icon,
  cls,
  href,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  cls: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer ${cls}`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight">{label}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-lg font-bold">{count}</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
      </div>
    </a>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
        {title}
      </h2>
      {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SECTOR_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
];

const ACTIVITY_META = {
  tracker: {
    icon: <Activity className="w-3.5 h-3.5" />,
    cls: "bg-blue-50 text-blue-600 border-blue-100",
  },
  checklist: {
    icon: <ClipboardList className="w-3.5 h-3.5" />,
    cls: "bg-amber-50 text-amber-600 border-amber-100",
  },
  init: {
    icon: <Rocket className="w-3.5 h-3.5" />,
    cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  eval: {
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    cls: "bg-violet-50 text-violet-600 border-violet-100",
  },
};

const BUCKET_COLORS = ["#e5e7eb", "#fbbf24", "#3b82f6", "#10b981"];
const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#f97316"];

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardClient({
  stats,
  userRole,
  userName,
  reportProjects,
}: {
  stats: DashboardStats;
  userRole: "me" | "sector" | "admin";
  userName: string;
  reportProjects: ReportProject[];
}) {
  const [showReport, setShowReport] = useState(false);
  const isME = userRole === "me";

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  const completionRate =
    stats.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;

  const actionCount =
    stats.awaitingDraftReview +
    stats.awaitingWeightsReview +
    stats.recentTrackers +
    stats.stalledProjects;

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {greeting},{" "}
              <span className="text-blue-600">{userName.split(" ")[0]}</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {isME
                ? `${actionCount} item${actionCount !== 1 ? "s" : ""} need your attention · ${stats.recentTrackers} new tracker${stats.recentTrackers !== 1 ? "s" : ""} this week`
                : `Monitoring ${stats.activeProjects} active project${stats.activeProjects !== 1 ? "s" : ""} across ${stats.sectorBreakdown.length} sector${stats.sectorBreakdown.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <span
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${
              isME
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : userRole === "admin"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {isME
              ? "M&E Officer"
              : userRole === "admin"
                ? "Admin"
                : "Sector Officer"}
          </span>

          {isME && (
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
          )}

          {showReport && (
            <ReportGenerator
              projects={reportProjects}
              onClose={() => setShowReport(false)}
            />
          )}
        </div>

        {/* ── ME Action Queue ──────────────────────────────────────────────── */}
        {isME && actionCount > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:bg-amber-900/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-amber-800 dark:text-amber-400">
                Action Queue
              </h2>
              <span className="text-xs text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                {actionCount} items
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <QueueCard
                label="Awaiting Draft Review"
                count={stats.awaitingDraftReview}
                icon={<ClipboardList className="w-4 h-4 text-amber-600" />}
                cls="bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                href="/projects?attention=needs_draft_review"
              />
              <QueueCard
                label="Awaiting Weights Review"
                count={stats.awaitingWeightsReview}
                icon={<BarChart3 className="w-4 h-4 text-purple-600" />}
                cls="bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
                href="/projects?attention=needs_weights_review"
              />
              <QueueCard
                label="New Trackers (7d)"
                count={stats.recentTrackers}
                icon={<Activity className="w-4 h-4 text-blue-600" />}
                cls="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                href="/projects?attention=new_tracker"
              />
              <QueueCard
                label="Stalled Projects"
                count={stats.stalledProjects}
                icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
                cls="bg-red-50 border-red-200 text-red-800 hover:bg-red-100"
                href="/projects?attention=stalled_items"
              />
            </div>
          </div>
        )}

        {/* ── Key metrics ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Projects"
            value={<Counter value={stats.totalProjects} />}
            sub={`${stats.pendingProjects} pending · ${stats.activeProjects} active`}
            icon={<Layers className="w-5 h-5 text-blue-600" />}
            accentBorder="border-blue-100 dark:border-blue-900/40"
            accentIcon="bg-blue-50"
          />
          <StatCard
            label="Portfolio Budget"
            value={fmtBudget(stats.totalBudget)}
            sub={`${stats.totalProjects} projects`}
            icon={<BarChart3 className="w-5 h-5 text-emerald-600" />}
            accentBorder="border-emerald-100 dark:border-emerald-900/40"
            accentIcon="bg-emerald-50"
          />
          <StatCard
            label="Avg Progress"
            value={
              <>
                <Counter value={stats.avgProgress} decimals={1} />%
              </>
            }
            sub={`${stats.nearCompleteProjects} near complete`}
            icon={<TrendingUp className="w-5 h-5 text-violet-600" />}
            accentBorder="border-violet-100 dark:border-violet-900/40"
            accentIcon="bg-violet-50"
          />
          <StatCard
            label="Completion Rate"
            value={
              <>
                <Counter value={completionRate} />%
              </>
            }
            sub={`${stats.completedProjects} completed`}
            icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
            accentBorder="border-teal-100 dark:border-teal-900/40"
            accentIcon="bg-teal-50"
          />
        </div>

        {/* ── Sector + distribution ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Sector breakdown — 2 cols */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <SectionHeader
              title="By Sector"
              sub="Average progress and project count per sector"
            />
            <div className="space-y-3">
              {stats.sectorBreakdown.slice(0, 8).map((s, i) => (
                <div key={s.sector || i} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length],
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                        {s.sector ?? "Unknown"}
                      </span>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs text-zinc-400">
                          {s.count} proj
                        </span>
                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 w-9 text-right">
                          {s.avgProgress.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.avgProgress}%`,
                          backgroundColor:
                            SECTOR_COLORS[i % SECTOR_COLORS.length],
                          transition: "width 1s cubic-bezier(0.34,1.56,0.64,1)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress distribution — 1 col */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <SectionHeader title="Progress Buckets" />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={stats.progressBuckets}
                barSize={22}
                margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Projects" radius={[4, 4, 0, 0]}>
                  {stats.progressBuckets.map((_, i) => (
                    <Cell key={i} fill={BUCKET_COLORS[i] ?? "#3b82f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {stats.progressBuckets.map((b, i) => (
                <div key={b.label} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-sm shrink-0"
                    style={{ backgroundColor: BUCKET_COLORS[i] }}
                  />
                  <span className="text-xs text-zinc-500 truncate">
                    {b.label}: <strong>{b.count}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Monthly activity + budget ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Monthly tracker submissions */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <SectionHeader
              title="Tracker Activity"
              sub="Monthly submission count"
            />
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart
                data={stats.monthlyTrackers}
                margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  name="Submissions"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#blueGrad)"
                  dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Budget by project size */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <SectionHeader title="Budget by Size" />
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={stats.budgetBySize}
                    dataKey="budget"
                    nameKey="size"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {stats.budgetBySize.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => fmtBudget(v)}
                    contentStyle={{
                      fontSize: 11,
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: 8,
                      color: "#f4f4f5",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-1">
              {stats.budgetBySize.map((b, i) => (
                <div key={b.size} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {b.size}
                    </span>
                    <span className="text-xs text-zinc-400">({b.count})</span>
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    {fmtBudget(b.budget)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent activity feed ─────────────────────────────────────────── */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <SectionHeader
            title="Recent Activity"
            sub="Latest events across all projects"
          />
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-10">
              No recent activity
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {stats.recentActivity.slice(0, 8).map((ev) => {
                const meta = ACTIVITY_META[ev.type];
                return (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div
                      className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center mt-0.5 ${meta.cls}`}
                    >
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {ev.projectName}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {ev.detail}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400 shrink-0 mt-0.5">
                      {timeAgo(ev.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <a
            href="/projects"
            className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all projects <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
