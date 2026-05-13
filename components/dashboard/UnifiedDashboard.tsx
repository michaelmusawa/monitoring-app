"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import {
  ChevronRight,
  Target,
  TrendingUp,
  FolderKanban,
  FolderOpen,
  Layers,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Bell,
  ClipboardList,
  BarChart3,
  Activity,
  Rocket,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import ReportGenerator, { type ReportProject } from "./ReportGenerator";
import type {
  CIDPPerformance,
  SectorPerformance,
  CategoryPerformance,
  ProjectPerformance,
} from "@/lib/actions/dashboardActions";

// ─────────────────────────────────────────────────────────────────────────────
// Types for the stats dashboard (same as before)
// ─────────────────────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  pendingProjects: number;
  completedProjects: number;
  totalBudget: number;
  avgProgress: number;
  awaitingDraftReview: number;
  awaitingWeightsReview: number;
  recentTrackers: number;
  stalledProjects: number;
  nearCompleteProjects: number;
  sectorBreakdown: {
    sector: string;
    count: number;
    avgProgress: number;
    budget: number;
  }[];
  progressBuckets: { label: string; count: number }[];
  recentActivity: {
    id: string;
    projectName: string;
    type: "tracker" | "checklist" | "init" | "eval";
    detail: string;
    date: string;
  }[];
  budgetBySize: { size: string; budget: number; count: number }[];
  monthlyTrackers: { month: string; submissions: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions (copied from original dashboards)
// ─────────────────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#3b82f6";
  if (score >= 25) return "#f59e0b";
  return "#ef4444";
}

function scoreBg(score: number): string {
  if (score >= 80)
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800";
  if (score >= 50)
    return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
  if (score >= 25)
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800";
  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Sub‑components
// ─────────────────────────────────────────────────────────────────────────────

// Animated counter
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

// Thin progress bar
function Bar2({
  value,
  color,
  className = "",
}: {
  value: number;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={`w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// Custom tooltip for charts
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 text-zinc-100 text-xs px-3 py-2 rounded-lg shadow-xl border border-zinc-700">
      <p className="font-semibold mb-1 truncate max-w-[180px]">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill ?? p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          %
        </p>
      ))}
    </div>
  );
}

// Score gauge (radial)
function ScoreGauge({
  score,
  size = 120,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const color = scoreColor(score);
  const data = [{ value: score, fill: color }];
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={6} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black" style={{ color }}>
            {score.toFixed(0)}%
          </span>
          {label && (
            <span className="text-[10px] text-zinc-400 mt-0.5">{label}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Breadcrumb navigation
function Breadcrumb({
  items,
}: {
  items: { label: string; onClick?: () => void }[];
}) {
  return (
    <div className="flex items-center gap-1 text-xs text-zinc-400 mb-5 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-green-700 hover:text-green-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-zinc-600 dark:text-zinc-400 font-semibold">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

// Stat card
function StatCard({ label, value, sub, icon, accentBorder, accentIcon }: any) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-white dark:bg-zinc-900 p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${accentBorder} dark:border-zinc-800`}
    >
      <div className="flex items-start justify-between mb-2">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${accentIcon}`}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-0.5">
        {value}
      </div>
      <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      {sub && (
        <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5 flex items-center gap-1">
          {sub}
        </div>
      )}
    </div>
  );
}
// Queue card (for action items)
function QueueCard({ label, count, icon, cls, href }: any) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer ${cls} dark:border-zinc-700`}
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

// Section header
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
        {title}
      </h2>
      {sub && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</p>
      )}
    </div>
  );
}

// Chart tooltip (for stats charts)
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

// ─────────────────────────────────────────────────────────────────────────────
// CIDP drill‑down views (copied from original CIDPPerformanceDashboard)
// ─────────────────────────────────────────────────────────────────────────────

