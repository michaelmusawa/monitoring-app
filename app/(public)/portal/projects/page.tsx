// app/portal/projects/page.tsx
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ProjectList from "@/components/portal/ProjectList";
import ProjectFilters from "@/components/portal/ProjectFilters";
import {
  fetchBreakdownData,
  fetchPublicProjects,
  fetchFiscalYears,
  fetchBreakdownDimensions,
  fetchOverviewGroups,
} from "@/lib/actions/publicActions";
import { fetchRootSectors } from "@/lib/actions/orgActions";
import FiscalYearFilter from "@/components/portal/FiscalYearFilter";
import BreakdownSummaryCards from "@/components/portal/BreakdownSummaryCards";
import BreakdownTable from "@/components/portal/BreakdownTable";
import OverviewGroups from "@/components/portal/OverviewGroups";
import GroupByToggle from "@/components/portal/GroupByToggle";
import type { PublicProject, BreakdownItem } from "@/lib/actions/publicActions";
import DynamicBreakdownTabs from "@/components/portal/BreakdownTabs";

type SearchParams = {
  // global
  fiscalYear?: string;
  // breakdown
  type?: string; // e.g. "fiscalYear", "org-Sector", "loc-Sub-county"
  sector?: string; // selected org unit value (any level)
  subCounty?: string;
  ward?: string;
  // grouping toggle for overview
  groupBy?: string; // "org" | "location"
  // additional filters for project list
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

  // ─── Global data ──────────────────────────────────────────
  const [sectors, dimensions, fiscalYears] = await Promise.all([
    fetchRootSectors(),
    fetchBreakdownDimensions(),
    fetchFiscalYears(),
  ]);

  const fiscalYear = params?.fiscalYear;

  // ─── Breakdown section ────────────────────────────────────
  const breakdownType = params?.type || "fiscalYear"; // default: fiscalYear

  // Determine active breakdown value from URL
  let activeBreakdownValue: string | undefined;
  if (breakdownType === "fiscalYear") {
    activeBreakdownValue = fiscalYear;
  } else if (breakdownType.startsWith("org-")) {
    activeBreakdownValue = params?.sector;
  } else if (breakdownType === "loc-Sub-county") {
    activeBreakdownValue = params?.subCounty;
  } else if (breakdownType === "loc-Ward") {
    activeBreakdownValue = params?.ward;
  }

  // Fetch breakdown data (always)
  const breakdownData = await fetchBreakdownData(breakdownType, {
    fiscalYear,
    parentValue: activeBreakdownValue, // for location levels, pass parent
  });

  // Summary stats for the active value (if any)
  let summaryStats: BreakdownItem | undefined;
  if (activeBreakdownValue) {
    summaryStats = breakdownData.find(
      (item) => item.value === activeBreakdownValue,
    );
  }

  // ─── Projects list section ────────────────────────────────
  const groupBy = params?.groupBy === "location" ? "location" : "org";

  // If a breakdown value is selected → fetch filtered flat list
  // Otherwise → fetch overview groups (collapsible, limited)
  let listProjects: PublicProject[] = [];
  let overviewGroups: Awaited<ReturnType<typeof fetchOverviewGroups>> | null =
    null;

  if (activeBreakdownValue) {
    // Build filters for the public projects query
    const filters: Record<string, string | undefined> = {
      fiscalYear,
    };
    if (breakdownType.startsWith("org-")) filters.sector = activeBreakdownValue;
    else if (breakdownType === "loc-Sub-county")
      filters.subCounty = activeBreakdownValue;
    else if (breakdownType === "loc-Ward") filters.ward = activeBreakdownValue;

    if (params?.status) filters.status = params.status;
    if (params?.projectName) filters.projectName = params.projectName;
    if (params?.minBudget) filters.minBudget = params.minBudget;
    if (params?.maxBudget) filters.maxBudget = params.maxBudget;
    if (params?.minProgress) filters.minProgress = params.minProgress;
    if (params?.maxProgress) filters.maxProgress = params.maxProgress;

    listProjects = await fetchPublicProjects(filters);
  } else {
    // No breakdown selected – load overview groups
    overviewGroups = await fetchOverviewGroups(fiscalYear, groupBy);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Header + fiscal year filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Projects</h1>
          <p className="text-muted-foreground">
            Explore county development projects by organisation, location, or
            fiscal year.
          </p>
        </div>
        <FiscalYearFilter years={fiscalYears} />
      </div>

      {/* Breakdown section */}
      <Card className="border-border/50 shadow-md">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <DynamicBreakdownTabs
              orgLevels={dimensions.orgLevels}
              locationLevels={dimensions.locationLevels}
              currentType={breakdownType}
            />
          </div>

          {summaryStats && (
            <BreakdownSummaryCards
              data={{
                totalProjects: summaryStats.totalProjects,
                active: summaryStats.ongoing,
                stalled: summaryStats.stalled,
                completed: summaryStats.completed,
                notStarted: summaryStats.notStarted,
              }}
            />
          )}

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
              currentFiscalYear={fiscalYear}
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Projects list section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">
              {activeBreakdownValue || "All"} Projects
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeBreakdownValue
                ? `${listProjects.length} project${listProjects.length !== 1 ? "s" : ""} found`
                : "Grouped overview"}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {!activeBreakdownValue && <GroupByToggle current={groupBy} />}
            <ProjectFilters sectors={sectors} />
          </div>
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
          {activeBreakdownValue ? (
            <ProjectList projects={listProjects} />
          ) : overviewGroups ? (
            <OverviewGroups groups={overviewGroups} groupBy={groupBy} />
          ) : null}
        </Suspense>
      </section>
    </div>
  );
}
