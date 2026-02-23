// app/api/projects/[projectId]/reports/tracker-progress/route.ts
import { NextResponse } from "next/server";
import { safeQuery, DatabaseError } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    // All submissions ordered oldest → newest
    const { rows: subRows } = await safeQuery<any>(
      `SELECT id, title, submittedBy, submittedAt, overallPercent
       FROM TrackerSubmission
       WHERE projectId = @p1
       ORDER BY submittedAt ASC`,
      [projectId],
    );

    // Fetch items for every submission in one query, then group in JS
    // (avoids N+1 round-trips for large submission counts)
    let allItems: any[] = [];
    if (subRows.length > 0) {
      const ids = subRows.map((s: any) => `'${s.id}'`).join(",");
      const { rows } = await safeQuery<any>(
        `SELECT submissionId, status, percentComplete, category
         FROM TrackerSubmissionItem
         WHERE submissionId IN (${ids})`,
        [],
      );
      allItems = rows;
    }

    // Group items by submissionId
    const itemsBySubmission: Record<string, any[]> = {};
    for (const item of allItems) {
      const sid = item.submissionId.toString();
      if (!itemsBySubmission[sid]) itemsBySubmission[sid] = [];
      itemsBySubmission[sid].push(item);
    }

    const submissions = subRows.map((sub: any) => {
      const sid = sub.id.toString();
      const items = itemsBySubmission[sid] ?? [];
      return {
        id: sid,
        title: sub.title,
        submittedBy: sub.submittedBy,
        submittedAt: sub.submittedAt?.toISOString(),
        overallPercent: sub.overallPercent,
        completedCount: items.filter((i) => i.status === "COMPLETED").length,
        stalledCount: items.filter((i) => i.status === "STALLED").length,
        ongoingCount: items.filter((i) => i.status === "ONGOING").length,
        totalItems: items.length,
      };
    });

    // Category breakdown from the latest submission
    let categories: { name: string; latestPercent: number }[] = [];
    if (subRows.length > 0) {
      const latestId = subRows[subRows.length - 1].id;
      const { rows: catRows } = await safeQuery<any>(
        `SELECT category, AVG(CAST(percentComplete AS FLOAT)) as avgPercent
         FROM TrackerSubmissionItem
         WHERE submissionId = @p1
         GROUP BY category
         ORDER BY category`,
        [latestId],
      );
      categories = catRows.map((r: any) => ({
        name: r.category,
        latestPercent: Math.round(r.avgPercent * 10) / 10,
      }));
    }

    // Project complete check (latest submission)
    let projectComplete = false;
    if (subRows.length > 0) {
      const latestId = subRows[subRows.length - 1].id;
      const { rows: cc } = await safeQuery<any>(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN percentComplete >= 100 THEN 1 ELSE 0 END) as completed
         FROM TrackerSubmissionItem WHERE submissionId = @p1`,
        [latestId],
      );
      projectComplete = cc[0]?.total > 0 && cc[0]?.total === cc[0]?.completed;
    }

    return NextResponse.json({ submissions, categories, projectComplete });
  } catch (error) {
    console.error("GET reports/tracker-progress error:", error);
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: "Database error" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to generate tracker progress report" },
      { status: 500 },
    );
  }
}
