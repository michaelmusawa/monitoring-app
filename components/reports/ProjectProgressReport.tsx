"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/utils/export";

export function ProjectProgressReport({ initialData }: { initialData: any[] }) {
  const [filter, setFilter] = useState("");
  const data = initialData.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const chartData = data.map((p) => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + "…" : p.name,
    progress: p.progress,
    status: p.status,
  }));

  const getBarColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "#22c55e";
      case "ACTIVE":
        return "#3b82f6";
      case "ON_HOLD":
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  };

  const handleExport = () => {
    exportToCSV(data, "project-progress-report");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Progress Report</CardTitle>
        <div className="flex justify-between items-center mt-2">
          <Input
            placeholder="Filter by project name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="progress" name="Progress (%)" fill="#3b82f6">
                {chartData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={getBarColor(entry.status)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Budget (KES)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.sector || "—"}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span>{p.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{p.budget?.toLocaleString() || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
