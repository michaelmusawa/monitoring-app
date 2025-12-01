//monitoring-app/lib/data/migrated/migratedEvaluationStats.ts
// Dummy evaluation stats and completed stages migrated from EvaluationPage

export type EvaluationStat = {
  label: string;
  value: number;
  icon: string; // Icon name as string for portability
  color: string;
};

export const dummyEvaluationStats: EvaluationStat[] = [
  {
    label: "Responses Collected",
    value: 124,
    icon: "ClipboardListIcon",
    color: "text-blue-500",
  },
  {
    label: "Avg. Score",
    value: 82,
    icon: "BarChart3Icon",
    color: "text-green-600",
  },
  {
    label: "Completed Stages",
    value: 2,
    icon: "PieChartIcon",
    color: "text-yellow-500",
  },
];

export const dummyCompletedStages: string[] = ["relevance", "coherence"];
