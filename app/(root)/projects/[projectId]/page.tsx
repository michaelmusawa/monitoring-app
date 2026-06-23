// app/(root)/projects/[projectId]/page.tsx
import {
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  ArrowUpRightIcon,
  UsersIcon,
  MessageSquareIcon,
  TrendingUpIcon,
  LayersIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  BarChart3Icon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";

import PublicComments from "@/components/projects/PublicComments";
import { ProjectCalendar } from "@/components/projects/ProjectCalendar";
import ProjectChecklistClient from "@/components/projects/ProjectChecklistClient";
import { ProjectTrackers } from "@/components/projects/ProjectTrackers";
import ProjectMembers from "@/components/projects/ProjectMembers";
import { getProject } from "@/lib/actions/projectActions";
import {
  getChecklist,
  getTemplateBySector,
} from "@/lib/actions/checklistActions";
import { getTrackerSubmissions } from "@/lib/actions/trackerActions";
import { getUser } from "@/lib/actions/usersActions";
import { getUserPermissions } from "@/lib/actions/adminActions";
import { Button } from "@/components/ui/button";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  ONGOING: {
    label: "Ongoing",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  },
  STALLED: {
    label: "Stalled",
    dot: "bg-violet-400",
    badge:
      "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-blue-500",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  },
  TERMINATED: {
    label: "Terminated",
    dot: "bg-red-400",
    badge:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
  },
  NOT_STARTED: {
    label: "Not Started",
    dot: "bg-yellow-400",
    badge:
      "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-800",
  },
};

const STAGES = [
  { id: "initialization", label: "Init", full: "Initialization" },
  { id: "checklist", label: "Checklist", full: "Checklist" },
  { id: "tracking", label: "Tracking", full: "Tracking" },
  { id: "completed", label: "Completed", full: "Completed" },
  { id: "evaluation", label: "Evaluation", full: "Evaluation" },
];

function getStageFromChecklist(status: string): string {
  switch (status) {
    case "Draft":
    case "DraftReview":
    case "WeightsAssignment":
    case "WeightsReview":
      return "checklist";
    case "Approved":
      return "tracking";
    case "Completed":
      return "completed";
    default:
      return "initialization";
  }
}

