import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";

import ProjectList from "@/components/portal/ProjectList";
import ProjectFilters from "@/components/portal/ProjectFilters";
import {
  fetchBreakdownData,
  fetchPublicProjects,
  fetchFiscalYears,
} from "@/lib/actions/publicActions";
import FiscalYearFilter from "@/components/portal/FiscalYearFilter";
import BreakdownTabs from "@/components/portal/BreakdownTabs";
import WardSubcountyFilter from "@/components/portal/WardSubcountyFilter";
import BreakdownSummaryCards from "@/components/portal/BreakdownSummaryCards";
import BreakdownTable from "@/components/portal/BreakdownTable";

type SearchParams = {
  type?: string;
  fiscalYear?: string;
  sector?: string;
  subCounty?: string;
  ward?: string;
  status?: string;
  projectName?: string;
  minBudget?: string;
  maxBudget?: string;
  minProgress?: string;
  maxProgress?: string;
};

export default async function ProjectsPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await props.searchParams;

  // Fiscal year global filter
  const fiscalYear = params?.fiscalYear;

  // Breakdown type
  const breakdownType =
    params?.type === "fiscalYear" ||
    params?.type === "sector" ||
    params?.type === "subCounty" ||
    params?.type === "ward"
      ? params.type
      : "sector";

  // For ward breakdown, subCounty is required to fetch wards
  const subCountyForWard =
    breakdownType === "ward" ? params?.subCounty : undefined;

  // Fetch fiscal years list (for dropdown)
  const fiscalYears = await fetchFiscalYears();

  // Build filter object for project list (global + breakdown specific)
  const projectFilters: Record<string, string | undefined> = {};
  if (fiscalYear) projectFilters.fiscalYear = fiscalYear;
  if (params?.sector && breakdownType === "sector")
    projectFilters.sector = params.sector;
  if (
    params?.subCounty &&
    (breakdownType === "subCounty" ||
      (breakdownType === "ward" && subCountyForWard))
  )
    projectFilters.subCounty = params.subCounty;
  if (params?.ward && breakdownType === "ward")
    projectFilters.ward = params.ward;
  // Additional search/filters
  if (params?.status) projectFilters.status = params.status;
  if (params?.projectName) projectFilters.projectName = params.projectName;
  if (params?.minBudget) projectFilters.minBudget = params.minBudget;
  if (params?.maxBudget) projectFilters.maxBudget = params.maxBudget;
  if (params?.minProgress) projectFilters.minProgress = params.minProgress;
  if (params?.maxProgress) projectFilters.maxProgress = params.maxProgress;

  // Fetch breakdown data (depends on type and optional subCounty for ward)
  // Inside ProjectsPage, after fetching breakdownData
  const breakdownData = await fetchBreakdownData(breakdownType, {
    subCounty: subCountyForWard,
    fiscalYear,
  });

  // Active breakdown value for highlighting row
  const activeBreakdownValue =
    breakdownType === "fiscalYear"
      ? params?.fiscalYear
      : breakdownType === "sector"
        ? params?.sector
        : breakdownType === "subCounty"
          ? params?.subCounty
          : params?.ward;

  // Compute summary stats for the selected breakdown item (if any)
  let summaryStats;
  if (activeBreakdownValue) {
    const selected = breakdownData.find(
      (item) => item.value === activeBreakdownValue,
    );
    if (selected) {
      summaryStats = {
        totalProjects: selected.totalProjects,
        active: selected.active,
        stalled: selected.stalled,
        completed: selected.completed,
        notStarted: selected.notStarted,
      };
    } else {
      // fallback to aggregated if selected not found
      summaryStats = breakdownData.reduce(
        (acc, item) => {
          acc.totalProjects += item.totalProjects;
          acc.active += item.active;
          acc.stalled += item.stalled;
          acc.completed += item.completed;
          acc.notStarted += item.notStarted;
          return acc;
        },
        {
          totalProjects: 0,
          active: 0,
          stalled: 0,
          completed: 0,
          notStarted: 0,
        },
      );
    }
  } else {
    // No breakdown selected – show aggregated totals
    summaryStats = breakdownData.reduce(
      (acc, item) => {
        acc.totalProjects += item.totalProjects;
        acc.active += item.active;
        acc.stalled += item.stalled;
        acc.completed += item.completed;
        acc.notStarted += item.notStarted;
        return acc;
      },
      { totalProjects: 0, active: 0, stalled: 0, completed: 0, notStarted: 0 },
    );
  }

  // Fetch projects for the list
  const listProjects = await fetchPublicProjects(projectFilters as any);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Page header with global fiscal year filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Projects</h1>
          <p className="text-muted-foreground">
            Explore county development projects by financial year, sector,
            sub‑county, or ward.
          </p>
        </div>
        <FiscalYearFilter years={fiscalYears} />
      </div>

      {/* Breakdown tabs */}
      <Card className="border-border/50 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <BreakdownTabs currentType={breakdownType} />
            {breakdownType === "ward" && <WardSubcountyFilter />}
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <BreakdownSummaryCards data={summaryStats} />

      {/* Breakdown table */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            {breakdownType === "fiscalYear"
              ? "Fiscal Year Breakdown"
              : breakdownType === "sector"
                ? "Sector Breakdown"
                : breakdownType === "subCounty"
                  ? "Sub‑county Breakdown"
                  : `Ward Breakdown ${subCountyForWard ? `(${subCountyForWard})` : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-4">
          <Suspense
            fallback={
              <div className="p-4 text-muted-foreground">
                Loading breakdown…
              </div>
            }
          >
            <BreakdownTable
              data={breakdownData}
              type={breakdownType}
              activeValue={activeBreakdownValue}
              subCounty={subCountyForWard}
              currentFiscalYear={fiscalYear} // ← add this line
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Project list */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">
              {activeBreakdownValue || "All"} Projects
            </h2>
            <p className="text-sm text-muted-foreground">
              {listProjects.length} project
              {listProjects.length !== 1 ? "s" : ""} found
            </p>
          </div>
          <ProjectFilters />
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-card shadow-sm animate-pulse h-48"
                />
              ))}
            </div>
          }
        >
          <ProjectList projects={listProjects} />
        </Suspense>
      </section>
    </div>
  );
}
