// components/projects/ProjectsByCategoryServer.tsx
import Link from "next/link";
import {
  fetchCategoriesWithProjects,
  fetchUncategorizedProjects,
  type CategoryWithProjects,
  type CategoryProject,
} from "@/lib/actions/categoryActions";
import {
  MapPin,
  Clock,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Rocket,
  ChevronRight,
  FolderOpen,
  Layers,
  CircleDot,
  Target,
  Wallet,
  Plus,
} from "lucide-react";

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmtCurrency(n: number | null) {
  if (n == null) return "—";
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysAgo(iso: string | null) {
  if (!iso) return null;
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  value,
  thin = false,
}: {
  value: number;
  thin?: boolean;
}) {
  const pct = Math.min(Math.max(value, 0), 100);
  const color =
    pct >= 100
      ? "bg-emerald-500"
      : pct >= 80
        ? "bg-blue-500"
        : pct >= 50
          ? "bg-amber-500"
          : "bg-zinc-300";
  return (
    <div
      className={`w-full rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden ${thin ? "h-1" : "h-1.5"}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Size badge ───────────────────────────────────────────────────────────────

const SIZE_CLS: Record<string, string> = {
  Small: "text-blue-600 bg-blue-50",
  Medium: "text-violet-600 bg-violet-50",
  Large: "text-orange-600 bg-orange-50",
};

// ─── Project mini-card ────────────────────────────────────────────────────────

function ProjectMiniCard({ project }: { project: CategoryProject }) {
  const isPending = project.status === "PENDING";
  const pct = project.latestTrackerPercent ?? project.progress ?? 0;

  return (
    <div className="group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      {/* Status dot */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
              isPending
                ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}
          >
            {isPending ? "Pending" : "Active"}
          </span>
          {project.size && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${SIZE_CLS[project.size] ?? "bg-zinc-50 text-zinc-500"}`}
            >
              {project.size}
            </span>
          )}
        </div>
        <Link
          href={
            isPending
              ? `/projects/${project.id}/initialize`
              : `/projects/${project.id}`
          }
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-50 dark:bg-zinc-800 text-zinc-500 hover:bg-blue-600 hover:text-white border border-zinc-200 dark:border-zinc-700 transition-all"
        >
          {isPending ? (
            <Rocket className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          {isPending ? "Init" : "View"}
        </Link>
      </div>

      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
        {project.name}
      </h4>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400 mb-3">
        {(project.ward || project.subCounty) && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {[project.ward, project.subCounty].filter(Boolean).join(", ")}
          </span>
        )}
        {project.budget != null && (
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            {fmtCurrency(project.budget)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {fmtDate(project.createdAt)}
        </span>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Progress
          </span>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {pct.toFixed(1)}%
          </span>
        </div>
        <ProgressBar value={pct} thin />
        {project.latestTrackerDate && (
          <p className="text-xs text-zinc-400">
            {project.trackerCount} tracker
            {project.trackerCount !== 1 ? "s" : ""} ·{" "}
            {daysAgo(project.latestTrackerDate)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Add project button ───────────────────────────────────────────────────────

function AddProjectButton({
  categoryId,
  categoryName,
  sector,
}: {
  categoryId: string;
  categoryName: string;
  sector: string | null;
}) {
  // Links to a new-project form pre-seeded with categoryId and sector as query params
  const params = new URLSearchParams({
    categoryId,
    categoryName: categoryName.slice(0, 80),
    ...(sector ? { sector } : {}),
  });
  return (
    <Link
      href={`/projects/new?${params.toString()}`}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 text-sm font-medium group"
    >
      <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
      Add project to this category
    </Link>
  );
}

// ─── Sector colour map ────────────────────────────────────────────────────────

const SECTOR_COLORS: Record<string, { dot: string; badge: string }> = {
  "Mobility And Works": {
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "Health, Wellness And Nutrition": {
    dot: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  "Talent, Skills Development And Care": {
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
  },
  "Green Nairobi": {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  "Business And Hustler Opportunities": {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  "Built Environment And Urban Planning": {
    dot: "bg-cyan-500",
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  "Innovation And Digital Economy": {
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  "Finance And Economic Planning": {
    dot: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

function getSectorColors(sector: string | null) {
  return (
    (sector ? SECTOR_COLORS[sector] : null) ?? {
      dot: "bg-zinc-400",
      badge: "bg-zinc-50 text-zinc-600 border-zinc-200",
    }
  );
}

// ─── Category accordion card ──────────────────────────────────────────────────

function CategoryCard({
  category,
  userRole,
}: {
  category: CategoryWithProjects;
  userRole: string;
}) {
  const colors = getSectorColors(category.sector);
  const pct = category.avgProgress ?? 0;
  const hasProjects = category.projectCount > 0;

  return (
    <details className="group/cat" open={hasProjects}>
      <summary className="list-none cursor-pointer">
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all duration-200 group-open/cat:rounded-b-none group-open/cat:border-b-0">
          {/* Left accent */}
          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />

          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {category.sector && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colors.badge}`}
                >
                  {category.sector}
                </span>
              )}
              <span className="text-xs text-zinc-400 font-medium px-2 py-0.5 rounded-full bg-zinc-50 border border-zinc-200">
                {category.projectCount} project
                {category.projectCount !== 1 ? "s" : ""}
                {category.activeCount > 0 &&
                  ` · ${category.activeCount} active`}
                {category.pendingCount > 0 &&
                  ` · ${category.pendingCount} pending`}
              </span>
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 leading-snug text-base">
              {category.name}
            </h3>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500">
              {category.target != null && (
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Target:{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {category.target.toLocaleString()}
                  </span>
                </span>
              )}
              {category.budget != null && (
                <span className="flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {fmtCurrency(category.budget)}
                  </span>
                </span>
              )}
              {hasProjects && (
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  Avg progress:{" "}
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {pct.toFixed(1)}%
                  </span>
                </span>
              )}
            </div>

            {/* Progress bar */}
            {hasProjects && (
              <div className="mt-3 max-w-sm">
                <ProgressBar value={pct} />
              </div>
            )}
          </div>

          {/* Toggle chevron */}
          <svg
            className="w-4 h-4 text-zinc-400 shrink-0 mt-1 group-open/cat:rotate-180 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </summary>

      {/* Projects grid */}
      <div className="border border-t-0 border-zinc-200 dark:border-zinc-800 rounded-b-2xl bg-zinc-50/50 dark:bg-zinc-900/50 p-4">
        {hasProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
            {category.projects.map((p) => (
              <ProjectMiniCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 py-4 px-2 mb-4">
            <FolderOpen className="w-5 h-5 text-zinc-300" />
            <span className="text-sm text-zinc-400 italic">
              No projects yet in this category.
            </span>
          </div>
        )}
        {userRole === "sector" && (
          <AddProjectButton
            categoryId={category.id}
            categoryName={category.name}
            sector={category.sector}
          />
        )}
      </div>
    </details>
  );
}

// ─── Uncategorized section ────────────────────────────────────────────────────

function UncategorizedSection({ projects }: { projects: CategoryProject[] }) {
  if (projects.length === 0) return null;
  return (
    <details className="group/uncat">
      <summary className="list-none cursor-pointer">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 hover:shadow-sm transition-all">
          <Layers className="w-4 h-4 text-zinc-400" />
          <span className="font-medium text-zinc-600 dark:text-zinc-400 text-sm">
            Uncategorized ({projects.length} project
            {projects.length !== 1 ? "s" : ""})
          </span>
          <svg
            className="w-4 h-4 text-zinc-400 ml-auto group-open/uncat:rotate-180 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </summary>
      <div className="border border-t-0 border-dashed border-zinc-300 dark:border-zinc-700 rounded-b-2xl p-4 bg-zinc-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.map((p) => (
            <ProjectMiniCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </details>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <FolderOpen className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">
        No approved categories found
      </h3>
      <p className="text-sm text-zinc-400 mt-1 max-w-sm">
        Categories must be extracted from the CIDP and approved before projects
        can be grouped under them.
      </p>
      <Link
        href="/cidp"
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Go to CIDP Categories
      </Link>
    </div>
  );
}

// ─── Server component ─────────────────────────────────────────────────────────

export default async function ProjectsByCategoryServer({
  query,
  sector,
  userRole,
  userEmail,
}: {
  query: string;
  sector: string;
  userRole: string;
  userEmail: string;
}) {
  const [categories, uncategorized] = await Promise.all([
    fetchCategoriesWithProjects({
      sector: sector !== "ALL" ? sector : undefined,
      query: query || undefined,
    }),
    fetchUncategorizedProjects(),
  ]);

  if (categories.length === 0 && uncategorized.length === 0) {
    return <EmptyState />;
  }

  // Summary stats
  const totalProjects =
    categories.reduce((s, c) => s + c.projectCount, 0) + uncategorized.length;
  const totalActive = categories.reduce((s, c) => s + c.activeCount, 0);
  const totalPending = categories.reduce((s, c) => s + c.pendingCount, 0);

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      <div className="flex flex-wrap gap-4 text-sm text-zinc-500 px-1">
        <span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">
            {categories.length}
          </span>{" "}
          approved {categories.length === 1 ? "category" : "categories"}
        </span>
        <span className="text-zinc-300">·</span>
        <span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-100">
            {totalProjects}
          </span>{" "}
          total projects
        </span>
        {totalActive > 0 && (
          <>
            <span className="text-zinc-300">·</span>
            <span className="text-emerald-600">
              <span className="font-semibold">{totalActive}</span> active
            </span>
          </>
        )}
        {totalPending > 0 && (
          <>
            <span className="text-zinc-300">·</span>
            <span className="text-yellow-600">
              <span className="font-semibold">{totalPending}</span> pending
            </span>
          </>
        )}
        {uncategorized.length > 0 && (
          <>
            <span className="text-zinc-300">·</span>
            <span className="text-zinc-400">
              <span className="font-semibold">{uncategorized.length}</span>{" "}
              uncategorized
            </span>
          </>
        )}
      </div>

      {/* Category cards */}
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          userRole={userRole}
        />
      ))}

      {/* Uncategorized bucket */}
      <UncategorizedSection projects={uncategorized} />
    </div>
  );
}
