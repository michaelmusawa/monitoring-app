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

import { projects } from "@/lib/data/data";
import {
  getEvaluationStats,
  getCompletedStages,
} from "@/lib/data/evaluationData";
import EvaluationCategory from "@/components/evaluation/EvaluationCategory";

export default async function EvaluationPage(props: {
  params?: Promise<{ projectId?: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const projectId = params?.projectId || "";
  const tab = searchParams?.tab || "relevance";

  // Get project from static data
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="p-10 text-center">
        <p className="text-3xl mt-20">Project not found</p>
        <Link
          className="mt-4 inline-block bg-zinc-300 px-4 py-2 rounded hover:bg-zinc-400 transition-colors"
          href="/projects"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  // Get evaluation data from static data
  const evaluationStages = [
    "relevance",
    "coherence",
    "effectiveness",
    "efficiency",
    "impact",
    "sustainability",
  ];

  const completedStages = getCompletedStages(projectId);
  const completedCount = completedStages.length;
  const completionPercent = (completedCount / evaluationStages.length) * 100;

  const stats = getEvaluationStats(projectId);

  return (
    <div className="mt-10 space-y-5 max-w-6xl mx-auto text-zinc-900 dark:text-white px-6 pt-20 lg:pt-6">
      {/* HEADER */}
      <div className="flex max-md:flex-col items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="p-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>

          <div>
            <h1 className="text-xl font-medium">Evaluation – {project.name}</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Survey & questionnaire analysis for completed project
            </p>
          </div>
        </div>

        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          <span className="font-medium">Sector:</span> {project.sector} •
          <span className="font-medium ml-2">Status:</span> {project.status} •
          <span className="font-medium ml-2">Progress:</span> {project.progress}
          %
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded overflow-hidden">
        <div
          className="h-2 bg-blue-500 transition-all duration-500"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
        {evaluationStages.map((stage) => (
          <span
            key={stage}
            className={`transition-colors ${
              completedStages.includes(stage)
                ? "font-bold text-blue-500 dark:text-blue-400"
                : ""
            }`}
          >
            {stage.charAt(0).toUpperCase() + stage.slice(1)}
          </span>
        ))}
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s, i) => {
          const iconMap = {
            ClipboardListIcon,
            BarChart3Icon,
            PieChartIcon,
            GaugeIcon,
            FileTextIcon,
            ListChecksIcon,
          } as const;

          const IconComp =
            iconMap[s.icon as keyof typeof iconMap] || BarChart3Icon;

          return (
            <div
              key={`${s.label}-${i}`}
              className="border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/60 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    {s.label}
                  </p>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <IconComp className={`size-5 ${s.color} opacity-80`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* TABS */}
      <div className="mt-8">
        <div className="inline-flex flex-wrap max-sm:grid grid-cols-3 gap-2 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900/50 p-1">
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
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded transition-all ${
                tab === t.key
                  ? "bg-white dark:bg-zinc-800 shadow-sm"
                  : "hover:bg-white/50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </Link>
          ))}

          {/* Final Evaluation Report (external page) */}
          <Link
            href={`/projects/${projectId}/evaluation/report`}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded hover:bg-white/50 dark:hover:bg-zinc-800/50 transition-colors"
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