const CHECKLIST_PHASE_LABEL: Record<string, string> = {
  Draft: "Draft",
  DraftReview: "Draft Review",
  WeightsAssignment: "Weights",
  WeightsReview: "Wt. Review",
  Approved: "Approved",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProjectDetail(props: {
  searchParams?: Promise<{ tab?: string }>;
  params?: Promise<{ projectId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const projectId = params?.projectId || "";
  const tab = searchParams?.tab || "checklist";

  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const userPermissions = user?.id ? await getUserPermissions(user.id) : [];

  const project = await getProject(projectId);
  if (!project) notFound();

  const checklist = await getChecklist(projectId);
  const template = await getTemplateBySector(project?.sector ?? "");

  const standardParams = template.flatMap((cat: any) =>
    cat.tasks.map((task: any) => ({
      id: task.id,
      label: task.label,
      category: cat.name,
      description: task.description || "",
    })),
  );

  const selectedItems = checklist?.items.filter((i) => i.weight > 0) ?? [];
  const totalChecklistItems = standardParams.length;
  const currentStage = getStageFromChecklist(checklist?.status || "");
  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);

  const hasApprovedChecklist = checklist?.status === "Approved";
  const submissions = await getTrackerSubmissions(projectId);

  // Sort by date descending so the most recent submission is first
  const sortedSubmissions = [...submissions].sort(
    (a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
  const latestSubmission = sortedSubmissions[0] ?? null;
  const overallProgress = latestSubmission?.overallPercent ?? 0;

  const checklistItemsForWorkplan = selectedItems.map((i) => ({
    parameterId: i.parameterId,
    label: i.label,
    category: i.category,
    weight: i.weight,
  }));

  const statusMeta =
    STATUS_META[project?.status ?? ""] ?? STATUS_META.NOT_STARTED;
  const checklistPhaseLabel =
    CHECKLIST_PHASE_LABEL[checklist?.status ?? ""] ?? "—";

  const mainTabs = [
    { key: "checklist", label: "Checklist", icon: CheckIcon },
    { key: "trackers", label: "Trackers", icon: BarChart3Icon },
    { key: "calendar", label: "Calendar", icon: CalendarIcon },
    { key: "comments", label: "Comments", icon: MessageSquareIcon },
    { key: "members", label: "Members", icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 pt-20 lg:pt-8 space-y-0">
        {/* Back nav */}
        <div className="py-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            All projects
          </Link>
        </div>

        {/* Header */}
        <div className="py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight leading-none">
                  {project.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusMeta.badge}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot} animate-pulse`}
                  />
                  {statusMeta.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <LayersIcon className="w-3.5 h-3.5" />
                  {project.sector}
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className="flex items-center gap-1.5">
                  <CircleDotIcon className="w-3.5 h-3.5" />
                  {checklistPhaseLabel}
                </span>
                {submissions.length > 0 && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="flex items-center gap-1.5">
                      <TrendingUpIcon className="w-3.5 h-3.5" />
                      {overallProgress.toFixed(1)}% progress
                    </span>
                  </>
                )}
              </div>
            </div>
            <div>
              <Link href={`/projects/${project.id}/edit`}>
                <Button variant="outline" size="sm">
                  Edit Project
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stage progress */}
        <div className="py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <div className="absolute top-[13px] left-0 right-0 h-px bg-zinc-200 dark:bg-zinc-800" />
            <div
              className="absolute top-[13px] left-0 h-px bg-zinc-900 dark:bg-zinc-200 transition-all duration-700"
              style={{
                width:
                  currentStageIndex >= 0
                    ? `${(currentStageIndex / (STAGES.length - 1)) * 100}%`
                    : "0%",
              }}
            />
            <div className="relative flex justify-between">
              {STAGES.map((stage, i) => {
                const isDone = i < currentStageIndex;
                const isCurrent = i === currentStageIndex;
                return (
                  <div
                    key={stage.id}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={`
                        w-[26px] h-[26px] rounded-full flex items-center justify-center
                        border-2 transition-all duration-300 z-10
                        ${isDone ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100" : ""}
                        ${isCurrent ? "bg-white dark:bg-zinc-950 border-zinc-900 dark:border-zinc-100 ring-4 ring-zinc-900/10 dark:ring-zinc-100/10" : ""}
                        ${!isDone && !isCurrent ? "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700" : ""}
                      `}
                    >
                      {isDone ? (
                        <CheckIcon className="w-3 h-3 text-white dark:text-zinc-900" />
                      ) : isCurrent ? (
                        <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                      ) : null}
                    </div>
                    <span
                      className={`
                        text-[11px] font-medium hidden sm:block
                        ${isDone || isCurrent ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400 dark:text-zinc-600"}
                        ${isCurrent ? "font-semibold text-zinc-900 dark:text-white" : ""}
                      `}
                    >
                      {stage.full}
                    </span>
                    <span
                      className={`
                        text-[11px] font-medium sm:hidden
                        ${isCurrent ? "text-zinc-900 dark:text-white font-semibold" : "text-zinc-300 dark:text-zinc-700"}
                      `}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="py-5 grid grid-cols-2 lg:grid-cols-4 gap-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Submissions
              </span>
              <ClipboardListIcon className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {submissions.length}
            </div>
            <div className="text-xs text-zinc-400">
              {submissions.length === 0
                ? "No trackers yet"
                : `Latest: ${new Date(latestSubmission!.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Checklist
              </span>
              <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {selectedItems.length}
              <span className="text-sm font-normal text-zinc-400 ml-1">
                / {totalChecklistItems}
              </span>
            </div>
            <div className="text-xs text-zinc-400">items selected</div>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Progress
              </span>
              <TrendingUpIcon className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {overallProgress.toFixed(0)}
              <span className="text-sm font-normal text-zinc-400">%</span>
            </div>
            <div className="w-full h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-700"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Stage
              </span>
              <ClockIcon className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div className="text-lg font-bold capitalize text-violet-600 dark:text-violet-400 leading-tight">
              {currentStage}
            </div>
            <div className="text-xs text-zinc-400">
              Step {currentStageIndex + 1} of {STAGES.length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="pt-4">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none border-b border-zinc-200 dark:border-zinc-800 pb-0">
            {mainTabs.map((tabItem) => {
              const isActive = tab === tabItem.key;
              return (
                <Link
                  key={tabItem.key}
                  href={`/projects/${projectId}?tab=${tabItem.key}`}
                  className={`
                    inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium
                    whitespace-nowrap border-b-2 -mb-px transition-all
                    ${
                      isActive
                        ? "border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100"
                        : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                    }
                  `}
                >
                  <tabItem.icon className="w-3.5 h-3.5" />
                  {tabItem.label}
                </Link>
              );
            })}
            <div className="flex-1 min-w-4" />
            <Link
              href={`/projects/${projectId}/reports`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 border-transparent -mb-px text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
            >
              <FileTextIcon className="w-3.5 h-3.5" />
              Reports
              <ArrowUpRightIcon className="w-3 h-3 opacity-40" />
            </Link>
            {userPermissions.includes("checklist:evaluation") && (
              <Link
                href={`/projects/${projectId}/evaluation`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 border-transparent -mb-px text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
              >
                <FileTextIcon className="w-3.5 h-3.5" />
                Evaluation
                <ArrowUpRightIcon className="w-3 h-3 opacity-40" />
              </Link>
            )}
          </div>

          <div className="pt-6">
            {tab === "checklist" && (
              <ProjectChecklistClient
                projectId={project.id}
                checklist={checklist}
                standardParams={standardParams}
                userPermissions={userPermissions}
              />
            )}
            {tab === "trackers" && (
              <ProjectTrackers
                projectId={project.id}
                submissions={submissions}
                hasApprovedChecklist={hasApprovedChecklist}
                userPermissions={userPermissions}
              />
            )}
            {tab === "calendar" && (
              <ProjectCalendar
                projectId={project.id}
                checklistStatus={checklist?.status ?? "Draft"}
                userPermissions={userPermissions}
                checklistItems={checklistItemsForWorkplan}
              />
            )}
            {tab === "comments" && <PublicComments projectId={project.id} />}
            {tab === "members" && <ProjectMembers projectId={project.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}
