// File: lib/actions/actions.ts

"use server";

import { revalidatePath } from "next/cache";
// lib/actions/projectActions.ts

import { DatabaseError, safeQuery } from "../db";
import { Project } from "../types/projectsTypes";
import { withTransaction } from "./checklistActions";
import sql from "mssql";

export async function getProject(id: string): Promise<Project | null> {
  try {
    const sqlQuery = `
      SELECT id, name, sector, budget, status, lat, long, description,
             subCounty, ward, createdAt, updatedAt
      FROM Project
      WHERE id = @p1
    `;
    const { rows } = await safeQuery<any>(sqlQuery, [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      sector: row.sector,
      budget: row.budget,
      status: row.status,
      lat: row.lat,
      long: row.long,
      description: row.description,
      subCounty: row.subCounty,
      ward: row.ward,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    };
  } catch (error) {
    console.error("getProject error:", error);
    throw new DatabaseError();
  }
}

// -----------------------------------------------------------------------------
// Helper to build dynamic WHERE clause and parameters
// -----------------------------------------------------------------------------
function buildFilterConditions(
  query: string,
  startDate?: string,
  endDate?: string,
  status?: string,
  size?: string, // 'Small' | 'Medium' | 'Large' | 'ALL'
): { whereClause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];

  if (query) {
    conditions.push(
      `(name LIKE @p${params.length + 1} OR CAST(id AS NVARCHAR) LIKE @p${params.length + 1})`,
    );
    params.push(`%${query}%`);
  }

  if (startDate) {
    conditions.push(`createdAt >= @p${params.length + 1}`);
    params.push(new Date(startDate));
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(`createdAt <= @p${params.length + 1}`);
    params.push(end);
  }

  if (status && status !== "ALL") {
    conditions.push(`status = @p${params.length + 1}`);
    params.push(status);
  }

  if (size && size !== "ALL") {
    if (size === "Small") {
      conditions.push(`budget <= @p${params.length + 1}`);
      params.push(500000);
    } else if (size === "Medium") {
      conditions.push(
        `budget > @p${params.length + 1} AND budget <= @p${params.length + 2}`,
      );
      params.push(500000, 1000000);
    } else if (size === "Large") {
      conditions.push(`budget > @p${params.length + 1}`);
      params.push(1000000);
    }
  }

  const whereClause = conditions.length
    ? "WHERE " + conditions.join(" AND ")
    : "";
  return { whereClause, params };
}

// -----------------------------------------------------------------------------
// Get total number of pages (for pagination)
// -----------------------------------------------------------------------------
export async function fetchProjectsPages(
  query: string,
  startDate?: string,
  endDate?: string,
  status?: string,
  size?: string,
): Promise<number> {
  const ITEMS_PER_PAGE = 10;

  try {
    const { whereClause, params } = buildFilterConditions(
      query,
      startDate,
      endDate,
      status,
      size,
    );
    const sql = `
      SELECT COUNT(*) as count
      FROM Project
      ${whereClause}
    `;
    const { rows } = await safeQuery<{ count: number }>(sql, params);
    const totalCount = rows[0]?.count || 0;
    return Math.ceil(totalCount / ITEMS_PER_PAGE);
  } catch (error) {
    console.error("fetchProjectsPages error:", error);
    return 0;
  }
}

