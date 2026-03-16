// components/projects/ProjectsCategoryPageClient.tsx
"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Search, X, FolderKanban, Plus, ChevronDown } from "lucide-react";
import Link from "next/link";

const SECTORS = [
  "ALL",
  "Mobility And Works",
  "Health, Wellness And Nutrition",
  "Talent, Skills Development And Care",
  "Green Nairobi",
  "Business And Hustler Opportunities",
  "Built Environment And Urban Planning",
  "Boroughs, Sub County Administration And Personnel",
  "Public Service Management",
  "Innovation And Digital Economy",
  "Finance And Economic Planning",
  "Inclusivity, Public Participation And Customer Service",
  "Office Of The Governor & Deputy Governor",
  "County Secretary & Head Of County Public Service",
  "Security And Compliance",
  "Office Of The County Attorney",
  "Disaster & Emergency Management",
  "Internal Audit And Risk Management",
  "Ward Development Programme",
  "County Public Service Board",
  "County Assembly",
];

export default function ProjectsCategoryPageClient({
  userRole,
}: {
  userRole: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentQuery = searchParams.get("query") || "";
  const currentSector = searchParams.get("sector") || "ALL";
  const hasFilters = currentQuery !== "" || currentSector !== "ALL";

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    replace(`${pathname}?${params.toString()}`);
  }

  const handleSearch = useDebouncedCallback((q: string) => {
    updateParams("query", q);
  }, 300);

  function clearAll() {
    replace(pathname);
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Projects by Category
            </h1>
          </div>
          <p className="text-sm text-zinc-500">
            Projects organised under approved CIDP Key Output categories.
          </p>
        </div>

        {/* Primary action */}
        <Link
          href="/projects/new"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Project
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search categories…"
            defaultValue={currentQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
          />
        </div>

        {/* Sector filter */}
        <div className="relative">
          <select
            value={currentSector}
            onChange={(e) => updateParams("sector", e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all cursor-pointer"
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Sectors" : s}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-700 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white transition-all"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
