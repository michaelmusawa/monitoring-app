"use server";

import { revalidatePath } from "next/cache";
import { safeQuery } from "../db";
import { z } from "zod";
import { buildUnitLookup, getRootUnitName } from "./orgActions";
import { ProjectStatus } from "@/components/portal/ProjectList";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface PublicProject {
  id: string;
  name: string;
  sector: string | null;
  status: string;
  budget: number | null;
  progress: number;
  subCounty: string | null;
  ward: string | null;
  createdAt: string;
  latestTrackerPercent: number | null;
  latestTrackerDate: string | null;
  derivedStatus: ProjectStatus;
}

interface LatestTrackerInfo {
  overallPercent: number;
  submittedAt: Date;
  prevOverallPercent: number | null;
}

export interface PublicProjectDetail extends PublicProject {
  description: string | null;
  fundingSource: string | null;
  contractSum: string | null;
  contractDuration: string | null;
  commencementDate: string | null;
  plannedCompletion: string | null;
  costToCompletion: string | null;
  employer: string | null;
  projectManager: string | null;
  fiscalYear: string | null;
  location: { lat: number | null; long: number | null } | null;
}

export interface PublicComment {
  id: string;
  authorName: string;
  authorEmail: string | null;
  content: string;
  fileUrl: string | null;
  createdAt: string;
  isApproved: boolean;
}

async function getLatestTrackerInfoMap(
  fiscalYear?: string,
): Promise<Map<string, LatestTrackerInfo>> {
  // Same logic as in dashboardActions, but without fiscalYear filter if not needed
  let sql = `
    WITH ranked AS (
      SELECT projectId, overallPercent, submittedAt,
             ROW_NUMBER() OVER (PARTITION BY projectId ORDER BY submittedAt DESC) AS rn
      FROM TrackerSubmission
    )
    SELECT r1.projectId,
           r1.overallPercent,
           r1.submittedAt,
           r2.overallPercent AS prevOverallPercent
    FROM ranked r1
    LEFT JOIN ranked r2 ON r1.projectId = r2.projectId AND r2.rn = 2
    WHERE r1.rn = 1
  `;
  const { rows } = await safeQuery<{
    projectId: string;
    overallPercent: number;
    submittedAt: Date;
    prevOverallPercent: number | null;
  }>(sql, []);

  const map = new Map<string, LatestTrackerInfo>();
  for (const row of rows) {
    map.set(row.projectId, {
      overallPercent: Number(row.overallPercent),
      submittedAt: row.submittedAt,
      prevOverallPercent:
        row.prevOverallPercent != null ? Number(row.prevOverallPercent) : null,
    });
  }
  return map;
}

function computePublicStatus(
  dbStatus: string,
  tracker?: LatestTrackerInfo,
): "NOT_STARTED" | "ONGOING" | "STALLED" | "COMPLETED" | "TERMINATED" {
  if (dbStatus === "TERMINATED") return "TERMINATED";
  if (dbStatus === "COMPLETED" || dbStatus === "COMPLETE") return "COMPLETED";

  const pct = tracker?.overallPercent ?? 0;
  if (pct === 100) return "COMPLETED";
  if (pct === 0) return "NOT_STARTED";
  if (pct > 0 && pct < 100) {
    // STALLED if the latest tracker is older than 3 months and progress unchanged from previous
    const threeMonthsMs = 3 * 30 * 24 * 60 * 60 * 1000;
    if (
      tracker &&
      tracker.prevOverallPercent !== null &&
      pct === tracker.prevOverallPercent &&
      Date.now() - new Date(tracker.submittedAt).getTime() > threeMonthsMs
    ) {
      return "STALLED";
    }
    return "ONGOING";
  }
  return "NOT_STARTED";
}

