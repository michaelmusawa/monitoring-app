import { TrackerForm } from "@/components/trackers/TrackerForm";
import { getTrackerById } from "@/lib/actions/projectActions";

export default async function EditTrackerPage(props: {
  params?: Promise<{ projectId: string; trackerId: string }>;
}) {
  const params = await props.params;
  const trackerId = params?.trackerId || "";
  const projectId = params?.projectId || "";
  const tracker = await getTrackerById(projectId, trackerId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <h1 className="text-2xl font-semibold">Edit Tracker</h1>
      <TrackerForm
        projectId={projectId}
        tracker={{
          ...tracker,
          challenges: tracker.challenges || "",
          recommendations: tracker.recommendations || "",
          attachments: tracker.attachments || null,
        }}
      />
    </div>
  );
}
