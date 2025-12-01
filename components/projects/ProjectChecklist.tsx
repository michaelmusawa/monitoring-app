/**
 * Server-rendered ProjectChecklist
 *
 * Converted to a server component to fetch checklist data and standard params
 * using server actions. Interactive creation/editing flows are delegated to
 * dedicated client pages (create / weights / review) to avoid calling server
 * actions directly from a client component.
 *
 * This component renders the checklist if present and includes links to the
 * existing interactive pages:
 * - /projects/[projectId]/checklist/create
 * - /projects/[projectId]/checklist/weights
 * - /projects/[projectId]/checklist/weights-review
 * - /projects/[projectId]/checklist/finalized
 *
 * If you prefer client-side interactivity instead, create a small client
 * subcomponent and call an API route (e.g., /api/projects/[id]/checklist) to
 * perform saves. That approach is outlined in the project but is implemented
 * separately.
 */

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getChecklistForProject,
  getStandardParams,
} from "@/lib/actions/actions";

type ChecklistItem = {
  parameterId: string;
  weight: number;
};

type Checklist = {
  id: string;
  projectId: string;
  // Relaxed to string to match shared types returned by server helpers
  status: string;
  items: ChecklistItem[];
  draftReviewComments?: {
    reviewer: string;
    accepted: boolean;
    reason?: string;
  };
  weightsReviewComments?: {
    reviewer: string;
    accepted: boolean;
    reason?: string;
  };
};

type StandardParam = {
  id: string;
  label: string;
  category: string;
};

export default async function ProjectChecklist({
  projectId,
}: {
  projectId: string;
}) {
  // Server-side fetch checklist and params
  const checklist: Checklist = await getChecklistForProject(projectId);
  const standardParams: StandardParam[] = await getStandardParams();

  // Helper: render status bar
  const renderStatusBar = (status: Checklist["status"]) => {
    const stages: Checklist["status"][] = [
      "Draft",
      "DraftReview",
      "WeightsAssignment",
      "WeightsReview",
      "Approved",
    ];
    return (
      <div className="flex items-center gap-2 mb-3">
        {stages.map((s, idx) => (
          <div key={s} className="flex-1">
            <div
              className={`h-2 rounded ${
                stages.indexOf(status) >= idx
                  ? "bg-green-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
            <p className="text-xs text-center mt-1">{s}</p>
          </div>
        ))}
      </div>
    );
  };

  // If there are checklist items, group them by category and render
  if (checklist && checklist.items && checklist.items.length > 0) {
    const categoryMap: Record<
      string,
      { id: string; label: string; weight: number }[]
    > = {};

    checklist.items.forEach((it) => {
      const param = standardParams.find((p) => p.id === it.parameterId);
      if (!param) return;
      if (!categoryMap[param.category]) categoryMap[param.category] = [];
      categoryMap[param.category].push({
        id: param.id,
        label: param.label,
        weight: it.weight,
      });
    });

    Object.values(categoryMap).forEach((arr) =>
      arr.sort((a, b) =>
        a.id.localeCompare(b.id, undefined, { numeric: true }),
      ),
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStatusBar(checklist.status)}
          {Object.entries(categoryMap).map(([category, items]) => (
            <div key={category} className="mb-4">
              <h3 className="text-md font-semibold text-blue-700 mb-2">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex justify-between border rounded p-2"
                  >
                    <span>
                      {it.id} {it.label}
                    </span>
                    <span className="text-xs">Weight: {it.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-4 flex gap-2">
            {/* Provide links to interactive pages where users can make changes */}
            {checklist.status === "Draft" && (
              <Link
                href={`/projects/${projectId}/checklist/weights`}
                className="btn"
              >
                Assign Weights
              </Link>
            )}

            {checklist.status === "WeightsAssignment" && (
              <Link
                href={`/projects/${projectId}/checklist/weights-review`}
                className="btn"
              >
                Review Weights
              </Link>
            )}

            {checklist.status === "Approved" && (
              <Link
                href={`/projects/${projectId}/checklist/finalized`}
                className="btn"
              >
                View Finalized Checklist
              </Link>
            )}

            {/* Fallback: open the create/edit page */}
            <Link
              href={`/projects/${projectId}/checklist/create`}
              className="btn-outline"
            >
              Edit / Recreate Checklist
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No checklist items → show create flow link
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          This project has no checklist yet. Use the create page to build a
          checklist and assign weights.
        </div>
        <div className="flex gap-2">
          <Link
            href={`/projects/${projectId}/checklist/create`}
            className="btn"
          >
            Create Checklist
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
