// File: app/projects/[projectId]/checklist/review/page.tsx
import {
  getChecklistForProject,
  getStandardParams,
} from "@/lib/actions/actions";
import { getProjectById } from "@/lib/actions/projectActions";
import React from "react";

export default async function ChecklistReview({
  params,
}: {
  params: { projectId: string };
}) {
  const project = await getProjectById(params.projectId);
  const checklist = await getChecklistForProject(params.projectId);
  const paramsList = await getStandardParams();

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-semibold">M&E Review Checklist</h2>
      <p className="text-sm text-muted-foreground">Project: {project?.name}</p>

      <div className="mt-4 space-y-2">
        {checklist.items.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No checklist items yet
          </div>
        )}
        {checklist.items.map((it: any) => (
          <div
            key={it.parameterId}
            className="border rounded p-3 flex justify-between"
          >
            <div>
              {paramsList.find((p: any) => p.id === it.parameterId)?.label}
            </div>
            <div>Weight: {it.weight}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn">Suggest Edit</button>
        <button className="btn-outline">Approve & Finalize</button>
      </div>
    </div>
  );
}
