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
  budget: number | null;
  status: CategoryStatus;
  createdBy: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reviewNotes?: ReviewNote[];
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 44);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
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
    `SELECT id, name, sector, target, budget, status, createdBy,
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
    `SELECT id, name, sector, target, budget, status, createdBy,
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
      req.input("budget", sql.Decimal(18, 2), item.budget ?? null);
      req.input("status", sql.NVarChar(50), "DRAFT");
      req.input("createdBy", sql.NVarChar(200), createdBy || null);
      const result = await req.query(`
        INSERT INTO ProjectCategory (id, name, sector, target, budget, status, createdBy)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.sector, INSERTED.target,
               INSERTED.budget, INSERTED.status, INSERTED.createdBy,
               INSERTED.submittedAt, INSERTED.reviewedAt,
               INSERTED.createdAt, INSERTED.updatedAt
        VALUES (@id, @name, @sector, @target, @budget, @status, @createdBy)
      `);
      created.push(mapCategory(result.recordset[0]));
    }
    return created;
  });
}

// ─── updateCategory  (sector officer edits) ───────────────────────────────────

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    sector?: string;
    target?: number;
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
  if (data.budget !== undefined) {
    updates.push(`budget = @p${params.length + 1}`);
    params.push(data.budget);
  }

  if (updates.length === 0) throw new Error("No fields to update");
  updates.push("updatedAt = GETDATE()");

  const { rows } = await safeQuery<any>(
    `UPDATE ProjectCategory SET ${updates.join(", ")}
     OUTPUT INSERTED.id, INSERTED.name, INSERTED.sector, INSERTED.target,
            INSERTED.budget, INSERTED.status, INSERTED.createdBy,
            INSERTED.submittedAt, INSERTED.reviewedAt, INSERTED.createdAt, INSERTED.updatedAt
     WHERE id = @p${params.length + 1}`,
    [...params, id],
  );
  if (rows.length === 0) throw new DatabaseError();
  revalidatePath("/cidp");
  return mapCategory(rows[0]);
}

// ─── addCategory (sector officer adds a new one) ──────────────────────────────

export async function addCategory(
  data: { name: string; sector?: string; target?: number; budget?: number },
  createdBy?: string,
): Promise<ProjectCategory> {
  const [result] = await batchCreateCategories([data], createdBy);
  revalidatePath("/cidp");
  return result;
}

// ─── deleteCategory ───────────────────────────────────────────────────────────

export async function deleteCategory(id: string): Promise<void> {
  await safeQuery(`DELETE FROM ProjectCategory WHERE id = @p1`, [id]);
  revalidatePath("/cidp");
}

// ─── submitForReview (sector → ME) ───────────────────────────────────────────

