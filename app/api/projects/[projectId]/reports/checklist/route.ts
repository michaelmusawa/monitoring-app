// app/api/projects/[projectId]/reports/checklist/route.ts
import { NextResponse } from "next/server";
import { safeQuery, DatabaseError } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const { rows: clRows } = await safeQuery<any>(
      `SELECT TOP 1 id, status, version, lastModifiedBy, lastModified, editReason
       FROM Checklist WHERE projectId = @p1`,
      [projectId],
    );
    if (clRows.length === 0) {
      return NextResponse.json(
        { error: "No checklist found" },
        { status: 404 },
      );
    }
    const cl = clRows[0];

    const { rows: itemRows } = await safeQuery<any>(
      `SELECT parameterId, label, category, weight
       FROM ChecklistItem
       WHERE checklistId = @p1 AND weight > 0
       ORDER BY category, parameterId`,
      [cl.id],
    );

    // Group by category
    const catMap: Record<
      string,
      { name: string; items: any[]; totalWeight: number }
    > = {};
    for (const item of itemRows) {
      if (!catMap[item.category]) {
        catMap[item.category] = {
          name: item.category,
          items: [],
          totalWeight: 0,
        };
      }
      catMap[item.category].items.push({
        parameterId: item.parameterId,
        label: item.label,
        weight: item.weight,
      });
      catMap[item.category].totalWeight += item.weight;
    }

    const { rows: historyRows } = await safeQuery<any>(
      `SELECT id, status, changedBy, reason, createdAt
       FROM ChecklistHistory
       WHERE projectId = @p1
       ORDER BY createdAt ASC`,
      [projectId],
    );

    return NextResponse.json({
      checklist: {
        status: cl.status,
        version: cl.version,
        lastModifiedBy: cl.lastModifiedBy,
        lastModified: cl.lastModified?.toISOString(),
        editReason: cl.editReason ?? null,
      },
      history: historyRows.map((h: any) => ({
        id: h.id.toString(),
        status: h.status,
        changedBy: h.changedBy,
        reason: h.reason ?? null,
        createdAt: h.createdAt?.toISOString(),
      })),
      categories: Object.values(catMap),
      totalWeight: itemRows.reduce((s: number, i: any) => s + i.weight, 0),
      totalItems: itemRows.length,
    });
  } catch (error) {
    console.error("GET reports/checklist error:", error);
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: "Database error" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to generate checklist report" },
      { status: 500 },
    );
  }
}
