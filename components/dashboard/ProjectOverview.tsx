// components/dashboard/ProjectOverview.tsx
import React from "react";
import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";

type Project = {
  id: string;
  name: string;
  code?: string;
  sector?: string;
  description?: string;
  status?: string;
  progress?: number;
  priority?: "LOW" | "MEDIUM" | "HIGH" | string;
  members?: any[];
  end_date?: string;
};

const statusColors: Record<string, string> = {
  PLANNED: "bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200",
  PENDING: "bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200",
  ONGOING:
    "bg-emerald-200 text-emerald-800 dark:bg-emerald-500 dark:text-emerald-900",
  ACTIVE:
    "bg-emerald-200 text-emerald-800 dark:bg-emerald-500 dark:text-emerald-900",
  STALLED: "bg-amber-200 text-amber-800 dark:bg-amber-500 dark:text-amber-900",
  COMPLETED: "bg-blue-200 text-blue-800 dark:bg-blue-500 dark:text-blue-900",
  COMPLETE: "bg-blue-200 text-blue-800 dark:bg-blue-500 dark:text-blue-900",
};

const priorityColors: Record<string, string> = {
  LOW: "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400",
  MEDIUM:
    "border-amber-300 text-amber-700 dark:border-amber-500 dark:text-amber-400",
  HIGH: "border-green-300 text-green-700 dark:border-green-500 dark:text-green-400",
};

function prettyStatus(status?: string) {
  if (!status) return "Unknown";
  return status.replace("_", " ").replaceAll(/\b\w/g, (c) => c.toUpperCase());
}

type PublicComment = {
  id: string;
  projectId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
};

interface ProjectOverviewProps {
  projects?: Project[];
  comments?: PublicComment[];
}

export default function ProjectOverview({
  projects = [],
  comments = [],
}: ProjectOverviewProps) {
  // Filter out only active/ongoing projects for overview
  const activeProjects = projects.filter(
    (p) =>
      (p.status || "").toUpperCase() === "ACTIVE" ||
      (p.status || "").toUpperCase() === "ONGOING" ||
      (p.status || "").toUpperCase() === "PENDING",
  );

  // show top 5 active projects or placeholder
  if (activeProjects.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-md text-zinc-800 dark:text-zinc-300">
            Project Overview
          </h2>
          <Link
            href="/projects"
            className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center"
          >
            View all <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-500 rounded-full flex items-center justify-center">
            <FolderOpen size={32} />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">No active projects</p>
          <Link href="/projects">
            <button className="mt-4 px-4 py-2 text-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white dark:text-zinc-200 rounded hover:opacity-90 transition">
              Create New Project
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <div className="border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between">
        <h2 className="text-md text-zinc-800 dark:text-zinc-300">
          Active Projects Overview
        </h2>
        <Link
          href="/projects"
          className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center"
        >
          View all <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {activeProjects.slice(0, 5).map((project) => {
          const projectComments = comments.filter(
            (c) => c.projectId === project.id,
          );

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-800 dark:text-zinc-300 mb-1">
                    {project.name}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {project.description || "No description"}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      statusColors[(project.status || "").toUpperCase()] ||
                      statusColors.PLANNED
                    }`}
                  >
                    {prettyStatus(project.status)}
                  </span>
                  {project.priority && (
                    <div
                      className={`w-2 h-2 rounded-full border-2 ${
                        priorityColors[project.priority] || priorityColors.LOW
                      }`}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500 mb-3">
                <div className="flex items-center gap-4">
                  {project.sector && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs">🏢</span>
                      {project.sector}
                    </div>
                  )}
                  {project.members?.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs">👥</span>
                      {project.members.length} members
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-500">
                    Progress
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {project.progress ?? 0}%
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded h-1.5">
                  <div
                    className="h-1.5 bg-blue-500 rounded"
                    style={{ width: `${project.progress ?? 0}%` }}
                  />
                </div>
              </div>

              {/* Recent Comments Preview */}
              {projectComments.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Recent Comments ({projectComments.length})
                  </div>
                  <div className="space-y-1">
                    {projectComments
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime(),
                      )
                      .slice(0, 2)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="text-xs border rounded p-2 bg-zinc-50 dark:bg-zinc-800"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium text-blue-700 dark:text-blue-400">
                              {c.name}
                            </span>
                            <span className="text-zinc-400 text-xs">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-zinc-700 dark:text-zinc-200 truncate">
                            {c.message}
                          </div>
                        </div>
                      ))}
                  </div>
                  <Link
                    href={`/projects/${project.id}/comments`}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                  >
                    View all comments
                  </Link>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
