// components/projects/ProjectsPageClient.tsx
"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Search, Calendar, X, Bell, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type AttentionFilter =
  | "ALL"
  | "needs_draft_review"
  | "needs_weights_review"
  | "new_tracker"
  | "pending_init"
  | "stalled_items"
  | "near_complete";

const ATTENTION_OPTIONS: {
  value: AttentionFilter;
  label: string;
  color: string;
  dot: string;
}[] = [
  {
    value: "ALL",
    label: "All Projects",
    color: "bg-zinc-100 text-zinc-700 border-zinc-200",
    dot: "bg-zinc-400",
  },
  {
    value: "needs_draft_review",
    label: "Draft Review",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  {
    value: "needs_weights_review",
    label: "Weights Review",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  {
    value: "new_tracker",
    label: "New Tracker (7d)",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  {
    value: "stalled_items",
    label: "Stalled Items",
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  {
    value: "near_complete",
    label: "Near Complete >=80%",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  {
    value: "pending_init",
    label: "Pending Init",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    dot: "bg-yellow-500",
  },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
];

const SIZE_OPTIONS = [
  { value: "ALL", label: "All Sizes" },
  { value: "Small", label: "Small (<500K)" },
  { value: "Medium", label: "Medium (500K-1M)" },
  { value: "Large", label: "Large (>1M)" },
];

export default function ProjectsPageClient({ userRole }: { userRole: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentAttention = (searchParams.get("attention") ||
    "ALL") as AttentionFilter;
  const currentStatus = searchParams.get("status") || "ALL";
  const currentSize = searchParams.get("size") || "ALL";
  const currentStart = searchParams.get("startDate") || "";
  const currentEnd = searchParams.get("endDate") || "";

  const [startDate, setStartDate] = useState(currentStart);
  const [endDate, setEndDate] = useState(currentEnd);
  const [showDates, setShowDates] = useState(false);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value && value !== "ALL") params.set(key, value);
      else params.delete(key);
      params.set("page", "1");
      replace(pathname + "?" + params.toString());
    },
    [pathname, replace, searchParams],
  );

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) params.set("query", term);
    else params.delete("query");
    replace(pathname + "?" + params.toString());
  }, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (startDate) params.set("startDate", startDate);
    else params.delete("startDate");
    if (endDate) params.set("endDate", endDate);
    else params.delete("endDate");
    params.set("page", "1");
    replace(pathname + "?" + params.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const hasActiveFilters =
    currentStatus !== "ALL" ||
    currentSize !== "ALL" ||
    currentStart ||
    currentEnd;

  const clearAll = () => {
    setStartDate("");
    setEndDate("");
    replace(pathname);
  };

  const isME = userRole === "me";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage and monitor capital projects
          </p>
        </div>
        {isME && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
            <Bell className="w-3.5 h-3.5" /> M&amp;E Officer View
          </div>
        )}
      </div>

      {isME && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Bell className="w-3 h-3" /> Needs Attention
          </p>
          <div className="flex flex-wrap gap-2">
            {ATTENTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateParam("attention", opt.value)}
                className={
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all " +
                  (currentAttention === opt.value
                    ? opt.color + " shadow-sm"
                    : "bg-white dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300")
                }
              >
                <span className={"w-1.5 h-1.5 rounded-full " + opt.dot} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search projects..."
            defaultValue={searchParams.get("query") || ""}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>

        <div className="relative">
          <select
            value={currentStatus}
            onChange={(e) => updateParam("status", e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={currentSize}
            onChange={(e) => updateParam("size", e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
          >
            {SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        </div>

        <button
          onClick={() => setShowDates((v) => !v)}
          className={
            "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all " +
            (showDates || currentStart || currentEnd
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400")
          }
        >
          <Calendar className="w-4 h-4" /> Date Range
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>

      {showDates && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="text-xs text-zinc-500 shrink-0">
            Created between
          </span>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none"
          />
          <span className="text-zinc-300">to</span>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 focus:outline-none"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
