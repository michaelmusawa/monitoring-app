// app/api/projects/[projectId]/reports/summary/route.ts
import { NextResponse } from "next/server";
import { safeQuery, DatabaseError } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const { rows: projectRows } = await safeQuery<any>(
      `SELECT id, name, status, sector, description, createdAt
       FROM Project WHERE id = @p1`,
      [projectId],
    );
    if (projectRows.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const project = projectRows[0];

    const { rows: clRows } = await safeQuery<any>(
      `SELECT TOP 1 id, status FROM Checklist WHERE projectId = @p1`,
      [projectId],
    );
    const cl = clRows[0] ?? null;

    let checklistData = null;
    if (cl) {
      const { rows: itemRows } = await safeQuery<any>(
        `SELECT weight FROM ChecklistItem WHERE checklistId = @p1`,
        [cl.id],
      );
      const selectedItems = itemRows.filter((i: any) => i.weight > 0);
      checklistData = {
        status: cl.status,
        totalItems: itemRows.length,
        selectedItems: selectedItems.length,
        totalWeight: selectedItems.reduce(
          (s: number, i: any) => s + i.weight,
          0,
        ),
      };
    }

    const { rows: trackerRows } = await safeQuery<any>(
      `SELECT TOP 1 id, overallPercent, submittedAt
       FROM TrackerSubmission
       WHERE projectId = @p1
       ORDER BY submittedAt DESC`,
      [projectId],
    );
    const latestTracker = trackerRows[0] ?? null;

    let latestTrackerData = null;
    if (latestTracker) {
      const { rows: tiRows } = await safeQuery<any>(
        `SELECT percentComplete FROM TrackerSubmissionItem WHERE submissionId = @p1`,
        [latestTracker.id],
      );
      latestTrackerData = {
        overallPercent: latestTracker.overallPercent,
        submittedAt: latestTracker.submittedAt?.toISOString(),
        completedItems: tiRows.filter((i: any) => i.percentComplete >= 100)
          .length,
        totalItems: tiRows.length,
      };
    }

    const { rows: countRows } = await safeQuery<any>(
      `SELECT COUNT(*) as cnt FROM TrackerSubmission WHERE projectId = @p1`,
      [projectId],
    );

    const { rows: wpRows } = await safeQuery<any>(
      `SELECT
         COUNT(*) as totalItems,
         SUM(CASE WHEN plannedStartDate IS NOT NULL AND plannedEndDate IS NOT NULL THEN 1 ELSE 0 END) as datedItems,
         MIN(plannedStartDate) as plannedStart,
         MAX(plannedEndDate) as plannedEnd
       FROM WorkplanItem WHERE projectId = @p1`,
      [projectId],
    );
    const wp = wpRows[0];

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        sector: project.sector,
        description: project.description ?? null,
        createdAt: project.createdAt?.toISOString(),
      },
      checklist: checklistData,
      latestTracker: latestTrackerData,
      workplan: {
        totalItems: wp?.totalItems ?? 0,
        datedItems: wp?.datedItems ?? 0,
        plannedStart: wp?.plannedStart?.toISOString() ?? null,
        plannedEnd: wp?.plannedEnd?.toISOString() ?? null,
      },
      trackerCount: countRows[0]?.cnt ?? 0,
    });
  } catch (error) {
    console.error("GET reports/summary error:", error);
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: "Database error" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to generate summary report" },
      { status: 500 },
    );
  }
}
