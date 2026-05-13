"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/utils/export";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export function SectorPerformanceReport({
  initialData,
}: {
  initialData: any[];
}) {
  const pieData = initialData.map((s) => ({
    name: s.sector,
    value: s.projectCount,
  }));

  const barData = initialData.map((s) => ({
    sector: s.sector,
    avgProgress: s.avgProgress,
    active: s.activeProjects,
    completed: s.completedProjects,
  }));

  const handleExport = () => {
    exportToCSV(initialData, "sector-performance-report");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Sector Performance Report
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Projects by Sector</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Average Progress by Sector
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sector" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="avgProgress"
                  name="Avg Progress (%)"
                  fill="#3b82f6"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-md border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Sector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Projects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Avg Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Total Budget (KES)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {initialData.map((s) => (
                <tr key={s.sector}>
                  <td className="px-6 py-4 font-medium">{s.sector}</td>
                  <td className="px-6 py-4">{s.projectCount}</td>
                  <td className="px-6 py-4">{s.activeProjects}</td>
                  <td className="px-6 py-4">{s.completedProjects}</td>
                  <td className="px-6 py-4">{s.avgProgress}%</td>
                  <td className="px-6 py-4">
                    {s.totalBudget.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
