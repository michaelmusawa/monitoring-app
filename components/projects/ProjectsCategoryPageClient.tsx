"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  Search,
  X,
  FolderKanban,
  Plus,
  ChevronDown,
  LayoutGrid,
  List,
} from "lucide-react";
import Link from "next/link";
import { Role } from "@/lib/actions/adminActions";

export default function ProjectsCategoryPageClient({
  userRole,
  userSector,
  currentView,
  sectors,
}: {
  userRole: Role[];
  userSector: string | undefined;
  currentView: string;
  sectors: string[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Read filter values from URL
  const categoryQuery = searchParams.get("query") || "";
  const projectName = searchParams.get("projectName") || "";
  const projectStatus = searchParams.get("projectStatus") || "ALL";
  const minBudget = searchParams.get("minBudget") || "";
  const maxBudget = searchParams.get("maxBudget") || "";
  const currentSector = userSector || searchParams.get("sector") || "ALL";

  const hasFilters =
    categoryQuery !== "" ||
    projectName !== "" ||
    projectStatus !== "ALL" ||
    minBudget !== "" ||
    maxBudget !== "" ||
    currentSector !== "ALL";

  // Helper to update any param
  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      replace(`${pathname}?${params.toString()}`);
    },
    [pathname, replace, searchParams],
  );

  const handleCategorySearch = useDebouncedCallback((q: string) => {
    setParam("query", q);
  }, 300);

  const handleProjectNameSearch = useDebouncedCallback((q: string) => {
    setParam("projectName", q);
  }, 300);

  function clearAll() {
    replace(pathname);
  }

  function toggleView() {
    const newView = currentView === "grouped" ? "flat" : "grouped";
    setParam("view", newView);
  }

  const isSectorRestricted = !!userSector;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderKanban className="w-5 h-5 text-green-800-600" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Projects
            </h1>
          </div>
          <p className="text-sm text-zinc-500">
            {currentView === "grouped"
              ? "Projects organised under approved CIDP Key Output categories."
              : "All projects in a flat list, filterable by category, name, status, or budget."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <button
            onClick={toggleView}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            title={
              currentView === "grouped"
                ? "Switch to flat list"
                : "Switch to grouped view"
            }
          >
            {currentView === "grouped" ? (
              <>
                <List className="w-4 h-4" />
                Flat list
              </>
            ) : (
              <>
                <LayoutGrid className="w-4 h-4" />
                Grouped
              </>
            )}
          </button>

          {/* New project button */}
          {userSector !== "Monitoring And Evaluation" && (
            <Link
              href="/projects/new"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-700 text-white text-sm font-medium hover:bg-green-600 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Link>
          )}
        </div>
      </div>

      {/* Filters row 1: Category search & Sector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search categories…"
            defaultValue={categoryQuery}
            onChange={(e) => handleCategorySearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
        </div>

        <div className="relative">
          <select
            value={currentSector}
            onChange={(e) => setParam("sector", e.target.value)}
            disabled={isSectorRestricted}
            className={`appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all cursor-pointer ${
              isSectorRestricted ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <option value="ALL">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        </div>

        {hasFilters && !isSectorRestricted && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-700 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white transition-all"
          >
            <X className="w-3 h-3" />
            Clear all filters
          </button>
        )}
      </div>

      {/* Filters row 2: Project name, status, budget (only for flat view, but can be shown always) */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="relative flex-1 min-w-[180px]">
          <input
            type="text"
            placeholder="Project name…"
            defaultValue={projectName}
            onChange={(e) => handleProjectNameSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          />
        </div>
        <select
          value={projectStatus}
          onChange={(e) => setParam("projectStatus", e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white"
        >
          <option value="ALL">All status</option>
          <option value="ONGOING">Ongoing</option>
          <option value="COMPLETED">Completed</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="STALLED">Stalled</option>
          <option value="TERMINATED">Terminated</option>
        </select>
        <div className="flex items-center gap-1">
          <input
            type="number"
            placeholder="Min budget (KES)"
            value={minBudget}
            onChange={(e) => setParam("minBudget", e.target.value)}
            className="w-32 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white"
          />
          <span className="text-zinc-400">–</span>
          <input
            type="number"
            placeholder="Max (KES)"
            value={maxBudget}
            onChange={(e) => setParam("maxBudget", e.target.value)}
            className="w-32 px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