function CumulativeView({
  data,
  onDrillSector,
}: {
  data: CIDPPerformance;
  onDrillSector: (s: SectorPerformance) => void;
}) {
  const chartData = data.sectors.map((s) => ({
    name: s.sector.length > 18 ? s.sector.slice(0, 18) + "…" : s.sector,
    fullName: s.sector,
    score: Number(s.score.toFixed(1)),
    actual: Number(s.totalActual.toFixed(1)),
    fill: scoreColor(s.score),
  }));

  return (
    <div className="space-y-6">
      {/* Cumulative hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Big gauge */}
        <div className="md:col-span-1 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center gap-3">
          <ScoreGauge
            score={data.cumulativeScore}
            size={140}
            label="Overall Score"
          />
          <div className="text-center">
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">
              Cumulative KPI Performance
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {data.totalProjects} projects · {data.totalCategories} categories
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {[
            {
              label: "Target (100%)",
              value: "100%",
              sub: "KPI 5-year cumulative target",
              icon: (
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ),
              border: "border-blue-100 dark:border-blue-900/40",
              bg: "bg-blue-50 dark:bg-blue-950/30",
            },
            {
              label: "Actual Delivery",
              value: pct(data.cumulativeActual),
              sub: `Weighted across all ${data.totalCategories} categories`,
              icon: (
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ),
              border: "border-emerald-100 dark:border-emerald-900/40",
              bg: "bg-emerald-50 dark:bg-emerald-950/30",
            },
            {
              label: "Score",
              value: pct(data.cumulativeScore),
              sub: "Actual as % of target",
              icon: (
                <CheckCircle2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              ),
              border: "border-violet-100 dark:border-violet-900/40",
              bg: "bg-violet-50 dark:bg-violet-950/30",
            },
            {
              label: "Sectors",
              value: data.sectors.length,
              sub: `${data.totalCategories} approved categories`,
              icon: (
                <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ),
              border: "border-amber-100 dark:border-amber-900/40",
              bg: "bg-amber-50 dark:bg-amber-950/30",
            },
          ].map((c) => (
            <div
              key={c.label}
              className={`bg-white dark:bg-zinc-900 rounded-2xl border ${c.border} dark:border-zinc-800 p-4 space-y-2`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}
              >
                {c.icon}
              </div>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {c.value}
              </p>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {c.label}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {c.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sector comparison chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
              Sector Comparison
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Score = actual delivery ÷ target × 100. Click a bar to drill down.
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            barSize={28}
            margin={{ top: 4, right: 0, left: -15, bottom: 60 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<ChartTip />} />
            <Bar
              dataKey="score"
              name="Score"
              radius={[4, 4, 0, 0]}
              onClick={(d) => {
                const sector = data.sectors.find(
                  (s) => s.sector === d.fullName,
                );
                if (sector) onDrillSector(sector);
              }}
              cursor="pointer"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Sector table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
            Breakdown by Sector
          </h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {data.sectors.map((sector) => (
            <button
              key={sector.sector}
              onClick={() => onDrillSector(sector)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {sector.sector}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreBg(sector.score)}`}
                  >
                    {sector.score.toFixed(1)}%
                  </span>
                </div>
                <Bar2 value={sector.score} color={scoreColor(sector.score)} />
                <div className="flex gap-4 mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <span>{sector.categoryCount} categories</span>
                  <span>{sector.projectCount} projects</span>
                  <span>Actual: {sector.totalActual.toFixed(1)}%</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectorView({
  sector,
  onDrillCategory,
}: {
  sector: SectorPerformance;
  onDrillCategory: (c: CategoryPerformance) => void;
}) {
  const chartData = sector.categories.map((c) => ({
    name: c.name.length > 22 ? c.name.slice(0, 22) + "…" : c.name,
    fullName: c.name,
    score: Number(c.score.toFixed(1)),
    actual: Number(c.actualPercent.toFixed(1)),
    fill: scoreColor(c.score),
  }));

  return (
    <div className="space-y-6">
      {/* Sector header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col items-center justify-center">
          <ScoreGauge score={sector.score} size={110} />
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-2 font-medium">
            Sector Score
          </p>
        </div>
        {[
          {
            label: "Categories",
            value: sector.categoryCount,
            icon: (
              <FolderKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ),
          },
          {
            label: "Projects",
            value: sector.projectCount,
            icon: (
              <FolderOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ),
          },
          {
            label: "Actual",
            value: pct(sector.totalActual),
            icon: (
              <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            ),
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-3">
              {s.icon}
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {s.value}
            </p>
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Category comparison chart */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest mb-4">
          Categories — Score Comparison
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            barSize={22}
            margin={{ top: 4, right: 0, left: -15, bottom: 70 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<ChartTip />} />
            <Bar
              dataKey="score"
              name="Score"
              radius={[4, 4, 0, 0]}
              onClick={(d) => {
                const cat = sector.categories.find(
                  (c) => c.name === d.fullName,
                );
                if (cat) onDrillCategory(cat);
              }}
              cursor="pointer"
            >
              {chartData.map((e, i) => (
                <Cell key={i} fill={e.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
            Categories in {sector.sector}
          </h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {sector.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onDrillCategory(cat)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {cat.name}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${scoreBg(cat.score)}`}
                  >
                    {cat.score.toFixed(1)}%
                  </span>
                </div>
                <Bar2 value={cat.score} color={scoreColor(cat.score)} />
                <div className="flex gap-4 mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 flex-wrap">
                  <span>Target: {cat.target.toFixed(0)}</span>
                  <span>Actual: {cat.actualPercent.toFixed(1)}%</span>
                  <span>
                    {cat.projectCount} project
                    {cat.projectCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryView({ category }: { category: CategoryPerformance }) {
  if (category.projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderOpen className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          No projects in this category yet
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          Add projects under this CIDP category to see performance.
        </p>
      </div>
    );
  }

  const chartData = category.projects.map((p) => ({
    name: p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name,
    fullName: p.name,
    score: Number(p.latestTrackerPercent.toFixed(1)),
    fill: scoreColor(p.latestTrackerPercent),
  }));

  return (
    <div className="space-y-6">
      {/* Category header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col items-center justify-center">
          <ScoreGauge score={category.score} size={110} />
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-2 font-medium">
            Category Score
          </p>
        </div>
        {[
          {
            label: "KPI Target",
            value: category.target.toFixed(0),
            sub: "5-year KPI target",
          },
          {
            label: "Actual Delivery",
            value: pct(category.actualPercent),
            sub: "Avg tracker % across projects",
          },
          {
            label: "Projects",
            value: category.projectCount,
            sub: "Linked to this category",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5"
          >
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-4">
              {s.value}
            </p>
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
              {s.label}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Project chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest mb-4">
            Projects — Tracker Progress
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              barSize={24}
              margin={{ top: 4, right: 0, left: -15, bottom: 70 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="score" name="Progress" radius={[4, 4, 0, 0]}>
                {chartData.map((e, i) => (
                  <Cell key={i} fill={e.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Project list */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
            Projects in "{category.name}"
          </h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {category.projects.map((proj) => (
            <div key={proj.id} className="flex items-center gap-4 px-5 py-4">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: scoreColor(proj.latestTrackerPercent),
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {proj.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${
                      proj.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                        : "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>
                <Bar2
                  value={proj.latestTrackerPercent}
                  color={scoreColor(proj.latestTrackerPercent)}
                />
                <div className="flex gap-4 mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                  <span>Tracker: {proj.latestTrackerPercent.toFixed(1)}%</span>
                  <span>
                    Contribution: {proj.contribution.toFixed(1)}% of target
                  </span>
                </div>
              </div>
              <a
                href={`/projects/${proj.id}`}
                className="shrink-0 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
              >
                View <ChevronRight className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main UnifiedDashboard component
// ─────────────────────────────────────────────────────────────────────────────
interface UnifiedDashboardProps {
  cidpData: CIDPPerformance;
  stats: DashboardStats;
  userRole: "me" | "sector" | "admin";
  userName: string;
  reportProjects: ReportProject[];
}

export default function UnifiedDashboard({
  cidpData,
  stats,
  userRole,
  userName,
  reportProjects,
}: UnifiedDashboardProps) {
  const [showReport, setShowReport] = useState(false);
  const [activeView, setActiveView] = useState<"dashboard" | "cidp">(
    "dashboard",
  );
  const isME = userRole === "me";

  // Drill state for CIDP section
  type DrillState =
    | { level: "cumulative" }
    | { level: "sector"; sector: SectorPerformance }
    | {
        level: "category";
        sector: SectorPerformance;
        category: CategoryPerformance;
      };
  const [drill, setDrill] = useState<DrillState>({ level: "cumulative" });

  const breadcrumb = useMemo(() => {
    const items: { label: string; onClick?: () => void }[] = [
      {
        label: "KPI Overview",
        onClick: () => setDrill({ level: "cumulative" }),
      },
    ];
    if (drill.level === "sector" || drill.level === "category") {
      items.push({
        label: drill.sector.sector,
        onClick:
          drill.level === "category"
            ? () => setDrill({ level: "sector", sector: drill.sector })
            : undefined,
      });
    }
    if (drill.level === "category") {
      items.push({ label: drill.category.name });
    }
    return items;
  }, [drill]);

  const completionRate =
    stats.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;
  const ongoingRate =
    stats.totalProjects > 0
      ? Math.round((stats.activeProjects / stats.totalProjects) * 100)
      : 0;
  const stalledRate =
    stats.totalProjects > 0
      ? Math.round((stats.stalledProjects / stats.totalProjects) * 100)
      : 0;

  const notRate =
    stats.totalProjects > 0
      ? Math.round((stats.pendingProjects / stats.totalProjects) * 100)
      : 0;

  const actionCount =
    stats.awaitingDraftReview +
    stats.awaitingWeightsReview +
    stats.recentTrackers +
    stats.stalledProjects;
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  // Constants for charts
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
  const BUCKET_COLORS = ["#e5e7eb", "#fbbf24", "#3b82f6", "#10b981"];
  const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#f97316"];
  const ACTIVITY_META: Record<string, { icon: React.ReactNode; cls: string }> =
    {
      tracker: {
        icon: <Activity className="w-3.5 h-3.5" />,
        cls: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
      },
      checklist: {
        icon: <ClipboardList className="w-3.5 h-3.5" />,
        cls: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
      },
      init: {
        icon: <Rocket className="w-3.5 h-3.5" />,
        cls: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
      },
      eval: {
        icon: <BarChart3 className="w-3.5 h-3.5" />,
        cls: "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800",
      },
    };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Unified Header with view toggle ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {greeting},{" "}
              <span className="text-green-700 dark:text-blue-400">
                {
                  userName && userName.includes("@")
                    ? userName.split("@")[0] // Extract local part from email
                    : userName?.split(" ")[0] // Fallback to first word (original logic)
                }
              </span>
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {isME
                ? `${actionCount} item${actionCount !== 1 ? "s" : ""} need your attention · ${stats.recentTrackers} new tracker${stats.recentTrackers !== 1 ? "s" : ""} this week`
                : `Monitoring ${stats.activeProjects} active project${stats.activeProjects !== 1 ? "s" : ""} across ${stats.sectorBreakdown.length} sector${stats.sectorBreakdown.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setActiveView("dashboard")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeView === "dashboard"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView("cidp")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeView === "cidp"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                KPI Performance
              </button>
            </div>

            {/* Role badge */}
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${
                isME
                  ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400"
                  : userRole === "admin"
                    ? "bg-green-50 border-green-200 text-green-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {isME
                ? "M&E Officer"
                : userRole === "admin"
                  ? "Admin"
                  : "Sector Officer"}
            </span>

            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* ── VIEW: Dashboard Overview (default) ─────────────────────────────────── */}
        {activeView === "dashboard" && (
          <>
            {/* ── Action Queue (only for ME) ────────────────────────────────────── */}
            {isME && actionCount > 0 && (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h2 className="text-sm font-bold text-amber-800 dark:text-amber-400">
                    Action Queue
                  </h2>
                  <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full font-medium">
                    {actionCount} items
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <QueueCard
                    label="Awaiting Draft Review"
                    count={stats.awaitingDraftReview}
                    icon={
                      <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    }
                    cls="bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/50"
                    href="/projects?attention=needs_draft_review"
                  />
                  <QueueCard
                    label="Awaiting Weights Review"
                    count={stats.awaitingWeightsReview}
                    icon={
                      <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    }
                    cls="bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/50"
                    href="/projects?attention=needs_weights_review"
                  />
                  <QueueCard
                    label="New Trackers (7d)"
                    count={stats.recentTrackers}
                    icon={
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    }
                    cls="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    href="/projects?attention=new_tracker"
                  />
                  <QueueCard
                    label="Stalled Projects"
                    count={stats.stalledProjects}
                    icon={
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    }
                    cls="bg-red-50 border-red-200 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/50"
                    href="/projects?attention=stalled_items"
                  />
                </div>
              </div>
            )}

            {/* ── Top Stats (8 cards) ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Projects"
                value={<Counter value={stats.totalProjects} />}
                // sub={`${stats.pendingProjects} pending · ${stats.activeProjects} active`}
                icon={
                  <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                }
                accentBorder="border-blue-100 dark:border-blue-900/40"
                accentIcon="bg-blue-50 dark:bg-blue-950/30"
              />
              <StatCard
                label="Completed Projects"
                value={
                  <>
                    <Counter value={stats.completedProjects} />
                  </>
                }
                sub={`${completionRate}%`}
                icon={
                  <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                }
                accentBorder="border-teal-100 dark:border-teal-900/40"
                accentIcon="bg-teal-50 dark:bg-teal-950/30"
              />
              <StatCard
                label="Ongoing Projects"
                value={<Counter value={stats.activeProjects} />}
                sub={`${ongoingRate}%`}
                icon={
                  <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                }
                accentBorder="border-sky-100 dark:border-sky-900/40"
                accentIcon="bg-sky-50 dark:bg-sky-950/30"
              />
              <StatCard
                label="Stalled Projects"
                value={<Counter value={stats.stalledProjects} />}
                sub={`${stalledRate}%`}
                icon={
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                }
                accentBorder="border-red-100 dark:border-red-900/40"
                accentIcon="bg-red-50 dark:bg-red-950/30"
              />
              <StatCard
                label="Terminated projects"
                value={<Counter value={0} />}
                sub={`${0}%`}
                icon={
                  <Rocket className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                }
                accentBorder="border-indigo-100 dark:border-indigo-900/40"
                accentIcon="bg-indigo-50 dark:bg-indigo-950/30"
              />
              <StatCard
                label="Total Budget"
                value={fmtBudget(stats.totalBudget)}
                sub={`${stats.totalProjects} projects`}
                icon={
                  <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                }
                accentBorder="border-emerald-100 dark:border-emerald-900/40"
                accentIcon="bg-emerald-50 dark:bg-emerald-950/30"
              />

              <StatCard
                label="Not Started"
                value={<Counter value={stats.pendingProjects} />}
                sub={`${notRate}%`}
                icon={
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                }
                accentBorder="border-amber-100 dark:border-amber-900/40"
                accentIcon="bg-amber-50 dark:bg-amber-950/30"
              />

              <StatCard
                label="Avg Progress"
                value={
                  <>
                    <Counter value={stats.avgProgress} decimals={1} />%
                  </>
                }
                sub={`${stats.nearCompleteProjects} near complete`}
                icon={
                  <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                }
                accentBorder="border-violet-100 dark:border-violet-900/40"
                accentIcon="bg-violet-50 dark:bg-violet-950/30"
              />

              {/* Additional 4 cards */}
            </div>

            {/* ── Sector + distribution row ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
                <SectionHeader
                  title="By Sector"
                  sub="Average progress and project count per sector"
                />
                <div className="space-y-3">
                  {stats.sectorBreakdown.slice(0, 8).map((s, i) => (
                    <div
                      key={s.sector || i}
                      className="flex items-center gap-3"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            SECTOR_COLORS[i % SECTOR_COLORS.length],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                            {s.sector ?? "Unknown"}
                          </span>
                          <div className="flex items-center gap-3 shrink-0 ml-2">
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
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
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {b.label}: <strong>{b.count}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Tracker activity + budget row ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
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
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
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
                    <div
                      key={b.size}
                      className="flex items-center justify-between"
                    >
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
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          ({b.count})
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {fmtBudget(b.budget)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Recent Activity ────────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <SectionHeader
                title="Recent Activity"
                sub="Latest events across all projects"
              />
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-10">
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
                          className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center mt-0.5 ${meta.cls} dark:border-zinc-700`}
                        >
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                            {ev.projectName}
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {ev.detail}
                          </p>
                        </div>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5">
                          {timeAgo(ev.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <a
                href="/projects"
                className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                View all projects <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </>
        )}

        {/* ── VIEW: CIDP Performance Monitor ────────────────────────────────────── */}
        {activeView === "cidp" && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
                  County key performance indicators
                </h2>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Target vs actual delivery across all approved categories
                </p>
              </div>
            </div>

            <Breadcrumb items={breadcrumb} />

            {drill.level === "cumulative" && (
              <CumulativeView
                data={cidpData}
                onDrillSector={(s) => setDrill({ level: "sector", sector: s })}
              />
            )}
            {drill.level === "sector" && (
              <SectorView
                sector={drill.sector}
                onDrillCategory={(c) =>
                  setDrill({
                    level: "category",
                    sector: drill.sector,
                    category: c,
                  })
                }
              />
            )}
            {drill.level === "category" && (
              <CategoryView category={drill.category} />
            )}
          </div>
        )}
      </div>

      {/* Report Generator Modal */}
      {showReport && (
        <ReportGenerator
          projects={reportProjects}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
