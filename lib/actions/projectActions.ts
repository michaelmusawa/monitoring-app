// lib/actions/projectActions.ts
"use server";

import { revalidatePath } from "next/cache";
import { DatabaseError, safeQuery } from "../db";
import { Project } from "../types/projectsTypes";
import { withTransaction } from "./checklistActions";
import sql from "mssql";

// ─── getProject ───────────────────────────────────────────────────────────────

export async function getProject(id: string): Promise<Project | null> {
  try {
    const sqlQuery = `
      SELECT id, name, sector, budget, status, lat, long, description,
             subCounty, ward, createdAt, updatedAt,
             fundingSource, employer, employerRep, projectManager,
             fiscalYear, contractSum, contractDuration,
             commencementDate, plannedCompletion, costToCompletion,
             categoryId
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
      fundingSource: row.fundingSource ?? null,
      employer: row.employer ?? null,
      employerRep: row.employerRep ?? null,
      projectManager: row.projectManager ?? null,
      fiscalYear: row.fiscalYear ?? null,
      contractSum: row.contractSum ?? null,
      contractDuration: row.contractDuration ?? null,
      commencementDate: row.commencementDate
        ? row.commencementDate.toISOString().slice(0, 10)
        : null,
      plannedCompletion: row.plannedCompletion
        ? row.plannedCompletion.toISOString().slice(0, 10)
        : null,
      costToCompletion: row.costToCompletion ?? null,
      categoryId: row.categoryId ?? null,
    };
  } catch (error) {
    console.error("getProject error:", error);
    throw new DatabaseError();
  }
}

// ─── Slug helper ──────────────────────────────────────────────────────────────
// Project.id is NVARCHAR(50). We reserve 5 chars for the "-xxxx" random suffix,
// leaving 45 chars for the slugified name portion.

const SLUG_NAME_MAX = 45; // 50 - 5 ("-xxxx")

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, SLUG_NAME_MAX); // hard cap at 45 chars
  const suffix = Math.random().toString(36).substring(2, 6); // 4-char random
  return `${base}-${suffix}`; // max 50 chars total
}

// ─── Filter helpers ───────────────────────────────────────────────────────────

function buildFilterConditions(
  query: string,
  startDate?: string,
  endDate?: string,
  status?: string,
  size?: string,
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

// ─── Pagination ───────────────────────────────────────────────────────────────

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
    const sqlStr = `SELECT COUNT(*) as count FROM Project ${whereClause}`;
    const { rows } = await safeQuery<{ count: number }>(sqlStr, params);
    return Math.ceil((rows[0]?.count || 0) / ITEMS_PER_PAGE);
  } catch (error) {
    console.error("fetchProjectsPages error:", error);
    return 0;
  }
}

// ─── Filtered list ────────────────────────────────────────────────────────────

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
    const sqlStr = `
      SELECT id, name, sector, status, budget, progress, lat, long, createdAt,
             subCounty, ward, categoryId
      FROM Project
      ${whereClause}
      ORDER BY createdAt DESC
      OFFSET @p${params.length + 1} ROWS FETCH NEXT @p${params.length + 2} ROWS ONLY
    `;
    params.push(offset, ITEMS_PER_PAGE);
    const { rows } = await safeQuery<any>(sqlStr, params);
    return rows.map((row: any) => mapProjectRow(row));
  } catch (error) {
    console.error("fetchFilteredProjects error:", error);
    return [];
  }
}

// ─── Map view ─────────────────────────────────────────────────────────────────

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
    const coordCondition = whereClause
      ? " AND lat IS NOT NULL AND long IS NOT NULL"
      : "WHERE lat IS NOT NULL AND long IS NOT NULL";
    const sqlStr = `
      SELECT id, name, sector, status, budget, progress, lat, long, createdAt
      FROM Project
      ${whereClause}${coordCondition}
      ORDER BY createdAt DESC
    `;
    const { rows } = await safeQuery<any>(sqlStr, params);
    return rows.map((row: any) => mapProjectRow(row));
  } catch (error) {
    console.error("fetchProjectsForMap error:", error);
    return [];
  }
}

function mapProjectRow(row: any): Project {
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
    subCounty: row.subCounty ?? null,
    ward: row.ward ?? null,
    categoryId: row.categoryId ?? null,
  };
}

// ─── getProjects ──────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  try {
    const sqlQuery = `
      SELECT id, name, sector, budget, status, lat, long, description, createdAt, updatedAt
      FROM Project ORDER BY createdAt DESC
    `;
    const { rows } = await safeQuery<any>(sqlQuery, []);
    return rows.map((row: any) => ({
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

// ─── createProject ────────────────────────────────────────────────────────────

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
    const { rows } = await safeQuery<any>(sqlQuery, [
      slug,
      data.name,
      data.sector || null,
      data.budget || null,
      data.lat || null,
      data.long || null,
      data.description || null,
      "PENDING",
    ]);
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

// ─── updateProject ────────────────────────────────────────────────────────────

export async function updateProject(
  id: string,
  data: Partial<Omit<Project, "id" | "slug" | "createdAt" | "updatedAt">>,
): Promise<Project> {
  const updates: string[] = [];
  const params: any[] = [];

  const fields: [keyof typeof data, string][] = [
    ["name", "name"],
    ["sector", "sector"],
    ["budget", "budget"],
    ["status", "status"],
    ["lat", "lat"],
    ["long", "long"],
    ["description", "description"],
  ];

  for (const [key, col] of fields) {
    if (data[key] !== undefined) {
      updates.push(`${col} = @p${params.length + 1}`);
      params.push(data[key]);
    }
  }

  if (updates.length === 0) throw new Error("No fields to update");
  updates.push("updatedAt = GETDATE()");

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
    revalidatePath("/settings");
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

// ─── deleteProject ────────────────────────────────────────────────────────────

export async function deleteProject(id: string): Promise<void> {
  try {
    await safeQuery("DELETE FROM Project WHERE id = @p1", [id]);
    revalidatePath("/settings");
  } catch (error) {
    console.error("deleteProject error:", error);
    throw new DatabaseError();
  }
}

// ─── batchCreateProjects ──────────────────────────────────────────────────────

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
      const req = new sql.Request(trx);
      req.input("slug", sql.NVarChar(50), slug);
      req.input("name", sql.NVarChar(500), data.name);
      req.input("sector", sql.NVarChar(200), data.sector || null);
      req.input("budget", sql.Decimal(18, 2), data.budget || null);
      req.input("lat", sql.Decimal(10, 8), data.lat || null);
      req.input("long", sql.Decimal(11, 8), data.long || null);
      req.input("description", sql.NVarChar(sql.MAX), data.description || null);
      req.input("status", sql.NVarChar(50), "PENDING");
      const result = await req.query(`
        INSERT INTO Project (id, name, sector, budget, lat, long, description, status)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.sector,
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

// ─── updateProjectLocation ────────────────────────────────────────────────────

export async function updateProjectLocation(
  projectId: string,
  data: { subCounty: string; ward: string; lat: number; long: number },
): Promise<void> {
  await withTransaction(async (trx) => {
    const req = new sql.Request(trx);
    req.input("id", sql.NVarChar, projectId);
    req.input("subCounty", sql.NVarChar, data.subCounty);
    req.input("ward", sql.NVarChar, data.ward);
    req.input("lat", sql.Decimal(10, 8), data.lat);
    req.input("long", sql.Decimal(11, 8), data.long);
    await req.query(`
      UPDATE Project
      SET subCounty = @subCounty, ward = @ward,
          lat = @lat, long = @long, updatedAt = GETDATE()
      WHERE id = @id
    `);
  });
  revalidatePath(`/projects/${projectId}`);
}

// ─── updateProjectDetails ─────────────────────────────────────────────────────

export async function updateProjectDetails(
  projectId: string,
  data: {
    fundingSource?: string;
    employer?: string;
    employerRep?: string;
    projectManager?: string;
    fiscalYear?: string;
    contractSum?: string;
    contractDuration?: string;
    commencementDate?: string;
    plannedCompletion?: string;
    costToCompletion?: string;
  },
): Promise<void> {
  await withTransaction(async (trx) => {
    const req = new sql.Request(trx);
    req.input("id", sql.NVarChar, projectId);
    req.input("fundingSource", sql.NVarChar, data.fundingSource || null);
    req.input("employer", sql.NVarChar, data.employer || null);
    req.input("employerRep", sql.NVarChar, data.employerRep || null);
    req.input("projectManager", sql.NVarChar, data.projectManager || null);
    req.input("fiscalYear", sql.NVarChar, data.fiscalYear || null);
    req.input("contractSum", sql.NVarChar, data.contractSum || null);
    req.input("contractDuration", sql.NVarChar, data.contractDuration || null);
    req.input(
      "commencementDate",
      sql.Date,
      data.commencementDate ? new Date(data.commencementDate) : null,
    );
    req.input(
      "plannedCompletion",
      sql.Date,
      data.plannedCompletion ? new Date(data.plannedCompletion) : null,
    );
    req.input("costToCompletion", sql.NVarChar, data.costToCompletion || null);
    await req.query(`
      UPDATE Project
      SET fundingSource    = @fundingSource,
          employer         = @employer,
          employerRep      = @employerRep,
          projectManager   = @projectManager,
          fiscalYear       = @fiscalYear,
          contractSum      = @contractSum,
          contractDuration = @contractDuration,
          commencementDate = @commencementDate,
          plannedCompletion = @plannedCompletion,
          costToCompletion = @costToCompletion,
          updatedAt        = GETDATE()
      WHERE id = @id
    `);
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/initialize`);
}

// ─── initializeProject ────────────────────────────────────────────────────────

export async function initializeProject(projectId: string): Promise<void> {
  await withTransaction(async (trx) => {
    const req = new sql.Request(trx);
    req.input("id", sql.NVarChar, projectId);
    req.input("status", sql.NVarChar, "ACTIVE");
    await req.query(`
      UPDATE Project SET status = @status, updatedAt = GETDATE() WHERE id = @id
    `);
  });
  revalidatePath(`/projects/${projectId}`);
}

// ─── createFullProject ────────────────────────────────────────────────────────
// Creates a project with ALL details in one shot, immediately ACTIVE.
// Used by the new "Create Project" form that replaces the old init flow.

export async function createFullProject(data: {
  // Core
  name: string;
  sector?: string;
  budget?: number;
  description?: string;
  categoryId?: string;
  // Location
  subCounty?: string;
  ward?: string;
  lat?: number;
  long?: number;
  // Contract details
  fundingSource?: string;
  employer?: string;
  employerRep?: string;
  projectManager?: string;
  fiscalYear?: string;
  contractSum?: string;
  contractDuration?: string;
  commencementDate?: string;
  plannedCompletion?: string;
  costToCompletion?: string;
}): Promise<Project> {
  const slug = generateSlug(data.name);
  try {
    const { rows } = await safeQuery<any>(
      `INSERT INTO Project (
         id, name, sector, budget, description, status, categoryId,
         subCounty, ward, lat, long,
         fundingSource, employer, employerRep, projectManager,
         fiscalYear, contractSum, contractDuration,
         commencementDate, plannedCompletion, costToCompletion
       )
       OUTPUT
         INSERTED.id, INSERTED.name, INSERTED.sector, INSERTED.budget,
         INSERTED.status, INSERTED.description, INSERTED.categoryId,
         INSERTED.subCounty, INSERTED.ward, INSERTED.lat, INSERTED.long,
         INSERTED.createdAt, INSERTED.updatedAt,
         INSERTED.fundingSource, INSERTED.employer, INSERTED.employerRep,
         INSERTED.projectManager, INSERTED.fiscalYear, INSERTED.contractSum,
         INSERTED.contractDuration, INSERTED.commencementDate,
         INSERTED.plannedCompletion, INSERTED.costToCompletion
       VALUES (
         @p1,  @p2,  @p3,  @p4,  @p5,  'ACTIVE', @p6,
         @p7,  @p8,  @p9,  @p10,
         @p11, @p12, @p13, @p14,
         @p15, @p16, @p17,
         @p18, @p19, @p20
       )`,
      [
        slug,
        data.name,
        data.sector ?? null,
        data.budget ?? null,
        data.description ?? null,
        data.categoryId ?? null,
        data.subCounty ?? null,
        data.ward ?? null,
        data.lat ?? null,
        data.long ?? null,
        data.fundingSource ?? null,
        data.employer ?? null,
        data.employerRep ?? null,
        data.projectManager ?? null,
        data.fiscalYear ?? null,
        data.contractSum ?? null,
        data.contractDuration ?? null,
        data.commencementDate ? new Date(data.commencementDate) : null,
        data.plannedCompletion ? new Date(data.plannedCompletion) : null,
        data.costToCompletion ?? null,
      ],
    );
    const row = rows[0];
    revalidatePath("/projects");
    return {
      id: row.id,
      name: row.name,
      sector: row.sector,
      budget: row.budget,
      status: row.status,
      description: row.description,
      categoryId: row.categoryId ?? null,
      subCounty: row.subCounty ?? null,
      ward: row.ward ?? null,
      lat: row.lat,
      long: row.long,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
      fundingSource: row.fundingSource ?? null,
      employer: row.employer ?? null,
      employerRep: row.employerRep ?? null,
      projectManager: row.projectManager ?? null,
      fiscalYear: row.fiscalYear ?? null,
      contractSum: row.contractSum ?? null,
      contractDuration: row.contractDuration ?? null,
      commencementDate:
        row.commencementDate?.toISOString().slice(0, 10) ?? null,
      plannedCompletion:
        row.plannedCompletion?.toISOString().slice(0, 10) ?? null,
      costToCompletion: row.costToCompletion ?? null,
    };
  } catch (error) {
    console.error("createFullProject error:", error);
    throw new DatabaseError();
  }
}
