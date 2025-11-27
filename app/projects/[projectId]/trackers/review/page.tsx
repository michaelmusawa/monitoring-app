// File: app/projects/[projectId]/tracker/review/page.tsx
import React from "react";
import { getTrackers, getProjectById } from "../../actions/projectActions";

export default async function TrackerReview({ params }: any) {
  const project = await getProjectById(params.projectId);
  const trackers = await getTrackers(params.projectId);

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-semibold">M&E Review Trackers</h2>
      <p className="text-sm text-muted-foreground">Project: {project?.name}</p>

      <div className="mt-4 space-y-3">
        {trackers.map((t: any) => (
          <div key={t.id} className="border rounded p-3">
            <div className="flex justify-between items-center">
              <div>Submitted: {new Date(t.submittedAt).toLocaleString()}</div>
              <div className="font-medium">Overall: {t.overallPercent}%</div>
            </div>
            <div className="mt-2 grid gap-2">
              {t.items.map((it: any) => (
                <div key={it.parameterId} className="p-2 border rounded">
                  <div className="font-medium">{it.parameterId}</div>
                  <div>
                    Status: {it.status} • {it.percentComplete}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Challenges: {it.challenges}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <button className="btn">Suggest Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
