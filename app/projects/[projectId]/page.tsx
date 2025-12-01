// app/projects/[projectId]/page.tsx

import {
  ArrowLeftIcon,
  BarChart3Icon,
  CalendarIcon,
  CheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  ZapIcon,
  GroupIcon,
  ArrowUpRightIcon,
} from "lucide-react";

import Link from "next/link";

import { ProjectAnalytics } from "@/components/projects/ProjectAnalytics";
import { ProjectCalendar } from "@/components/projects/ProjectCalendar";

import ProjectChecklistClient from "@/components/projects/ProjectChecklistClient";

import { getProjectById, getTrackers } from "@/lib/actions/actions";
import { getChecklist } from "@/lib/actions/projectActions";
import { ProjectTrackers } from "@/components/projects/ProjectTrackers";
import ProjectMembers from "@/components/projects/ProjectMembers";
import ProjectChecklist from "@/components/projects/ProjectChecklist";

export default async function ProjectDetail(props: {
  searchParams?: Promise<{ tab?: string }>;
  params?: Promise<{ projectId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const projectId = params?.projectId || "";
  const tab = searchParams?.tab || "checklist";

  const p = await getProjectById(projectId);
  const trackers = await getTrackers(projectId);
  const checklist = await getChecklist(projectId);

  const completedChecklistItems = checklist.items.filter(
    (i) => i.parameterId,
  ).length;
  const totalChecklistItems = checklist.items.length;

  const statusColors = {
    PLANNING: "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-200",
    ACTIVE:
      "bg-emerald-200 text-emerald-900 dark:bg-emerald-500 dark:text-emerald-900",
    ON_HOLD:
      "bg-amber-200 text-amber-900 dark:bg-amber-500 dark:text-amber-900",
    COMPLETED: "bg-blue-200 text-blue-900 dark:bg-blue-500 dark:text-blue-900",
    CANCELLED: "bg-red-200 text-red-900 dark:bg-red-500 dark:text-red-900",
  };

  if (!p) {
    return (
      <div className="p-6 text-center text-zinc-900 dark:text-zinc-200">
        <p className="text-3xl md:text-5xl mt-40 mb-10">Project not found</p>
        <Link
          href="/projects"
          className="mt-4 inline-block px-4 py-2 rounded bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  // PHASE PROGRESS BAR
  const stageOrder = [
    "initialization",
    "checklist",
    "tracking",
    "completed",
    "evaluation",
  ];
  const currentStageIndex = stageOrder.indexOf(p.stage || "initialization");

  return (
    <div className="mt-10 space-y-5 max-w-6xl mx-auto text-zinc-900 dark:text-white px-6 pt-20 lg:pt-6">
      {/* HEADER */}
      <div className="flex max-md:flex-col gap-4 flex-wrap items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="p-1 rounded hover:bg-zinc-200
            dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium">{p.name}</h1>
            <span
              className={`px-2 py-1 rounded text-xs capitalize ${
                statusColors[p.status]
              }`}
            >
              {p.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* STAGE PROGRESS BAR */}
      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded">
        <div
          className="h-2 bg-blue-500 rounded transition-all"
          style={{
            width: `${(currentStageIndex + 1) * 20}%`,
          }}
        ></div>
      </div>

      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
        {stageOrder.map((stage, i) => (
          <span
            key={i}
            className={
              i <= currentStageIndex ? "font-semibold text-blue-500" : ""
            }
          >
            {stage}
          </span>
        ))}
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 sm:flex flex-wrap gap-6">
        {[
          {
            label: "Filled Trackers",
            value: trackers.length,
            color: "text-blue-700 dark:text-blue-400",
          },
          {
            label: "Checklist Completed",
            value: `${completedChecklistItems}/${totalChecklistItems}`,
            color: "text-emerald-700 dark:text-emerald-400",
          },
          {
            label: "Project Stage",
            value: p.stage || "initialization",
            color: "text-amber-700 dark:text-amber-400",
          },
          {
            label: "Team Members",
            value: p.members?.length || 0,
            color: "text-purple-700 dark:text-purple-400",
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50
            border border-zinc-200 dark:border-zinc-800
            flex justify-between sm:min-w-60 p-4 py-2.5 rounded"
          >
            <div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {card.label}
              </div>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </div>
            <ZapIcon className={`size-4 ${card.color}`} />
          </div>
        ))}
      </div>

      {/* TABS */}
      <div>
        <div className="inline-flex flex-wrap max-sm:grid grid-cols-3 gap-2 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
          {[
            { key: "checklist", label: "Checklist", icon: CheckIcon },
            { key: "trackers", label: "Trackers", icon: ClipboardListIcon },
            { key: "calendar", label: "Calendar", icon: CalendarIcon },
            { key: "analytics", label: "Analytics", icon: BarChart3Icon },
            { key: "members", label: "Members", icon: GroupIcon },
          ].map((tabItem) => (
            <Link
              key={tabItem.key}
              href={`/projects/${projectId}?tab=${tabItem.key}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-all ${
                tab === tabItem.key
                  ? "bg-zinc-100 dark:bg-zinc-800/80"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              <tabItem.icon className="size-3.5" />
              {tabItem.label}
            </Link>
          ))}

          {/* SPECIAL REPORTS TAB */}
          <Link
            href={`/projects/${projectId}/reports`}
            className="flex items-center gap-2 px-4 py-2 text-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            <FileTextIcon className="size-3.5" />
            Reports
            {/* Indicator that it opens a separate page */}
            <ArrowUpRightIcon className="size-3.5 opacity-60" />
          </Link>
          <Link
            href={`/projects/${projectId}/evaluation`}
            className="flex items-center gap-2 px-4 py-2 text-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            <FileTextIcon className="size-3.5" />
            Evaluation
            {/* Indicator that it opens a separate page */}
            <ArrowUpRightIcon className="size-3.5 opacity-60" />
          </Link>
        </div>

        {/* TAB CONTENT */}
        <div className="mt-6">
          {tab === "checklist" && <ProjectChecklistClient projectId={p.id} />}
          {tab === "trackers" && (
            <ProjectTrackers projectId={p.id} trackers={trackers} />
          )}
          {tab === "calendar" && <ProjectCalendar projectId={p.id} />}
          {tab === "analytics" && <ProjectAnalytics projectId={p.id} />}
          {tab === "reports" && <ProjectReports projectId={p.id} />}
          {tab === "members" && <ProjectMembers projectId={p.id} />}
        </div>
      </div>
    </div>
  );
}
