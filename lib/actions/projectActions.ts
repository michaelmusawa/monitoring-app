"use server";

import { revalidatePath } from "next/cache";
import { DatabaseError, safeQuery } from "../db";
import { Project } from "../types/projectsTypes";
import { withTransaction } from "./checklistActions";
import sql from "mssql";
import { buildUnitLookup, getRootUnitName } from "./orgActions";
import { logAudit } from "./auditActions";
import { auth } from "@/auth";

// ─── Helper to get actor email ───────────────────────────────────────────────
async function getActorEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

// ─── getProject ───────────────────────────────────────────────────────────────

export async function getProject(id: string): Promise<any | null> {
  const unitLookup = await buildUnitLookup();
  try {
    // Explicitly list all columns except 'sector' (which doesn't exist)
    const sqlQuery = `
      SELECT
        p.id, p.name, p.orgUnitId, p.budget, p.status, p.description,
        p.categoryId, p.contributionValue, p.locationUnitId,
        p.lat, p.long, p.projectType,
        p.fundingSource, p.employerRep, p.tenderNumber,
        p.projectScope, p.projectObjective, p.contractor,
        p.fiscalYear, p.contractSum, p.contractDuration,
        p.commencementDate, p.plannedCompletion, p.costToCompletion,
        p.createdAt, p.updatedAt,
        ou.name AS directUnitName
      FROM Project p
      LEFT JOIN OrganisationalUnit ou ON p.orgUnitId = ou.id
      WHERE p.id = @p1
    `;
    const { rows } = await safeQuery<any>(sqlQuery, [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    const sector = row.orgUnitId
      ? await getRootUnitName(row.orgUnitId, unitLookup)
      : "Unknown";
    return {
      ...row,
      sector, // computed, not from DB
    };
  } catch (error) {
    console.error("getProject error:", error);
    throw new DatabaseError();
  }
}

// ─── Slug helper ──────────────────────────────────────────────────────────────

const SLUG_NAME_MAX = 45;

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, SLUG_NAME_MAX);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
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
      SELECT id, name, status, budget, progress, lat, long, createdAt,
             categoryId
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
      SELECT id, name, status, budget, progress, lat, long, createdAt
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

// ─── mapProjectRow ──────────────────────────────────────────────────────────
function mapProjectRow(row: any): Project {
  let size: any["size"] = null;
  if (row.budget !== null) {
    if (row.budget <= 500000) size = "Small";
    else if (row.budget <= 1000000) size = "Medium";
    else size = "Large";
  }
  return {
    id: row.id.toString(),
    name: row.name,
    status: row.status,
    budget: row.budget,
    progress: row.progress,
    lat: row.lat,
    long: row.long,
    createdAt: new Date(row.createdAt),
    size,
    categoryId: row.categoryId ?? null,
    contributionValue: row.contributionValue ?? null,
  };
}

// ─── getProjects ──────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  try {
    const sqlQuery = `
      SELECT id, name, budget, status, lat, long, description, createdAt, updatedAt
      FROM Project ORDER BY createdAt DESC
    `;
    const { rows } = await safeQuery<any>(sqlQuery, []);
    return rows.map((row: any) => ({
      id: row.id,
      name: row.name,
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
  budget?: number;
  lat?: number;
  long?: number;
  description?: string;
}): Promise<Project> {
  const actor = await getActorEmail();
  const slug = generateSlug(data.name);
  try {
    const sqlQuery = `
      INSERT INTO Project (id, name, budget, lat, long, description, status)
      OUTPUT INSERTED.id, INSERTED.name,
             INSERTED.budget, INSERTED.status, INSERTED.lat, INSERTED.long,
             INSERTED.description, INSERTED.createdAt, INSERTED.updatedAt
      VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7)
    `;
    const { rows } = await safeQuery<any>(sqlQuery, [
      slug,
      data.name,
      data.budget || null,
      data.lat || null,
      data.long || null,
      data.description || null,
      "PENDING",
    ]);
    const row = rows[0];
    const project = {
      id: row.id,
      name: row.name,
      budget: row.budget,
      status: row.status,
      lat: row.lat,
      long: row.long,
      description: row.description,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    };
    await logAudit({
      action: "project.create",
      entityType: "Project",
      entityId: project.id,
      newValues: {
        name: project.name,
        budget: project.budget,
        status: project.status,
        description: project.description,
      },
      actorEmail: actor,
    });
    return project;
  } catch (error) {
    console.error("createProject error:", error);
    throw new DatabaseError();
  }
}

// ─── updateProject ────────────────────────────────────────────────────────────

export async function updateProject(
  id: string,
  data: Partial<Omit<Project, "id" | "slug" | "createdAt" | "updatedAt">> & {
    contributionValue?: number;
  },
): Promise<Project> {
  const actor = await getActorEmail();
  const oldProject = await getProject(id);
  const oldValues = oldProject
    ? {
        name: oldProject.name,
        budget: oldProject.budget,
        status: oldProject.status,
        lat: oldProject.lat,
        long: oldProject.long,
        description: oldProject.description,
        contributionValue: oldProject.contributionValue,
      }
    : null;

  const updates: string[] = [];
  const params: any[] = [];

  const fields: [keyof typeof data, string][] = [
    ["name", "name"],
    ["budget", "budget"],
    ["status", "status"],
    ["lat", "lat"],
    ["long", "long"],
    ["description", "description"],
    ["contributionValue", "contributionValue"],
  ];

  for (const [key, col] of fields) {
    if (data[key] !== undefined) {
      updates.push(`${col} = @p${params.length + 1}`);
      params.push(data[key]);
    }
  }

  if (updates.length === 0) throw new Error("No fields to update");
  updates.push("updatedAt = GETDATE()");
  params.push(id);

  const sqlQuery = `
    UPDATE Project
    SET ${updates.join(", ")}
    OUTPUT INSERTED.id, INSERTED.name,
           INSERTED.budget, INSERTED.status, INSERTED.lat, INSERTED.long,
           INSERTED.description, INSERTED.createdAt, INSERTED.updatedAt,
           INSERTED.contributionValue
    WHERE id = @p${params.length}
  `;
  try {
    const { rows } = await safeQuery<any>(sqlQuery, params);
    if (rows.length === 0) throw new Error("Project not found");
    const row = rows[0];
    const updated = {
      id: row.id.toString(),
      name: row.name,
      budget: row.budget,
      status: row.status,
      lat: row.lat,
      long: row.long,
      description: row.description,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
      contributionValue: row.contributionValue ?? null,
    };
    revalidatePath("/settings");
    await logAudit({
      action: "project.update",
      entityType: "Project",
      entityId: id,
      oldValues,
      newValues: {
        name: updated.name,
        budget: updated.budget,
        status: updated.status,
        lat: updated.lat,
        long: updated.long,
        description: updated.description,
        contributionValue: updated.contributionValue,
      },
      actorEmail: actor,
    });
    return updated;
  } catch (error) {
    console.error("updateProject error:", error);
    throw new DatabaseError();
  }
}

// ─── deleteProject ────────────────────────────────────────────────────────────

export async function deleteProject(id: string): Promise<void> {
  const actor = await getActorEmail();
  const oldProject = await getProject(id);
  const oldValues = oldProject
    ? {
        name: oldProject.name,
        budget: oldProject.budget,
        status: oldProject.status,
      }
    : null;

  try {
    await safeQuery("DELETE FROM Project WHERE id = @p1", [id]);
    revalidatePath("/settings");
    await logAudit({
      action: "project.delete",
      entityType: "Project",
      entityId: id,
      oldValues,
      actorEmail: actor,
    });
  } catch (error) {
    console.error("deleteProject error:", error);
    throw new DatabaseError();
  }
}

// ─── batchCreateProjects ──────────────────────────────────────────────────────

export async function batchCreateProjects(
  projects: {
    name: string;
    budget?: number;
    lat?: number;
    long?: number;
    description?: string;
  }[],
): Promise<Project[]> {
  if (projects.length === 0) return [];
  const actor = await getActorEmail();
  const created: Project[] = [];
  await withTransaction(async (trx) => {
    for (const data of projects) {
      const slug = generateSlug(data.name);
      const req = new sql.Request(trx);
      req.input("slug", sql.NVarChar(50), slug);
      req.input("name", sql.NVarChar(500), data.name);
      req.input("budget", sql.Decimal(18, 2), data.budget || null);
      req.input("lat", sql.Decimal(10, 8), data.lat || null);
      req.input("long", sql.Decimal(11, 8), data.long || null);
      req.input("description", sql.NVarChar(sql.MAX), data.description || null);
      req.input("status", sql.NVarChar(50), "PENDING");
      const result = await req.query(`
        INSERT INTO Project (id, name, budget, lat, long, description, status)
        OUTPUT INSERTED.id, INSERTED.name,
               INSERTED.budget, INSERTED.status, INSERTED.lat, INSERTED.long,
               INSERTED.description, INSERTED.createdAt, INSERTED.updatedAt
        VALUES (@slug, @name, @budget, @lat, @long, @description, @status)
      `);
      const row = result.recordset[0];
      created.push({
        id: row.id,
        name: row.name,
        budget: row.budget,
        status: row.status,
        lat: row.lat,
        long: row.long,
        description: row.description,
        createdAt: row.createdAt?.toISOString(),
        updatedAt: row.updatedAt?.toISOString(),
      });
    }
  });
  for (const proj of created) {
    await logAudit({
      action: "project.create",
      entityType: "Project",
      entityId: proj.id,
      newValues: {
        name: proj.name,
        budget: proj.budget,
        status: proj.status,
        description: proj.description,
      },
      actorEmail: actor,
    });
  }
  return created;
}

// ─── updateProjectDetails ─────────────────────────────────────────────────────

export async function updateProjectDetails(
  projectId: string,
  data: {
    fundingSource?: string;
    employerRep?: string;
    contractor?: string;
    fiscalYear?: string;
    contractSum?: string;
    contractDuration?: string;
    commencementDate?: string;
    plannedCompletion?: string;
    costToCompletion?: string;
  },
): Promise<void> {
  const actor = await getActorEmail();
  const oldProject = await getFullProject(projectId);
  const oldValues = oldProject
    ? {
        fundingSource: oldProject.fundingSource,
        employerRep: oldProject.employerRep,
        contractor: oldProject.contractor,
        fiscalYear: oldProject.fiscalYear,
        contractSum: oldProject.contractSum,
        contractDuration: oldProject.contractDuration,
        commencementDate: oldProject.commencementDate,
        plannedCompletion: oldProject.plannedCompletion,
        costToCompletion: oldProject.costToCompletion,
      }
    : null;

  await withTransaction(async (trx) => {
    const req = new sql.Request(trx);
    req.input("id", sql.NVarChar, projectId);
    req.input("fundingSource", sql.NVarChar, data.fundingSource || null);
    req.input("employerRep", sql.NVarChar, data.employerRep || null);
    req.input("contractor", sql.NVarChar, data.contractor || null);
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
          employerRep      = @employerRep,
          contractor       = @contractor,
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
  await logAudit({
    action: "project.update_details",
    entityType: "Project",
    entityId: projectId,
    oldValues,
    newValues: data,
    actorEmail: actor,
  });
}

// ─── initializeProject ────────────────────────────────────────────────────────

export async function initializeProject(projectId: string): Promise<void> {
  const actor = await getActorEmail();
  const oldProject = await getProject(projectId);
  const oldStatus = oldProject?.status ?? null;

  await withTransaction(async (trx) => {
    const req = new sql.Request(trx);
    req.input("id", sql.NVarChar, projectId);
    req.input("status", sql.NVarChar, "ACTIVE");
    await req.query(`
      UPDATE Project SET status = @status, updatedAt = GETDATE() WHERE id = @id
    `);
  });
  revalidatePath(`/projects/${projectId}`);
  await logAudit({
    action: "project.initialize",
    entityType: "Project",
    entityId: projectId,
    oldValues: { status: oldStatus },
    newValues: { status: "ACTIVE" },
    actorEmail: actor,
  });
}

// ─── createFullProject ────────────────────────────────────────────────────────

export async function createFullProject(data: {
  name: string;
  orgUnitId?: string;
  budget?: number;
  description?: string;
  categoryId?: string;
  contributionValue?: number;
  locationUnitId?: string;
  lat?: number;
  long?: number;
  projectType?: string;
  fundingSource?: string;
  employer?: string;
  tenderNumber?: string;
  projectScope?: string;
  projectObjective?: string;
  projectManager?: string;
  contractor?: string;
  fiscalYear?: string;
  contractSum?: string;
  contractDuration?: string;
  commencementDate?: string;
  plannedCompletion?: string;
  costToCompletion?: string;
}): Promise<any> {
  const actor = await getActorEmail();
  const slug = generateSlug(data.name);
  try {
    if (data.categoryId && data.contributionValue !== undefined) {
      const catRes = await safeQuery<{ target: number }>(
        `SELECT target FROM ProjectCategory WHERE id = @p1`,
        [data.categoryId],
      );
      if (catRes.rows.length > 0) {
        const existingRes = await safeQuery<{ sum: number }>(
          `SELECT SUM(contributionValue) AS sum FROM Project WHERE categoryId = @p1 AND status != 'ARCHIVED'`,
          [data.categoryId],
        );
        const existing = existingRes.rows[0]?.sum ?? 0;
        if (existing + data.contributionValue > catRes.rows[0].target) {
          console.warn(`Contribution exceeds remaining target`);
        }
      }
    }

    const { rows } = await safeQuery<any>(
      `INSERT INTO Project (
         id, name, orgUnitId, budget, description, status, categoryId, contributionValue, locationUnitId,
         lat, long, projectType,
         fundingSource, tenderNumber, projectScope, projectObjective,
         contractor, fiscalYear, contractSum, contractDuration,
         commencementDate, plannedCompletion, costToCompletion
       )
       OUTPUT
         INSERTED.id, INSERTED.name, INSERTED.budget,
         INSERTED.status, INSERTED.description, INSERTED.categoryId, INSERTED.locationUnitId,
         INSERTED.lat, INSERTED.long, INSERTED.projectType,
         INSERTED.createdAt, INSERTED.updatedAt,
         INSERTED.fundingSource, INSERTED.tenderNumber,
         INSERTED.projectScope, INSERTED.projectObjective,
         INSERTED.contractor, INSERTED.fiscalYear, INSERTED.contractSum,
         INSERTED.contractDuration, INSERTED.commencementDate,
         INSERTED.plannedCompletion, INSERTED.costToCompletion, INSERTED.contributionValue
       VALUES (
         @p1,  @p2,  @p3,  @p4,  @p5,  'NOT-STARTED', @p6, @p7,
         @p8,  @p9,  @p10, @p11, @p12, @p13, @p14, @p15,
         @p16, @p17, @p18, @p19,
         @p20, @p21, @p22
       )`,
      [
        slug,
        data.name,
        data.orgUnitId ?? null,
        data.budget ?? null,
        data.description ?? null,
        data.categoryId ?? null,
        data.contributionValue ?? null,
        data.locationUnitId ?? null,
        data.lat ?? null,
        data.long ?? null,
        data.projectType ?? null,
        data.fundingSource ?? null,
        data.tenderNumber ?? null,
        data.projectScope ?? null,
        data.projectObjective ?? null,
        data.contractor ?? null,
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
    const newProject = {
      id: row.id,
      name: row.name,
      budget: row.budget,
      status: row.status,
      description: row.description,
      categoryId: row.categoryId ?? null,
      contributionValue: row.contributionValue ?? null,
      lat: row.lat,
      long: row.long,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
      fundingSource: row.fundingSource ?? null,
      tenderNumber: row.tenderNumber ?? null,
      projectScope: row.projectScope ?? null,
      projectObjective: row.projectObjective ?? null,
      contractor: row.contractor ?? null,
      fiscalYear: row.fiscalYear ?? null,
      contractSum: row.contractSum ?? null,
      contractDuration: row.contractDuration ?? null,
      commencementDate:
        row.commencementDate?.toISOString().slice(0, 10) ?? null,
      plannedCompletion:
        row.plannedCompletion?.toISOString().slice(0, 10) ?? null,
      costToCompletion: row.costToCompletion ?? null,
    };
    await logAudit({
      action: "project.create_full",
      entityType: "Project",
      entityId: newProject.id,
      newValues: {
        name: newProject.name,
        budget: newProject.budget,
        status: newProject.status,
        description: newProject.description,
        categoryId: newProject.categoryId,
        contributionValue: newProject.contributionValue,
        orgUnitId: data.orgUnitId,
        locationUnitId: data.locationUnitId,
        projectType: data.projectType,
        fundingSource: data.fundingSource,
        tenderNumber: data.tenderNumber,
      },
      actorEmail: actor,
    });
    return newProject;
  } catch (error) {
    console.error("createFullProject error:", error);
    throw error;
  }
}

// ─── getFullProject ─────────────────────────────────────────────────────────
export async function getFullProject(id: string): Promise<any | null> {
  try {
    const sqlQuery = `
      SELECT
        p.id, p.name, p.orgUnitId, p.budget, p.status, p.description,
        p.categoryId, p.contributionValue, p.locationUnitId,
        p.lat, p.long, p.projectType,
        p.fundingSource, p.tenderNumber,
        p.projectScope, p.projectObjective, p.contractor,
        p.fiscalYear, p.contractSum, p.contractDuration,
        p.commencementDate, p.plannedCompletion, p.costToCompletion,
        ou.name AS orgUnitName, lu.name AS locationUnitName
      FROM Project p
      LEFT JOIN OrganisationalUnit ou ON p.orgUnitId = ou.id
      LEFT JOIN LocationUnit lu ON p.locationUnitId = lu.id
      WHERE p.id = @p1
    `;
    const { rows } = await safeQuery<any>(sqlQuery, [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      name: row.name,
      orgUnitId: row.orgUnitId ?? null,
      orgUnitName: row.orgUnitName ?? null,
      budget: row.budget,
      status: row.status,
      description: row.description,
      categoryId: row.categoryId ?? null,
      contributionValue: row.contributionValue,
      locationUnitId: row.locationUnitId ?? null,
      locationUnitName: row.locationUnitName ?? null,
      lat: row.lat,
      long: row.long,
      projectType: row.projectType ?? null,
      fundingSource: row.fundingSource ?? null,
      tenderNumber: row.tenderNumber ?? null,
      projectScope: row.projectScope ?? null,
      projectObjective: row.projectObjective ?? null,
      contractor: row.contractor ?? null,
      fiscalYear: row.fiscalYear ?? null,
      contractSum: row.contractSum ?? null,
      contractDuration: row.contractDuration ?? null,
      commencementDate: row.commencementDate
        ? new Date(row.commencementDate).toISOString().slice(0, 10)
        : null,
      plannedCompletion: row.plannedCompletion
        ? new Date(row.plannedCompletion).toISOString().slice(0, 10)
        : null,
      costToCompletion: row.costToCompletion ?? null,
    };
  } catch (error) {
    console.error("getFullProject error:", error);
    throw new DatabaseError();
  }
}

// ─── updateFullProject ──────────────────────────────────────────────────────
export async function updateFullProject(
  id: string,
  data: {
    name: string;
    orgUnitId?: string;
    budget?: number;
    description?: string;
    categoryId?: string | null;
    contributionValue?: number | null;
    locationUnitId?: string | null;
    lat?: number | null;
    long?: number | null;
    projectType?: string;
    status?: string;
    fundingSource?: string | null;
    employer?: string | null;
    tenderNumber?: string | null;
    projectScope?: string | null;
    projectObjective?: string | null;
    projectManager?: string | null;
    contractor?: string | null;
    fiscalYear?: string | null;
    contractSum?: string | null;
    contractDuration?: string | null;
    commencementDate?: string | null;
    plannedCompletion?: string | null;
    costToCompletion?: string | null;
  },
): Promise<any> {
  const actor = await getActorEmail();
  const oldProject = await getFullProject(id);
  const oldValues = oldProject
    ? {
        name: oldProject.name,
        orgUnitId: oldProject.orgUnitId,
        budget: oldProject.budget,
        description: oldProject.description,
        categoryId: oldProject.categoryId,
        contributionValue: oldProject.contributionValue,
        locationUnitId: oldProject.locationUnitId,
        lat: oldProject.lat,
        long: oldProject.long,
        projectType: oldProject.projectType,
        status: oldProject.status,
        fundingSource: oldProject.fundingSource,
        tenderNumber: oldProject.tenderNumber,
        projectScope: oldProject.projectScope,
        projectObjective: oldProject.projectObjective,
        contractor: oldProject.contractor,
        fiscalYear: oldProject.fiscalYear,
        contractSum: oldProject.contractSum,
        contractDuration: oldProject.contractDuration,
        commencementDate: oldProject.commencementDate,
        plannedCompletion: oldProject.plannedCompletion,
        costToCompletion: oldProject.costToCompletion,
      }
    : null;

  try {
    if (
      data.categoryId &&
      data.contributionValue !== undefined &&
      data.contributionValue !== null
    ) {
      const catRes = await safeQuery<{ target: number }>(
        `SELECT target FROM ProjectCategory WHERE id = @p1`,
        [data.categoryId],
      );
      if (catRes.rows.length > 0) {
        const existingRes = await safeQuery<{ sum: number }>(
          `SELECT SUM(contributionValue) AS sum FROM Project WHERE categoryId = @p1 AND id != @p2 AND status != 'ARCHIVED'`,
          [data.categoryId, id],
        );
        const existing = existingRes.rows[0]?.sum ?? 0;
        if (existing + data.contributionValue > catRes.rows[0].target) {
          throw new Error("Contribution would exceed the category target.");
        }
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    const fields: [keyof typeof data, string][] = [
      ["name", "name"],
      ["orgUnitId", "orgUnitId"],
      ["budget", "budget"],
      ["description", "description"],
      ["categoryId", "categoryId"],
      ["contributionValue", "contributionValue"],
      ["locationUnitId", "locationUnitId"],
      ["lat", "lat"],
      ["long", "long"],
      ["projectType", "projectType"],
      ["status", "status"],
      ["fundingSource", "fundingSource"],
      ["tenderNumber", "tenderNumber"],
      ["projectScope", "projectScope"],
      ["projectObjective", "projectObjective"],
      ["contractor", "contractor"],
      ["fiscalYear", "fiscalYear"],
      ["contractSum", "contractSum"],
      ["contractDuration", "contractDuration"],
      ["commencementDate", "commencementDate"],
      ["plannedCompletion", "plannedCompletion"],
      ["costToCompletion", "costToCompletion"],
    ];

    for (const [key, col] of fields) {
      if (data[key] !== undefined) {
        updates.push(`${col} = @p${params.length + 1}`);
        if (key === "commencementDate" || key === "plannedCompletion") {
          params.push(data[key] ? new Date(data[key]) : null);
        } else {
          params.push(data[key]);
        }
      }
    }

    if (updates.length === 0) throw new Error("No fields to update");
    updates.push("updatedAt = GETDATE()");
    params.push(id);

    const sqlQuery = `
      UPDATE Project
      SET ${updates.join(", ")}
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.orgUnitId, INSERTED.budget,
             INSERTED.status, INSERTED.description, INSERTED.categoryId,
             INSERTED.contributionValue, INSERTED.locationUnitId, INSERTED.lat,
             INSERTED.long, INSERTED.projectType, INSERTED.fundingSource,
             INSERTED.tenderNumber, INSERTED.projectScope,
             INSERTED.projectObjective, INSERTED.contractor,
             INSERTED.fiscalYear, INSERTED.contractSum, INSERTED.contractDuration,
             INSERTED.commencementDate, INSERTED.plannedCompletion,
             INSERTED.costToCompletion, INSERTED.createdAt, INSERTED.updatedAt
      WHERE id = @p${params.length}
    `;
    const { rows } = await safeQuery<any>(sqlQuery, params);
    if (rows.length === 0) throw new Error("Project not found");
    const row = rows[0];
    revalidatePath(`/projects/${id}`);
    revalidatePath(`/projects/${id}/edit`);
    const updated = {
      id: row.id,
      name: row.name,
      orgUnitId: row.orgUnitId,
      budget: row.budget,
      status: row.status,
      description: row.description,
      categoryId: row.categoryId,
      contributionValue: row.contributionValue,
      locationUnitId: row.locationUnitId,
      lat: row.lat,
      long: row.long,
      projectType: row.projectType,
      fundingSource: row.fundingSource,
      tenderNumber: row.tenderNumber,
      projectScope: row.projectScope,
      projectObjective: row.projectObjective,
      contractor: row.contractor,
      fiscalYear: row.fiscalYear,
      contractSum: row.contractSum,
      contractDuration: row.contractDuration,
      commencementDate: row.commencementDate
        ? new Date(row.commencementDate).toISOString().slice(0, 10)
        : null,
      plannedCompletion: row.plannedCompletion
        ? new Date(row.plannedCompletion).toISOString().slice(0, 10)
        : null,
      costToCompletion: row.costToCompletion,
      createdAt: row.createdAt?.toISOString(),
      updatedAt: row.updatedAt?.toISOString(),
    };
    await logAudit({
      action: "project.update_full",
      entityType: "Project",
      entityId: id,
      oldValues,
      newValues: {
        name: updated.name,
        orgUnitId: updated.orgUnitId,
        budget: updated.budget,
        description: updated.description,
        categoryId: updated.categoryId,
        contributionValue: updated.contributionValue,
        locationUnitId: updated.locationUnitId,
        lat: updated.lat,
        long: updated.long,
        projectType: updated.projectType,
        status: updated.status,
        fundingSource: updated.fundingSource,
        tenderNumber: updated.tenderNumber,
        projectScope: updated.projectScope,
        projectObjective: updated.projectObjective,
        contractor: updated.contractor,
        fiscalYear: updated.fiscalYear,
        contractSum: updated.contractSum,
        contractDuration: updated.contractDuration,
        commencementDate: updated.commencementDate,
        plannedCompletion: updated.plannedCompletion,
        costToCompletion: updated.costToCompletion,
      },
      actorEmail: actor,
    });
    return updated;
  } catch (error) {
    console.error("updateFullProject error:", error);
    throw new DatabaseError();
  }
}
