// components/dashboard/StatsCharts.tsx
"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function StatsCharts({ stats }: { stats: any }) {
  const { statusCounts, priorityCounts, monthlyProgress } = stats;

  // ---------------------------
  // PIE CHART CONFIG (Project Status)
  // ---------------------------
  const statusConfig: ChartConfig = Object.fromEntries(
    statusCounts.map((item: any) => [
      item.name,
      {
        label: item.name,
        color: item.color || "#2563eb",
      },
    ]),
  );

  // ---------------------------
  // BAR CHART CONFIG (Priority Levels)
  // ---------------------------
  const priorityConfig: ChartConfig = Object.fromEntries(
    priorityCounts.map((item: any) => [
      item.name,
      {
        label: item.name,
        color: item.color || "#60a5fa",
      },
    ]),
  );

  // ---------------------------
  // LINE CHART CONFIG (Monthly Progress)
  // ---------------------------
  const progressConfig: ChartConfig = {
    progress: {
      label: "Progress",
      color: "#16a34a",
    },
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* ========================================================= */}
      {/*  1. PROJECT STATUS PIE CHART */}
      {/* ========================================================= */}
      <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
        <h3 className="text-sm font-semibold mb-2">Project Status Breakdown</h3>

        <ChartContainer config={statusConfig} className="min-h-[230px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />

            <Pie
              data={statusCounts}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={70}
              label
            >
              {statusCounts.map((entry: any, index: any) => (
                <Cell key={index} fill={statusConfig[entry.name].color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>

      {/* ========================================================= */}
      {/*  2. PRIORITY BAR CHART */}
      {/* ========================================================= */}
      <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
        <h3 className="text-sm font-semibold mb-2">Priority Levels</h3>

        <ChartContainer
          config={priorityConfig}
          className="min-h-[230px] w-full"
        >
          <BarChart accessibilityLayer data={priorityCounts}>
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />

            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />

            {priorityCounts.map((entry: any, idx: any) => (
              <Bar
                key={idx}
                dataKey="value"
                fill={priorityConfig[entry.name].color}
                radius={4}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </div>

      {/* ========================================================= */}
      {/*  3. LINE CHART – MONTHLY PROGRESS */}
      {/* ========================================================= */}
      <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
        <h3 className="text-sm font-semibold mb-2">Progress Over Time</h3>

        <ChartContainer
          config={progressConfig}
          className="min-h-[230px] w-full"
        >
          <LineChart accessibilityLayer data={monthlyProgress}>
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(v) => v.slice(0, 3)}
            />

            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />

            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-progress)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </div>
    </div>
  );
}
