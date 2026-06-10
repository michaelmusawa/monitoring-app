"use server";

import { revalidatePath } from "next/cache";
import { DatabaseError, safeQuery } from "../db";
import { withTransaction } from "./checklistActions";
import sql from "mssql";

// ─── Types ────────────────────────────────────────────────────────────────────
export type CategoryStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED";

export interface ReviewNote {
  id: string;
  categoryId: string;
  field: string;
  originalValue: string | null;
  suggestedValue: string | null;
  reason: string;
  reviewerEmail: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ProjectCategory {
  id: string;
  name: string;
  sector: string | null;
  target: number | null;
  targetType: "NUMBER" | "PERCENT";
  budget: number | null;
  status: CategoryStatus;
  createdBy: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reviewNotes?: ReviewNote[];
}

export interface CategoryProject {
  id: string;
  name: string;
  sector: string | null;
  status: string;
  budget: number | null;
  progress: number | null;
  size: "Small" | "Medium" | "Large" | null;
  subCounty: string | null;
  ward: string | null;
  createdAt: string;
  latestTrackerPercent: number | null;
  latestTrackerDate: string | null;
  trackerCount: number;
  contributionValue: number | null;
}

export interface CategoryWithProjects extends ProjectCategory {
  projects: CategoryProject[];
  projectCount: number;
  activeCount: number;
  pendingCount: number;
  avgProgress: number | null;
}

export interface FlatProject {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  sector: string | null;
  status: string;
  budget: number | null;
  progress: number;
  ward: string | null;
  subCounty: string | null;
  createdAt: string;
}

export interface FieldChange {
  field: "name" | "target" | "budget" | "sector" | "targetType";
  originalValue: string;
  suggestedValue: string;
  reason: string;
}

// ─── Slug generator ───────────────────────────────────────────────────────────
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 44);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