// -----------------------------------------------------------------------------
// Fetch paginated projects for the table view
// -----------------------------------------------------------------------------
export async function fetchFilteredProjects({
  query,
  startDate,
  endDate,
  status,
  size,
  currentPage,
  userEmail,
}: {
  query: string;
  startDate?: string;
  endDate?: string;
  status: string;
  size: string;
  currentPage: number;
  userEmail: string;
}): Promise<Project[]> {
  const ITEMS_PER_PAGE = 10;
  try {
    const { whereClause, params } = buildFilterConditions(
      query,
      startDate,
      endDate,
      status,
      size,
    );
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    const sql = `
      SELECT id, name, sector, status, budget, progress, lat, long, createdAt
      FROM Project
      ${whereClause}
      ORDER BY createdAt DESC
      OFFSET @p${params.length + 1} ROWS FETCH NEXT @p${params.length + 2} ROWS ONLY
    `;
    params.push(offset, ITEMS_PER_PAGE);

    const { rows } = await safeQuery<any>(sql, params);
    return rows.map((row) => {
      let size: Project["size"] = null;
      if (row.budget !== null) {
        if (row.budget <= 500000) size = "Small";
        else if (row.budget <= 1000000) size = "Medium";
        else size = "Large";
      }
      return {
        id: row.id.toString(),
        name: row.name,
        sector: row.sector,
        status: row.status,
        budget: row.budget,
        progress: row.progress,
        lat: row.lat,
        long: row.long,
        createdAt: new Date(row.createdAt),
        size,
      };
    });
  } catch (error) {
    console.error("fetchFilteredProjects error:", error);
    return [];
  }
}
// -----------------------------------------------------------------------------
// Fetch all projects (with coordinates) for the map view
// -----------------------------------------------------------------------------
export async function fetchProjectsForMap({
  query,
  status,
  size,
  userEmail,
}: {
  query: string;
  status: string;
  size: string;
  userEmail: string;
}): Promise<Project[]> {
  try {
    const { whereClause, params } = buildFilterConditions(
      query,
      undefined,
      undefined,
      status,
      size,
    );
    // Only include projects that have valid coordinates
    const coordCondition = whereClause
      ? ` AND lat IS NOT NULL AND long IS NOT NULL`
      : `WHERE lat IS NOT NULL AND long IS NOT NULL`;
    const fullWhere = whereClause
      ? whereClause + coordCondition
      : coordCondition;

    const sql = `
      SELECT id, name, sector, status, budget, progress, lat, long, createdAt
      FROM Project
      ${fullWhere}
      ORDER BY createdAt DESC
    `;
    const { rows } = await safeQuery<any>(sql, params);
    return rows.map((row) => {
      let size: Project["size"] = null;
      if (row.budget !== null) {
        if (row.budget <= 500000) size = "Small";
        else if (row.budget <= 1000000) size = "Medium";
        else size = "Large";
      }
      return {
        id: row.id.toString(),
        name: row.name,
        sector: row.sector,
        status: row.status,
        budget: row.budget,
        progress: row.progress,
        lat: row.lat,
        long: row.long,
        createdAt: new Date(row.createdAt),
        size,
      };
    });
  } catch (error) {
    console.error("fetchProjectsForMap error:", error);
    return [];
  }
}

// Helper: generate a slug from name
function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).substring(2, 6)
  );
}

// -----------------------------------------------------------------------------
// Get all projects (optionally filtered)
// -----------------------------------------------------------------------------
export async function getProjects(): Promise<Project[]> {
  try {
    const sqlQuery = `
      SELECT id, name, sector, budget, status, lat, long, description, createdAt, updatedAt
      FROM Project
      ORDER BY createdAt DESC
    `;
    const { rows } = await safeQuery<any>(sqlQuery, []);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sector: row.sector,
      budget: row.budget,
      status: row.status,
      lat: row.lat,
      long: row.long,
      description: row.description,
      createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: row.updatedAt?.toISOString() || new Date().toISOString(),
    }));
  } catch (error) {
    console.error("getProjects error:", error);
    throw new DatabaseError();
  }
}

// -----------------------------------------------------------------------------
// Create a single project
// -----------------------------------------------------------------------------
export async function createProject(data: {
  name: string;
  sector?: string;
  budget?: number;
  lat?: number;
  long?: number;
  description?: string;
}): Promise<Project> {
  const slug = generateSlug(data.name);
  try {
    const sqlQuery = `
      INSERT INTO Project (id, name, sector, budget, lat, long, description, status)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.sector,
             INSERTED.budget, INSERTED.status, INSERTED.lat, INSERTED.long,
             INSERTED.description, INSERTED.createdAt, INSERTED.updatedAt
      VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8)
    `;
    const params = [
      slug,
      data.name,
      data.sector || null,
      data.budget || null,
      data.lat || null,
      data.long || null,
      data.description || null,
      "PENDING",
    ];
    const { rows } = await safeQuery<any>(sqlQuery, params);
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      sector: row.sector,
      budget: row.budget,
      status: row.status,
      lat: row.lat,
      long: row.long,
      description: row.description,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    };
  } catch (error) {
    console.error("createProject error:", error);
    throw new DatabaseError();
  }
}

