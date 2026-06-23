"use server";

import sql from "mssql";
import { DatabaseError, pool, poolConnect, safeQuery } from "@/lib/db";

async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  metadata?: any;
}) {
  try {
    await safeQuery(
      `INSERT INTO Notification (userId, type, title, message, link, metadata)
       VALUES (@p1, @p2, @p3, @p4, @p5, @p6)`,
      [
        data.userId,
        data.type,
        data.title,
        data.message,
        data.link ?? null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ],
    );
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

async function getMEOfficerIds(): Promise<string[]> {
  const { rows } = await safeQuery<{ id: string }>(
    `SELECT id FROM [User] WHERE sector = 'Monitoring And Evaluation' AND status = 'active'`,
  );
  return rows.map((r) => r.id);
}

async function getUserIdByEmail(email: string | null): Promise<string | null> {
  if (!email) return null;
  const { rows } = await safeQuery<{ id: string }>(
    `SELECT id FROM [User] WHERE email = @p1`,
    [email],
  );
  return rows[0]?.id || null;
}

async function getProjectCreator(projectId: string): Promise<string | null> {
  try {
    const { rows } = await safeQuery<{ createdBy: string }>(
      `SELECT createdBy FROM Project WHERE id = @p1`,
      [projectId],
    );
    return rows[0]?.createdBy || null;
  } catch (error) {
    console.warn(
      "Could not fetch project creator (column 'createdBy' likely missing). Notifications to sector officer will be skipped.",
      error,
    );
    return null;
  }
}

async function getProjectName(projectId: string): Promise<string> {
  const { rows } = await safeQuery<{ name: string }>(
    `SELECT name FROM Project WHERE id = @p1`,
    [projectId],
  );
  return rows[0]?.name || "a project";
}

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

export interface CustomParam {
  id: string;
  label: string;
  category: string;
  isPending: string;
  addedBy: string;
  addedAt: string;
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
  /** Custom items added by sector officer, stored in ChecklistCustomItem */
  customItems?: CustomParam[];
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

    const checklistId = rows[0].id.toString();

    const checklist: any = {
      id: checklistId,
      projectId,
      status: rows[0].status,
      version: rows[0].version,
      lastModified:
        rows[0].lastModified?.toISOString() || new Date().toISOString(),
      lastModifiedBy: rows[0].lastModifiedBy,
      editReason: rows[0].editReason,
      taskAnnotations,
      items: [],
      customItems: [],
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

    // ── Load custom items ──────────────────────────────────────────────────
    const { rows: customRows } = await safeQuery<any>(
      `SELECT id, label, category, addedBy, addedAt
       FROM ChecklistCustomItem
       WHERE checklistId = @p1
       ORDER BY addedAt`,
      [checklistId],
    );

    checklist.customItems = customRows.map((r: any) => ({
      id: r.id,
      label: r.label,
      category: r.category,
      isPending: true as const,
      addedBy: r.addedBy ?? "",
      addedAt: r.addedAt?.toISOString() ?? new Date().toISOString(),
    }));

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
    taskAnnotations?: TaskAnnotation[];
    customItemsToPromote?: CustomParam[];
    sector?: string;
  },
): Promise<Checklist> {
  const numericId = parseInt(checklistId, 10);
  if (isNaN(numericId)) throw new Error("Invalid checklist ID");

  // Transaction returns the updated checklist, oldStatus, and projectId
  const { updatedChecklist, oldStatus, projectId } = await withTransaction(
    async (trx) => {
      // 1. Get current status and projectId
      const getInfoReq = new sql.Request(trx);
      getInfoReq.input("id", sql.Int, numericId);
      const infoResult = await getInfoReq.query(
        "SELECT status, projectId FROM Checklist WHERE id = @id",
      );
      if (infoResult.recordset.length === 0)
        throw new Error("Checklist not found");
      const currentStatus = infoResult.recordset[0].status;
      const currentProjectId = infoResult.recordset[0].projectId;

      // 2. Determine annotations to store
      const isSendingBack = isSendBackTransition(currentStatus, data.status);
      const annotationsToStore = isSendingBack
        ? (data.taskAnnotations ?? [])
        : [];
      const annotationsJson =
        annotationsToStore.length > 0
          ? JSON.stringify(annotationsToStore)
          : null;

      // 3. Update header
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

      // 5. Insert new items (only weights > 0)
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

      // 6. Promote custom items to template on final approval
      // 6. Promote custom items to template on final approval
      const isApproving =
        currentStatus === "WeightsReview" && data.status === "Approved";
      if (isApproving && data.sector && data.customItemsToPromote?.length) {
        const tplReq = new sql.Request(trx);
        tplReq.input("sector", sql.NVarChar, data.sector);
        const tplResult = await tplReq.query(
          "SELECT id FROM Template WHERE name = @sector",
        );
        const templateId = tplResult.recordset[0]?.id ?? null;
        if (templateId !== null) {
          for (const cp of data.customItemsToPromote) {
            // Find or create Category
            const catLookup = new sql.Request(trx);
            catLookup.input("templateId", sql.Int, templateId);
            catLookup.input("catName", sql.NVarChar, cp.category);
            let catResult = await catLookup.query(
              "SELECT id FROM Category WHERE templateId = @templateId AND name = @catName",
            );
            let categoryId: number;
            if (catResult.recordset.length) {
              categoryId = catResult.recordset[0].id;
            } else {
              const catInsert = new sql.Request(trx);
              catInsert.input("templateId", sql.Int, templateId);
              catInsert.input("catName", sql.NVarChar, cp.category);
              const catInsertResult = await catInsert.query(`
              INSERT INTO Category (templateId, name)
              OUTPUT INSERTED.id
              VALUES (@templateId, @catName)
            `);
              categoryId = catInsertResult.recordset[0].id;
            }
            // Insert Task if not exists
            const taskCheck = new sql.Request(trx);
            taskCheck.input("categoryId", sql.Int, categoryId);
            taskCheck.input("taskName", sql.NVarChar, cp.label);
            const taskExists = await taskCheck.query(
              "SELECT id FROM Task WHERE categoryId = @categoryId AND name = @taskName",
            );
            if (taskExists.recordset.length === 0) {
              const taskInsert = new sql.Request(trx);
              taskInsert.input("categoryId", sql.Int, categoryId);
              taskInsert.input("taskName", sql.NVarChar, cp.label);
              await taskInsert.query(
                "INSERT INTO Task (categoryId, name) VALUES (@categoryId, @taskName)",
              );
            }
            // Delete from custom items
            const delCustom = new sql.Request(trx);
            delCustom.input("customId", sql.NVarChar, cp.id);
            await delCustom.query(
              "DELETE FROM ChecklistCustomItem WHERE id = @customId",
            );
          }
        }
      }

      // 7. Add history entry
      if (currentStatus !== data.status) {
        const historyReason =
          annotationsToStore.length > 0
            ? `Sent back with ${annotationsToStore.length} task change(s)`
            : isApproving && (data.customItemsToPromote?.length ?? 0) > 0
              ? `Approved — ${data.customItemsToPromote!.length} custom task(s) promoted to template`
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

      // 8. Fetch updated checklist (including custom items)
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
      const updated: any = {
        id: rows[0].id.toString(),
        projectId: currentProjectId,
        status: rows[0].status,
        version: rows[0].version,
        lastModified:
          rows[0].lastModified?.toISOString() ?? new Date().toISOString(),
        lastModifiedBy: rows[0].lastModifiedBy,
        editReason: rows[0].editReason,
        taskAnnotations: parsedAnnotations,
        items: [],
        customItems: [],
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
      const customReq = new sql.Request(trx);
      customReq.input("customChecklistId", sql.Int, numericId);
      const customResult = await customReq.query(`
          SELECT id, label, category, addedBy, addedAt
          FROM ChecklistCustomItem
          WHERE checklistId = @customChecklistId
          ORDER BY addedAt
        `);
      updated.customItems = customResult.recordset.map((r: any) => ({
        id: r.id,
        label: r.label,
        category: r.category,
        isPending: true as const,
        addedBy: r.addedBy ?? "",
        addedAt: r.addedAt?.toISOString() ?? new Date().toISOString(),
      }));
      return {
        updatedChecklist: updated,
        oldStatus: currentStatus,
        projectId: currentProjectId,
      };
    },
  );

  // Now `updatedChecklist`, `oldStatus`, `projectId` are guaranteed to be assigned
  const projectName = await getProjectName(projectId);
  const actor = data.lastModifiedBy;

  // Helper to send to sector officer (project creator)
  async function notifySector(
    type: string,
    title: string,
    message: string,
    link?: string,
    metadata?: any,
  ) {
    const creatorEmail = await getProjectCreator(projectId);
    const userId = creatorEmail ? await getUserIdByEmail(creatorEmail) : null;
    if (userId) {
      await createNotification({
        userId,
        type,
        title,
        message,
        link,
        metadata,
      });
    }
  }

  async function notifyME(
    type: string,
    title: string,
    message: string,
    link?: string,
    metadata?: any,
  ) {
    const meIds = await getMEOfficerIds();
    for (const userId of meIds) {
      await createNotification({
        userId,
        type,
        title,
        message,
        link,
        metadata,
      });
    }
  }

  // Determine transition and send notifications
  const from = oldStatus;
  const to = data.status;

  if (from === "Draft" && to === "DraftReview") {
    await notifyME(
      "checklist_submitted",
      "Checklist Ready for Review",
      `${actor} submitted the checklist for project "${projectName}" for draft review.`,
      `/projects/${projectId}?tab=checklist`,
      { projectId, transition: "draft_review" },
    );
  } else if (from === "DraftReview" && to === "WeightsAssignment") {
    await notifySector(
      "checklist_approved",
      "Checklist Draft Approved",
      `Your checklist for "${projectName}" has been approved. Proceed to assign weights.`,
      `/projects/${projectId}?tab=checklist`,
      { projectId, transition: "weights_assignment" },
    );
  } else if (from === "WeightsAssignment" && to === "WeightsReview") {
    await notifyME(
      "weights_submitted",
      "Weights Ready for Review",
      `${actor} submitted weights for project "${projectName}" for review.`,
      `/projects/${projectId}?tab=checklist`,
      { projectId, transition: "weights_review" },
    );
  } else if (from === "WeightsReview" && to === "Approved") {
    await notifySector(
      "weights_approved",
      "Weights Approved",
      `Your weights for "${projectName}" have been approved. The checklist is now finalized.`,
      `/projects/${projectId}?tab=checklist`,
      { projectId, transition: "approved" },
    );
  } else if (
    (from === "DraftReview" && to === "Draft") ||
    (from === "WeightsReview" && to === "WeightsAssignment")
  ) {
    const annotations = data.taskAnnotations ?? [];
    const reasons = annotations
      .map((a) => `${a.parameterId}: ${a.reason}`)
      .join("; ");
    await notifySector(
      "checklist_sent_back",
      "Checklist Sent Back for Changes",
      `Your checklist for "${projectName}" was sent back with the following comments: ${reasons}`,
      `/projects/${projectId}?tab=checklist`,
      { projectId, transition: "send_back", annotations },
    );
  }

  return updatedChecklist;
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