// ─── Fetch projects with filters (no auth required) ───────────────────────
export async function fetchPublicProjects(filters?: {
  sector?: string;
  status?: string;
  subCounty?: string;
  ward?: string;
  fiscalYear?: string;
  projectName?: string;
  minBudget?: number;
  maxBudget?: number;
  minProgress?: number;
  maxProgress?: number;
  limit?: number; // 👈 ADD THIS
}): Promise<PublicProject[]> {
  const unitLookup = await buildUnitLookup();
  const trackerMap = await getLatestTrackerInfoMap();

  // Base SQL without sector filter (we'll handle in code)
  let query = `
    SELECT
      p.id, p.name, p.orgUnitId, p.status, p.budget, p.progress,
      p.subCounty, p.ward, p.createdAt,
      t.overallPercent as latestTrackerPercent,
      t.submittedAt as latestTrackerDate
    FROM Project p
    LEFT JOIN (
      SELECT projectId, overallPercent, submittedAt,
        ROW_NUMBER() OVER (PARTITION BY projectId ORDER BY submittedAt DESC) as rn
      FROM TrackerSubmission
    ) t ON p.id = t.projectId AND t.rn = 1
    WHERE 1=1
  `;
  const params: any[] = [];
  let idx = 1;

  if (filters?.sector && filters.sector !== "ALL") {
    query += ` AND p.sector = @p${idx++}`;
    params.push(filters.sector);
  }
  if (filters?.status && filters.status !== "ALL") {
    query += ` AND p.status = @p${idx++}`;
    params.push(filters.status);
  }
  if (filters?.subCounty) {
    query += ` AND p.subCounty = @p${idx++}`;
    params.push(filters.subCounty);
  }
  if (filters?.ward) {
    query += ` AND p.ward = @p${idx++}`;
    params.push(filters.ward);
  }
  if (filters?.fiscalYear) {
    query += ` AND p.fiscalYear = @p${idx++}`;
    params.push(filters.fiscalYear);
  }
  if (filters?.projectName) {
    query += ` AND p.name LIKE @p${idx++}`;
    params.push(`%${filters.projectName}%`);
  }
  if (filters?.minBudget !== undefined) {
    query += ` AND p.budget >= @p${idx++}`;
    params.push(filters.minBudget);
  }
  if (filters?.maxBudget !== undefined) {
    query += ` AND p.budget <= @p${idx++}`;
    params.push(filters.maxBudget);
  }
  if (filters?.minProgress !== undefined) {
    query += ` AND p.progress >= @p${idx++}`;
    params.push(filters.minProgress);
  }
  if (filters?.maxProgress !== undefined) {
    query += ` AND p.progress <= @p${idx++}`;
    params.push(filters.maxProgress);
  }

  query += ` ORDER BY p.createdAt DESC`;
  const { rows } = await safeQuery<any>(query, params);
  const filtered = [];
  for (const row of rows) {
    if (filters?.sector) {
      const root = await getRootUnitName(row.orgUnitId, unitLookup);
      if (root !== filters.sector) continue;
    }
    const tracker = trackerMap.get(row.id);
    const derivedStatus = computePublicStatus(row.status, tracker);
    // apply status filter if present
    if (
      filters?.status &&
      filters.status !== "ALL" &&
      derivedStatus !== filters.status
    )
      continue;
    filtered.push({
      ...mapPublicProject(row),
      sector: row.orgUnitId
        ? await getRootUnitName(row.orgUnitId, unitLookup)
        : null,
      derivedStatus,
    });
  }
  if (filters?.limit !== undefined) {
    return filtered.slice(0, filters.limit);
  }

  return filters?.limit ? filtered.slice(0, filters.limit) : filtered;
}

