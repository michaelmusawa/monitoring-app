"use client";

import {
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import type { PublicProject } from "@/lib/actions/publicActions";
import { Card, CardContent } from "@/components/ui/card";

function formatCurrency(value: number) {
  if (value >= 1e9) return `KES ${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `KES ${(value / 1e6).toFixed(1)}M`;
  return `KES ${value.toLocaleString()}`;
}

export default function SummaryCards({
  projects,
}: {
  projects: PublicProject[];
}) {
  const total = projects.length;
  const active = projects.filter((p) => p.status === "ACTIVE").length;
  const pending = projects.filter((p) => p.status === "PENDING").length;
  const completed = projects.filter((p) => p.status === "COMPLETED").length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;

  const avgProgress = total
    ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / total
    : 0;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const subCounties = new Set(projects.map((p) => p.subCounty).filter(Boolean))
    .size;

  const cards = [
    {
      title: "Total Projects",
      value: total,
      icon: Briefcase,
      color: "bg-blue-50 dark:bg-blue-950",
      border: "border-l-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Active",
      value: active,
      icon: CheckCircle,
      color: "bg-emerald-50 dark:bg-emerald-950",
      border: "border-l-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Pending",
      value: pending,
      icon: Clock,
      color: "bg-amber-50 dark:bg-amber-950",
      border: "border-l-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Avg. Progress",
      value: `${avgProgress.toFixed(1)}%`,
      icon: TrendingUp,
      color: "bg-indigo-50 dark:bg-indigo-950",
      border: "border-l-indigo-500",
      textColor: "text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Total Budget",
      value: formatCurrency(totalBudget),
      icon: DollarSign,
      color: "bg-violet-50 dark:bg-violet-950",
      border: "border-l-violet-500",
      textColor: "text-violet-600 dark:text-violet-400",
    },
    {
      title: "Sub‑counties",
      value: subCounties,
      icon: MapPin,
      color: "bg-rose-50 dark:bg-rose-950",
      border: "border-l-rose-500",
      textColor: "text-rose-600 dark:text-rose-400",
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      icon: CheckCircle2,
      color: "bg-teal-50 dark:bg-teal-950",
      border: "border-l-teal-500",
      textColor: "text-teal-600 dark:text-teal-400",
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Overview based on {projects.length} project
        {projects.length !== 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className={`border-l-4 ${card.border} shadow-md hover:shadow-lg transition-shadow`}
          >
            <CardContent className="p-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.title}
                </p>
                <p className="mt-1.5 text-2xl font-bold tracking-tight">
                  {card.value}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className={`h-5 w-5 ${card.textColor}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
