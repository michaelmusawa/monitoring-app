// app/projects/[projectId]/reports/page.tsx

import ReportsClient from "@/components/reports/ReportsPage";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // Dummy data for now — replace with DB query
  const summary = {
    completedTrackers: 8,
    totalTrackers: 12,
    lastUpdated: "2025-01-14 09:34 AM",
    completionRate: 67,
  };

  const trackerProgress = [
    { name: "Foundation", value: 100 },
    { name: "Walls", value: 85 },
    { name: "Roofing", value: 70 },
    { name: "Finishing", value: 40 },
    { name: "Inspection", value: 20 },
  ];

  const timeline = [
    { date: "2025-01-02", event: "Foundation completed" },
    { date: "2025-01-05", event: "Walls reached 85%" },
    { date: "2025-01-10", event: "Roofing started" },
    { date: "2025-01-14", event: "Team submitted weekly report" },
  ];

  const attachments = [
    { file: "evidence-photo-1.jpg" },
    { file: "weekly-report-Jan10.pdf" },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <ReportsClient
        projectId={projectId}
        summary={summary}
        trackerProgress={trackerProgress}
        timeline={timeline}
        attachments={attachments}
      />
    </div>
  );
}