// ─── Fetch single project detail with extra fields ────────────────────────
export async function fetchPublicProjectDetail(
  id: string,
): Promise<PublicProjectDetail | null> {
  const { rows } = await safeQuery<any>(
    `SELECT
       p.id, p.name, p.sector, p.status, p.budget, p.progress,
       p.subCounty, p.ward, p.createdAt, p.description,
       p.fundingSource, p.contractSum, p.contractDuration,
       p.commencementDate, p.plannedCompletion, p.costToCompletion,
       p.employer, p.projectManager, p.fiscalYear,
       p.lat, p.long,
       t.overallPercent as latestTrackerPercent,
       t.submittedAt as latestTrackerDate
     FROM Project p
     LEFT JOIN (
       SELECT projectId, overallPercent, submittedAt,
         ROW_NUMBER() OVER (PARTITION BY projectId ORDER BY submittedAt DESC) as rn
       FROM TrackerSubmission
     ) t ON p.id = t.projectId AND t.rn = 1
     WHERE p.id = @p1`,
    [id],
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    ...mapPublicProject(row),
    description: row.description ?? null,
    fundingSource: row.fundingSource ?? null,
    contractSum: row.contractSum ?? null,
    contractDuration: row.contractDuration ?? null,
    commencementDate: row.commencementDate?.toISOString() ?? null,
    plannedCompletion: row.plannedCompletion?.toISOString() ?? null,
    costToCompletion: row.costToCompletion ?? null,
    employer: row.employer ?? null,
    projectManager: row.projectManager ?? null,
    fiscalYear: row.fiscalYear ?? null,
    location: row.lat && row.long ? { lat: row.lat, long: row.long } : null,
  };
}

// ─── Fetch comments for a project (only approved ones) ────────────────────
export async function fetchPublicComments(
  projectId: string,
): Promise<PublicComment[]> {
  const { rows } = await safeQuery<any>(
    `SELECT id, authorName, authorEmail, content, fileUrl, createdAt, isApproved
     FROM PublicComment
     WHERE projectId = @p1 AND isApproved = 1
     ORDER BY createdAt DESC`,
    [projectId],
  );
  return rows.map((row) => ({
    id: row.id,
    authorName: row.authorName,
    authorEmail: row.authorEmail ?? null,
    content: row.content,
    fileUrl: row.fileUrl ?? null,
    createdAt: row.createdAt.toISOString(),
    isApproved: row.isApproved,
  }));
}

// ─── Submit a new comment (with optional file) ────────────────────────────
const commentSchema = z.object({
  projectId: z.string().min(1),
  authorName: z.string().min(2, "Name must be at least 2 characters").max(100),
  authorEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  content: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(2000),
  fileUrl: z.string().url().optional().nullable(),
});

export async function submitPublicComment(
  formData: FormData,
): Promise<{ success: boolean; message: string }> {
  const raw = {
    projectId: formData.get("projectId") as string,
    authorName: formData.get("authorName") as string,
    authorEmail: formData.get("authorEmail") as string,
    content: formData.get("content") as string,
    fileUrl: (formData.get("fileUrl") as string) || null,
  };

  const parsed = commentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, message: parsed.error.errors[0].message };
  }

  const { projectId, authorName, authorEmail, content, fileUrl } = parsed.data;

  try {
    // ✅ No more id column – let the database auto‑increment
    await safeQuery(
      `INSERT INTO PublicComment (projectId, authorName, authorEmail, content, fileUrl, isApproved)
       VALUES (@p1, @p2, @p3, @p4, @p5, 1)`,
      [projectId, authorName, authorEmail || null, content, fileUrl || null],
    );
    revalidatePath(`/portal/${projectId}`);
    return { success: true, message: "Comment submitted successfully!" };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "Failed to submit comment. Please try again.",
    };
  }
}

// ─── Helper mapper ────────────────────────────────────────────────────────
function mapPublicProject(row: any): PublicProject {
  return {
    id: row.id,
    name: row.name,
    sector: row.sector ?? null,
    status: row.status,
    budget: row.budget != null ? Number(row.budget) : null,
    progress: row.progress != null ? Number(row.progress) : 0,
    subCounty: row.subCounty ?? null,
    ward: row.ward ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    latestTrackerPercent:
      row.latestTrackerPercent != null
        ? Number(row.latestTrackerPercent)
        : null,
    latestTrackerDate: row.latestTrackerDate?.toISOString() ?? null,
  };
}