// -----------------------------------------------------------------------------
// Update a project
// -----------------------------------------------------------------------------
export async function updateProject(
  id: string,
  data: Partial<Omit<Project, "id" | "slug" | "createdAt" | "updatedAt">>,
): Promise<Project> {
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
  if (data.budget !== undefined) {
    updates.push(`budget = @p${params.length + 1}`);
    params.push(data.budget);
  }
  if (data.status !== undefined) {
    updates.push(`status = @p${params.length + 1}`);
    params.push(data.status);
  }
  if (data.lat !== undefined) {
    updates.push(`lat = @p${params.length + 1}`);
    params.push(data.lat);
  }
  if (data.long !== undefined) {
    updates.push(`long = @p${params.length + 1}`);
    params.push(data.long);
  }
  if (data.description !== undefined) {
    updates.push(`description = @p${params.length + 1}`);
    params.push(data.description);
  }

  if (updates.length === 0) {
    throw new Error("No fields to update");
  }

  updates.push(`updatedAt = GETDATE()`);

  const sqlQuery = `
    UPDATE Project
    SET ${updates.join(", ")}
    OUTPUT INSERTED.id, INSERTED.name, INSERTED.sector,
           INSERTED.budget, INSERTED.status, INSERTED.lat, INSERTED.long,
           INSERTED.description, INSERTED.createdAt, INSERTED.updatedAt
    WHERE id = @p${params.length + 1}
  `;
  params.push(id);

  try {
    const { rows } = await safeQuery<any>(sqlQuery, params);
    if (rows.length === 0) throw new Error("Project not found");
    const row = rows[0];
    revalidatePath("/settings"); // adjust to your path
    return {
      id: row.id.toString(),
      name: row.name,
      sector: row.sector,
      budget: row.budget,
      status: row.status,
      lat: row.lat,
      long: row.long,
      description: row.description,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    };
  } catch (error) {
    console.error("updateProject error:", error);
    throw new DatabaseError();
  }
}

// -----------------------------------------------------------------------------
// Delete a project
// -----------------------------------------------------------------------------
export async function deleteProject(id: string): Promise<void> {
  try {
    await safeQuery("DELETE FROM Project WHERE id = @p1", [id]);
    revalidatePath("/settings");
  } catch (error) {
    console.error("deleteProject error:", error);
    throw new DatabaseError();
  }
}

// -----------------------------------------------------------------------------
// Batch create projects (for CSV/JSON upload)
// -----------------------------------------------------------------------------
export async function batchCreateProjects(
  projects: {
    name: string;
    sector?: string;
    budget?: number;
    lat?: number;
    long?: number;
    description?: string;
  }[],
): Promise<Project[]> {
  if (projects.length === 0) return [];

  return await withTransaction(async (trx) => {
    const created: Project[] = [];

    for (const data of projects) {
      const slug = generateSlug(data.name);
      const insertReq = new sql.Request(trx);
      insertReq.input("slug", sql.NVarChar, slug);
      insertReq.input("name", sql.NVarChar, data.name);
      insertReq.input("sector", sql.NVarChar, data.sector || null);
      insertReq.input("budget", sql.Decimal(18, 2), data.budget || null);
      insertReq.input("lat", sql.Decimal(10, 8), data.lat || null);
      insertReq.input("long", sql.Decimal(11, 8), data.long || null);
      insertReq.input("description", sql.NVarChar, data.description || null);
      insertReq.input("status", sql.NVarChar, "PENDING");

      const result = await insertReq.query(`
        INSERT INTO Project (id, name, sector, budget, lat, long, description, status)
        OUTPUT INSERTED.id, INSERTED.slug, INSERTED.name, INSERTED.sector,
               INSERTED.budget, INSERTED.status, INSERTED.lat, INSERTED.long,
               INSERTED.description, INSERTED.createdAt, INSERTED.updatedAt
        VALUES (@slug, @name, @sector, @budget, @lat, @long, @description, @status)
      `);

      const row = result.recordset[0];
      created.push({
        id: row.id,
        name: row.name,
        sector: row.sector,
        budget: row.budget,
        status: row.status,
        lat: row.lat,
        long: row.long,
        description: row.description,
        createdAt: row.createdAt?.toISOString(),
        updatedAt: row.updatedAt?.toISOString(),
      });
    }

    return created;
  });
}

// Initialize project: update location and set status to ACTIVE
export async function initializeProject(
  projectId: string,
  data: {
    subCounty: string;
    ward: string;
    lat: number;
    long: number;
  },
): Promise<void> {
  await withTransaction(async (trx) => {
    const updateReq = new sql.Request(trx);
    updateReq.input("id", sql.NVarChar, projectId);
    updateReq.input("subCounty", sql.NVarChar, data.subCounty);
    updateReq.input("ward", sql.NVarChar, data.ward);
    updateReq.input("lat", sql.Decimal(10, 8), data.lat);
    updateReq.input("long", sql.Decimal(11, 8), data.long);
    updateReq.input("status", sql.NVarChar, "ACTIVE");
    await updateReq.query(`
      UPDATE Project
      SET subCounty = @subCounty,
          ward = @ward,
          lat = @lat,
          long = @long,
          status = @status,
          updatedAt = GETDATE()
      WHERE id = @id
    `);
  });
  // Revalidate the project page
  revalidatePath(`/projects/${projectId}`);
}
