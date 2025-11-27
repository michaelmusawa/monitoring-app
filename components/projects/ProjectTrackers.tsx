// components/projects/ProjectTrackers.tsx

import Link from "next/link";
import { Button } from "../ui/button";
import { CheckIcon } from "lucide-react";

export function ProjectTrackers({
  projectId,
  trackers,
  projectProgress,
}: {
  projectId: string;
  projectProgress: number; // project.progress from cidpProjects
  trackers: Array<{
    id: string;
    title: string;
    submittedBy: string;
    submittedAt: string;
    overallPercent: number;
  }>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-lg font-semibold">Project Trackers</h2>

        <Button size="sm">
          <CheckIcon className="size-4 mr-2" />
          Mark project complete
        </Button>
      </div>

      <div className="grid gap-4">
        {trackers.map((tr) => {
          const trackerShare =
            projectProgress > 0
              ? ((tr.overallPercent / projectProgress) * 100).toFixed(1)
              : "0";

          return (
            <Link
              key={tr.id}
              href={`/projects/${projectId}/trackers/${tr.id}`}
              className="block p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-medium text-base">{tr.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Submitted by{" "}
                    <span className="font-medium">{tr.submittedBy}</span> on{" "}
                    {new Date(tr.submittedAt).toLocaleDateString()}
                  </p>

                  <p className="text-sm font-medium">
                    Overall Progress:{" "}
                    <span className="text-blue-600">{tr.overallPercent}%</span>
                  </p>

                  <p className="text-xs text-zinc-500">
                    Represents{" "}
                    <span className="text-blue-500 font-medium">
                      {trackerShare}%
                    </span>{" "}
                    of total project progress
                  </p>
                </div>

                <div className="w-32 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${tr.overallPercent}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