// … existing code …

// ─── CIDP Performance (for public dashboard) ─────────────────────────────
export interface ProjectPerformance {
  id: string;
  name: string;
  categoryId: string;
  latestTrackerPercent: number;
  contribution: number;
  status: string;
}

export interface CategoryPerformance {
  id: string;
  name: string;
  sector: string;
  target: number;
  projectCount: number;
  actualPercent: number;
  score: number;
  projects: ProjectPerformance[];
}

export interface SectorPerformance {
  sector: string;
  totalTarget: number;
  totalActual: number;
  score: number;
  projectCount: number;
  categoryCount: number;
  categories: CategoryPerformance[];
}

export interface CIDPPerformance {
  cumulativeTarget: number;
  cumulativeActual: number;
  cumulativeScore: number;
  totalProjects: number;
  totalCategories: number;
  sectors: SectorPerformance[];
  lastUpdated: string;
}

export async function getCIDPPerformance(): Promise<CIDPPerformance> {
  const { rows } = await safeQuery<any>(
    `SELECT
       pc.id              AS categoryId,
       pc.name            AS categoryName,
       pc.sector          AS sector,
       ISNULL(pc.target, 100) AS target,
       p.id               AS projectId,
       p.name             AS projectName,
       p.status           AS projectStatus,
       (
         SELECT TOP 1 overallPercent
         FROM TrackerSubmission ts
         WHERE ts.projectId = p.id
         ORDER BY ts.submittedAt DESC
       )                  AS latestTrackerPercent
     FROM ProjectCategory pc
     LEFT JOIN Project p ON p.categoryId = pc.id
     WHERE pc.status = 'APPROVED'
     ORDER BY pc.sector, pc.name, p.name`,
    [],
  );

  if (rows.length === 0) {
    return {
      cumulativeTarget: 100,
      cumulativeActual: 0,
      cumulativeScore: 0,
      totalProjects: 0,
      totalCategories: 0,
      sectors: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  // Group rows into categories
  const categoryMap = new Map<
    string,
    {
      id: string;
      name: string;
      sector: string;
      target: number;
      projects: Array<{
        id: string;
        name: string;
        status: string;
        trackerPct: number;
      }>;
    }
  >();

  for (const row of rows) {
    if (!categoryMap.has(row.categoryId)) {
      categoryMap.set(row.categoryId, {
        id: row.categoryId,
        name: row.categoryName,
        sector: row.sector ?? "Unknown",
        target: Number(row.target ?? 100),
        projects: [],
      });
    }
    if (row.projectId) {
      categoryMap.get(row.categoryId)!.projects.push({
        id: row.projectId.toString(),
        name: row.projectName,
        status: row.projectStatus,
        trackerPct:
          row.latestTrackerPercent != null
            ? Number(row.latestTrackerPercent)
            : 0,
      });
    }
  }

  // Build CategoryPerformance[]
  const categories: CategoryPerformance[] = [];
  for (const cat of categoryMap.values()) {
    const n = cat.projects.length;
    const actualPercent =
      n > 0 ? cat.projects.reduce((s, p) => s + p.trackerPct, 0) / n : 0;
    const score =
      cat.target > 0 ? Math.min((actualPercent / cat.target) * 100, 100) : 0;

    categories.push({
      id: cat.id,
      name: cat.name,
      sector: cat.sector,
      target: cat.target,
      projectCount: n,
      actualPercent,
      score,
      projects: cat.projects.map((p) => ({
        id: p.id,
        name: p.name,
        categoryId: cat.id,
        status: p.status,
        latestTrackerPercent: p.trackerPct,
        contribution: cat.target > 0 ? (p.trackerPct / cat.target) * 100 : 0,
      })),
    });
  }

  // Build SectorPerformance[]
  const sectorMap = new Map<string, CategoryPerformance[]>();
  for (const cat of categories) {
    if (!sectorMap.has(cat.sector)) sectorMap.set(cat.sector, []);
    sectorMap.get(cat.sector)!.push(cat);
  }

  const sectors: SectorPerformance[] = [];
  for (const [sector, cats] of sectorMap) {
    const totalTarget = cats.reduce((s, c) => s + c.target, 0);
    const totalActual = cats.reduce(
      (s, c) =>
        s + c.actualPercent * (totalTarget > 0 ? c.target / totalTarget : 0),
      0,
    );
    const score =
      totalTarget > 0 ? Math.min((totalActual / totalTarget) * 100, 100) : 0;
    sectors.push({
      sector,
      totalTarget,
      totalActual,
      score,
      projectCount: cats.reduce((s, c) => s + c.projectCount, 0),
      categoryCount: cats.length,
      categories: cats.sort((a, b) => b.score - a.score),
    });
  }
  sectors.sort((a, b) => b.score - a.score);

  const cumulativeTarget = categories.reduce((s, c) => s + c.target, 0) || 100;
  const totalProjects = categories.reduce((s, c) => s + c.projectCount, 0);
  const cumulativeActual = categories.reduce(
    (s, c) => s + c.actualPercent * (c.target / cumulativeTarget),
    0,
  );
  const cumulativeScore = Math.min(
    (cumulativeActual / cumulativeTarget) * 100,
    100,
  );

  return {
    cumulativeTarget,
    cumulativeActual,
    cumulativeScore,
    totalProjects,
    totalCategories: categories.length,
    sectors,
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchPublicStats() {
  const unitLookup = await buildUnitLookup();
  const trackerMap = await getLatestTrackerInfoMap();

  const { rows: projects } = await safeQuery<any>(
    `SELECT id, budget, subCounty, ward, orgUnitId, status FROM Project`,
    [],
  );

  let total = 0,
    completed = 0,
    ongoing = 0,
    notStarted = 0,
    stalled = 0,
    terminated = 0;
  let totalBudget = 0;
  const subCountiesSet = new Set<string>();
  const wardsSet = new Set<string>();
  const sectorsSet = new Set<string>();

  for (const proj of projects) {
    total++;
    totalBudget += Number(proj.budget ?? 0);
    if (proj.subCounty) subCountiesSet.add(proj.subCounty);
    if (proj.ward) wardsSet.add(proj.ward);

    const root = await getRootUnitName(proj.orgUnitId, unitLookup);
    sectorsSet.add(root);

    const tracker = trackerMap.get(proj.id);
    const status = computePublicStatus(proj.status, tracker);
    switch (status) {
      case "COMPLETED":
        completed++;
        break;
      case "ONGOING":
        ongoing++;
        break;
      case "NOT_STARTED":
        notStarted++;
        break;
      case "STALLED":
        stalled++;
        break;
      case "TERMINATED":
        terminated++;
        break;
    }
  }

  return {
    totalProjects: total,
    completedProjects: completed,
    ongoingProjects: ongoing,
    notStartedProjects: notStarted,
    stalledProjects: stalled,
    terminatedProjects: terminated,
    totalBudget,
    subCounties: subCountiesSet.size,
    totalSectors: sectorsSet.size,
    totalWards: wardsSet.size,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
  };
}

export interface BreakdownItem {
  label: string;
  value: string;
  totalProjects: number;
  ongoing: number;
  stalled: number;
  notStarted: number;
  completed: number;
  terminated: number;
  totalBudget: number;
  avgProgress: number;
}
export async function fetchBreakdownData(
  type: string,
  extraFilter?: {
    fiscalYear?: string;
    parentValue?: string; // optional parent filter value (e.g. subCounty for wards)
  },
): Promise<BreakdownItem[]> {
  const unitLookup = await buildUnitLookup();
  const trackerMap = await getLatestTrackerInfoMap();

  // Build base project query (no grouping)
  let projectSQL = `
    SELECT p.id, p.orgUnitId, p.subCounty, p.ward, p.fiscalYear,
           p.sector, p.budget, p.status, p.name
    FROM Project p
    WHERE 1=1
  `;
  const params: any[] = [];
  let idx = 1;

  if (extraFilter?.fiscalYear) {
    projectSQL += ` AND p.fiscalYear = @p${idx++}`;
    params.push(extraFilter.fiscalYear);
  }

  // If a parent filter is provided (for location drill-down), apply it
  if (extraFilter?.parentValue) {
    if (type === "loc-Ward") {
      projectSQL += ` AND p.subCounty = @p${idx++}`;
      params.push(extraFilter.parentValue);
    }
    // For org levels, we'll filter after climbing (code below)
  }

  const { rows: allProjects } = await safeQuery<any>(projectSQL, params);

  // Process each project: compute status and grouping key
  const projMappings = await Promise.all(
    allProjects.map(async (p) => {
      const tracker = trackerMap.get(p.id);
      const status = computePublicStatus(p.status, tracker);
      const percent = tracker?.overallPercent ?? 0;

      let groupKey = "Unknown";

      if (type === "fiscalYear") {
        groupKey = p.fiscalYear ?? "Unknown";
      } else if (type.startsWith("org-")) {
        const level = type.slice(4); // e.g. "Sector", "Department"
        const ancestorName = await getAncestorAtLevel(p.orgUnitId, level);
        groupKey = ancestorName ?? "Unknown";

        // If parent filter is given, only include projects where the ancestor matches
        if (extraFilter?.parentValue && groupKey !== extraFilter.parentValue) {
          return null; // exclude
        }
      } else if (type === "loc-Sub-county") {
        groupKey = p.subCounty ?? "Unknown";
      } else if (type === "loc-Ward") {
        groupKey = p.ward ?? "Unknown";
      } else {
        // legacy fallback
        groupKey = (p as any)[type] ?? "Unknown";
      }

      return {
        ...p,
        groupKey,
        derivedStatus: status,
        trackerPercent: percent,
      };
    }),
  );

  // Filter out excluded projects
  const validProjects = projMappings.filter((p) => p !== null) as any[];

  // Group by groupKey
  const groups = new Map<string, any[]>();
  for (const proj of validProjects) {
    if (!groups.has(proj.groupKey)) groups.set(proj.groupKey, []);
    groups.get(proj.groupKey)!.push(proj);
  }

  // Aggregate
  const result: BreakdownItem[] = [];
  for (const [key, projs] of groups) {
    const total = projs.length;
    const completed = projs.filter(
      (p) => p.derivedStatus === "COMPLETED",
    ).length;
    const ongoing = projs.filter((p) => p.derivedStatus === "ONGOING").length;
    const stalled = projs.filter((p) => p.derivedStatus === "STALLED").length;
    const notStarted = projs.filter(
      (p) => p.derivedStatus === "NOT_STARTED",
    ).length;
    const terminated = projs.filter(
      (p) => p.derivedStatus === "TERMINATED",
    ).length;
    const totalBudget = projs.reduce((s, p) => s + Number(p.budget ?? 0), 0);
    const avgProgress =
      total > 0 ? projs.reduce((s, p) => s + p.trackerPercent, 0) / total : 0;

    result.push({
      label: key,
      value: key,
      totalProjects: total,
      ongoing,
      stalled,
      notStarted,
      completed,
      terminated,
      totalBudget,
      avgProgress: Math.round(avgProgress),
    });
  }

  result.sort((a, b) => b.totalProjects - a.totalProjects);
  return result;
}

async function getAncestorAtLevel(
  unitId: string | null,
  targetLevel: string,
): Promise<string | null> {
  if (!unitId) return null;
  const unitLookup = await buildUnitLookup();
  let current = unitId;
  for (let i = 0; i < 20; i++) {
    const unit = unitLookup.get(current);
    if (!unit) break;
    if (unit.level === targetLevel) return unit.name;
    if (!unit.parentId) break;
    current = unit.parentId;
  }
  return null;
}

export async function fetchFiscalYears(): Promise<string[]> {
  const { rows } = await safeQuery<{ fiscalYear: string }>(
    `SELECT DISTINCT fiscalYear FROM Project WHERE fiscalYear IS NOT NULL ORDER BY fiscalYear DESC`,
  );
  return rows.map((r) => r.fiscalYear);
}

export interface PublicFeedbackComment {
  id: string;
  projectId: string;
  projectName: string;
  authorName: string;
  content: string;
  fileUrl: string | null;
  createdAt: string;
}

export async function fetchAllPublicComments(search?: {
  query?: string; // search by project name or comment content
  page?: number;
  limit?: number;
}): Promise<{
  comments: PublicFeedbackComment[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = search?.page || 1;
  const limit = search?.limit || 10;
  const offset = (page - 1) * limit;

  let whereConditions = "pc.isApproved = 1";
  const params: any[] = [];
  let paramIdx = 1;

  if (search?.query) {
    whereConditions += ` AND (p.name LIKE @p${paramIdx} OR pc.content LIKE @p${paramIdx})`;
    params.push(`%${search.query}%`);
    paramIdx++;
  }

  // Count total
  const { rows: countRows } = await safeQuery<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM PublicComment pc
     INNER JOIN Project p ON p.id = pc.projectId
     WHERE ${whereConditions}`,
    params,
  );
  const total = Number(countRows[0]?.total ?? 0);
  const totalPages = Math.ceil(total / limit);

  // Fetch page
  params.push(limit);
  params.push(offset);
  const { rows } = await safeQuery<any>(
    `SELECT
       pc.id,
       pc.projectId,
       p.name AS projectName,
       pc.authorName,
       pc.content,
       pc.fileUrl,
       pc.createdAt
     FROM PublicComment pc
     INNER JOIN Project p ON p.id = pc.projectId
     WHERE ${whereConditions}
     ORDER BY pc.createdAt DESC
     OFFSET @p${paramIdx + 1} ROWS FETCH NEXT @p${paramIdx} ROWS ONLY`,
    params,
  );

  const comments: PublicFeedbackComment[] = rows.map((row) => ({
    id: row.id,
    projectId: row.projectId,
    projectName: row.projectName,
    authorName: row.authorName,
    content: row.content,
    fileUrl: row.fileUrl ?? null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }));

  return { comments, total, page, totalPages };
}

export interface GalleryImage {
  id: string; // combination of submissionId + index (unique key)
  projectId: string;
  projectName: string;
  url: string;
  caption: string | null; // tracker item label
  trackerLabel: string | null;
  submissionDate: string;
}

export async function fetchGalleryImages(filters?: {
  projectId?: string;
  sector?: string;
  subCounty?: string;
}): Promise<GalleryImage[]> {
  // 1. Get all tracker items that have attachments, with project info
  let query = `
    SELECT
      tsi.id AS itemId,
      tsi.attachments,
      tsi.label AS trackerLabel,
      ts.submittedAt,
      p.id AS projectId,
      p.name AS projectName,
      p.sector,
      p.subCounty
    FROM TrackerSubmissionItem tsi
    INNER JOIN TrackerSubmission ts ON ts.id = tsi.submissionId
    INNER JOIN Project p ON p.id = ts.projectId
    WHERE tsi.attachments IS NOT NULL
  `;
  const params: string[] = [];
  let idx = 1;

  if (filters?.projectId) {
    query += ` AND p.id = @p${idx++}`;
    params.push(filters.projectId);
  }
  if (filters?.sector && filters.sector !== "ALL") {
    query += ` AND p.sector = @p${idx++}`;
    params.push(filters.sector);
  }
  if (filters?.subCounty) {
    query += ` AND p.subCounty = @p${idx++}`;
    params.push(filters.subCounty);
  }

  query += ` ORDER BY ts.submittedAt DESC`;

  const { rows } = await safeQuery<any>(query, params);

  // 2. Flatten attachments JSON array into individual images
  const images: GalleryImage[] = [];
  for (const row of rows) {
    try {
      const attachmentUrls: string[] = row.attachments
        ? JSON.parse(row.attachments)
        : [];
      attachmentUrls.forEach((url, i) => {
        if (url) {
          images.push({
            id: `${row.itemId}_${i}`,
            projectId: row.projectId,
            projectName: row.projectName,
            url,
            caption: row.trackerLabel ?? null,
            trackerLabel: row.trackerLabel ?? null,
            submissionDate:
              row.submittedAt?.toISOString() ?? new Date().toISOString(),
          });
        }
      });
    } catch {
      // If JSON parse fails, skip this row
    }
  }

  return images;
}

export async function fetchBreakdownDimensions(): Promise<{
  orgLevels: string[];
  locationLevels: string[];
}> {
  const [orgRows, locRows] = await Promise.all([
    safeQuery<{ level: string }>(
      `SELECT DISTINCT level FROM OrganisationalUnit WHERE isActive = 1 AND level IS NOT NULL ORDER BY level`,
    ),
    safeQuery<{ level: string }>(
      `SELECT DISTINCT level FROM LocationUnit WHERE isActive = 1 AND level IS NOT NULL ORDER BY level`,
    ),
  ]);
  return {
    orgLevels: orgRows.rows.map((r) => r.level),
    locationLevels: locRows.rows.map((r) => r.level),
  };
}

export interface OverviewGroup {
  name: string;
  totalProjects: number;
  totalBudget: number;
  avgProgress: number;
  projects: PublicProject[]; // limited to 5 items
}

export async function fetchOverviewGroups(
  fiscalYear?: string,
  groupBy: "org" | "location" = "org",
): Promise<OverviewGroup[]> {
  const unitLookup = await buildUnitLookup();
  const trackerMap = await getLatestTrackerInfoMap();

  let query = `
    SELECT p.id, p.name, p.orgUnitId, p.subCounty, p.budget, p.status,
           p.ward, p.createdAt,
           t.overallPercent as latestTrackerPercent,
           t.submittedAt as latestTrackerDate
    FROM Project p
    LEFT JOIN (
      SELECT projectId, overallPercent, submittedAt,
             ROW_NUMBER() OVER (PARTITION BY projectId ORDER BY submittedAt DESC) as rn
      FROM TrackerSubmission
    ) t ON p.id = t.projectId AND t.rn = 1
    WHERE 1=1
  `;
  const params: any[] = [];
  let idx = 1;
  if (fiscalYear) {
    query += ` AND p.fiscalYear = @p${idx++}`;
    params.push(fiscalYear);
  }

  const { rows } = await safeQuery<any>(query, params);
  const allProjects = rows.map(mapPublicProject);

  // Group by org root unit or subCounty
  const groups = new Map<
    string,
    { projects: PublicProject[]; totalBudget: number; sumProgress: number }
  >();
  for (const proj of allProjects) {
    let key = "Unknown";
    if (groupBy === "org") {
      key = await getRootUnitName(proj.orgUnitId, unitLookup);
    } else {
      key = proj.subCounty || "Unknown";
    }
    if (!groups.has(key)) {
      groups.set(key, { projects: [], totalBudget: 0, sumProgress: 0 });
    }
    const group = groups.get(key)!;
    group.projects.push(proj);
    group.totalBudget += proj.budget ?? 0;
    group.sumProgress += proj.latestTrackerPercent ?? 0;
  }

  return Array.from(groups.entries()).map(([name, data]) => {
    const avgProgress = data.projects.length
      ? data.sumProgress / data.projects.length
      : 0;
    return {
      name,
      totalProjects: data.projects.length,
      totalBudget: data.totalBudget,
      avgProgress,
      projects: data.projects.slice(0, 5), // only first 5 cards
    };
  });
}
