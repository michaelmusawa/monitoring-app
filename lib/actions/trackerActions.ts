"use server";

import sql from "mssql";
import { DatabaseError, safeQuery } from "@/lib/db";

import { revalidatePath } from "next/cache";
import { withTransaction } from "./checklistActions";

export interface TrackerSubmissionItem {
  parameterId: string;
  weight: number;
  label: string;
  category: string;
  status: string;
  percentComplete: number;
  challenges?: string;
  recommendations?: string;
  attachments?: string[] | null;
}

export interface TrackerSubmission {
  id: string;
  projectId: string;
  title: string;
  submittedBy: string;
  submittedAt: string;
  overallPercent: number;
  items: TrackerSubmissionItem[];
}

// -----------------------------------------------------------------------------
// Fetch all tracker submissions for a project
// -----------------------------------------------------------------------------
export async function getTrackerSubmissions(
  projectId: string,
): Promise<TrackerSubmission[]> {
  try {
    const sqlQuery = `
      SELECT
        ts.id,
        ts.title,
        ts.submittedBy,
        ts.submittedAt,
        ts.overallPercent,
        tsi.id AS itemId,
        tsi.parameterId,
        tsi.weight,
        tsi.label,
        tsi.category,
        tsi.status,
        tsi.percentComplete,
        tsi.challenges,
        tsi.recommendations,
        tsi.attachments
      FROM TrackerSubmission ts
      LEFT JOIN TrackerSubmissionItem tsi ON tsi.submissionId = ts.id
      WHERE ts.projectId = @p1
      ORDER BY ts.submittedAt DESC, tsi.id
    `;
    const { rows } = await safeQuery<any>(sqlQuery, [projectId]);

    const submissionMap = new Map<number, TrackerSubmission>();
    for (const row of rows) {
      const sid = row.id;
      if (!submissionMap.has(sid)) {
        submissionMap.set(sid, {
          id: sid.toString(),
          projectId: projectId,
          title: row.title,
          submittedBy: row.submittedBy,
          submittedAt:
            row.submittedAt?.toISOString() || new Date().toISOString(),
          overallPercent: row.overallPercent,
          items: [],
        });
      }
      if (row.itemId) {
        const sub = submissionMap.get(sid)!;
        sub.items.push({
          parameterId: row.parameterId,
          weight: row.weight,
          label: row.label,
          category: row.category,
          status: row.status,
          percentComplete: row.percentComplete,
          challenges: row.challenges,
          recommendations: row.recommendations,
          attachments: row.attachments ? JSON.parse(row.attachments) : null,
        });
      }
    }
    return Array.from(submissionMap.values());
  } catch (error) {
    console.error("getTrackerSubmissions error:", error);
    throw new DatabaseError();
  }
}

// -----------------------------------------------------------------------------
// Create a new tracker submission.
//
// If `data.items` is provided and non-empty, those items are used directly
// (the client already built them from the checklist + previous tracker values).
// Otherwise, falls back to fetching the latest approved checklist from the DB.
// -----------------------------------------------------------------------------
export async function createTrackerSubmission(
  projectId: string,
  data: {
    title: string;
    submittedBy: string;
    /** Pre-built items from the client. When present, no DB checklist fetch needed. */
    items?: TrackerSubmissionItem[];
  },
): Promise<TrackerSubmission> {
  // ── Resolve items ─────────────────────────────────────────────────────────
  let items: TrackerSubmissionItem[];

  if (data.items && data.items.length > 0) {
    items = data.items;
  } else {
    // Fallback: fetch approved checklist from DB
    const checklistRes = await safeQuery<any>(
      `SELECT ci.parameterId, ci.weight, ci.label, ci.category
       FROM Checklist c
       JOIN ChecklistItem ci ON ci.checklistId = c.id
       WHERE c.projectId = @p1 AND c.status = 'Approved'
       ORDER BY ci.id`,
      [projectId],
    );

    if (checklistRes.rows.length === 0) {
      throw new Error("No approved checklist found for this project");
    }

    items = checklistRes.rows.map((ci: any) => ({
      parameterId: ci.parameterId,
      weight: ci.weight,
      label: ci.label,
      category: ci.category,
      status: "ONGOING",
      percentComplete: 0,
      challenges: "",
      recommendations: "",
      attachments: null,
    }));
  }

  // ── Compute weighted overall ──────────────────────────────────────────────
  const totalWeight = items.reduce((s, it) => s + it.weight, 0);
  const overallPercent =
    totalWeight > 0
      ? items.reduce((s, it) => s + it.weight * it.percentComplete, 0) /
        totalWeight
      : 0;

  // ── Persist ───────────────────────────────────────────────────────────────
  return await withTransaction(async (trx) => {
    const insertSub = new sql.Request(trx);
    insertSub.input("projectId", sql.NVarChar, projectId);
    insertSub.input("title", sql.NVarChar, data.title);
    insertSub.input("submittedBy", sql.NVarChar, data.submittedBy);
    insertSub.input("overallPercent", sql.Float, overallPercent);
    const subResult = await insertSub.query(`
      INSERT INTO TrackerSubmission (projectId, title, submittedBy, overallPercent)
      OUTPUT INSERTED.id, INSERTED.submittedAt
      VALUES (@projectId, @title, @submittedBy, @overallPercent)
    `);
    const { id: submissionId, submittedAt } = subResult.recordset[0];

    for (const item of items) {
      const insertItem = new sql.Request(trx);
      insertItem.input("submissionId", sql.Int, submissionId);
      insertItem.input("parameterId", sql.NVarChar, item.parameterId);
      insertItem.input("weight", sql.Int, item.weight);
      insertItem.input("label", sql.NVarChar, item.label);
      insertItem.input("category", sql.NVarChar, item.category);
      insertItem.input("status", sql.NVarChar, item.status ?? "ONGOING");
      insertItem.input("percentComplete", sql.Int, item.percentComplete ?? 0);
      insertItem.input("challenges", sql.NVarChar, item.challenges || null);
      insertItem.input(
        "recommendations",
        sql.NVarChar,
        item.recommendations || null,
      );
      insertItem.input(
        "attachments",
        sql.NVarChar,
        item.attachments ? JSON.stringify(item.attachments) : null,
      );
      await insertItem.query(`
        INSERT INTO TrackerSubmissionItem
          (submissionId, parameterId, weight, label, category, status, percentComplete, challenges, recommendations, attachments)
        VALUES (@submissionId, @parameterId, @weight, @label, @category, @status, @percentComplete, @challenges, @recommendations, @attachments)
      `);
    }

    revalidatePath(`/projects/${projectId}`);

    return {
      id: submissionId.toString(),
      projectId,
      title: data.title,
      submittedBy: data.submittedBy,
      submittedAt: submittedAt?.toISOString() ?? new Date().toISOString(),
      overallPercent,
      items,
    };
  });
}

