"use server";

import sql from "mssql";
import { DatabaseError, pool, poolConnect, safeQuery } from "@/lib/db";

import { revalidatePath } from "next/cache";

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

// Types (re‑export or define)
export interface ChecklistItem {
  id: string;
  parameterId: string;
  weight: number;
  label: string;
  category: string;
}

export interface Checklist {
  id: string;
  projectId: string; // string representation of projectId
  status: string;
  version: number;
  lastModified: string;
  lastModifiedBy: string;
  editReason?: string;
  items: ChecklistItem[];
}

// -----------------------------------------------------------------------------
// Fetch checklist for a project
// -----------------------------------------------------------------------------
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
        ci.id AS itemId,
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

    const checklist: Checklist = {
      id: rows[0].id.toString(),
      projectId,
      status: rows[0].status,
      version: rows[0].version,
      lastModified:
        rows[0].lastModified?.toISOString() || new Date().toISOString(),
      lastModifiedBy: rows[0].lastModifiedBy,
      editReason: rows[0].editReason,
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

// -----------------------------------------------------------------------------
// Fetch template by sector (unchanged, but ensure it works with your tables)
// -----------------------------------------------------------------------------
export async function getTemplateBySector(sector: string): Promise<any[]> {
  console.log("SEctor", sector);
  try {
    const sqlQuery = `
      SELECT
        t.id AS templateId,
        c.id AS categoryId,
        c.name AS categoryName,
        tk.id AS taskId,
        tk.name AS taskLabel
      FROM Template t
      LEFT JOIN Category c ON c.templateId = t.id
      LEFT JOIN Task tk ON tk.categoryId = c.id
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

// Similarly, update createChecklist to record initial creation
export async function createChecklist({
  projectId,
  createdBy,
}: {
  projectId: string;
  createdBy: string;
}): Promise<Checklist> {
  // ... resolve projectId ...

  return await withTransaction(async (trx) => {
    const insertHeader = new sql.Request(trx);
    insertHeader.input("projectId", sql.NVarChar, projectId);
    insertHeader.input("status", sql.NVarChar, "Draft");
    insertHeader.input("lastModifiedBy", sql.NVarChar, createdBy);
    const result = await insertHeader.query(`
      INSERT INTO Checklist (projectId, status, version, lastModifiedBy, createdAt, lastModified)
      OUTPUT INSERTED.id
      VALUES (@projectId, @status, 1, @lastModifiedBy, GETDATE(), GETDATE())
    `);
    const checklistId = result.recordset[0].id;

    // Record initial creation in history
    await addHistoryEntry(
      trx,
      checklistId,
      "Draft",
      createdBy,
      "Checklist created",
    );

    return {
      id: checklistId.toString(),
      projectId: projectId,
      status: "Draft",
      version: 1,
      lastModified: new Date().toISOString(),
      lastModifiedBy: createdBy,
      items: [],
    };
  });
}

// -----------------------------------------------------------------------------
// Save checklist – uses a transaction
// -----------------------------------------------------------------------------
// Update saveChecklist to record history
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
    editReason?: string;
    lastModifiedBy: string;
  },
): Promise<void> {
  const numericId = parseInt(checklistId, 10);
  if (isNaN(numericId)) throw new Error("Invalid checklist ID");

  await withTransaction(async (trx) => {
    // Get current status for history
    const getStatusReq = new sql.Request(trx);
    getStatusReq.input("id", sql.Int, numericId);
    const statusResult = await getStatusReq.query(
      "SELECT status FROM Checklist WHERE id = @id",
    );
    const oldStatus = statusResult.recordset[0]?.status;

    // 1. Update checklist header
    const updateHeader = new sql.Request(trx);
    updateHeader.input("id", sql.Int, numericId);
    updateHeader.input("status", sql.NVarChar, data.status);
    updateHeader.input("lastModifiedBy", sql.NVarChar, data.lastModifiedBy);
    updateHeader.input("editReason", sql.NVarChar, data.editReason || null);
    await updateHeader.query(`
      UPDATE Checklist
      SET status = @status,
          version = version + 1,
          lastModified = GETDATE(),
          lastModifiedBy = @lastModifiedBy,
          editReason = @editReason
      WHERE id = @id
    `);

    // 2. Delete old items
    const deleteItems = new sql.Request(trx);
    deleteItems.input("checklistId", sql.Int, numericId);
    await deleteItems.query(
      "DELETE FROM ChecklistItem WHERE checklistId = @checklistId",
    );

    // 3. Insert new items
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

    // 4. Record history if status changed or reason provided
    if (oldStatus !== data.status || data.editReason) {
      await addHistoryEntry(
        trx,
        numericId,
        data.status,
        data.lastModifiedBy,
        data.editReason,
        { items: data.items }, // snapshot
      );
    }
  });

  // Revalidate path (you may need projectId)
  // revalidatePath(`/projects/${...}`);
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
