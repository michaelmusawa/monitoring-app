// File: app/projects/[projectId]/trackers/[trackerId]/page.tsx

import { getProjectById, getTrackers } from "@/lib/actions/projectActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function TrackerDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; trackerId: string }>;
}) {
  const { projectId, trackerId } = await params;

  const project = await getProjectById(projectId);
  if (!project) return <div className="p-6">Project not found.</div>;

  const trackers = await getTrackers(projectId);
  const tracker = trackers.find((t) => t.id === trackerId);

  if (!tracker) return <div className="p-6">Tracker record not found.</div>;

  const contribution =
    project.progress > 0
      ? ((tracker.overallPercent / project.progress) * 100).toFixed(1)
      : "0";

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Link
        href={`/projects/${projectId}/trackers/${trackerId}/edit`}
        className="p-1 rounded hover:bg-zinc-200 
                      dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
      >
        Edit
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>{tracker.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submitted by <b>{tracker.submittedBy}</b> on{" "}
            {new Date(tracker.submittedAt).toLocaleString()}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="font-medium">Overall Completion</p>
            <div className="w-full h-3 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div
                style={{ width: `${tracker.overallPercent}%` }}
                className="h-full bg-blue-500"
              />
            </div>
            <p className="text-sm mt-1">{tracker.overallPercent}% complete</p>
          </div>

          <div>
            <p className="font-medium text-sm">
              Contribution to project lifecycle:
            </p>
            <p className="text-blue-600 font-semibold text-lg">
              {contribution}%
            </p>
          </div>

          <div className="space-y-4 mt-6">
            <p className="font-semibold">Item Breakdown</p>
            {tracker.items.map((item) => (
              <Card key={item.parameterId} className="border">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Parameter: {item.parameterId}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p>Status: {item.status}</p>
                  <p>Completion: {item.percentComplete}%</p>
                  {item.challenges && (
                    <p className="text-red-600 text-xs">
                      Challenges: {item.challenges}
                    </p>
                  )}
                  {item.recommendations && (
                    <p className="text-green-700 text-xs">
                      Recommendations: {item.recommendations}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
