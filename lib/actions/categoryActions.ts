"use server";

import { revalidatePath } from "next/cache";
import { DatabaseError, safeQuery } from "../db";
import { withTransaction } from "./checklistActions";
import sql from "mssql";
import { buildUnitLookup, getRootUnitName } from "./orgActions";

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
  targetUnit?: string | null;
  baselineValue?: number | null;
  targetDirection?: "INCREASE" | "DECREASE" | null;
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
  derivedStatus?: string;
}

export interface CategoryWithProjects extends ProjectCategory {
  projects: CategoryProject[];
  projectCount: number;
  activeCount: number;
  pendingCount: number;
  avgProgress: number | null;
  notStartedCount: number;
  ongoingCount: number;
  stalledCount: number;
  completedCount: number;
  terminatedCount: number;
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
  field:
    | "name"
    | "target"
    | "budget"
    | "sector"
    | "targetType"
    | "targetUnit"
    | "baselineValue"
    | "targetDirection";
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

// ─── Mappers ─────────────────────────────────────────────────────────────────
function mapCategory(row: any): ProjectCategory {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector ?? null,
    target: row.target != null ? Number(row.target) : null,
    targetType: row.targetType ?? "NUMBER",
    targetUnit: row.targetUnit ?? null,
    baselineValue: row.baselineValue != null ? Number(row.baselineValue) : null,
    targetDirection: row.targetDirection ?? null,
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

async function getCategory(id: string): Promise<ProjectCategory | null> {
  const { rows } = await safeQuery<any>(
    `SELECT * FROM ProjectCategory WHERE id = @p1`,
    [id],
  );
  return rows.length ? mapCategory(rows[0]) : null;
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
    `SELECT * FROM ProjectCategory ${where} ORDER BY sector, name`,
    params,
  );
  return rows.map(mapCategory);
}

// ─── getCategoryWithNotes ─────────────────────────────────────────────────────
export async function getCategoryWithNotes(
  id: string,
): Promise<ProjectCategory | null> {
  const { rows: catRows } = await safeQuery<any>(
    `SELECT * FROM ProjectCategory WHERE id = @p1`,
    [id],
  );
  if (catRows.length === 0) return null;
  const { rows: noteRows } = await safeQuery<any>(
    `SELECT * FROM CategoryReviewNote WHERE categoryId = @p1 ORDER BY createdAt DESC`,
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
    targetUnit?: string | null;
    baselineValue?: number | null;
    targetDirection?: "INCREASE" | "DECREASE" | null;
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
      req.input("targetUnit", sql.NVarChar(100), item.targetUnit || null);
      req.input(
        "baselineValue",
        sql.Decimal(18, 2),
        item.baselineValue ?? null,
      );
      req.input(
        "targetDirection",
        sql.NVarChar(20),
        item.targetDirection || null,
      );
      req.input("budget", sql.Decimal(18, 2), item.budget ?? null);
      req.input("status", sql.NVarChar(50), "DRAFT");
      req.input("createdBy", sql.NVarChar(200), createdBy || null);
      const result = await req.query(`
        INSERT INTO ProjectCategory (id, name, sector, target, targetType, targetUnit,
                                     baselineValue, targetDirection, budget, status, createdBy)
        OUTPUT INSERTED.*
        VALUES (@id, @name, @sector, @target, @targetType, @targetUnit,
                @baselineValue, @targetDirection, @budget, @status, @createdBy)
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
    targetUnit?: string;
    baselineValue?: number;
    targetDirection?: "INCREASE" | "DECREASE";
    budget?: number;
  },
  createdBy?: string,
): Promise<ProjectCategory> {
  const [result] = await batchCreateCategories([data], createdBy);
  revalidatePath("/cidp");
  return result;
}

type UpdateCategoryData = Partial<
  Pick<
    ProjectCategory,
    | "name"
    | "sector"
    | "target"
    | "targetType"
    | "targetUnit"
    | "baselineValue"
    | "targetDirection"
    | "budget"
  >
>;

// ─── updateCategory ───────────────────────────────────────────────────────────
export async function updateCategory(
  id: string,
  data: UpdateCategoryData,
): Promise<ProjectCategory> {
  const updates: string[] = [];
  const params: any[] = [];

  const addUpdate = (field: string, value: any) => {
    if (value !== undefined) {
      updates.push(`${field} = @p${params.length + 1}`);
      params.push(value);
    }
  };

  addUpdate("name", data.name);
  addUpdate("sector", data.sector);
  addUpdate("target", data.target);
  addUpdate("targetType", data.targetType);
  addUpdate("targetUnit", data.targetUnit);
  addUpdate("baselineValue", data.baselineValue);
  addUpdate("targetDirection", data.targetDirection);
  addUpdate("budget", data.budget);

  if (updates.length === 0) throw new Error("No fields to update");
  updates.push("updatedAt = GETDATE()");

  const { rows } = await safeQuery<any>(
    `UPDATE ProjectCategory SET ${updates.join(", ")}
     OUTPUT INSERTED.*
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
  const link = "/cidp?status=PENDING_REVIEW";
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

  // --- Notifications to creators ---
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
      if (
        change.field === "targetType" ||
        change.field === "targetUnit" ||
        change.field === "targetDirection"
      ) {
        const req = new sql.Request(trx);
        req.input("id", sql.NVarChar(50), categoryId);
        req.input("field", sql.NVarChar(100), change.field);
        req.input("val", sql.NVarChar(sql.MAX), change.suggestedValue);
        await req.query(`
          UPDATE ProjectCategory
          SET ${change.field} = @val, updatedAt = GETDATE()
          WHERE id = @id
        `);
      } else if (
        change.field === "baselineValue" ||
        change.field === "target"
      ) {
        const req = new sql.Request(trx);
        req.input("id", sql.NVarChar(50), categoryId);
        req.input("field", sql.NVarChar(100), change.field);
        req.input("val", sql.Decimal(18, 2), Number(change.suggestedValue));
        await req.query(`
          UPDATE ProjectCategory
          SET ${change.field} = @val, updatedAt = GETDATE()
          WHERE id = @id
        `);
      } else {
        // name, sector, budget
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

  // --- Notification to creator ---
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
    `UPDATE CategoryReviewNote SET resolvedAt = GETDATE() WHERE categoryId = @p1 AND resolvedAt IS NULL`,
    [categoryId],
  );
  await safeQuery(
    `UPDATE ProjectCategory SET status = 'DRAFT', updatedAt = GETDATE() WHERE id = @p1 AND status = 'CHANGES_REQUESTED'`,
    [categoryId],
  );
  revalidatePath("/cidp");

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

// ─── fetchFilteredProjectsFlat ────────────────────────────────────────────────
export async function fetchFilteredProjectsFlat(filters?: {
  sector?: string;
  categoryName?: string;
  projectName?: string;
  status?: string;
  minBudget?: number;
  maxBudget?: number;
}): Promise<FlatProject[]> {
  const unitLookup = await buildUnitLookup();

  let query = `
    SELECT
      p.id, p.name, p.orgUnitId, p.sector, p.budget, p.progress, p.status AS dbStatus, p.createdAt, p.categoryId,
      pc.name AS categoryName,
      t.latestTrackerPercent
    FROM Project p
    LEFT JOIN ProjectCategory pc ON p.categoryId = pc.id
    OUTER APPLY (
      SELECT TOP 1 overallPercent AS latestTrackerPercent
      FROM TrackerSubmission ts WHERE ts.projectId = p.id ORDER BY ts.submittedAt DESC
    ) t
    WHERE 1=1
  `;
  const params: any[] = [];
  let idx = 1;
  if (filters?.categoryName) {
    query += ` AND pc.name LIKE @p${idx}`;
    params.push(`%${filters.categoryName}%`);
    idx++;
  }
  if (filters?.projectName) {
    query += ` AND p.name LIKE @p${idx}`;
    params.push(`%${filters.projectName}%`);
    idx++;
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
        // handle in code
        break;
      case "TERMINATED":
        query += ` AND p.status = 'TERMINATED'`;
        break;
    }
  }
  if (filters?.minBudget !== undefined) {
    query += ` AND p.budget >= @p${idx}`;
    params.push(filters.minBudget);
    idx++;
  }
  if (filters?.maxBudget !== undefined) {
    query += ` AND p.budget <= @p${idx}`;
    params.push(filters.maxBudget);
    idx++;
  }
  // Sector filter not applied in SQL; we do it in code
  query += ` ORDER BY p.createdAt DESC`;

  const { rows } = await safeQuery<any>(query, params);
  const result: FlatProject[] = [];
  for (const row of rows) {
    if (filters?.sector) {
      const root = await getRootUnitName(row.orgUnitId, unitLookup);
      if (root !== filters.sector) continue;
    }
    if (filters?.status === "STALLED") {
      // placeholder; implement later
    }
    result.push({
      id: row.id.toString(),
      name: row.name,
      categoryId: row.categoryId?.toString() ?? null,
      categoryName: row.categoryName ?? null,
      sector: row.sector ?? null, // keep old sector for display? Might be deprecated
      status: row.dbStatus,
      budget: row.budget != null ? Number(row.budget) : null,
      progress: row.latestTrackerPercent ?? 0,
      ward: row.ward ?? null,
      subCounty: row.subCounty ?? null,
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    });
  }
  return result;
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
  const unitLookup = await buildUnitLookup();

  let query = `
    SELECT
      p.id, p.name, p.orgUnitId, p.status, p.budget, p.progress, p.createdAt,
      t.latestTrackerPercent
    FROM Project p
    OUTER APPLY (
      SELECT TOP 1 overallPercent AS latestTrackerPercent
      FROM TrackerSubmission ts WHERE ts.projectId = p.id ORDER BY ts.submittedAt DESC
    ) t
    WHERE p.categoryId IS NULL
      AND p.status != 'ARCHIVED'
  `;
  const params: any[] = [];
  let idx = 1;
  if (projectFilters?.projectName) {
    query += ` AND p.name LIKE @p${idx}`;
    params.push(`%${projectFilters.projectName}%`);
    idx++;
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
        // Skip SQL filter; apply in code
        break;
      case "TERMINATED":
        query += ` AND p.status = 'TERMINATED'`;
        break;
    }
  }
  if (projectFilters?.minBudget !== undefined) {
    query += ` AND p.budget >= @p${idx}`;
    params.push(projectFilters.minBudget);
    idx++;
  }
  if (projectFilters?.maxBudget !== undefined) {
    query += ` AND p.budget <= @p${idx}`;
    params.push(projectFilters.maxBudget);
    idx++;
  }
  query += ` ORDER BY p.createdAt DESC`;

  const { rows } = await safeQuery<any>(query, params);

  // Filter by sector (root unit) and by STALLED status (needs additional data)
  const result: CategoryProject[] = [];
  for (const p of rows) {
    if (sector) {
      const root = await getRootUnitName(p.orgUnitId, unitLookup);
      if (root !== sector) continue;
    }
    // STALLED filter
    if (projectFilters?.status === "STALLED") {
      // Need previous tracker; skip for now (implement later)
    }
    let size: CategoryProject["size"] = null;
    if (p.budget != null) {
      if (p.budget <= 500_000) size = "Small";
      else if (p.budget <= 1_000_000) size = "Medium";
      else size = "Large";
    }
    result.push({
      id: p.id.toString(),
      name: p.name,
      sector: null, // will be updated later? Not needed.
      status: p.status,
      budget: p.budget != null ? Number(p.budget) : null,
      progress:
        p.latestTrackerPercent != null ? Number(p.latestTrackerPercent) : null,
      size,
      subCounty: p.subCounty ?? null,
      ward: p.ward ?? null,
      createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
      latestTrackerPercent:
        p.latestTrackerPercent != null ? Number(p.latestTrackerPercent) : null,
      latestTrackerDate: null,
      trackerCount: 0,
      contributionValue: null,
    });
  }
  return result;
}

// ─── fetchCategoriesWithProjects ──────────────────────────────────────────────
// ─── fetchCategoriesWithProjects (fixed) ──────────────────────────────────
export async function fetchCategoriesWithProjects(filters?: {
  sector?: string; // root unit name
  query?: string;
  projectName?: string;
  projectStatus?: string;
  minBudget?: number;
  maxBudget?: number;
}): Promise<CategoryWithProjects[]> {
  // 1. Fetch approved categories (filter by category name if present)
  const catConditions: string[] = ["status = 'APPROVED'"];
  const catParams: any[] = [];
  if (filters?.query) {
    catParams.push(`%${filters.query}%`);
    catConditions.push(`name LIKE @p${catParams.length}`);
  }
  const where = `WHERE ${catConditions.join(" AND ")}`;
  const { rows: catRows } = await safeQuery<any>(
    `SELECT * FROM ProjectCategory ${where} ORDER BY sector, name`,
    catParams,
  );
  if (catRows.length === 0) return [];

  const unitLookup = await buildUnitLookup();
  const result: CategoryWithProjects[] = [];

  for (const cat of catRows) {
    // Build project query for this category – use @p1 for categoryId
    let projectSQL = `
      SELECT
        p.id, p.name, p.orgUnitId, p.status, p.budget, p.progress,
        p.createdAt, p.contributionValue,
        t.latestTrackerPercent
      FROM Project p
      OUTER APPLY (
        SELECT TOP 1 overallPercent AS latestTrackerPercent
        FROM TrackerSubmission
        WHERE projectId = p.id
        ORDER BY submittedAt DESC
      ) t
      WHERE p.categoryId = @p1
        AND p.status != 'ARCHIVED'
    `;
    const params: any[] = [cat.id];
    let paramIdx = 2; // next parameter number

    // Apply project-level filters
    if (filters?.projectName) {
      projectSQL += ` AND p.name LIKE @p${paramIdx}`;
      params.push(`%${filters.projectName}%`);
      paramIdx++;
    }
    if (filters?.projectStatus && filters.projectStatus !== "ALL") {
      switch (filters.projectStatus) {
        case "ONGOING":
          projectSQL += ` AND ISNULL(t.latestTrackerPercent, 0) > 0 AND ISNULL(t.latestTrackerPercent, 0) < 100`;
          break;
        case "COMPLETED":
          projectSQL += ` AND ISNULL(t.latestTrackerPercent, 0) = 100`;
          break;
        case "NOT_STARTED":
          projectSQL += ` AND ISNULL(t.latestTrackerPercent, 0) = 0`;
          break;
        case "STALLED":
          // handle after fetching (placeholder)
          break;
        case "TERMINATED":
          projectSQL += ` AND p.status = 'TERMINATED'`;
          break;
      }
    }
    if (filters?.minBudget !== undefined) {
      projectSQL += ` AND p.budget >= @p${paramIdx}`;
      params.push(filters.minBudget);
      paramIdx++;
    }
    if (filters?.maxBudget !== undefined) {
      projectSQL += ` AND p.budget <= @p${paramIdx}`;
      params.push(filters.maxBudget);
      paramIdx++;
    }

    const { rows: projRows } = await safeQuery<any>(projectSQL, params);

    // Filter by root sector if a sector filter is active
    let filtered = projRows;
    if (filters?.sector) {
      const targetSector = filters.sector;
      const filtered2 = [];
      for (const p of projRows) {
        const root = await getRootUnitName(p.orgUnitId, unitLookup);
        if (root === targetSector) filtered2.push(p);
      }
      filtered = filtered2;
    }

    // STALLED filter – you can implement later with time‑based logic
    if (filters?.projectStatus === "STALLED") {
      // Placeholder: keep everything for now
    }

    // If no projects remain after filtering, skip the category
    if (filtered.length === 0) continue;

    // Build project list with full tracker details (batch queries)
    const projectIds = filtered.map((p) => p.id);
    let trackerByProject = new Map<
      string,
      { overallPercent: number; submittedAt: Date } // ✅ now a Date
    >();
    let countByProject = new Map<string, number>();

    if (projectIds.length > 0) {
      const placeholders = projectIds.map((_, i) => `@p${i + 1}`).join(",");

      // Latest tracker info
      const { rows: trackerRows } = await safeQuery<any>(
        `SELECT projectId, overallPercent, submittedAt
         FROM TrackerSubmission
         WHERE projectId IN (${placeholders})
           AND submittedAt = (SELECT MAX(submittedAt) FROM TrackerSubmission t2 WHERE t2.projectId = TrackerSubmission.projectId)`,
        projectIds,
      );
      for (const r of trackerRows) trackerByProject.set(r.projectId, r);

      // Tracker counts
      const { rows: countRows } = await safeQuery<any>(
        `SELECT projectId, COUNT(*) AS cnt FROM TrackerSubmission WHERE projectId IN (${placeholders}) GROUP BY projectId`,
        projectIds,
      );
      for (const r of countRows) countByProject.set(r.projectId, Number(r.cnt));
    }

    const projects: CategoryProject[] = filtered.map((p: any) => {
      let size: CategoryProject["size"] = null;
      if (p.budget != null) {
        if (p.budget <= 500_000) size = "Small";
        else if (p.budget <= 1_000_000) size = "Medium";
        else size = "Large";
      }
      const tr = trackerByProject.get(p.id);
      return {
        id: p.id.toString(),
        name: p.name,
        sector: null, // filled later? Not needed for display
        status: p.status,
        budget: p.budget != null ? Number(p.budget) : null,
        progress: tr ? Number(tr.overallPercent) : null,
        size,
        subCounty: p.subCounty ?? null,
        ward: p.ward ?? null,
        createdAt: p.createdAt?.toISOString() ?? new Date().toISOString(),
        latestTrackerPercent: tr ? Number(tr.overallPercent) : null,
        latestTrackerDate: tr ? tr.submittedAt?.toISOString() : null,
        trackerCount: countByProject.get(p.id) ?? 0,
        contributionValue: p.contributionValue ?? null,
      };
    });
    const projectsWithStatus = projects.map((p) => {
      let derivedStatus: string;
      if (p.status === "TERMINATED") {
        derivedStatus = "TERMINATED";
      } else {
        const pct = p.latestTrackerPercent ?? 0;
        if (pct >= 100) derivedStatus = "COMPLETED";
        else if (pct > 0) derivedStatus = "ONGOING";
        else derivedStatus = "NOT_STARTED";
      }
      return { ...p, derivedStatus };
    });

    const notStartedCount = projectsWithStatus.filter(
      (p) => p.derivedStatus === "NOT_STARTED",
    ).length;
    const ongoingCount = projectsWithStatus.filter(
      (p) => p.derivedStatus === "ONGOING",
    ).length;
    const stalledCount = projectsWithStatus.filter(
      (p) => p.derivedStatus === "STALLED",
    ).length; // will be 0 for now
    const completedCount = projectsWithStatus.filter(
      (p) => p.derivedStatus === "COMPLETED",
    ).length;
    const terminatedCount = projectsWithStatus.filter(
      (p) => p.derivedStatus === "TERMINATED",
    ).length;

    const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
    const pendingCount = projects.filter((p) => p.status === "PENDING").length;
    const progValues = projects.map((p) => p.latestTrackerPercent ?? 0);
    const avgProgress =
      progValues.length > 0
        ? progValues.reduce((a, b) => a + b, 0) / progValues.length
        : null;

    // Root sector for the category – use the first project's organisational unit
    let displaySector = cat.sector ?? "Unknown";
    if (filtered.length > 0) {
      const firstOrgId = filtered[0].orgUnitId;
      if (firstOrgId) {
        displaySector = await getRootUnitName(firstOrgId, unitLookup);
      }
    }

    result.push({
      ...mapCategory(cat),
      sector: displaySector,
      projects: projectsWithStatus,
      projectCount: projectsWithStatus.length,
      activeCount, // still available for backward compatibility? We'll replace with new counts.
      pendingCount, // we can remove later
      avgProgress,
      notStartedCount,
      ongoingCount,
      stalledCount,
      completedCount,
      terminatedCount,
    });
  }

  return result;
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
