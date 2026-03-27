"use client";

import { useState, useMemo } from "react";
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
} from "recharts";
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  FolderKanban,
  FolderOpen,
  Layers,
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Circle,
} from "lucide-react";
import type {
  CIDPPerformance,
  SectorPerformance,
  CategoryPerformance,
  ProjectPerformance,
} from "@/lib/actions/dashboardActions";
import ReportGenerator, { type ReportProject } from "./ReportGenerator";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981"; // emerald
  if (score >= 50) return "#3b82f6"; // blue
  if (score >= 25) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (score >= 50) return "bg-blue-50 text-blue-700 border-blue-200";
  if (score >= 25) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

// ─── Radial score gauge ────────────────────────────────────────────────────────

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

// ─── Thin progress bar ────────────────────────────────────────────────────────

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
      className={`w-full h-2 rounded-full bg-zinc-100 overflow-hidden ${className}`}
    >
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

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

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

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
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-zinc-600 font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── View: CUMULATIVE ────────────────────────────────────────────────────────

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
              Cumulative CIDP Performance
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
              sub: "CIDP 5-year cumulative target",
              icon: <Target className="w-5 h-5 text-blue-600" />,
              border: "border-blue-100",
              bg: "bg-blue-50",
            },
            {
              label: "Actual Delivery",
              value: pct(data.cumulativeActual),
              sub: `Weighted across all ${data.totalCategories} categories`,
              icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
              border: "border-emerald-100",
              bg: "bg-emerald-50",
            },
            {
              label: "Score",
              value: pct(data.cumulativeScore),
              sub: "Actual as % of target",
              icon: <CheckCircle2 className="w-5 h-5 text-violet-600" />,
              border: "border-violet-100",
              bg: "bg-violet-50",
            },
            {
              label: "Sectors",
              value: data.sectors.length,
              sub: `${data.totalCategories} approved categories`,
              icon: <Layers className="w-5 h-5 text-amber-600" />,
              border: "border-amber-100",
              bg: "bg-amber-50",
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
              <p className="text-xs font-semibold text-zinc-500">{c.label}</p>
              <p className="text-xs text-zinc-400">{c.sub}</p>
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
            <p className="text-xs text-zinc-400 mt-0.5">
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
                <div className="flex gap-4 mt-1.5 text-xs text-zinc-400">
                  <span>{sector.categoryCount} categories</span>
                  <span>{sector.projectCount} projects</span>
                  <span>Actual: {sector.totalActual.toFixed(1)}%</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 group-hover:text-zinc-700 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── View: SECTOR ─────────────────────────────────────────────────────────────

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
          <p className="text-xs text-zinc-400 text-center mt-2 font-medium">
            Sector Score
          </p>
        </div>
        {[
          {
            label: "Categories",
            value: sector.categoryCount,
            icon: <FolderKanban className="w-4 h-4 text-blue-600" />,
          },
          {
            label: "Projects",
            value: sector.projectCount,
            icon: <FolderOpen className="w-4 h-4 text-emerald-600" />,
          },
          {
            label: "Actual",
            value: pct(sector.totalActual),
            icon: <TrendingUp className="w-4 h-4 text-violet-600" />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center mb-3">
              {s.icon}
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
              {s.value}
            </p>
            <p className="text-xs font-medium text-zinc-400">{s.label}</p>
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
                <div className="flex gap-4 mt-1.5 text-xs text-zinc-400 flex-wrap">
                  <span>Target: {cat.target.toFixed(0)}</span>
                  <span>Actual: {cat.actualPercent.toFixed(1)}%</span>
                  <span>
                    {cat.projectCount} project
                    {cat.projectCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 group-hover:text-zinc-700 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── View: CATEGORY ───────────────────────────────────────────────────────────

function CategoryView({ category }: { category: CategoryPerformance }) {
  if (category.projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderOpen className="w-12 h-12 text-zinc-300 mb-3" />
        <p className="text-sm font-semibold text-zinc-500">
          No projects in this category yet
        </p>
        <p className="text-xs text-zinc-400 mt-1">
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
          <p className="text-xs text-zinc-400 text-center mt-2 font-medium">
            Category Score
          </p>
        </div>
        {[
          {
            label: "CIDP Target",
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
            <p className="text-xs font-semibold text-zinc-500 mt-1">
              {s.label}
            </p>
            <p className="text-xs text-zinc-400">{s.sub}</p>
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
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-zinc-50 text-zinc-500 border-zinc-200"
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>
                <Bar2
                  value={proj.latestTrackerPercent}
                  color={scoreColor(proj.latestTrackerPercent)}
                />
                <div className="flex gap-4 mt-1.5 text-xs text-zinc-400">
                  <span>Tracker: {proj.latestTrackerPercent.toFixed(1)}%</span>
                  <span>
                    Contribution: {proj.contribution.toFixed(1)}% of target
                  </span>
                </div>
              </div>
              <a
                href={`/projects/${proj.id}`}
                className="shrink-0 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
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

// ─── Main component ───────────────────────────────────────────────────────────

type DrillState =
  | { level: "cumulative" }
  | { level: "sector"; sector: SectorPerformance }
  | {
      level: "category";
      sector: SectorPerformance;
      category: CategoryPerformance;
    };

export default function CIDPPerformanceDashboard({
  data,
  reportProjects,
}: {
  data: CIDPPerformance;
  reportProjects: ReportProject[];
}) {
  const [drill, setDrill] = useState<DrillState>({ level: "cumulative" });
  const [showReport, setShowReport] = useState(false);

  const breadcrumb = useMemo(() => {
    const items: { label: string; onClick?: () => void }[] = [
      {
        label: "CIDP Overview",
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

  return (
    <div className="space-y-0">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
            CIDP Performance Monitor
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Target vs actual delivery across all approved categories
          </p>
        </div>
        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
        >
          <FileText className="w-3.5 h-3.5" />
          Generate Report
        </button>
      </div>

      <Breadcrumb items={breadcrumb} />

      {drill.level === "cumulative" && (
        <CumulativeView
          data={data}
          onDrillSector={(s) => setDrill({ level: "sector", sector: s })}
        />
      )}

      {drill.level === "sector" && (
        <SectorView
          sector={drill.sector}
          onDrillCategory={(c) =>
            setDrill({ level: "category", sector: drill.sector, category: c })
          }
        />
      )}

      {drill.level === "category" && <CategoryView category={drill.category} />}

      {showReport && (
        <ReportGenerator
          projects={reportProjects}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
