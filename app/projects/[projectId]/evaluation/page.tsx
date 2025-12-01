// app/projects/[projectId]/evaluation/page.tsx

import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  ListChecksIcon,
  FileTextIcon,
  PieChartIcon,
  BarChart3Icon,
  GaugeIcon,
  ClipboardListIcon,
} from "lucide-react";

import { getProjectById } from "@/lib/actions/actions";
import {
  getEvaluationStats,
  getCompletedStages,
} from "@/lib/actions/migrated/getEvaluationStats";

import EvaluationCategory from "@/components/evaluation/EvaluationCategory";

export default async function EvaluationPage(props: {
  params?: Promise<{ projectId?: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const projectId = params?.projectId || "";
  const tab = searchParams?.tab || "relevance";

  const p = await getProjectById(projectId);

  if (!p) {
    return (
      <div className="p-10 text-center">
        <p className="text-3xl mt-20">Project not found</p>
        <Link
          className="mt-4 inline-block bg-zinc-300 px-4 py-2 rounded"
          href="/projects"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  // -----------------------------------------
  // EVALUATION PHASE PROGRESS & STATS (from migrated server actions)
  // Note: server action imports moved to top-level for correct usage
  // -----------------------------------------

  const evaluationStages = [
    "relevance",
    "coherence",
    "effectiveness",
    "efficiency",
    "impact",
    "sustainability",
  ];

  const completedStages = await getCompletedStages();
  const completedCount = completedStages.length;
  const completionPercent = (completedCount / evaluationStages.length) * 100;

  const stats = await getEvaluationStats();

  // -----------------------------------------
  // PAGE
  // -----------------------------------------
  return (
    <div className="mt-10 space-y-5 max-w-6xl mx-auto text-zinc-900 dark:text-white px-6 pt-20 lg:pt-6">
      {/* HEADER */}
      <div className="flex max-md:flex-col items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>

          <div>
            <h1 className="text-xl font-medium">Evaluation – {p.name}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Survey & questionnaire analysis for completed project
            </p>
          </div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded">
        <div
          className="h-2 bg-blue-500 rounded"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
        {evaluationStages.map((stage, i) => (
          <span
            key={stage}
            className={
              completedStages.includes(stage) ? "font-bold text-blue-500" : ""
            }
          >
            {stage}
          </span>
        ))}
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid sm:flex flex-wrap gap-6">
        {stats.map((s, i) => {
          // map icon name strings from migrated data to actual components
          // Use a concrete component type instead of `any` to tighten typing.
          const iconMap: Record<string, typeof BarChart3Icon> = {
            ClipboardListIcon: ClipboardListIcon,
            BarChart3Icon: BarChart3Icon,
            PieChartIcon: PieChartIcon,
            GaugeIcon: GaugeIcon,
            FileTextIcon: FileTextIcon,
            ListChecksIcon: ListChecksIcon,
          };
          // narrow the key to the known icon map keys to avoid accessing with a plain string
          const iconKey = s.icon as keyof typeof iconMap;
          const IconComp = iconMap[iconKey] ?? BarChart3Icon;
          return (
            <div
              key={`${s.label}-${i}`}
              className="border border-zinc-200 dark:border-zinc-800
            dark:bg-zinc-900/60 rounded p-4 sm:min-w-60 flex justify-between"
            >
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {s.label}
                </p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
              <IconComp className={`size-4 opacity-80 ${s.color}`} />
            </div>
          );
        })}
      </div>

      {/* TABS */}
      <div>
        <div className="inline-flex flex-wrap max-sm:grid grid-cols-3 gap-2 border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
          {[
            { key: "relevance", label: "Relevance", icon: PieChartIcon },
            { key: "coherence", label: "Coherence", icon: BarChart3Icon },
            { key: "effectiveness", label: "Effectiveness", icon: GaugeIcon },
            { key: "efficiency", label: "Efficiency", icon: ListChecksIcon },
            { key: "impact", label: "Impact", icon: ClipboardListIcon },
            {
              key: "sustainability",
              label: "Sustainability",
              icon: FileTextIcon,
            },
          ].map((t) => (
            <Link
              key={t.key}
              href={`/projects/${projectId}/evaluation?tab=${t.key}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-all ${
                tab === t.key
                  ? "bg-zinc-100 dark:bg-zinc-800/80"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-700"
              }`}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </Link>
          ))}

          {/* Final Evaluation Report (external page) */}
          <Link
            href={`/projects/${projectId}/evaluation/report`}
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            <FileTextIcon className="size-3.5" />
            Final Report
            <ArrowUpRightIcon className="size-3.5 opacity-60" />
          </Link>
        </div>

        {/* TAB CONTENT */}
        <div className="mt-6">
          <EvaluationCategory projectId={projectId} category={tab} />
        </div>
      </div>
    </div>
  );
}