export async function submitForReview(
  categoryIds: string[],
  actorEmail?: string,
): Promise<void> {
  await withTransaction(async (trx) => {
    for (const id of categoryIds) {
      // Only allow submit from DRAFT or CHANGES_REQUESTED
      const req1 = new sql.Request(trx);
      req1.input("id", sql.NVarChar(50), id);
      req1.input("actorEmail", sql.NVarChar(200), actorEmail || null);
      await req1.query(`
        UPDATE ProjectCategory
        SET status = 'PENDING_REVIEW', submittedAt = GETDATE(), updatedAt = GETDATE()
        WHERE id = @id AND status IN ('DRAFT', 'CHANGES_REQUESTED')
      `);
      // Log history
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
}

// ─── approveCategories (ME commits) ──────────────────────────────────────────

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
}

// ─── requestChanges (ME sends back with per-field notes) ─────────────────────

export interface FieldChange {
  field: "name" | "target" | "budget" | "sector";
  originalValue: string;
  suggestedValue: string;
  reason: string;
}

export async function requestChanges(
  categoryId: string,
  changes: FieldChange[],
  reviewerEmail?: string,
): Promise<void> {
  await withTransaction(async (trx) => {
    // Apply suggested values to the category
    for (const change of changes) {
      const req = new sql.Request(trx);
      req.input("id", sql.NVarChar(50), categoryId);
      req.input("field", sql.NVarChar(100), change.field);
      req.input("val", sql.NVarChar(sql.MAX), change.suggestedValue);
      // Dynamically update only the changed field
      await req.query(`
        UPDATE ProjectCategory
        SET ${change.field} = @val, updatedAt = GETDATE()
        WHERE id = @id
      `);
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
}

// ─── acknowledgeChanges (sector acknowledges ME notes) ────────────────────────

export async function acknowledgeChanges(categoryId: string): Promise<void> {
  // Mark all open review notes as resolved
  await safeQuery(
    `UPDATE CategoryReviewNote
     SET resolvedAt = GETDATE()
     WHERE categoryId = @p1 AND resolvedAt IS NULL`,
    [categoryId],
  );
  // Move back to DRAFT so sector can re-edit and re-submit
  await safeQuery(
    `UPDATE ProjectCategory
     SET status = 'DRAFT', updatedAt = GETDATE()
     WHERE id = @p1 AND status = 'CHANGES_REQUESTED'`,
    [categoryId],
  );
  revalidatePath("/cidp");
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapCategory(row: any): ProjectCategory {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector ?? null,
    target: row.target != null ? Number(row.target) : null,
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

// ─── Types for category+projects view ────────────────────────────────────────

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
  // Tracker snapshot
  latestTrackerPercent: number | null;
  latestTrackerDate: string | null;
  trackerCount: number;
}

export interface CategoryWithProjects extends ProjectCategory {
  projects: CategoryProject[];
  projectCount: number;
  activeCount: number;
  pendingCount: number;
  avgProgress: number | null;
}

// ─── fetchCategoriesWithProjects ──────────────────────────────────────────────
// Returns all APPROVED categories, each with their linked projects and a
// lightweight enrichment (latest tracker, counts).  Used by the grouped
// projects page so the server component can render everything in one shot.

// Add these types and functions at the end of the file

// ─── New type for flat project list ─────────────────────────────────────────
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

// ─── fetchFilteredProjectsFlat ──────────────────────────────────────────────
// Returns a flat list of projects with their category names, applying all filters.
export async function fetchFilteredProjectsFlat(filters?: {
  sector?: string;
  categoryName?: string; // search inside category name
  projectName?: string;
  status?: string;
  minBudget?: number;
  maxBudget?: number;
}): Promise<FlatProject[]> {
  let query = `
    SELECT
      p.id, p.name, p.sector, p.status, p.budget, p.progress,
      p.ward, p.subCounty, p.createdAt, p.categoryId,
      pc.name as categoryName
    FROM Project p
    LEFT JOIN ProjectCategory pc ON p.categoryId = pc.id
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
  if (filters?.status) {
    query += ` AND p.status = @p${++paramIndex}`;
    params.push(filters.status);
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
    status: row.status,
    budget: row.budget != null ? Number(row.budget) : null,
    progress: row.progress != null ? Number(row.progress) : 0,
    ward: row.ward ?? null,
    subCounty: row.subCounty ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
}

// ─── Update fetchUncategorizedProjects to accept project filters ────────────
// (Replace the existing function with this version)
// ─── fetchUncategorizedProjects (fixed) ──────────────────────────────────────
export async function fetchUncategorizedProjects(
  sector?: string,
  projectFilters?: {
    projectName?: string;
    status?: string;
    minBudget?: number;
    maxBudget?: number;
  },
): Promise<CategoryProject[]> {
  // 1. Build main query with filters
  let query = `
    SELECT p.id, p.name, p.sector, p.status, p.budget, p.progress,
           p.subCounty, p.ward, p.createdAt
    FROM Project p
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
    query += ` AND p.status = @p${nextParam++}`;
    mainParams.push(projectFilters.status);
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

  // 2. Get latest tracker submission for each project
  const projectIds = rows.map((p: any) => p.id.toString());
  // Build tracker query with its own independent parameters
  const trackerQuery = `
    SELECT t.projectId, t.overallPercent, t.submittedAt
    FROM TrackerSubmission t
    WHERE t.projectId IN (${projectIds.map((_, i) => `@p${i + 1}`).join(",")})
      AND t.submittedAt = (
        SELECT MAX(t2.submittedAt) FROM TrackerSubmission t2 WHERE t2.projectId = t.projectId
      )
  `;
  const { rows: trackerRows } = await safeQuery<any>(trackerQuery, projectIds);
  const trackerByProject = new Map(
    trackerRows.map((r: any) => [r.projectId.toString(), r]),
  );

  // 3. Map results
  return rows.map((p: any) => {
    let size: CategoryProject["size"] = null;
    if (p.budget != null) {
      if (p.budget <= 500_000) size = "Small";
      else if (p.budget <= 1_000_000) size = "Medium";
      else size = "Large";
    }
    const tr = trackerByProject.get(p.id.toString());
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
      latestTrackerPercent: tr ? Number(tr.overallPercent) : null,
      latestTrackerDate: tr ? tr.submittedAt?.toISOString() : null,
      trackerCount: 0,
    };
  });
}

// ─── Update fetchCategoriesWithProjects to accept project filters ───────────
// (Replace the existing function with this version)
export async function fetchCategoriesWithProjects(filters?: {
  sector?: string;
  query?: string; // category name search
  projectName?: string;
  projectStatus?: string;
  minBudget?: number;
  maxBudget?: number;
}): Promise<CategoryWithProjects[]> {
  // 1. Load approved categories (sector & category name filters)
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
    `SELECT id, name, sector, target, budget, status, createdBy,
            submittedAt, reviewedAt, createdAt, updatedAt
     FROM ProjectCategory ${where}
     ORDER BY sector, name`,
    catParams,
  );
  if (catRows.length === 0) return [];

  const categoryIds = catRows.map((r: any) => r.id);

  // 2. Load projects belonging to these categories, with project-level filters
  let projectQuery = `
    SELECT p.id, p.name, p.sector, p.status, p.budget, p.progress,
           p.subCounty, p.ward, p.createdAt, p.categoryId
    FROM Project p
    WHERE p.categoryId IN (${categoryIds.map((_, i) => `@p${i + 1}`).join(",")})
  `;
  const projectParams = [...categoryIds];
  let paramIndex = categoryIds.length;

  if (filters?.projectName) {
    projectQuery += ` AND p.name LIKE @p${++paramIndex}`;
    projectParams.push(`%${filters.projectName}%`);
  }
  if (filters?.projectStatus && filters.projectStatus !== "ALL") {
    projectQuery += ` AND p.status = @p${++paramIndex}`;
    projectParams.push(filters.projectStatus);
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

  // 3. Enrich with tracker data
  let trackerByProject = new Map<string, any>();
  let countByProject = new Map<string, number>();
  if (projectRows.length > 0) {
    const projectIds = projectRows.map((p: any) => p.id.toString());
    const projPlaceholders = projectIds.map((_, i) => `@p${i + 1}`).join(",");
    const { rows: trackerRows } = await safeQuery<any>(
      `SELECT t.projectId, t.overallPercent, t.submittedAt
       FROM TrackerSubmission t
       WHERE t.projectId IN (${projPlaceholders})
         AND t.submittedAt = (
           SELECT MAX(t2.submittedAt) FROM TrackerSubmission t2 WHERE t2.projectId = t.projectId
         )`,
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

  // 4. Group projects by categoryId
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
    });
  }

  // 5. Return ALL categories, including those without projects
  //    (projects array will be empty, counts zero, avgProgress null)
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
// Convenience wrapper used by the "+ Add Project" button on the category page.
// Creates a PENDING project already linked to the given category.

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
