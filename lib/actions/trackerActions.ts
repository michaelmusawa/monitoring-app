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
  challenges?: string[];
  recommendations?: string[];
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

// ─── Helper: update project status based on tracker progress ────────────────
async function updateProjectStatusAfterTracker(
  trx: sql.Transaction,
  projectId: string,
) {
  const req = new sql.Request(trx);
  req.input("projectId", sql.NVarChar, projectId);

  // Get the latest tracker's overall percent
  const latest = await req.query(
    `SELECT TOP 1 overallPercent
     FROM TrackerSubmission
     WHERE projectId = @projectId
     ORDER BY submittedAt DESC`,
  );

  if (latest.recordset.length === 0) return;
  const overall = latest.recordset[0].overallPercent as number;

  // Count how many trackers exist
  const countReq = new sql.Request(trx);
  countReq.input("projectId", sql.NVarChar, projectId);
  const countResult = await countReq.query(
    `SELECT COUNT(*) AS cnt FROM TrackerSubmission WHERE projectId = @projectId`,
  );
  const submissionCount = countResult.recordset[0].cnt as number;

  let newStatus: string | null = null;

  // First tracker → ONGOING
  if (submissionCount === 1) {
    newStatus = "ONGOING";
  }
  // All items complete (overall ≥ 100) → COMPLETED
  else if (overall >= 100) {
    newStatus = "COMPLETED";
  }

  // If previously STALLED, revert to ONGOING (only if not now completed)
  if (!newStatus) {
    const stallReq = new sql.Request(trx);
    stallReq.input("projectId", sql.NVarChar, projectId);
    const stallResult = await stallReq.query(
      `SELECT status FROM Project WHERE id = @projectId AND status = 'STALLED'`,
    );
    if (stallResult.recordset.length > 0) {
      newStatus = "ONGOING";
    }
  }

  if (newStatus) {
    const updateReq = new sql.Request(trx);
    updateReq.input("projectId", sql.NVarChar, projectId);
    updateReq.input("status", sql.NVarChar, newStatus);
    await updateReq.query(
      `UPDATE Project
       SET status = @status, updatedAt = GETDATE()
       WHERE id = @projectId AND status != @status`,
    );
  }
}

// ─── Get all tracker submissions for a project ─────────────────────────────
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

// ─── Create a new tracker submission ───────────────────────────────────────
export async function createTrackerSubmission(
  projectId: string,
  data: {
    title: string;
    submittedBy: string;
    items?: TrackerSubmissionItem[];
  },
): Promise<TrackerSubmission> {
  let items: TrackerSubmissionItem[];

  if (data.items && data.items.length > 0) {
    items = data.items;
  } else {
    // Fallback: fetch approved checklist
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
      status: "NOT_STARTED",
      percentComplete: 0,
      challenges: [], // array, not string
      recommendations: [], // array, not string
      attachments: null,
    }));
  }

  const totalWeight = items.reduce((s, it) => s + it.weight, 0);
  const overallPercent =
    totalWeight > 0
      ? items.reduce((s, it) => s + it.weight * it.percentComplete, 0) /
        totalWeight
      : 0;

  return await withTransaction(async (trx) => {
    // Insert submission header
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

    // Insert items
    for (const item of items) {
      const insertItem = new sql.Request(trx);
      insertItem.input("submissionId", sql.Int, submissionId);
      insertItem.input("parameterId", sql.NVarChar, item.parameterId);
      insertItem.input("weight", sql.Int, item.weight);
      insertItem.input("label", sql.NVarChar, item.label);
      insertItem.input("category", sql.NVarChar, item.category);
      insertItem.input("status", sql.NVarChar, item.status ?? "NOT_STARTED");
      insertItem.input("percentComplete", sql.Int, item.percentComplete ?? 0);

      // Store arrays as JSON strings
      insertItem.input(
        "challenges",
        sql.NVarChar,
        item.challenges?.length ? JSON.stringify(item.challenges) : null,
      );
      insertItem.input(
        "recommendations",
        sql.NVarChar,
        item.recommendations?.length
          ? JSON.stringify(item.recommendations)
          : null,
      );
      insertItem.input(
        "attachments",
        sql.NVarChar,
        item.attachments ? JSON.stringify(item.attachments) : null,
      );

      await insertItem.query(`
        INSERT INTO TrackerSubmissionItem
          (submissionId, parameterId, weight, label, category, status,
           percentComplete, challenges, recommendations, attachments)
        VALUES (@submissionId, @parameterId, @weight, @label, @category, @status,
                @percentComplete, @challenges, @recommendations, @attachments)
      `);
    }

    // Update project status (ONGOING on first tracker, COMPLETED when 100%, etc.)
    await updateProjectStatusAfterTracker(trx, projectId);

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
// ─── Update an existing tracker submission ────────────────────────────────
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
  const overallPercent =
    totalWeight > 0
      ? data.items.reduce(
          (sum, it) => sum + it.weight * it.percentComplete,
          0,
        ) / totalWeight
      : 0;

  await withTransaction(async (trx) => {
    // Get projectId for later status update
    const getProject = new sql.Request(trx);
    getProject.input("submissionId", sql.Int, numericId);
    const projResult = await getProject.query(
      `SELECT projectId FROM TrackerSubmission WHERE id = @submissionId`,
    );
    if (projResult.recordset.length === 0)
      throw new Error("Submission not found");
    const projectId = projResult.recordset[0].projectId as string;

    // Update header
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

    // Delete existing items
    const deleteItems = new sql.Request(trx);
    deleteItems.input("submissionId", sql.Int, numericId);
    await deleteItems.query(
      "DELETE FROM TrackerSubmissionItem WHERE submissionId = @submissionId",
    );

    // Insert new items (with JSON arrays)
    for (const item of data.items) {
      const insertItem = new sql.Request(trx);
      insertItem.input("submissionId", sql.Int, numericId);
      insertItem.input("parameterId", sql.NVarChar, item.parameterId);
      insertItem.input("weight", sql.Int, item.weight);
      insertItem.input("label", sql.NVarChar, item.label);
      insertItem.input("category", sql.NVarChar, item.category);
      insertItem.input("status", sql.NVarChar, item.status);
      insertItem.input("percentComplete", sql.Int, item.percentComplete);
      insertItem.input(
        "challenges",
        sql.NVarChar,
        item.challenges?.length ? JSON.stringify(item.challenges) : null,
      );
      insertItem.input(
        "recommendations",
        sql.NVarChar,
        item.recommendations?.length
          ? JSON.stringify(item.recommendations)
          : null,
      );
      insertItem.input(
        "attachments",
        sql.NVarChar,
        item.attachments ? JSON.stringify(item.attachments) : null,
      );
      await insertItem.query(`
        INSERT INTO TrackerSubmissionItem
          (submissionId, parameterId, weight, label, category, status,
           percentComplete, challenges, recommendations, attachments)
        VALUES (@submissionId, @parameterId, @weight, @label, @category, @status,
                @percentComplete, @challenges, @recommendations, @attachments)
      `);
    }

    // Update project status (revert STALLED, mark COMPLETED, etc.)
    await updateProjectStatusAfterTracker(trx, projectId);
  });

  revalidatePath(`/projects/${data.items[0]?.parameterId ?? ""}`);
}
