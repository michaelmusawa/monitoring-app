"use server";

import sql from "mssql";
import { DatabaseError, pool, poolConnect, safeQuery } from "@/lib/db";

export async function withTransaction<T>(
  callback: (trx: sql.Transaction) => Promise<T>,
): Promise<T> {
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  parameterId: string;
  weight: number;
  label: string;
  category: string;
}

/**
 * A per-task annotation created by the ME officer when sending back.
 * Stored as JSON in Checklist.taskAnnotations column.
 */
export interface TaskAnnotation {
  parameterId: string;
  oldValue: number;
  newValue: number;
  reason: string;
}

export interface Checklist {
  id: string;
  projectId: string;
  status: string;
  version: number;
  lastModified: string;
  lastModifiedBy: string;
  editReason?: string;
  items: ChecklistItem[];
  taskAnnotations: TaskAnnotation[];
}

// ─── Fetch checklist for a project ───────────────────────────────────────────

export async function getChecklist(
  projectId: string,
): Promise<Checklist | null> {
  try {
    const sqlQuery = `
      SELECT
        c.id,
        c.status,
        c.version,
        c.lastModified,
        c.lastModifiedBy,
        c.editReason,
        c.taskAnnotations,
        ci.id         AS itemId,
        ci.parameterId,
        ci.weight,
        ci.label,
        ci.category
      FROM Checklist c
      LEFT JOIN ChecklistItem ci ON ci.checklistId = c.id
      WHERE c.projectId = @p1
      ORDER BY ci.id
    `;
    const { rows } = await safeQuery<any>(sqlQuery, [projectId]);
    if (rows.length === 0) return null;

    let taskAnnotations: TaskAnnotation[] = [];
    if (rows[0].taskAnnotations) {
      try {
        taskAnnotations = JSON.parse(rows[0].taskAnnotations);
      } catch {
        taskAnnotations = [];
      }
    }

    const checklist: Checklist = {
      id: rows[0].id.toString(),
      projectId,
      status: rows[0].status,
      version: rows[0].version,
      lastModified:
        rows[0].lastModified?.toISOString() || new Date().toISOString(),
      lastModifiedBy: rows[0].lastModifiedBy,
      editReason: rows[0].editReason,
      taskAnnotations,
      items: [],
    };

    for (const row of rows) {
      if (row.itemId) {
        checklist.items.push({
          id: row.itemId.toString(),
          parameterId: row.parameterId,
          weight: row.weight,
          label: row.label,
          category: row.category,
        });
      }
    }
    return checklist;
  } catch (error) {
    console.error("getChecklist error:", error);
    throw new DatabaseError();
  }
}

// ─── Fetch template by sector ─────────────────────────────────────────────────

export async function getTemplateBySector(sector: string): Promise<any[]> {
  try {
    const sqlQuery = `
      SELECT
        t.id  AS templateId,
        c.id  AS categoryId,
        c.name AS categoryName,
        tk.id AS taskId,
        tk.name AS taskLabel
      FROM Template t
      LEFT JOIN Category c  ON c.templateId = t.id
      LEFT JOIN Task     tk ON tk.categoryId = c.id
      WHERE t.name = @p1
    `;
    const { rows } = await safeQuery<any>(sqlQuery, [sector]);
    const categoriesMap = new Map();
    for (const row of rows) {
      if (!row.categoryId) continue;
      if (!categoriesMap.has(row.categoryId)) {
        categoriesMap.set(row.categoryId, {
          id: row.categoryId.toString(),
          name: row.categoryName,
          tasks: [],
        });
      }
      if (row.taskId) {
        categoriesMap.get(row.categoryId).tasks.push({
          id: row.taskId.toString(),
          label: row.taskLabel,
        });
      }
    }
    return Array.from(categoriesMap.values());
  } catch (error) {
    console.error("getTemplateBySector error:", error);
    throw new DatabaseError();
  }
}

// ─── Create checklist ─────────────────────────────────────────────────────────

