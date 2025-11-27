// File: app/projects/[projectId]/tracker/history/page.tsx
import React from "react";
import { getTrackers } from "../../actions/projectActions";

export default async function TrackerHistory({ params }: any) {
  const trackers = await getTrackers(params.projectId);

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Tracker History</h2>
      <div className="mt-4 space-y-2">
        {trackers.map((t) => (
          <div key={t.id} className="border p-3 rounded flex justify-between">
            <div>Submitted: {new Date(t.submittedAt).toLocaleString()}</div>
            <div>Overall: {t.overallPercent}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
