// app/projects/[projectId]/reports/page.tsx

import ReportsClient from "@/components/reports/ReportsPage";
import {
  getReportSummary,
  getTrackerProgress,
  getTimeline,
  getAttachments,
} from "@/lib/actions/migrated/getReportData";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // Fetch dummy data from migrated server actions (already imported at top)
  const summary = await getReportSummary();
  const trackerProgress = await getTrackerProgress();
  const timeline = await getTimeline();
  const attachments = await getAttachments();

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
