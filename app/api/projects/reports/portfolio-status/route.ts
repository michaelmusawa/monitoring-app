// app/api/reports/portfolio-status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getDashboardStats,
  getCIDPPerformance,
  getFiscalYears,
} from "@/lib/actions/dashboardActions";
import { safeQuery } from "@/lib/db";
import { buildUnitLookup, getRootUnitName } from "@/lib/actions/orgActions";

// ... existing imports and auth check ...

export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const unitLookup = await buildUnitLookup();

    const { rows: projects } = await safeQuery<any>(
      `SELECT p.id, p.name, p.projectType, p.orgUnitId, p.status, p.budget,
              p.fiscalYear,
              t.overallPercent AS latestTrackerPercent,
              t.submittedAt AS latestTrackerDate
       FROM Project p
       LEFT JOIN (
         SELECT projectId, overallPercent, submittedAt,
                ROW_NUMBER() OVER (PARTITION BY projectId ORDER BY submittedAt DESC) AS rn
         FROM TrackerSubmission
       ) t ON p.id = t.projectId AND t.rn = 1
       WHERE p.status != 'ARCHIVED'`,
      [],
    );

    // Status computation (simplified for portfolio; no STALLED time‑based logic)
    function computeStatus(dbStatus: string, percent: number): string {
      if (dbStatus === "TERMINATED") return "Terminated";
      if (dbStatus === "COMPLETED" || percent >= 100) return "Completed";
      if (percent > 0) return "Ongoing";
      return "Not Started";
    }

    // Map to root sector
    const sectorMap = new Map<string, any[]>();
    const stalledProjectsList: any[] = [];

    for (const p of projects) {
      const rootSector = p.orgUnitId
        ? await getRootUnitName(p.orgUnitId, unitLookup)
        : "Unknown";
      const percent = p.latestTrackerPercent ?? 0;
      const status = computeStatus(p.status, percent);
      const proj = {
        id: p.id,
        name: p.name,
        type: p.projectType, // 'HARD' or 'SOFT'
        sector: rootSector,
        status,
        budget: p.budget,
        fiscalYear: p.fiscalYear,
      };

      if (!sectorMap.has(rootSector)) sectorMap.set(rootSector, []);
      sectorMap.get(rootSector)!.push(proj);

      if (status === "Stalled") {
        stalledProjectsList.push(proj);
      }
    }

    // Aggregate sectors
    // Aggregate sectors (keep existing code)
    const sectors = Array.from(sectorMap.entries()).map(([sector, projs]) => {
      const total = projs.length;
      const hard = projs.filter((p) => p.type === "HARD");
      const soft = projs.filter((p) => p.type === "SOFT");
      const completed = projs.filter((p) => p.status === "Completed").length;
      const ongoing = projs.filter((p) => p.status === "Ongoing").length;
      const stalled = projs.filter((p) => p.status === "Stalled").length;
      const terminated = projs.filter((p) => p.status === "Terminated").length;
      return {
        sector,
        total,
        hardTotal: hard.length,
        softTotal: soft.length,
        completed,
        ongoing,
        stalled,
        terminated,
        completionRate: total ? ((completed / total) * 100).toFixed(1) : "0.0",
      };
    });

    // Compute overall from sector aggregates (FIXED)
    const total = projects.length;
    const hardTotal = projects.filter((p) => p.projectType === "HARD").length;
    const softTotal = projects.filter((p) => p.projectType === "SOFT").length;
    const completed = sectors.reduce((sum, s) => sum + s.completed, 0);
    const ongoing = sectors.reduce((sum, s) => sum + s.ongoing, 0);
    const stalled = sectors.reduce((sum, s) => sum + s.stalled, 0);
    const terminated = sectors.reduce((sum, s) => sum + s.terminated, 0);

    // Sort stalled list by sector then name
    stalledProjectsList.sort(
      (a, b) =>
        a.sector.localeCompare(b.sector) || a.name.localeCompare(b.name),
    );

    return NextResponse.json({
      overall: {
        total,
        hardTotal,
        softTotal,
        completed,
        ongoing,
        stalled,
        terminated,
      },
      sectors,
      stalledProjects: stalledProjectsList,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Portfolio status report error:", error);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
