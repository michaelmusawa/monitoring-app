import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface Props {
  data: {
    totalProjects: number;
    active: number;
    stalled: number;
    completed: number;
    notStarted: number;
  };
}

export default function BreakdownSummaryCards({ data }: Props) {
  const cards = [
    {
      label: "Total Projects",
      value: data.totalProjects,
      icon: Briefcase,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      border: "border-l-blue-500",
    },
    {
      label: "Active",
      value: data.active,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950",
      border: "border-l-emerald-500",
    },
    {
      label: "Stalled",
      value: data.stalled,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
      border: "border-l-red-500",
    },
    {
      label: "Completed",
      value: data.completed,
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950",
      border: "border-l-indigo-500",
    },
    {
      label: "Not Started",
      value: data.notStarted,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
      border: "border-l-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={`border-l-4 ${card.border} shadow-sm`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {card.label}
              </p>
              <p className="mt-1 text-xl font-bold">{card.value}</p>
            </div>
            <div className={`p-2 rounded-lg ${card.bg}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