// ─── Mappers (unchanged) ─────────────────────────────────────────────────────
function mapCategory(row: any): ProjectCategory {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector ?? null,
    target: row.target != null ? Number(row.target) : null,
    targetType: row.targetType ?? "NUMBER",
    budget: row.budget != null ? Number(row.budget) : null,
    status: row.status as CategoryStatus,
    createdBy: row.createdBy ?? null,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

function mapNote(row: any): ReviewNote {
  return {
    id: row.id,
    categoryId: row.categoryId,
    field: row.field,
    originalValue: row.originalValue ?? null,
    suggestedValue: row.suggestedValue ?? null,
    reason: row.reason,
    reviewerEmail: row.reviewerEmail ?? null,
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

// ─── NOTIFICATION HELPERS ────────────────────────────────────────────────────

/**
 * Create a notification for a specific user.
 */
async function createNotification(data: {
  userId: string;
  type: string; // e.g. 'category_submitted', 'category_approved', 'changes_requested', 'acknowledged'
  title: string;
  message: string;
  link?: string | null; // URL to the relevant page (e.g., `/cidp?category=${id}`)
  metadata?: any; // JSON extra data (e.g., { categoryId, reviewerEmail })
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
    // Do not throw – notifications are non‑critical
  }
}

/**
 * Get all user IDs of Monitoring & Evaluation officers.
 */
async function getMEOfficerIds(): Promise<string[]> {
  const { rows } = await safeQuery<{ id: string }>(
    `SELECT id FROM [User] WHERE sector = 'Monitoring And Evaluation' AND status = 'active'`,
  );
  return rows.map((r) => r.id);
}

/**
 * Get a user's ID by email (used for category creator).
 */
async function getUserIdByEmail(email: string | null): Promise<string | null> {
  if (!email) return null;
  const { rows } = await safeQuery<{ id: string }>(
    `SELECT id FROM [User] WHERE email = @p1`,
    [email],
  );
  return rows[0]?.id || null;
}

/**
 * Builds a CTE (Common Table Expression) that gives each project:
 * - latestTrackerPercent
 * - isStalled (whether any item in the latest submission has status 'STALLED')
 * - terminated (if project.status = 'TERMINATED')
 * Then applies the status filter.
 */
function applyDerivedStatusFilter(
  baseQuery: string,
  statusFilter?: string,
): string {
  if (!statusFilter || statusFilter === "ALL") return baseQuery;

  // Build CTE that attaches latest tracker and stalled info
  const cte = `
    WITH ProjectStatus AS (
      SELECT
        p.id,
        p.name,
        p.sector,
        p.budget,
        p.progress,
        p.status AS dbStatus,
        p.ward,
        p.subCounty,
        p.createdAt,
        p.categoryId,
        pc.name AS categoryName,
        (
          SELECT TOP 1 overallPercent
          FROM TrackerSubmission ts
          WHERE ts.projectId = p.id
          ORDER BY ts.submittedAt DESC
        ) AS latestTrackerPercent,
        (
          SELECT TOP 1
            CASE WHEN EXISTS (
              SELECT 1
              FROM TrackerSubmissionItem tsi
              INNER JOIN TrackerSubmission ts ON ts.id = tsi.submissionId
              WHERE ts.projectId = p.id
                AND ts.submittedAt = (
                  SELECT MAX(submittedAt) FROM TrackerSubmission WHERE projectId = p.id
                )
                AND tsi.status = 'STALLED'
            ) THEN 1 ELSE 0 END
        ) AS isStalled
      FROM Project p
      LEFT JOIN ProjectCategory pc ON p.categoryId = pc.id
      WHERE 1=1
    )
  `;

  const filterMap: Record<string, string> = {
    ONGOING: "latestTrackerPercent > 0 AND latestTrackerPercent < 100",
    COMPLETED: "latestTrackerPercent = 100",
    NOT_STARTED: "latestTrackerPercent = 0",
    STALLED: "isStalled = 1",
    TERMINATED: "dbStatus = 'TERMINATED'",
  };

  const condition = filterMap[statusFilter];
  if (!condition) return baseQuery;

  // Wrap the original query with the CTE and filter
  // We assume the original query selects from Project (or includes a join). To simplify,
  // we'll replace the base query's FROM clause with a reference to the CTE.
  // Instead of complex parsing, we rewrite the function to use the CTE directly.
  // This means the function fetchFilteredProjectsFlat will be completely rewritten.
  throw new Error("See full function rewrite below");
}
// ─── getCategories ────────────────────────────────────────────────────────────

export async function getCategories(filters?: {
  sector?: string;
  status?: CategoryStatus;
}): Promise<ProjectCategory[]> {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters?.sector) {
    conditions.push(`sector = @p${params.length + 1}`);
    params.push(filters.sector);
  }
  if (filters?.status) {
    conditions.push(`status = @p${params.length + 1}`);
    params.push(filters.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await safeQuery<any>(
    `SELECT id, name, sector, target, targetType, budget, status, createdBy,
            submittedAt, reviewedAt, createdAt, updatedAt
     FROM ProjectCategory ${where}
     ORDER BY sector, name`,
    params,
  );

  return rows.map(mapCategory);
}

// ─── getCategoryWithNotes ─────────────────────────────────────────────────────

export async function getCategoryWithNotes(
  id: string,
): Promise<ProjectCategory | null> {
  const { rows: catRows } = await safeQuery<any>(
    `SELECT id, name, sector, target, targetType, budget, status, createdBy,
            submittedAt, reviewedAt, createdAt, updatedAt
     FROM ProjectCategory WHERE id = @p1`,
    [id],
  );
  if (catRows.length === 0) return null;

  const { rows: noteRows } = await safeQuery<any>(
    `SELECT id, categoryId, field, originalValue, suggestedValue,
            reason, reviewerEmail, resolvedAt, createdAt
     FROM CategoryReviewNote WHERE categoryId = @p1
     ORDER BY createdAt DESC`,
    [id],
  );

  return {
    ...mapCategory(catRows[0]),
    reviewNotes: noteRows.map(mapNote),
  };
}

// ─── batchCreateCategories ────────────────────────────────────────────────────

export async function batchCreateCategories(
  items: {
    name: string;
    sector?: string | null;
    target?: number;
    targetType?: "NUMBER" | "PERCENT";
    budget?: number | null;
  }[],
  createdBy?: string,
): Promise<ProjectCategory[]> {
  if (items.length === 0) return [];
  return await withTransaction(async (trx) => {
    const created: ProjectCategory[] = [];
    for (const item of items) {
      const slug = generateSlug(item.name);
      const req = new sql.Request(trx);
      req.input("id", sql.NVarChar(50), slug);
      req.input("name", sql.NVarChar(500), item.name);
      req.input("sector", sql.NVarChar(200), item.sector || null);
      req.input("target", sql.Decimal(18, 2), item.target ?? null);
      req.input("targetType", sql.NVarChar(10), item.targetType ?? "NUMBER");
      req.input("budget", sql.Decimal(18, 2), item.budget ?? null);
      req.input("status", sql.NVarChar(50), "DRAFT");
      req.input("createdBy", sql.NVarChar(200), createdBy || null);
      const result = await req.query(`
        INSERT INTO ProjectCategory (id, name, sector, target, targetType, budget, status, createdBy)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.sector, INSERTED.target, INSERTED.targetType,
               INSERTED.budget, INSERTED.status, INSERTED.createdBy,
               INSERTED.submittedAt, INSERTED.reviewedAt,
               INSERTED.createdAt, INSERTED.updatedAt
        VALUES (@id, @name, @sector, @target, @targetType, @budget, @status, @createdBy)
      `);
      created.push(mapCategory(result.recordset[0]));
    }
    return created;
  });
}

// ─── addCategory ──────────────────────────────────────────────────────────────

export async function addCategory(
  data: {
    name: string;
    sector?: string;
    target?: number;
    targetType?: "NUMBER" | "PERCENT";
    budget?: number;
  },
  createdBy?: string,
): Promise<ProjectCategory> {
  const [result] = await batchCreateCategories([data], createdBy);
  revalidatePath("/cidp");
  return result;
}

// ─── updateCategory ───────────────────────────────────────────────────────────

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    sector?: string;
    target?: number;
    targetType?: "NUMBER" | "PERCENT";
    budget?: number;
  },
): Promise<ProjectCategory> {
  const updates: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    updates.push(`name = @p${params.length + 1}`);
    params.push(data.name);
  }
  if (data.sector !== undefined) {
    updates.push(`sector = @p${params.length + 1}`);
    params.push(data.sector);
  }
  if (data.target !== undefined) {
    updates.push(`target = @p${params.length + 1}`);
    params.push(data.target);
  }
  if (data.targetType !== undefined) {
    updates.push(`targetType = @p${params.length + 1}`);
    params.push(data.targetType);
  }
  if (data.budget !== undefined) {
    updates.push(`budget = @p${params.length + 1}`);
    params.push(data.budget);
  }

  if (updates.length === 0) throw new Error("No fields to update");
  updates.push("updatedAt = GETDATE()");

  const { rows } = await safeQuery<any>(
    `UPDATE ProjectCategory SET ${updates.join(", ")}
     OUTPUT INSERTED.id, INSERTED.name, INSERTED.sector, INSERTED.target, INSERTED.targetType,
            INSERTED.budget, INSERTED.status, INSERTED.createdBy,
            INSERTED.submittedAt, INSERTED.reviewedAt, INSERTED.createdAt, INSERTED.updatedAt
     WHERE id = @p${params.length + 1}`,
    [...params, id],
  );
  if (rows.length === 0) throw new DatabaseError();
  revalidatePath("/cidp");
  return mapCategory(rows[0]);
}

// ─── deleteCategory ───────────────────────────────────────────────────────────

export async function deleteCategory(id: string): Promise<void> {
  await safeQuery(`DELETE FROM ProjectCategory WHERE id = @p1`, [id]);
  revalidatePath("/cidp");
}

// ─── submitForReview ──────────────────────────────────────────────────────────

export async function submitForReview(
  categoryIds: string[],
  actorEmail?: string,
): Promise<void> {
  await withTransaction(async (trx) => {
    for (const id of categoryIds) {
      const req1 = new sql.Request(trx);
      req1.input("id", sql.NVarChar(50), id);
      req1.input("actorEmail", sql.NVarChar(200), actorEmail || null);
      await req1.query(`
        UPDATE ProjectCategory
        SET status = 'PENDING_REVIEW', submittedAt = GETDATE(), updatedAt = GETDATE()
        WHERE id = @id AND status IN ('DRAFT', 'CHANGES_REQUESTED')
      `);
      const req2 = new sql.Request(trx);
      req2.input("histId", sql.NVarChar(50), generateSlug("hist"));
      req2.input("catId", sql.NVarChar(50), id);
      req2.input("fromStatus", sql.NVarChar(50), "DRAFT");
      req2.input("toStatus", sql.NVarChar(50), "PENDING_REVIEW");
      req2.input("actor", sql.NVarChar(200), actorEmail || null);
      await req2.query(`
        INSERT INTO CategoryStatusHistory (id, categoryId, fromStatus, toStatus, actorEmail)
        VALUES (@histId, @catId, @fromStatus, @toStatus, @actor)
      `);
    }
  });
  revalidatePath("/cidp");

  // --- Notifications ---
  const meOfficerIds = await getMEOfficerIds();
  const categoryNames = await getCategoryNames(categoryIds);
  const title = "CIDP Category Submitted for Review";
  const message = `${actorEmail ?? "A sector officer"} submitted ${categoryNames} for ME review.`;
  const link = "/cidp?status=PENDING_REVIEW"; // adjust to your actual filters
  const metadata = { categoryIds, actorEmail };

  for (const userId of meOfficerIds) {
    await createNotification({
      userId,
      type: "category_submitted",
      title,
      message,
      link,
      metadata,
    });
  }
}

async function getCategoryNames(ids: string[]): Promise<string> {
  if (ids.length === 0) return "a category";
  const placeholders = ids.map((_, i) => `@p${i + 1}`).join(",");
  const { rows } = await safeQuery<{ name: string }>(
    `SELECT name FROM ProjectCategory WHERE id IN (${placeholders})`,
    ids,
  );
  const names = rows.map((r) => r.name);
  if (names.length === 1) return `"${names[0]}"`;
  if (names.length === 2) return `"${names[0]}" and "${names[1]}"`;
  return `${names.length} categories`;
}

// ─── approveCategories ────────────────────────────────────────────────────────

export async function approveCategories(
  categoryIds: string[],
  actorEmail?: string,
): Promise<void> {
  await withTransaction(async (trx) => {
    for (const id of categoryIds) {
      const req1 = new sql.Request(trx);
      req1.input("id", sql.NVarChar(50), id);
      req1.input("actor", sql.NVarChar(200), actorEmail || null);
      await req1.query(`
        UPDATE ProjectCategory
        SET status = 'APPROVED', reviewedAt = GETDATE(), updatedAt = GETDATE()
        WHERE id = @id AND status = 'PENDING_REVIEW'
      `);
      const req2 = new sql.Request(trx);
      req2.input("histId", sql.NVarChar(50), generateSlug("hist"));
      req2.input("catId", sql.NVarChar(50), id);
      req2.input("fromStatus", sql.NVarChar(50), "PENDING_REVIEW");
      req2.input("toStatus", sql.NVarChar(50), "APPROVED");
      req2.input("actor", sql.NVarChar(200), actorEmail || null);
      await req2.query(`
        INSERT INTO CategoryStatusHistory (id, categoryId, fromStatus, toStatus, actorEmail)
        VALUES (@histId, @catId, @fromStatus, @toStatus, @actor)
      `);
    }
  });
  revalidatePath("/cidp");

  // --- Notifications to the creators of each category ---
  for (const id of categoryIds) {
    const category = await getCategory(id);
    if (category?.createdBy) {
      const userId = await getUserIdByEmail(category.createdBy);
      if (userId) {
        await createNotification({
          userId,
          type: "category_approved",
          title: "CIDP Category Approved",
          message: `Your category "${category.name}" has been approved by ${actorEmail ?? "ME officer"}.`,
          link: `/cidp?category=${id}`,
          metadata: { categoryId: id, approver: actorEmail },
        });
      }
    }
  }
}
// ─── requestChanges ───────────────────────────────────────────────────────────

export async function requestChanges(
  categoryId: string,
  changes: FieldChange[],
  reviewerEmail?: string,
): Promise<void> {
  await withTransaction(async (trx) => {
    // Apply suggested values to the category
    for (const change of changes) {
      if (change.field === "targetType") {
        const req = new sql.Request(trx);
        req.input("id", sql.NVarChar(50), categoryId);
        req.input("val", sql.NVarChar(10), change.suggestedValue);
        await req.query(`
          UPDATE ProjectCategory
          SET targetType = @val, updatedAt = GETDATE()
          WHERE id = @id
        `);
      } else {
        const req = new sql.Request(trx);
        req.input("id", sql.NVarChar(50), categoryId);
        req.input("field", sql.NVarChar(100), change.field);
        req.input("val", sql.NVarChar(sql.MAX), change.suggestedValue);
        await req.query(`
          UPDATE ProjectCategory
          SET ${change.field} = @val, updatedAt = GETDATE()
          WHERE id = @id
        `);
      }
      // Insert review note
      const req2 = new sql.Request(trx);
      req2.input("noteId", sql.NVarChar(50), generateSlug("note"));
      req2.input("catId", sql.NVarChar(50), categoryId);
      req2.input("field", sql.NVarChar(100), change.field);
      req2.input("origVal", sql.NVarChar(sql.MAX), change.originalValue);
      req2.input("sugVal", sql.NVarChar(sql.MAX), change.suggestedValue);
      req2.input("reason", sql.NVarChar(sql.MAX), change.reason);
      req2.input("reviewer", sql.NVarChar(200), reviewerEmail || null);
      await req2.query(`
        INSERT INTO CategoryReviewNote
          (id, categoryId, field, originalValue, suggestedValue, reason, reviewerEmail)
        VALUES (@noteId, @catId, @field, @origVal, @sugVal, @reason, @reviewer)
      `);
    }
    // Update category status
    const req3 = new sql.Request(trx);
    req3.input("id", sql.NVarChar(50), categoryId);
    req3.input("reviewer", sql.NVarChar(200), reviewerEmail || null);
    await req3.query(`
      UPDATE ProjectCategory
      SET status = 'CHANGES_REQUESTED', reviewedAt = GETDATE(), updatedAt = GETDATE()
      WHERE id = @id AND status = 'PENDING_REVIEW'
    `);
    // Log history
    const req4 = new sql.Request(trx);
    req4.input("histId", sql.NVarChar(50), generateSlug("hist"));
    req4.input("catId", sql.NVarChar(50), categoryId);
    req4.input("fromStatus", sql.NVarChar(50), "PENDING_REVIEW");
    req4.input("toStatus", sql.NVarChar(50), "CHANGES_REQUESTED");
    req4.input("actor", sql.NVarChar(200), reviewerEmail || null);
    await req4.query(`
      INSERT INTO CategoryStatusHistory (id, categoryId, fromStatus, toStatus, actorEmail)
      VALUES (@histId, @catId, @fromStatus, @toStatus, @actor)
    `);
  });
  revalidatePath("/cidp");

  // --- Notification to the category creator (sector officer) ---
  const category = await getCategory(categoryId);
  if (category?.createdBy) {
    const userId = await getUserIdByEmail(category.createdBy);
    if (userId) {
      const changesSummary = changes
        .map((c) => `${c.field} → ${c.suggestedValue}`)
        .join(", ");
      await createNotification({
        userId,
        type: "changes_requested",
        title: "Changes Requested on Your CIDP Category",
        message: `${reviewerEmail ?? "ME officer"} requested changes on "${category.name}". Changes: ${changesSummary}.`,
        link: `/cidp?category=${categoryId}`,
        metadata: { categoryId, changes, reviewerEmail },
      });
    }
  }
}

// ─── acknowledgeChanges ───────────────────────────────────────────────────────

export async function acknowledgeChanges(categoryId: string): Promise<void> {
  await safeQuery(
    `UPDATE CategoryReviewNote
     SET resolvedAt = GETDATE()
     WHERE categoryId = @p1 AND resolvedAt IS NULL`,
    [categoryId],
  );
  await safeQuery(
    `UPDATE ProjectCategory
     SET status = 'DRAFT', updatedAt = GETDATE()
     WHERE id = @p1 AND status = 'CHANGES_REQUESTED'`,
    [categoryId],
  );
  revalidatePath("/cidp");

  // Notify all ME officers that the sector has acknowledged the changes
  const category = await getCategory(categoryId);
  const meIds = await getMEOfficerIds();
  for (const userId of meIds) {
    await createNotification({
      userId,
      type: "acknowledged",
      title: "Category Changes Acknowledged",
      message: `The sector officer has acknowledged and will re‑edit "${category?.name}".`,
      link: `/cidp?category=${categoryId}`,
      metadata: { categoryId },
    });
  }
}

async function getCategory(id: string): Promise<ProjectCategory | null> {
  const { rows } = await safeQuery<any>(
    `SELECT id, name, createdBy FROM ProjectCategory WHERE id = @p1`,
    [id],
  );
  return rows.length ? mapCategory(rows[0]) : null;
}

// ─── fetchFilteredProjectsFlat ────────────────────────────────────────────────

export async function fetchFilteredProjectsFlat(filters?: {
  sector?: string;
  categoryName?: string;
  projectName?: string;
  status?: string; // 'ONGOING', 'COMPLETED', 'NOT_STARTED', 'STALLED', 'TERMINATED', 'ALL'
  minBudget?: number;
  maxBudget?: number;
}): Promise<FlatProject[]> {
  let query = `
    SELECT
      p.id,
      p.name,
      p.sector,
      p.budget,
      p.progress,
      p.status AS dbStatus,
      p.ward,
      p.subCounty,
      p.createdAt,
      p.categoryId,
      pc.name AS categoryName,
      t.latestTrackerPercent,
      CASE WHEN s.stalledCount > 0 THEN 1 ELSE 0 END AS isStalled
    FROM Project p
    LEFT JOIN ProjectCategory pc ON p.categoryId = pc.id
    OUTER APPLY (
      SELECT TOP 1 overallPercent AS latestTrackerPercent
      FROM TrackerSubmission ts
      WHERE ts.projectId = p.id
      ORDER BY ts.submittedAt DESC
    ) t
    OUTER APPLY (
      SELECT COUNT(*) AS stalledCount
      FROM TrackerSubmissionItem tsi
      INNER JOIN TrackerSubmission ts ON ts.id = tsi.submissionId
      WHERE ts.projectId = p.id
        AND ts.submittedAt = (
          SELECT MAX(submittedAt) FROM TrackerSubmission WHERE projectId = p.id
        )
        AND tsi.status = 'STALLED'
    ) s
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramIndex = 0;

  if (filters?.sector) {
    query += ` AND p.sector = @p${++paramIndex}`;
    params.push(filters.sector);
  }
  if (filters?.categoryName) {
    query += ` AND pc.name LIKE @p${++paramIndex}`;
    params.push(`%${filters.categoryName}%`);
  }
  if (filters?.projectName) {
    query += ` AND p.name LIKE @p${++paramIndex}`;
    params.push(`%${filters.projectName}%`);
  }
  if (filters?.status && filters.status !== "ALL") {
    switch (filters.status) {
      case "ONGOING":
        query += ` AND ISNULL(t.latestTrackerPercent, 0) > 0 AND ISNULL(t.latestTrackerPercent, 0) < 100`;
        break;
      case "COMPLETED":
        query += ` AND ISNULL(t.latestTrackerPercent, 0) = 100`;
        break;
      case "NOT_STARTED":
        query += ` AND ISNULL(t.latestTrackerPercent, 0) = 0`;
        break;
      case "STALLED":
        query += ` AND s.stalledCount > 0`;
        break;
      case "TERMINATED":
        query += ` AND p.status = 'TERMINATED'`;
        break;
    }
  }
  if (filters?.minBudget !== undefined) {
    query += ` AND p.budget >= @p${++paramIndex}`;
    params.push(filters.minBudget);
  }
  if (filters?.maxBudget !== undefined) {
    query += ` AND p.budget <= @p${++paramIndex}`;
    params.push(filters.maxBudget);
  }

  query += ` ORDER BY p.createdAt DESC`;

  const { rows } = await safeQuery<any>(query, params);
  return rows.map((row) => ({
    id: row.id.toString(),
    name: row.name,
    categoryId: row.categoryId?.toString() ?? null,
    categoryName: row.categoryName ?? null,
    sector: row.sector ?? null,
    status: row.dbStatus,
    budget: row.budget != null ? Number(row.budget) : null,
    progress: row.latestTrackerPercent ?? 0,
    ward: row.ward ?? null,
    subCounty: row.subCounty ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
}
// ─── fetchUncategorizedProjects ───────────────────────────────────────────────

export async function fetchUncategorizedProjects(
  sector?: string,
  projectFilters?: {
    projectName?: string;
    status?: string;
    minBudget?: number;
    maxBudget?: number;
  },
): Promise<CategoryProject[]> {
  let query = `
    SELECT
      p.id,
      p.name,
      p.sector,
      p.status,
      p.budget,
      p.progress,
      p.subCounty,
      p.ward,
      p.createdAt,
      t.latestTrackerPercent,
      CASE WHEN s.stalledCount > 0 THEN 1 ELSE 0 END AS isStalled
    FROM Project p
    OUTER APPLY (
      SELECT TOP 1 overallPercent AS latestTrackerPercent
      FROM TrackerSubmission ts
      WHERE ts.projectId = p.id
      ORDER BY ts.submittedAt DESC
    ) t
    OUTER APPLY (
      SELECT COUNT(*) AS stalledCount
      FROM TrackerSubmissionItem tsi
      INNER JOIN TrackerSubmission ts ON ts.id = tsi.submissionId
      WHERE ts.projectId = p.id
        AND ts.submittedAt = (
          SELECT MAX(submittedAt) FROM TrackerSubmission WHERE projectId = p.id
        )
        AND tsi.status = 'STALLED'
    ) s
    WHERE p.categoryId IS NULL
  `;
  const mainParams: any[] = [];
  let nextParam = 1;

  if (sector) {
    query += ` AND p.sector = @p${nextParam++}`;
    mainParams.push(sector);
  }
  if (projectFilters?.projectName) {
    query += ` AND p.name LIKE @p${nextParam++}`;
    mainParams.push(`%${projectFilters.projectName}%`);
  }
  if (projectFilters?.status && projectFilters.status !== "ALL") {
    switch (projectFilters.status) {
      case "ONGOING":
        query += ` AND ISNULL(t.latestTrackerPercent, 0) > 0 AND ISNULL(t.latestTrackerPercent, 0) < 100`;
        break;
      case "COMPLETED":
        query += ` AND ISNULL(t.latestTrackerPercent, 0) = 100`;
        break;
      case "NOT_STARTED":
        query += ` AND ISNULL(t.latestTrackerPercent, 0) = 0`;
        break;
      case "STALLED":
        query += ` AND s.stalledCount > 0`;
        break;
      case "TERMINATED":
        query += ` AND p.status = 'TERMINATED'`;
        break;
    }
  }
  if (projectFilters?.minBudget !== undefined) {
    query += ` AND p.budget >= @p${nextParam++}`;
    mainParams.push(projectFilters.minBudget);
  }
  if (projectFilters?.maxBudget !== undefined) {
    query += ` AND p.budget <= @p${nextParam++}`;
    mainParams.push(projectFilters.maxBudget);
  }
  query += ` ORDER BY p.createdAt DESC`;

  const { rows } = await safeQuery<any>(query, mainParams);
  if (rows.length === 0) return [];

  // Map rows to CategoryProject (same as before, using derived values)
  return rows.map((p: any) => {
    let size: CategoryProject["size"] = null;
    if (p.budget != null) {
      if (p.budget <= 500_000) size = "Small";
      else if (p.budget <= 1_000_000) size = "Medium";
      else size = "Large";
    }
    return {
      id: p.id.toString(),
      name: p.name,
      sector: p.sector ?? null,
      status: p.status,
      budget: p.budget != null ? Number(p.budget) : null,
      progress: p.progress != null ? Number(p.progress) : null,
      size,
      subCounty: p.subCounty ?? null,
      ward: p.ward ?? null,
      createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
      latestTrackerPercent:
        p.latestTrackerPercent != null ? Number(p.latestTrackerPercent) : null,
      latestTrackerDate: null, // not needed here, but could be added if needed
      trackerCount: 0,
      contributionValue: null,
    };
  });
}
// ─── fetchCategoriesWithProjects ──────────────────────────────────────────────

// ─── fetchCategoriesWithProjects (corrected) ─────────────────────────────────
export async function fetchCategoriesWithProjects(filters?: {
  sector?: string;
  query?: string;
  projectName?: string;
  projectStatus?: string;
  minBudget?: number;
  maxBudget?: number;
}): Promise<CategoryWithProjects[]> {
  // 1. Get approved categories with optional sector & name filters
  const catConditions: string[] = ["status = 'APPROVED'"];
  const catParams: any[] = [];
  if (filters?.sector) {
    catParams.push(filters.sector);
    catConditions.push(`sector = @p${catParams.length}`);
  }
  if (filters?.query) {
    catParams.push(`%${filters.query}%`);
    catConditions.push(`name LIKE @p${catParams.length}`);
  }
  const where = `WHERE ${catConditions.join(" AND ")}`;
  const { rows: catRows } = await safeQuery<any>(
    `SELECT id, name, sector, target, targetType, budget, status, createdBy,
            submittedAt, reviewedAt, createdAt, updatedAt
     FROM ProjectCategory ${where}
     ORDER BY sector, name`,
    catParams,
  );
  if (catRows.length === 0) return [];

  const categoryIds = catRows.map((r: any) => r.id);

  // 2. Build the project query with derived status (identical to flat list)
  let projectQuery = `
    SELECT
      p.id,
      p.name,
      p.sector,
      p.status,
      p.budget,
      p.progress,
      p.subCounty,
      p.ward,
      p.createdAt,
      p.categoryId,
      p.contributionValue,
      t.latestTrackerPercent,
      CASE WHEN s.stalledCount > 0 THEN 1 ELSE 0 END AS isStalled
    FROM Project p
    OUTER APPLY (
      SELECT TOP 1 overallPercent AS latestTrackerPercent
      FROM TrackerSubmission ts
      WHERE ts.projectId = p.id
      ORDER BY ts.submittedAt DESC
    ) t
    OUTER APPLY (
      SELECT COUNT(*) AS stalledCount
      FROM TrackerSubmissionItem tsi
      INNER JOIN TrackerSubmission ts ON ts.id = tsi.submissionId
      WHERE ts.projectId = p.id
        AND ts.submittedAt = (
          SELECT MAX(submittedAt) FROM TrackerSubmission WHERE projectId = p.id
        )
        AND tsi.status = 'STALLED'
    ) s
    WHERE p.categoryId IN (${categoryIds.map((_, i) => `@p${i + 1}`).join(",")})
  `;
  const projectParams = [...categoryIds];
  let paramIndex = categoryIds.length;

  // Apply project filters (same as flat list)
  if (filters?.projectName) {
    projectQuery += ` AND p.name LIKE @p${++paramIndex}`;
    projectParams.push(`%${filters.projectName}%`);
  }
  if (filters?.projectStatus && filters.projectStatus !== "ALL") {
    switch (filters.projectStatus) {
      case "ONGOING":
        projectQuery += ` AND ISNULL(t.latestTrackerPercent, 0) > 0 AND ISNULL(t.latestTrackerPercent, 0) < 100`;
        break;
      case "COMPLETED":
        projectQuery += ` AND ISNULL(t.latestTrackerPercent, 0) = 100`;
        break;
      case "NOT_STARTED":
        projectQuery += ` AND ISNULL(t.latestTrackerPercent, 0) = 0`;
        break;
      case "STALLED":
        projectQuery += ` AND s.stalledCount > 0`;
        break;
      case "TERMINATED":
        projectQuery += ` AND p.status = 'TERMINATED'`;
        break;
    }
  }
  if (filters?.minBudget !== undefined) {
    projectQuery += ` AND p.budget >= @p${++paramIndex}`;
    projectParams.push(filters.minBudget);
  }
  if (filters?.maxBudget !== undefined) {
    projectQuery += ` AND p.budget <= @p${++paramIndex}`;
    projectParams.push(filters.maxBudget);
  }
  projectQuery += ` ORDER BY p.createdAt DESC`;

  const { rows: projectRows } = await safeQuery<any>(
    projectQuery,
    projectParams,
  );

  // 3. Enrich with additional tracker data (counts, submission date)
  let trackerByProject = new Map<string, any>();
  let countByProject = new Map<string, number>();
  if (projectRows.length > 0) {
    const projectIds = projectRows.map((p: any) => p.id.toString());
    const projPlaceholders = projectIds.map((_, i) => `@p${i + 1}`).join(",");
    const { rows: trackerRows } = await safeQuery<any>(
      `SELECT t.projectId, t.overallPercent, t.submittedAt
       FROM TrackerSubmission t
       WHERE t.projectId IN (${projPlaceholders})
         AND t.submittedAt = (SELECT MAX(t2.submittedAt) FROM TrackerSubmission t2 WHERE t2.projectId = t.projectId)`,
      projectIds,
    );
    for (const r of trackerRows) {
      trackerByProject.set(r.projectId.toString(), r);
    }
    const { rows: countRows } = await safeQuery<any>(
      `SELECT projectId, COUNT(*) AS cnt
       FROM TrackerSubmission WHERE projectId IN (${projPlaceholders})
       GROUP BY projectId`,
      projectIds,
    );
    for (const r of countRows) {
      countByProject.set(r.projectId.toString(), Number(r.cnt));
    }
  }

  // 4. Group projects by category
  const projectsByCategory = new Map<string, CategoryProject[]>();
  for (const p of projectRows) {
    const catId = p.categoryId?.toString();
    if (!catId) continue;
    if (!projectsByCategory.has(catId)) projectsByCategory.set(catId, []);
    let size: CategoryProject["size"] = null;
    if (p.budget != null) {
      if (p.budget <= 500_000) size = "Small";
      else if (p.budget <= 1_000_000) size = "Medium";
      else size = "Large";
    }
    const tr = trackerByProject.get(p.id.toString());
    projectsByCategory.get(catId)!.push({
      id: p.id.toString(),
      name: p.name,
      sector: p.sector ?? null,
      status: p.status,
      budget: p.budget != null ? Number(p.budget) : null,
      progress: p.progress != null ? Number(p.progress) : null,
      size,
      subCounty: p.subCounty ?? null,
      ward: p.ward ?? null,
      createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
      latestTrackerPercent: tr ? Number(tr.overallPercent) : null,
      latestTrackerDate: tr ? tr.submittedAt?.toISOString() : null,
      trackerCount: countByProject.get(p.id.toString()) ?? 0,
      contributionValue: p.contributionValue ?? null,
    });
  }

  // 5. Return all categories (including those without projects)
  return catRows.map((row: any) => {
    const projects = projectsByCategory.get(row.id) ?? [];
    const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
    const pendingCount = projects.filter((p) => p.status === "PENDING").length;
    const progValues = projects.map(
      (p) => p.latestTrackerPercent ?? p.progress ?? 0,
    );
    const avgProgress =
      progValues.length > 0
        ? progValues.reduce((a, b) => a + b, 0) / progValues.length
        : null;
    return {
      ...mapCategory(row),
      projects,
      projectCount: projects.length,
      activeCount,
      pendingCount,
      avgProgress,
    };
  });
}
// ─── assignProjectToCategory ──────────────────────────────────────────────────

export async function assignProjectToCategory(
  projectId: string,
  categoryId: string | null,
): Promise<void> {
  await safeQuery(
    `UPDATE Project SET categoryId = @p1, updatedAt = GETDATE() WHERE id = @p2`,
    [categoryId, projectId],
  );
  revalidatePath("/projects");
}

// ─── createProjectInCategory ──────────────────────────────────────────────────

export async function createProjectInCategory(
  categoryId: string,
  data: {
    name: string;
    sector?: string;
    budget?: number;
    description?: string;
  },
): Promise<{ id: string }> {
  const base = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 44);
  const suffix = Math.random().toString(36).substring(2, 6);
  const slug = `${base}-${suffix}`;
  const { rows } = await safeQuery<any>(
    `INSERT INTO Project (id, name, sector, budget, description, status, categoryId)
     OUTPUT INSERTED.id
     VALUES (@p1, @p2, @p3, @p4, @p5, 'PENDING', @p6)`,
    [
      slug,
      data.name,
      data.sector ?? null,
      data.budget ?? null,
      data.description ?? null,
      categoryId,
    ],
  );
  revalidatePath("/projects");
  return { id: rows[0].id };
}
