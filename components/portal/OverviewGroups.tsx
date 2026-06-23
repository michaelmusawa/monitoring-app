// components/portal/OverviewGroups.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Building2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { OverviewGroup } from "@/lib/actions/publicActions";
import ProjectMiniCard from "./ProjectMiniCard";
// extract from existing ProjectList

export default function OverviewGroups({
  groups,
  groupBy,
}: {
  groups: OverviewGroup[];
  groupBy: "org" | "location";
}) {
  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <CollapsibleGroup key={group.name} group={group} groupBy={groupBy} />
      ))}
    </div>
  );
}

function CollapsibleGroup({
  group,
  groupBy,
}: {
  group: OverviewGroup;
  groupBy: "org" | "location";
}) {
  const [open, setOpen] = useState(false);

  // Link that sets the filter for this group
  const filterParam = groupBy === "org" ? "sector" : "subCounty";
  const href = `/portal/projects?${filterParam}=${encodeURIComponent(group.name)}`;

  return (
    <details
      className="group/cat"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="list-none cursor-pointer">
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 hover:shadow-md transition-all">
          <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-50 border">
                {group.totalProjects} project
                {group.totalProjects !== 1 ? "s" : ""}
              </span>
              <span className="text-xs text-zinc-500">
                Budget: KES {group.totalBudget.toLocaleString()}
              </span>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
              {group.name}
            </h3>
            <div className="mt-2 text-xs text-zinc-500">
              Avg progress: {group.avgProgress.toFixed(1)}%
            </div>
            {group.totalProjects > 5 && (
              <Link
                href={href}
                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
              >
                View all {group.totalProjects} projects →
              </Link>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400 mt-1 group-open/cat:rotate-180 transition-transform" />
        </div>
      </summary>
      <div className="border border-t-0 border-zinc-200 rounded-b-2xl bg-zinc-50/50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {group.projects.map((p) => (
            <ProjectMiniCard key={p.id} project={p} />
          ))}
        </div>
        {group.totalProjects > 5 && (
          <div className="text-center mt-3">
            <Link href={href} className="text-sm text-blue-600 hover:underline">
              Show all {group.totalProjects} projects
            </Link>
          </div>
        )}
      </div>
    </details>
  );
}
