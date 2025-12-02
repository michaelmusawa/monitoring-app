// app/dashboard/components/StatsGrid.tsx
import React from "react";
import {
  FolderOpen,
  CheckCircle,
  Users,
  AlertTriangle,
  BadgeAlertIcon,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  sector?: string;
  budget?: number;
  status?: string;
  size?: string;
};

export default function StatsGrid({ projects = [] }: { projects?: Project[] }) {
  const total = projects.length;

  // Calculate stats from dummy data
  const completed = projects.filter(
    (p) => (p.status || "").toUpperCase() === "COMPLETE",
  ).length;

  const active = projects.filter(
    (p) =>
      (p.status || "").toUpperCase() === "ACTIVE" ||
      (p.status || "").toUpperCase() === "ONGOING",
  ).length;

  const stalled = projects.filter(
    (p) => (p.status || "").toUpperCase() === "STALLED",
  ).length;

  const megaProjects = projects.filter(
    (p) => (p.size || "").toUpperCase() === "MEGA",
  ).length;

  const statCards = [
    {
      icon: FolderOpen,
      title: "Total Projects",
      value: total,
      subtitle: `projects in workspace`,
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-500",
    },
    {
      icon: CheckCircle,
      title: "Completed Projects",
      value: completed,
      subtitle: `${completed} of ${total} total`,
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-500",
    },
    {
      icon: BadgeAlertIcon,
      title: "Stalled",
      value: stalled,
      subtitle: "stalled projects",
      bgColor: "bg-purple-500/10",
      textColor: "text-purple-500",
    },
    {
      icon: AlertTriangle,
      title: "Mega Projects",
      value: megaProjects,
      subtitle: "large scale initiatives",
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-9">
      {statCards.map(
        ({ icon: Icon, title, value, subtitle, bgColor, textColor }, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-950 dark:bg-linear-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200 rounded-md"
          >
            <div className="p-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">
                    {title}
                  </p>
                  <p className="text-3xl font-bold text-zinc-800 dark:text-white">
                    {value}
                  </p>
                  {subtitle && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${bgColor} bg-opacity-20`}>
                  <Icon size={20} className={textColor} />
                </div>
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}
