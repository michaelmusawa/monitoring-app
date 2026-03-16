// components/projects/ProjectsListServer.tsx
import Link from "next/link";
import {
  fetchEnrichedProjects,
  type EnrichedProject,
  type AttentionFlag,
} from "@/lib/actions/projectsListActions";
import {
  MapPin,
  TrendingUp,
  FileText,
  BarChart3,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Rocket,
  ClipboardList,
  Activity,
  CircleDot,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(n: number | null) {
  if (!n) return "—";
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysAgo(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

// ─── Checklist phase chip ─────────────────────────────────────────────────────

const CHECKLIST_PHASE: Record<string, { label: string; cls: string }> = {
  Draft: { label: "Draft", cls: "bg-zinc-100 text-zinc-600" },
  DraftReview: { label: "Draft Review", cls: "bg-amber-100 text-amber-700" },
  WeightsAssignment: { label: "Weights", cls: "bg-blue-100 text-blue-700" },
  WeightsReview: {
    label: "Weights Review",
    cls: "bg-purple-100 text-purple-700",
  },
  Approved: { label: "Approved", cls: "bg-emerald-100 text-emerald-700" },
};

// ─── Attention flag badge ─────────────────────────────────────────────────────

const FLAG_META: Record<
  AttentionFlag,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  needs_draft_review: {
    label: "Review Draft",
    cls: "bg-amber-50 border-amber-200 text-amber-700",
    icon: <ClipboardList className="w-3 h-3" />,
  },
  needs_weights_review: {
    label: "Review Weights",
    cls: "bg-purple-50 border-purple-200 text-purple-700",
    icon: <BarChart3 className="w-3 h-3" />,
  },
  new_tracker: {
    label: "New Tracker",
    cls: "bg-blue-50 border-blue-200 text-blue-700",
    icon: <Activity className="w-3 h-3" />,
  },
  pending_init: {
    label: "Needs Init",
    cls: "bg-yellow-50 border-yellow-200 text-yellow-700",
    icon: <Rocket className="w-3 h-3" />,
  },
  stalled_items: {
    label: "Stalled",
    cls: "bg-red-50 border-red-200 text-red-700",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  near_complete: {
    label: "Near Complete",
    cls: "bg-emerald-50 border-emerald-200 text-emerald-700",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

function AttentionPill({ flag }: { flag: AttentionFlag }) {
  const m = FLAG_META[flag];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${m.cls}`}
    >
      {m.icon} {m.label}
    </span>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  const color =
    value >= 100
      ? "bg-emerald-500"
      : value >= 80
        ? "bg-blue-500"
        : value >= 50
          ? "bg-amber-500"
          : "bg-zinc-300";
  return (
    <div
      className={`h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// ─── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  userRole,
  index,
}: {
  project: EnrichedProject;
  userRole: string;
  index: number;
}) {
  const isPending = project.status === "PENDING";
  const isME = userRole === "me";
  const hasFlags = project.attentionFlags.length > 0;
  const flagsForME = project.attentionFlags.filter(
    (f) => f !== "pending_init" || isME,
  );

  const clPhase = project.checklistStatus
    ? CHECKLIST_PHASE[project.checklistStatus]
    : null;
  const trackerPct = project.latestTrackerPercent;

  const statusPill = isPending
    ? "bg-yellow-50 border-yellow-200 text-yellow-700"
    : "bg-emerald-50 border-emerald-200 text-emerald-700";

  const sizeColor: Record<string, string> = {
    Small: "text-blue-600 bg-blue-50",
    Medium: "text-violet-600 bg-violet-50",
    Large: "text-orange-600 bg-orange-50",
  };

  return (
    <div
      className={`group relative bg-white dark:bg-zinc-900 rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        isME && hasFlags
          ? "border-amber-200 dark:border-amber-800/50"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {/* Attention stripe */}
      {isME && hasFlags && (
        <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-amber-400" />
      )}

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs text-zinc-400 font-mono">
                #{index + 1}
              </span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusPill}`}
              >
                {isPending ? "Pending" : "Active"}
              </span>
              {project.size && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${sizeColor[project.size] || "text-zinc-500 bg-zinc-50"}`}
                >
                  {project.size}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
          </div>
          <Link
            href={
              isPending
                ? `/projects/${project.id}/initialize`
                : `/projects/${project.id}`
            }
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-blue-600 hover:text-white border border-zinc-200 dark:border-zinc-700"
          >
            {isPending ? (
              <>
                <Rocket className="w-3.5 h-3.5" /> Initiate
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5" /> View
              </>
            )}
          </Link>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 mb-4">
          {project.sector && (
            <span className="flex items-center gap-1">
              <CircleDot className="w-3 h-3" /> {project.sector}
            </span>
          )}
          {project.categoryId && (
            <Link
              href={`/projects?sector=${encodeURIComponent(project.sector || "")}`}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors font-medium"
              title="View category"
            >
              <ArrowRight className="w-3 h-3" /> Category
            </Link>
          )}
          {(project.ward || project.subCounty) && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {[project.ward, project.subCounty].filter(Boolean).join(", ")}
            </span>
          )}
          {project.budget && (
            <span className="flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
              {fmtCurrency(project.budget)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />{" "}
            {fmtDate(project.createdAt?.toISOString?.() ?? null)}
          </span>
        </div>

        {/* Three-column info grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Checklist */}
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-medium">
                Checklist
              </span>
            </div>
            {clPhase ? (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${clPhase.cls}`}
              >
                {clPhase.label}
              </span>
            ) : (
              <span className="text-xs text-zinc-400 italic">None</span>
            )}
            {project.checklistVersion && (
              <p className="text-xs text-zinc-400 mt-1">
                v{project.checklistVersion}
              </p>
            )}
          </div>

          {/* Tracker */}
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-medium">Tracker</span>
            </div>
            {project.trackerCount > 0 ? (
              <>
                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  {trackerPct !== null ? `${trackerPct.toFixed(1)}%` : "—"}
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {project.trackerCount} submission
                  {project.trackerCount !== 1 ? "s" : ""}
                  {project.latestTrackerDate
                    ? ` · ${daysAgo(project.latestTrackerDate)}`
                    : ""}
                </p>
              </>
            ) : (
              <span className="text-xs text-zinc-400 italic">
                No submissions
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-medium">
                Progress
              </span>
            </div>
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-1.5">
              {trackerPct !== null
                ? `${trackerPct.toFixed(1)}%`
                : `${project.progress ?? 0}%`}
            </p>
            <ProgressBar value={trackerPct ?? project.progress ?? 0} />
          </div>
        </div>

        {/* Stalled warning */}
        {project.stalledCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-100 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="text-xs text-red-700 font-medium">
              {project.stalledCount} stalled item
              {project.stalledCount !== 1 ? "s" : ""} in latest tracker
            </span>
          </div>
        )}

        {/* Attention flags (ME only) */}
        {isME && flagsForME.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {flagsForME.map((f) => (
              <AttentionPill key={f} flag={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Server List ──────────────────────────────────────────────────────────────

export default async function ProjectsListServer({
  query,
  startDate,
  endDate,
  status,
  size,
  attention,
  currentPage,
  userEmail,
  userRole,
}: {
  query: string;
  startDate: string;
  endDate: string;
  status: string;
  size: string;
  attention: string;
  currentPage: number;
  userEmail: string;
  userRole: string;
}) {
  const projects = await fetchEnrichedProjects({
    query,
    startDate,
    endDate,
    status,
    size,
    attention,
    currentPage,
    userEmail,
  });

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
          No projects found
        </h3>
        <p className="text-sm text-zinc-400 mt-1">
          Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  const offset = (currentPage - 1) * 10;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((project, i) => (
        <ProjectCard
          key={project.id}
          project={project}
          userRole={userRole}
          index={offset + i}
        />
      ))}
    </div>
  );
}
