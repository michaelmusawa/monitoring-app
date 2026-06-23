// components/portal/ProjectMiniCard.tsx
import Link from "next/link";
import { MapPin, TrendingUp, Clock } from "lucide-react";
import type { PublicProject } from "@/lib/actions/publicActions";
import { Badge } from "@/components/ui/badge";

function fmtCurrency(n: number | null | undefined) {
  if (!n) return "—";
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  return `KES ${n.toLocaleString()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectMiniCard({
  project,
}: {
  project: PublicProject;
}) {
  const pct = project.latestTrackerPercent ?? 0;

  const statusConfig: Record<string, { label: string; bg: string }> = {
    NOT_STARTED: {
      label: "Not Started",
      bg: "bg-zinc-100 text-zinc-600 border-zinc-200",
    },
    ONGOING: {
      label: "Ongoing",
      bg: "bg-blue-50 text-blue-700 border-blue-200",
    },
    STALLED: {
      label: "Stalled",
      bg: "bg-red-50 text-red-700 border-red-200",
    },
    COMPLETED: {
      label: "Completed",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    TERMINATED: {
      label: "Terminated",
      bg: "bg-zinc-200 text-zinc-700 border-zinc-300",
    },
  };

  const status = project.derivedStatus ?? "NOT_STARTED";
  const { label, bg } = statusConfig[status] ?? statusConfig.NOT_STARTED;

  const progressColor =
    pct >= 100
      ? "bg-emerald-500"
      : pct >= 75
        ? "bg-blue-500"
        : pct >= 50
          ? "bg-amber-500"
          : pct > 0
            ? "bg-red-400"
            : "bg-zinc-300";

  return (
    <Link href={`/portal/${project.id}`} className="group">
      <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 hover:shadow-md transition-all duration-200 h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className={`text-xs font-medium ${bg}`}>
            {label}
          </Badge>
        </div>
        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {project.name}
        </h4>

        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
          <MapPin className="w-3 h-3" />
          <span className="truncate">
            {project.ward
              ? `${project.ward}, ${project.subCounty}`
              : project.subCounty || "Location TBD"}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium">{fmtCurrency(project.budget)}</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {pct.toFixed(0)}%
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>

        <div className="flex items-center text-xs text-zinc-400">
          <Clock className="w-3 h-3 mr-1" />
          {fmtDate(project.createdAt)}
        </div>
      </div>
    </Link>
  );
}
