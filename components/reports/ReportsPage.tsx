"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  BarChart3,
  FileDown,
  FileText,
  PieChartIcon,
  Clock,
  FolderOpen,
} from "lucide-react";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

// Lazy-load Recharts for client
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
} from "recharts";

export default function ReportsClient({
  projectId,
  summary,
  trackerProgress,
  timeline,
  attachments,
}) {
  // =============================================================
  // CHART CONFIGS
  // =============================================================

  // Colors auto-generated or you can hardcode
  const progressConfig: ChartConfig = Object.fromEntries(
    trackerProgress.map((item: any) => [
      item.name,
      {
        label: item.name,
        color: item.color || "#3b82f6", // fallback blue
      },
    ]),
  );

  const pieConfig: ChartConfig = progressConfig;

  return (
    <div className="p-6 space-y-8">
      {/* ------------------------------------------------------ */}
      {/* HEADER */}
      {/* ------------------------------------------------------ */}
      <div>
        <h1 className="text-2xl font-bold">Project Reports</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Reports & analytics for project <strong>{projectId}</strong>
        </p>
      </div>

      {/* ------------------------------------------------------ */}
      {/* SUMMARY CARDS */}
      {/* ------------------------------------------------------ */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {summary.completionRate}%
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trackers Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {summary.completedTrackers}/{summary.totalTrackers}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Updated</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <Clock className="inline mr-1 size-4" />
            {summary.lastUpdated}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Exports</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button size="sm" variant="outline">
              <FileDown className="size-4 mr-1" />
              PDF
            </Button>
            <Button size="sm" variant="outline">
              <FileText className="size-4 mr-1" />
              CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* ------------------------------------------------------ */}
      {/* BAR CHART – TRACKER PROGRESS */}
      {/* ------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Tracker Progress Breakdown
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ChartContainer
            config={progressConfig}
            className="min-h-[260px] w-full"
          >
            <BarChart accessibilityLayer data={trackerProgress}>
              <CartesianGrid vertical={false} />

              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />

              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />

              <Bar
                dataKey="value"
                radius={5}
                fillOpacity={0.9}
                shape="rectangle"
              >
                {trackerProgress.map((entry: any, index: any) => (
                  <Cell key={index} fill={progressConfig[entry.name].color} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------ */}
      {/* PIE CHART – COMPLETION DISTRIBUTION */}
      {/* ------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="size-5" />
            Completion Distribution
          </CardTitle>
        </CardHeader>

        <CardContent>
          <ChartContainer config={pieConfig} className="min-h-[260px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />

              <Pie
                data={trackerProgress}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {trackerProgress.map((entry: any, index: any) => (
                  <Cell key={index} fill={pieConfig[entry.name].color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------ */}
      {/* TIMELINE SECTION */}
      {/* ------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {timeline.map((t: any, i: any) => (
              <div key={i} className="flex gap-4">
                <div className="w-32 text-sm text-zinc-500">{t.date}</div>
                <div className="flex-1">{t.event}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------ */}
      {/* ATTACHMENTS */}
      {/* ------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="size-5" />
            Supporting Documents
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-zinc-500">Uploaded by field teams</p>

            <div className="flex flex-col gap-2">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-2 border rounded-lg"
                >
                  <span>{a.file}</span>
                  <Button size="sm" variant="outline">
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
