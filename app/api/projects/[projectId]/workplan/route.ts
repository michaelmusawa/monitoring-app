import { NextResponse } from "next/server";
import { safeQuery, DatabaseError } from "@/lib/db";

import sql from "mssql";
import { withTransaction } from "@/lib/actions/checklistActions";

// -----------------------------------------------------------------------------
// GET /api/projects/[projectId]/workplan
// Returns all workplan items for the project (dates as YYYY-MM-DD strings)
// -----------------------------------------------------------------------------
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const sqlQuery = `
      SELECT
        id,
        parameterId,
        label,
        category,
        weight,
        CONVERT(VARCHAR(10), plannedStartDate, 23) as plannedStartDate,
        CONVERT(VARCHAR(10), plannedEndDate, 23) as plannedEndDate,
        createdAt,
        updatedAt
      FROM WorkplanItem
      WHERE projectId = @p1
      ORDER BY category, plannedStartDate
    `;
    const { rows } = await safeQuery<any>(sqlQuery, [projectId]);
    // Convert to camelCase for client
    const items = rows.map((row) => ({
      id: row.id.toString(),
      parameterId: row.parameterId,
      label: row.label,
      category: row.category,
      weight: row.weight,
      plannedStartDate: row.plannedStartDate, // already string YYYY-MM-DD
      plannedEndDate: row.plannedEndDate,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    }));
    return NextResponse.json(items);
  } catch (error) {
    console.error("GET workplan error:", error);
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: "Database error" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to fetch workplan" },
      { status: 500 },
    );
  }
}

// -----------------------------------------------------------------------------
// PUT /api/projects/[projectId]/workplan
// Replaces all workplan items for the project (upsert based on parameterId)
// -----------------------------------------------------------------------------
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Validate each item
    for (const item of items) {
      if (!item.parameterId || !item.plannedStartDate || !item.plannedEndDate) {
        return NextResponse.json(
          {
            error:
              "Each item must have parameterId, plannedStartDate, plannedEndDate",
          },
          { status: 400 },
        );
      }
    }

    // Run upserts in a transaction
    const upserted = await withTransaction(async (trx) => {
      const results = [];

      for (const item of items) {
        // Check if exists
        const checkReq = new sql.Request(trx);
        checkReq.input("projectId", sql.NVarChar, projectId);
        checkReq.input("parameterId", sql.NVarChar, item.parameterId);
        const checkResult = await checkReq.query(
          "SELECT id FROM WorkplanItem WHERE projectId = @projectId AND parameterId = @parameterId",
        );
        const exists = checkResult.recordset.length > 0;

        if (exists) {
          // Update
          const updateReq = new sql.Request(trx);
          updateReq.input("projectId", sql.NVarChar, projectId);
          updateReq.input("parameterId", sql.NVarChar, item.parameterId);
          updateReq.input("label", sql.NVarChar, item.label || "");
          updateReq.input("category", sql.NVarChar, item.category || "");
          updateReq.input("weight", sql.Int, item.weight || 0);
          updateReq.input(
            "plannedStartDate",
            sql.Date,
            new Date(item.plannedStartDate),
          );
          updateReq.input(
            "plannedEndDate",
            sql.Date,
            new Date(item.plannedEndDate),
          );
          await updateReq.query(`
            UPDATE WorkplanItem
            SET
              label = @label,
              category = @category,
              weight = @weight,
              plannedStartDate = @plannedStartDate,
              plannedEndDate = @plannedEndDate,
              updatedAt = GETDATE()
            WHERE projectId = @projectId AND parameterId = @parameterId
          `);
        } else {
          // Insert
          const insertReq = new sql.Request(trx);
          insertReq.input("projectId", sql.NVarChar, projectId);
          insertReq.input("parameterId", sql.NVarChar, item.parameterId);
          insertReq.input("label", sql.NVarChar, item.label || "");
          insertReq.input("category", sql.NVarChar, item.category || "");
          insertReq.input("weight", sql.Int, item.weight || 0);
          insertReq.input(
            "plannedStartDate",
            sql.Date,
            new Date(item.plannedStartDate),
          );
          insertReq.input(
            "plannedEndDate",
            sql.Date,
            new Date(item.plannedEndDate),
          );
          await insertReq.query(`
            INSERT INTO WorkplanItem (projectId, parameterId, label, category, weight, plannedStartDate, plannedEndDate)
            OUTPUT INSERTED.id
            VALUES (@projectId, @parameterId, @label, @category, @weight, @plannedStartDate, @plannedEndDate)
          `);
          // we don't need the ID for response now
        }

        // For response, we'll return the item as sent (with dates as strings)
        results.push({
          ...item,
          plannedStartDate: item.plannedStartDate, // keep original string
          plannedEndDate: item.plannedEndDate,
        });
      }

      return results;
    });

    return NextResponse.json(upserted);
  } catch (error) {
    console.error("PUT workplan error:", error);
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: "Database error" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Failed to save workplan" },
      { status: 500 },
    );
  }
}
