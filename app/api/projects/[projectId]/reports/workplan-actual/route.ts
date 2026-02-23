// app/api/projects/[projectId]/reports/workplan-actual/route.ts
import { NextResponse } from "next/server";
import { safeQuery, DatabaseError } from "@/lib/db";

function daysBetween(a: string, b: string) {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
  );
}

function computeStatus(
  plannedEndDate: string,
  latestPct: number,
): "ahead" | "ontrack" | "behind" | "notstarted" {
  if (latestPct === 0) return "notstarted";
  if (latestPct >= 100) return "ahead";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today > new Date(plannedEndDate)) return "behind";
  return "ontrack";
}

const STATUS_PRIORITY: Record<string, number> = {
  behind: 3,
  notstarted: 2,
  ontrack: 1,
  ahead: 0,
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    // Workplan items
    const { rows: wpRows } = await safeQuery<any>(
      `SELECT
         parameterId, label, category, weight,
         CONVERT(VARCHAR(10), plannedStartDate, 23) as plannedStartDate,
         CONVERT(VARCHAR(10), plannedEndDate, 23) as plannedEndDate
       FROM WorkplanItem
       WHERE projectId = @p1
       ORDER BY category, plannedStartDate`,
      [projectId],
    );

    if (wpRows.length === 0) {
      return NextResponse.json({
        items: [],
        categories: [],
        overallLatestPercent: 0,
        projectPlannedStart: null,
        projectPlannedEnd: null,
        totalPlannedDays: 0,
      });
    }

    // Latest tracker submission
    const { rows: latestSubRows } = await safeQuery<any>(
      `SELECT TOP 1 id, overallPercent
       FROM TrackerSubmission
       WHERE projectId = @p1
       ORDER BY submittedAt DESC`,
      [projectId],
    );
    const latestSub = latestSubRows[0] ?? null;

    // Latest tracker items → percentComplete per parameterId
    const latestPercentMap: Record<string, number> = {};
    if (latestSub) {
      const { rows: tiRows } = await safeQuery<any>(
        `SELECT parameterId, percentComplete
         FROM TrackerSubmissionItem
         WHERE submissionId = @p1`,
        [latestSub.id],
      );
      for (const ti of tiRows) {
        latestPercentMap[ti.parameterId] = ti.percentComplete;
      }
    }

    // Build items
    const items = wpRows.map((w: any) => {
      const latestPercent = latestPercentMap[w.parameterId] ?? 0;
      return {
        parameterId: w.parameterId,
        label: w.label,
        category: w.category,
        weight: w.weight,
        plannedStartDate: w.plannedStartDate,
        plannedEndDate: w.plannedEndDate,
        plannedDays: Math.max(
          1,
          daysBetween(w.plannedStartDate, w.plannedEndDate) + 1,
        ),
        latestPercent,
        status: computeStatus(w.plannedEndDate, latestPercent),
      };
    });

    // Category rollup — worst status wins
    const catMap: Record<
      string,
      { name: string; percents: number[]; statuses: string[] }
    > = {};
    for (const item of items) {
      if (!catMap[item.category]) {
        catMap[item.category] = {
          name: item.category,
          percents: [],
          statuses: [],
        };
      }
      catMap[item.category].percents.push(item.latestPercent);
      catMap[item.category].statuses.push(item.status);
    }

    const categories = Object.values(catMap).map((cat) => {
      const avgPct =
        cat.percents.reduce((s, v) => s + v, 0) / cat.percents.length;
      const worstStatus = cat.statuses.reduce((worst, s) =>
        STATUS_PRIORITY[s] > STATUS_PRIORITY[worst] ? s : worst,
      );
      return {
        name: cat.name,
        avgLatestPercent: Math.round(avgPct * 10) / 10,
        status: worstStatus as "ahead" | "ontrack" | "behind" | "notstarted",
      };
    });

    // Project bounds
    const sortedStarts = wpRows.map((w: any) => w.plannedStartDate).sort();
    const sortedEnds = wpRows.map((w: any) => w.plannedEndDate).sort();
    const projectPlannedStart = sortedStarts[0];
    const projectPlannedEnd = sortedEnds[sortedEnds.length - 1];

    return NextResponse.json({
      items,
      categories,
      overallLatestPercent: latestSub?.overallPercent ?? 0,
      projectPlannedStart,
      projectPlannedEnd,
      totalPlannedDays: Math.max(
        1,
        daysBetween(projectPlannedStart, projectPlannedEnd) + 1,
      ),
    });
  } catch (error) {
    console.error("GET reports/workplan-actual error:", error);
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: "Database error" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to generate workplan vs actual report" },
      { status: 500 },
    );
  }
}
