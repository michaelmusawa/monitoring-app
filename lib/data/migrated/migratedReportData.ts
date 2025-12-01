//monitoring-app/lib/data/migrated/migratedReportData.ts
// Dummy report data migrated from ReportsPage (app/projects/[projectId]/reports/page.tsx)

export type ReportSummary = {
  completedTrackers: number;
  totalTrackers: number;
  lastUpdated: string;
  completionRate: number;
};

export type TrackerProgress = {
  name: string;
  value: number;
};

export type TimelineEvent = {
  date: string;
  event: string;
};

export type Attachment = {
  file: string;
};

export const dummyReportSummary: ReportSummary = {
  completedTrackers: 8,
  totalTrackers: 12,
  lastUpdated: "2025-01-14 09:34 AM",
  completionRate: 67,
};

export const dummyTrackerProgress: TrackerProgress[] = [
  { name: "Foundation", value: 100 },
  { name: "Walls", value: 85 },
  { name: "Roofing", value: 70 },
  { name: "Finishing", value: 40 },
  { name: "Inspection", value: 20 },
];

export const dummyTimeline: TimelineEvent[] = [
  { date: "2025-01-02", event: "Foundation completed" },
  { date: "2025-01-05", event: "Walls reached 85%" },
  { date: "2025-01-10", event: "Roofing started" },
  { date: "2025-01-14", event: "Team submitted weekly report" },
];

export const dummyAttachments: Attachment[] = [
  { file: "evidence-photo-1.jpg" },
  { file: "weekly-report-Jan10.pdf" },
];
