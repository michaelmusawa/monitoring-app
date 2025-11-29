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
  // group checklist items by parameter category
  const categoryMap: Record<string, { id: string, label: string, weight: number }[]> = {};
  checklist.items.forEach((it: any) => {
    const param = paramsList.find((p: any) => p.id === it.parameterId);
    if (!param) return;
    if (!categoryMap[param.category]) categoryMap[param.category] = [];
    categoryMap[param.category].push({ id: param.id, label: param.label, weight: it.weight });
  });
  Object.values(categoryMap).forEach(arr => arr.sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true})));
  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-semibold">M&E Review Checklist</h2>
      <p className="text-sm text-muted-foreground">Project: {project?.name}</p>

      <div className="mt-4">
        {Object.keys(categoryMap).length === 0 && (
          <div className="text-sm text-muted-foreground">No checklist items yet</div>
        )}
        {Object.entries(categoryMap).map(([category, items]) => (
          <div key={category} className="mb-4">
            <h3 className="text-md font-semibold text-blue-700 mb-2">{category}</h3>
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between border rounded p-2">
                  <span>{it.id} {it.label}</span>
                  <span className="text-xs">Weight: {it.weight}</span>
                </div>
              ))}
            </div>
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
