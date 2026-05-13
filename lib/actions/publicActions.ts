"use server";

import { revalidatePath } from "next/cache";
import { safeQuery } from "../db";
import { z } from "zod";

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
}): Promise<PublicProject[]> {
  let query = `
    SELECT
      p.id, p.name, p.sector, p.status, p.budget, p.progress,
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
  return rows.map(mapPublicProject);
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
  // Option A – if you have a 'STALLED' status in the Project table
  const { rows } = await safeQuery<any>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active,
       SUM(CASE WHEN status = 'STALLED' THEN 1 ELSE 0 END) AS stalled,
       SUM(CASE WHEN status = 'PENDING' AND progress = 0 THEN 1 ELSE 0 END) AS notStarted,
       SUM(budget) AS totalBudget,
       COUNT(DISTINCT subCounty) AS subCounties,
       ROUND(100.0 * SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) / COUNT(*), 0) AS completionRate
     FROM Project`,
    [],
  );

  // Alternative if you don't have STALLED status – use a heuristic
  // const { rows } = await safeQuery<any>(
  //   `SELECT
  //      COUNT(*) AS total,
  //      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active,
  //      SUM(CASE WHEN (progress < 5 AND latestTrackerDate IS NOT NULL AND latestTrackerDate < DATEADD(day, -90, GETDATE())) OR status = 'STALLED' THEN 1 ELSE 0 END) AS stalled,
  //      SUM(CASE WHEN status = 'PENDING' AND progress = 0 THEN 1 ELSE 0 END) AS notStarted,
  //      …
  //    FROM Project
  //    LEFT JOIN (
  //      SELECT projectId, MAX(submittedAt) as latestTrackerDate
  //      FROM TrackerSubmission
  //      GROUP BY projectId
  //    ) ts ON ts.projectId = Project.id`,
  //   []
  // );

  const r = rows[0];
  return {
    totalProjects: Number(r.total ?? 0),
    activeProjects: Number(r.active ?? 0),
    stalledProjects: Number(r.stalled ?? 0),
    notStartedProjects: Number(r.notStarted ?? 0),
    totalBudget: Number(r.totalBudget ?? 0),
    subCounties: Number(r.subCounties ?? 0),
    completionRate: Number(r.completionRate ?? 0),
  };
}

export interface BreakdownItem {
  label: string; // e.g. "2024/2025" or "Water & Sanitation"
  value: string; // filter value to set in URL
  totalProjects: number;
  active: number;
  stalled: number;
  notStarted: number;
  completed: number;
  totalBudget: number;
  avgProgress: number;
}
export async function fetchBreakdownData(
  type: "fiscalYear" | "sector" | "subCounty" | "ward",
  extraFilter?: { subCounty?: string; fiscalYear?: string },
): Promise<BreakdownItem[]> {
  let groupField: string;
  let order: string;
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  // Determine grouping field
  if (type === "fiscalYear") {
    groupField = "p.fiscalYear";
    order = "p.fiscalYear DESC";
  } else if (type === "sector") {
    groupField = "p.sector";
    order = "p.sector";
  } else if (type === "subCounty") {
    groupField = "p.subCounty";
    order = "p.subCounty";
  } else {
    // ward
    groupField = "p.ward";
    order = "p.ward";
    if (extraFilter?.subCounty) {
      conditions.push(`p.subCounty = @p${idx++}`);
      params.push(extraFilter.subCounty);
    }
  }

  // Global fiscal year filter
  if (extraFilter?.fiscalYear) {
    conditions.push(`p.fiscalYear = @p${idx++}`);
    params.push(extraFilter.fiscalYear);
  }

  // Ensure we only count non‑null group values
  conditions.push(`${groupField} IS NOT NULL`);

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const query = `
    SELECT
      ${groupField} AS groupValue,
      COUNT(*) AS total,
      SUM(CASE WHEN p.status = 'ACTIVE' THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN p.status = 'STALLED' THEN 1 ELSE 0 END) AS stalled,
      SUM(CASE WHEN p.status = 'PENDING' AND p.progress = 0 THEN 1 ELSE 0 END) AS notStarted,
      SUM(CASE WHEN p.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
      SUM(p.budget) AS budget,
      AVG(p.progress * 1.0) AS avgProgress
    FROM Project p
    ${whereClause}
    GROUP BY ${groupField}
    ORDER BY ${order}
  `;

  const { rows } = await safeQuery<any>(query, params);

  return rows.map((row: any) => ({
    label: row.groupValue,
    value: row.groupValue,
    totalProjects: Number(row.total),
    active: Number(row.active),
    stalled: Number(row.stalled),
    notStarted: Number(row.notStarted),
    completed: Number(row.completed),
    totalBudget: Number(row.budget ?? 0),
    avgProgress: Math.round(Number(row.avgProgress ?? 0)),
  }));
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
