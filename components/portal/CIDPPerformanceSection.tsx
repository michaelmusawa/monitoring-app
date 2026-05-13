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
  Target,
  TrendingUp,
  FolderKanban,
  FolderOpen,
  Layers,
  CheckCircleIcon,
} from "lucide-react";
import type {
  CIDPPerformance,
  SectorPerformance,
  CategoryPerformance,
} from "@/lib/actions/publicActions";

// Helpers (same as before)
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

function Bar2({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function ScoreGauge({ score, size = 100 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  const data = [{ value: score, fill: color }];
  return (
    <div className="relative" style={{ width: size, height: size }}>
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
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-black" style={{ color }}>
          {score.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 text-zinc-100 text-xs px-3 py-2 rounded-lg shadow-xl border border-zinc-700">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill ?? p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          %
        </p>
      ))}
    </div>
  );
}

function Breadcrumb({
  items,
}: {
  items: { label: string; onClick?: () => void }[];
}) {
  return (
    <div className="flex items-center gap-1 text-xs text-zinc-400 mb-4 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
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

// ─── Views ─────────────────────────────────────────────────────────────────
function CumulativeView({
  data,
  onDrill,
}: {
  data: CIDPPerformance;
  onDrill: (s: SectorPerformance) => void;
}) {
  const chartData = data.sectors.map((s) => ({
    name: s.sector.length > 18 ? s.sector.slice(0, 18) + "…" : s.sector,
    fullName: s.sector,
    score: Number(s.score.toFixed(1)),
    fill: scoreColor(s.score),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col items-center justify-center gap-3">
          <ScoreGauge score={data.cumulativeScore} size={130} />
          <p className="text-xs text-zinc-400 text-center">
            Overall CIDP Score
          </p>
        </div>
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {[
            {
              label: "Target",
              value: "100%",
              sub: "5‑year cumulative target",
              icon: <Target className="w-4 h-4 text-blue-600" />,
            },
            {
              label: "Actual Delivery",
              value: pct(data.cumulativeActual),
              sub: `Across ${data.totalCategories} categories`,
              icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
            },
            {
              label: "Score",
              value: pct(data.cumulativeScore),
              sub: "Actual as % of target",
              icon: <CheckCircleIcon />,
            },
            {
              label: "Sectors",
              value: data.sectors.length,
              sub: `${data.totalCategories} categories`,
              icon: <Layers className="w-4 h-4 text-amber-600" />,
            },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-white dark:bg-slate-900 rounded-2xl border p-4 space-y-2"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
                {c.icon}
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {c.value}
              </p>
              <p className="text-xs font-semibold text-zinc-500">{c.label}</p>
              <p className="text-xs text-zinc-400">{c.sub}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-4">
          Sector Comparison
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={chartData}
            barSize={24}
            margin={{ left: -15, bottom: 60 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              dataKey="score"
              name="Score"
              radius={[4, 4, 0, 0]}
              onClick={(d) =>
                onDrill(data.sectors.find((s) => s.sector === d.fullName)!)
              }
              cursor="pointer"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h3 className="text-sm font-bold uppercase tracking-widest">
            Breakdown by Sector
          </h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {data.sectors.map((sector) => (
            <button
              key={sector.sector}
              onClick={() => onDrill(sector)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold truncate">
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
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectorView({
  sector,
  onDrill,
  onBack,
}: {
  sector: SectorPerformance;
  onDrill: (c: CategoryPerformance) => void;
  onBack: () => void;
}) {
  const chartData = sector.categories.map((c) => ({
    name: c.name.length > 22 ? c.name.slice(0, 22) + "…" : c.name,
    fullName: c.name,
    score: Number(c.score.toFixed(1)),
    fill: scoreColor(c.score),
  }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col items-center justify-center">
          <ScoreGauge score={sector.score} size={90} />
          <p className="text-xs text-zinc-400 mt-2">Sector Score</p>
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
            className="bg-white dark:bg-slate-900 rounded-2xl border p-5"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-3">
              {s.icon}
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {s.value}
            </p>
            <p className="text-xs font-medium text-zinc-400">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4">
          Categories – Score
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            barSize={22}
            margin={{ left: -15, bottom: 70 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              dataKey="score"
              name="Score"
              radius={[4, 4, 0, 0]}
              onClick={(d) =>
                onDrill(sector.categories.find((c) => c.name === d.fullName)!)
              }
              cursor="pointer"
            >
              {chartData.map((e, i) => (
                <Cell key={i} fill={e.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h3 className="text-sm font-bold uppercase tracking-widest">
            Categories in {sector.sector}
          </h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {sector.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onDrill(cat)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold truncate">
                    {cat.name}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${scoreBg(cat.score)}`}
                  >
                    {cat.score.toFixed(1)}%
                  </span>
                </div>
                <Bar2 value={cat.score} color={scoreColor(cat.score)} />
                <div className="flex gap-4 mt-1.5 text-xs text-zinc-400">
                  <span>Target: {cat.target}</span>
                  <span>Actual: {cat.actualPercent.toFixed(1)}%</span>
                  <span>{cat.projectCount} projects</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryView({
  category,
  onBack,
}: {
  category: CategoryPerformance;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col items-center justify-center">
          <ScoreGauge score={category.score} size={90} />
          <p className="text-xs text-zinc-400 mt-2">Category Score</p>
        </div>
        {[
          {
            label: "CIDP Target",
            value: category.target.toFixed(0),
            sub: "5‑year KPI target",
          },
          {
            label: "Actual Delivery",
            value: pct(category.actualPercent),
            sub: "Avg tracker %",
          },
          {
            label: "Projects",
            value: category.projectCount,
            sub: "Linked to this category",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-900 rounded-2xl border p-5"
          >
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-4">
              {s.value}
            </p>
            <p className="text-xs font-semibold text-zinc-500 mt-1">
              {s.label}
            </p>
            <p className="text-xs text-zinc-400">{s.sub}</p>
          </div>
        ))}
      </div>
      {category.projects.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4">
            Projects Progress
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={category.projects.map((p) => ({
                name: p.name.length > 22 ? p.name.slice(0, 22) + "…" : p.name,
                progress: p.latestTrackerPercent,
                fill: scoreColor(p.latestTrackerPercent),
              }))}
              barSize={22}
              margin={{ left: -15, bottom: 70 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="progress" name="Progress" radius={[4, 4, 0, 0]}>
                {category.projects.map((e, i) => (
                  <Cell key={i} fill={scoreColor(e.latestTrackerPercent)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h3 className="text-sm font-bold uppercase tracking-widest">
            Projects in {category.name}
          </h3>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {category.projects.map((proj) => (
            <div key={proj.id} className="flex items-center gap-4 px-5 py-4">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: scoreColor(proj.latestTrackerPercent),
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold truncate">
                    {proj.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border font-medium ${proj.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-zinc-50 text-zinc-500 border-zinc-200"}`}
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CIDPPerformanceSection({
  data,
}: {
  data: CIDPPerformance;
}) {
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
    <section className="rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            CIDP Performance Monitor
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Target vs actual delivery across approved categories
          </p>
        </div>
      </div>
      <Breadcrumb items={breadcrumb} />

      {drill.level === "cumulative" && (
        <CumulativeView
          data={data}
          onDrill={(s) => setDrill({ level: "sector", sector: s })}
        />
      )}
      {drill.level === "sector" && (
        <SectorView
          sector={drill.sector}
          onDrill={(c) =>
            setDrill({ level: "category", sector: drill.sector, category: c })
          }
          onBack={() => setDrill({ level: "cumulative" })}
        />
      )}
      {drill.level === "category" && (
        <CategoryView
          category={drill.category}
          onBack={() => setDrill({ level: "sector", sector: drill.sector })}
        />
      )}
    </section>
  );
}