export async function createChecklist({
  projectId,
  createdBy,
}: {
  projectId: string;
  createdBy: string;
}): Promise<Checklist> {
  return await withTransaction(async (trx) => {
    const insertHeader = new sql.Request(trx);
    insertHeader.input("projectId", sql.NVarChar, projectId);
    insertHeader.input("status", sql.NVarChar, "Draft");
    insertHeader.input("lastModifiedBy", sql.NVarChar, createdBy);
    const result = await insertHeader.query(`
      INSERT INTO Checklist (projectId, status, version, lastModifiedBy, createdAt, lastModified, taskAnnotations)
      OUTPUT INSERTED.id
      VALUES (@projectId, @status, 1, @lastModifiedBy, GETDATE(), GETDATE(), NULL)
    `);
    const checklistId = result.recordset[0].id;

    await addHistoryEntry(
      trx,
      checklistId,
      "Draft",
      createdBy,
      "Checklist created",
    );

    return {
      id: checklistId.toString(),
      projectId,
      status: "Draft",
      version: 1,
      lastModified: new Date().toISOString(),
      lastModifiedBy: createdBy,
      taskAnnotations: [],
      items: [],
    };
  });
}

// ─── Save checklist ───────────────────────────────────────────────────────────

export async function saveChecklist(
  checklistId: string,
  data: {
    status: string;
    items: {
      parameterId: string;
      weight: number;
      label: string;
      category: string;
    }[];
    lastModifiedBy: string;
    /**
     * Per-task annotations from the ME officer.
     * Only present when sending back (status goes to a previous phase).
     * Cleared (empty array) when the ME approves forward.
     */
    taskAnnotations?: TaskAnnotation[];
  },
): Promise<Checklist> {
  const numericId = parseInt(checklistId, 10);
  if (isNaN(numericId)) throw new Error("Invalid checklist ID");

  return await withTransaction(async (trx) => {
    // 1. Get current status for history
    const getStatusReq = new sql.Request(trx);
    getStatusReq.input("id", sql.Int, numericId);
    const statusResult = await getStatusReq.query(
      "SELECT status FROM Checklist WHERE id = @id",
    );
    const oldStatus = statusResult.recordset[0]?.status;

    // 2. Determine taskAnnotations to persist
    //    • Sending back  → persist the new annotations from ME officer
    //    • Approving forward / sector saves → clear annotations
    const isSendingBack = isSendBackTransition(oldStatus, data.status);
    const annotationsToStore = isSendingBack
      ? (data.taskAnnotations ?? [])
      : [];

    const annotationsJson =
      annotationsToStore.length > 0 ? JSON.stringify(annotationsToStore) : null;

    // 3. Update checklist header
    const updateHeader = new sql.Request(trx);
    updateHeader.input("id", sql.Int, numericId);
    updateHeader.input("status", sql.NVarChar, data.status);
    updateHeader.input("lastModifiedBy", sql.NVarChar, data.lastModifiedBy);
    updateHeader.input("taskAnnotations", sql.NVarChar, annotationsJson);
    await updateHeader.query(`
      UPDATE Checklist
      SET status           = @status,
          version          = version + 1,
          lastModified     = GETDATE(),
          lastModifiedBy   = @lastModifiedBy,
          taskAnnotations  = @taskAnnotations,
          editReason       = NULL
      WHERE id = @id
    `);

    // 4. Delete old items
    const deleteItems = new sql.Request(trx);
    deleteItems.input("checklistId", sql.Int, numericId);
    await deleteItems.query(
      "DELETE FROM ChecklistItem WHERE checklistId = @checklistId",
    );

    // 5. Insert new items
    for (const item of data.items) {
      if (item.weight > 0) {
        const insertItem = new sql.Request(trx);
        insertItem.input("checklistId", sql.Int, numericId);
        insertItem.input("parameterId", sql.NVarChar, item.parameterId);
        insertItem.input("weight", sql.Int, item.weight);
        insertItem.input("label", sql.NVarChar, item.label);
        insertItem.input("category", sql.NVarChar, item.category);
        await insertItem.query(`
          INSERT INTO ChecklistItem (checklistId, parameterId, weight, label, category)
          VALUES (@checklistId, @parameterId, @weight, @label, @category)
        `);
      }
    }

    // 6. Record history
    if (oldStatus !== data.status) {
      const historyReason =
        annotationsToStore.length > 0
          ? `Sent back with ${annotationsToStore.length} task change(s)`
          : undefined;

      await addHistoryEntry(
        trx,
        numericId,
        data.status,
        data.lastModifiedBy,
        historyReason,
        {
          items: data.items,
          taskAnnotations: annotationsToStore,
        },
      );
    }

    // 7. Return updated checklist
    const fetchReq = new sql.Request(trx);
    fetchReq.input("id", sql.Int, numericId);
    const fetchResult = await fetchReq.query(`
      SELECT
        c.id, c.status, c.version, c.lastModified,
        c.lastModifiedBy, c.editReason, c.taskAnnotations,
        ci.id AS itemId, ci.parameterId, ci.weight, ci.label, ci.category
      FROM Checklist c
      LEFT JOIN ChecklistItem ci ON ci.checklistId = c.id
      WHERE c.id = @id
      ORDER BY ci.id
    `);

    const rows = fetchResult.recordset;
    let parsedAnnotations: TaskAnnotation[] = [];
    if (rows[0]?.taskAnnotations) {
      try {
        parsedAnnotations = JSON.parse(rows[0].taskAnnotations);
      } catch {
        parsedAnnotations = [];
      }
    }

    const updated: Checklist = {
      id: rows[0].id.toString(),
      projectId: "", // filled by caller via API route
      status: rows[0].status,
      version: rows[0].version,
      lastModified:
        rows[0].lastModified?.toISOString() ?? new Date().toISOString(),
      lastModifiedBy: rows[0].lastModifiedBy,
      editReason: rows[0].editReason,
      taskAnnotations: parsedAnnotations,
      items: [],
    };

    for (const row of rows) {
      if (row.itemId) {
        updated.items.push({
          id: row.itemId.toString(),
          parameterId: row.parameterId,
          weight: row.weight,
          label: row.label,
          category: row.category,
        });
      }
    }

    return updated;
  });
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getChecklistHistory(checklistId: string) {
  try {
    const { rows } = await safeQuery<any>(
      `SELECT id, status, changedBy, reason, snapshot, createdAt
       FROM ChecklistHistory
       WHERE checklistId = @p1
       ORDER BY createdAt DESC`,
      [checklistId],
    );
    return rows.map((r: any) => ({
      id: r.id.toString(),
      status: r.status,
      changedBy: r.changedBy,
      reason: r.reason,
      createdAt: r.createdAt?.toISOString(),
    }));
  } catch (error) {
    console.error("getChecklistHistory error:", error);
    throw new DatabaseError();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true when the transition is a "send back" (ME → previous phase).
 */
function isSendBackTransition(from: string, to: string): boolean {
  const SEND_BACK: Record<string, string> = {
    DraftReview: "Draft",
    WeightsReview: "WeightsAssignment",
  };
  return SEND_BACK[from] === to;
}

async function addHistoryEntry(
  trx: sql.Transaction,
  checklistId: number,
  status: string,
  changedBy: string,
  reason?: string,
  snapshot?: any,
) {
  const req = new sql.Request(trx);
  req.input("checklistId", sql.Int, checklistId);
  req.input("status", sql.NVarChar, status);
  req.input("changedBy", sql.NVarChar, changedBy);
  req.input("reason", sql.NVarChar, reason || null);
  req.input(
    "snapshot",
    sql.NVarChar,
    snapshot ? JSON.stringify(snapshot) : null,
  );
  await req.query(`
    INSERT INTO ChecklistHistory (checklistId, status, changedBy, reason, snapshot, createdAt)
    VALUES (@checklistId, @status, @changedBy, @reason, @snapshot, GETDATE())
  `);
}