// -----------------------------------------------------------------------------
// Update a tracker submission (replace items)
// -----------------------------------------------------------------------------
export async function updateTrackerSubmission(
  submissionId: string,
  data: {
    title: string;
    items: TrackerSubmissionItem[];
    lastModifiedBy: string;
  },
): Promise<void> {
  const numericId = parseInt(submissionId, 10);
  if (isNaN(numericId)) throw new Error("Invalid submission ID");

  const totalWeight = data.items.reduce((sum, it) => sum + it.weight, 0);
  const weightedSum = data.items.reduce(
    (sum, it) => sum + it.weight * it.percentComplete,
    0,
  );
  const overallPercent = totalWeight > 0 ? weightedSum / totalWeight : 0;

  await withTransaction(async (trx) => {
    const updateHeader = new sql.Request(trx);
    updateHeader.input("id", sql.Int, numericId);
    updateHeader.input("title", sql.NVarChar, data.title);
    updateHeader.input("overallPercent", sql.Float, overallPercent);
    updateHeader.input("submittedBy", sql.NVarChar, data.lastModifiedBy);
    await updateHeader.query(`
      UPDATE TrackerSubmission
      SET title = @title,
          overallPercent = @overallPercent,
          submittedBy = @submittedBy,
          updatedAt = GETDATE()
      WHERE id = @id
    `);

    const deleteItems = new sql.Request(trx);
    deleteItems.input("submissionId", sql.Int, numericId);
    await deleteItems.query(
      "DELETE FROM TrackerSubmissionItem WHERE submissionId = @submissionId",
    );

    for (const item of data.items) {
      const insertItem = new sql.Request(trx);
      insertItem.input("submissionId", sql.Int, numericId);
      insertItem.input("parameterId", sql.NVarChar, item.parameterId);
      insertItem.input("weight", sql.Int, item.weight);
      insertItem.input("label", sql.NVarChar, item.label);
      insertItem.input("category", sql.NVarChar, item.category);
      insertItem.input("status", sql.NVarChar, item.status);
      insertItem.input("percentComplete", sql.Int, item.percentComplete);
      insertItem.input("challenges", sql.NVarChar, item.challenges || null);
      insertItem.input(
        "recommendations",
        sql.NVarChar,
        item.recommendations || null,
      );
      insertItem.input(
        "attachments",
        sql.NVarChar,
        item.attachments ? JSON.stringify(item.attachments) : null,
      );
      await insertItem.query(`
        INSERT INTO TrackerSubmissionItem
          (submissionId, parameterId, weight, label, category, status, percentComplete, challenges, recommendations, attachments)
        VALUES (@submissionId, @parameterId, @weight, @label, @category, @status, @percentComplete, @challenges, @recommendations, @attachments)
      `);
    }
  });

  revalidatePath(`/projects/${data.items[0]?.projectId ?? ""}`);
}
