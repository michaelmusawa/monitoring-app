"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicProject } from "@/lib/actions/publicActions";

const STATUS_COLORS = {
  ACTIVE: "#10b981",
  PENDING: "#f59e0b",
  COMPLETED: "#6366f1",
};

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 50) return "#3b82f6";
  if (score >= 25) return "#f59e0b";
  return "#ef4444";
}

export default function ProjectCharts({
  projects,
}: {
  projects: PublicProject[];
}) {
  // --- Status distribution ---
  const statusMap = { ACTIVE: 0, PENDING: 0, COMPLETED: 0 } as Record<
    string,
    number
  >;
  projects.forEach((p) => {
    const key =
      p.status === "ACTIVE"
        ? "ACTIVE"
        : p.status === "COMPLETED"
          ? "COMPLETED"
          : "PENDING";
    statusMap[key] = (statusMap[key] || 0) + 1;
  });
  const statusData = Object.entries(statusMap)
    .filter(([_, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  // --- Sector performance (avg progress + count) ---
  const sectorMap: Record<string, { count: number; totalProgress: number }> =
    {};
  projects.forEach((p) => {
    const sector = p.sector || "Unknown";
    if (!sectorMap[sector]) sectorMap[sector] = { count: 0, totalProgress: 0 };
    sectorMap[sector].count += 1;
    sectorMap[sector].totalProgress += p.progress || 0;
  });
  const sectorPerfData = Object.entries(sectorMap)
    .map(([name, { count, totalProgress }]) => ({
      name,
      avgProgress: Math.round(totalProgress / count),
      count,
    }))
    .sort((a, b) => b.avgProgress - a.avgProgress)
    .slice(0, 8);

  // --- Budget by sub‑county ---
  const subBudget: Record<string, number> = {};
  projects.forEach((p) => {
    if (p.subCounty)
      subBudget[p.subCounty] = (subBudget[p.subCounty] || 0) + (p.budget || 0);
  });
  const subCountyData = Object.entries(subBudget)
    .map(([name, budget]) => ({ name, budget: budget / 1e6 }))
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 8);

  // --- Progress distribution donut ---
  const progressRanges = [
    { name: "0–25%", min: 0, max: 25 },
    { name: "26–50%", min: 26, max: 50 },
    { name: "51–75%", min: 51, max: 75 },
    { name: "76–100%", min: 76, max: 100 },
  ];
  const progressData = progressRanges.map((r) => ({
    name: r.name,
    value: projects.filter(
      (p) => (p.progress || 0) >= r.min && (p.progress || 0) <= r.max,
    ).length,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Status Pie */}
      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {statusData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={
                      STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] ||
                      "#94a3b8"
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sector Performance: Avg Progress (full width on large screens) */}
      <Card>
        <CardHeader>
          <CardTitle>Sector Performance – Avg Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={sectorPerfData}
              layout="vertical"
              margin={{ left: 130 }}
            >
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  if (name === "avgProgress")
                    return [`${value}%`, "Avg Progress"];
                  return [value, name];
                }}
                labelFormatter={(label: string) =>
                  `${label} (${sectorPerfData.find((s) => s.name === label)?.count ?? 0} projects)`
                }
              />
              <Bar
                dataKey="avgProgress"
                name="Avg Progress"
                radius={[0, 4, 4, 0]}
              >
                {sectorPerfData.map((entry, idx) => (
                  <Cell key={idx} fill={scoreColor(entry.avgProgress)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Budget by Sub‑county */}
      <Card>
        <CardHeader>
          <CardTitle>Budget by Sub‑county (Top 8, KES Millions)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={subCountyData}
              layout="vertical"
              margin={{ left: 80 }}
            >
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={110} />
              <Tooltip formatter={(val: number) => `KES ${val.toFixed(1)}M`} />
              <Bar dataKey="budget" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Progress Donut */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={progressData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {progressData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={["#94a3b8", "#60a5fa", "#818cf8", "#34d399"][idx % 4]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
