"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";

interface StatusData {
  name: string;
  value: number;
  color: string;
}

export default function DeliverySummaryCharts({
  statusData,
  totalProjects,
}: {
  statusData: StatusData[];
  totalProjects: number;
}) {
  // Filter out zero values for the pie chart only (avoid invisible wedges)
  const pieData = statusData.filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Donut chart */}
      <Card className="lg:col-span-1 shadow-md border-l-4 border-l-primary">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Project Status</h2>
          </div>
          <div className="relative mx-auto">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${value} projects`}
                  contentStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {statusData.map((s) => (
              <div
                key={s.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{s.name}</span>
                </div>
                <span className="font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delivery Summary bar chart */}
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Delivery Summary</h2>
          </div>
          <div className="space-y-3">
            {statusData.map((s) => {
              const percent =
                totalProjects > 0 ? (s.value / totalProjects) * 100 : 0;
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="text-xs font-semibold tabular-nums">
                        {s.value} projects
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: s.color,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {percent.toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
