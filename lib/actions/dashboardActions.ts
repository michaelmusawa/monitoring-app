// lib/actions/dashboardActions.ts
"use server";

import { safeQuery } from "@/lib/db";
import type { DashboardStats } from "@/components/dashboard/DashboardClient";
import type { ReportProject } from "@/components/dashboard/ReportGenerator";

// ─── CIDP Performance Types ───────────────────────────────────────────────────

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

// ─── getDashboardStats ────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    summaryRows,
    sectorRows,
    bucketRows,
    checklistQueueRows,
    recentTrackerRows,
    stalledRows,
    nearCompleteRows,
    activityRows,
    budgetSizeRows,
    monthlyRows,
  ] = await Promise.all([
    safeQuery<any>(
      `SELECT
        COUNT(*)                                                        AS total,
        SUM(CASE WHEN status = 'PENDING'   THEN 1 ELSE 0 END)          AS pending,
        SUM(CASE WHEN status = 'ACTIVE'    THEN 1 ELSE 0 END)          AS active,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END)          AS completed,
        ISNULL(SUM(budget), 0)                                          AS totalBudget,
        ISNULL(AVG(CAST(progress AS FLOAT)), 0)                         AS avgProgress
       FROM Project`,
      [],
    ),

    safeQuery<any>(
      `SELECT
        ISNULL(sector, 'Unknown')               AS sector,
        COUNT(*)                                 AS cnt,
        ISNULL(AVG(CAST(progress AS FLOAT)), 0)  AS avgProgress,
        ISNULL(SUM(budget), 0)                   AS budget
       FROM Project GROUP BY sector ORDER BY cnt DESC`,
      [],
    ),

    safeQuery<any>(
      `SELECT
        SUM(CASE WHEN progress = 0 OR progress IS NULL     THEN 1 ELSE 0 END) AS bucket0,
        SUM(CASE WHEN progress > 0  AND progress < 50      THEN 1 ELSE 0 END) AS bucket1,
        SUM(CASE WHEN progress >= 50 AND progress < 100    THEN 1 ELSE 0 END) AS bucket2,
        SUM(CASE WHEN progress >= 100                      THEN 1 ELSE 0 END) AS bucket3
       FROM Project`,
      [],
    ),

    safeQuery<any>(
      `SELECT
        SUM(CASE WHEN status = 'DraftReview'   THEN 1 ELSE 0 END) AS draftReview,
        SUM(CASE WHEN status = 'WeightsReview' THEN 1 ELSE 0 END) AS weightsReview
       FROM Checklist`,
      [],
    ),

    safeQuery<any>(
      `SELECT COUNT(DISTINCT projectId) AS cnt FROM TrackerSubmission
       WHERE submittedAt >= DATEADD(day, -7, GETDATE())`,
      [],
    ),

    safeQuery<any>(
      `SELECT COUNT(DISTINCT ts.projectId) AS cnt
       FROM TrackerSubmission ts
       INNER JOIN TrackerSubmissionItem tsi ON tsi.submissionId = ts.id
       WHERE tsi.status = 'STALLED'
         AND ts.submittedAt = (
           SELECT MAX(ts2.submittedAt) FROM TrackerSubmission ts2 WHERE ts2.projectId = ts.projectId
         )`,
      [],
    ),

    safeQuery<any>(
      `SELECT COUNT(*) AS cnt FROM (
         SELECT ts.projectId, ts.overallPercent
         FROM TrackerSubmission ts
         WHERE ts.submittedAt = (
           SELECT MAX(ts2.submittedAt) FROM TrackerSubmission ts2 WHERE ts2.projectId = ts.projectId
         )
       ) latest WHERE overallPercent >= 80 AND overallPercent < 100`,
      [],
    ),

    safeQuery<any>(
      `SELECT TOP 20 * FROM (
        SELECT CAST(ts.id AS NVARCHAR) AS id, p.name AS projectName, 'tracker' AS type,
          CONCAT('Tracker submitted — ', CAST(CAST(ts.overallPercent AS INT) AS NVARCHAR), '% overall') AS detail,
          ts.submittedAt AS eventDate
        FROM TrackerSubmission ts INNER JOIN Project p ON p.id = ts.projectId
        UNION ALL
        SELECT CAST(ch.id AS NVARCHAR), p.name, 'checklist',
          CONCAT('Checklist → ', ch.status), ch.createdAt
        FROM ChecklistHistory ch
        INNER JOIN Checklist c ON c.id = ch.checklistId
        INNER JOIN Project p ON p.id = c.projectId
        UNION ALL
        SELECT CAST(p.id AS NVARCHAR), p.name, 'init', 'Project activated', p.updatedAt
        FROM Project p WHERE p.status = 'ACTIVE' AND p.updatedAt IS NOT NULL
      ) feed ORDER BY eventDate DESC`,
      [],
    ),

    safeQuery<any>(
      `SELECT
        CASE WHEN budget <= 500000 THEN 'Small' WHEN budget <= 1000000 THEN 'Medium' ELSE 'Large' END AS size,
        ISNULL(SUM(budget), 0) AS totalBudget, COUNT(*) AS cnt
       FROM Project WHERE budget IS NOT NULL
       GROUP BY CASE WHEN budget <= 500000 THEN 'Small' WHEN budget <= 1000000 THEN 'Medium' ELSE 'Large' END`,
      [],
    ),

    safeQuery<any>(
      `SELECT TOP 12 FORMAT(submittedAt, 'MMM yy') AS month, COUNT(*) AS submissions
       FROM TrackerSubmission WHERE submittedAt >= DATEADD(month, -12, GETDATE())
       GROUP BY FORMAT(submittedAt, 'MMM yy'), YEAR(submittedAt), MONTH(submittedAt)
       ORDER BY YEAR(submittedAt) ASC, MONTH(submittedAt) ASC`,
      [],
    ),
  ]);

  const s = summaryRows.rows[0] ?? {};
  const cq = checklistQueueRows.rows[0] ?? {};
  const bk = bucketRows.rows[0] ?? {};

  return {
    totalProjects: Number(s.total ?? 0),
    activeProjects: Number(s.active ?? 0),
    pendingProjects: Number(s.pending ?? 0),
    completedProjects: Number(s.completed ?? 0),
    totalBudget: Number(s.totalBudget ?? 0),
    avgProgress: Number(s.avgProgress ?? 0),
    awaitingDraftReview: Number(cq.draftReview ?? 0),
    awaitingWeightsReview: Number(cq.weightsReview ?? 0),
    recentTrackers: Number(recentTrackerRows.rows[0]?.cnt ?? 0),
    stalledProjects: Number(stalledRows.rows[0]?.cnt ?? 0),
    nearCompleteProjects: Number(nearCompleteRows.rows[0]?.cnt ?? 0),
    sectorBreakdown: sectorRows.rows.map((r: any) => ({
      sector: r.sector,
      count: Number(r.cnt),
      avgProgress: Number(r.avgProgress),
      budget: Number(r.budget),
    })),
    progressBuckets: [
      { label: "0%", count: Number(bk.bucket0 ?? 0) },
      { label: "1–49%", count: Number(bk.bucket1 ?? 0) },
      { label: "50–99%", count: Number(bk.bucket2 ?? 0) },
      { label: "100%", count: Number(bk.bucket3 ?? 0) },
    ],
    recentActivity: activityRows.rows.map((r: any) => ({
      id: r.id?.toString(),
      projectName: r.projectName,
      type: r.type as any,
      detail: r.detail,
      date: r.eventDate?.toISOString?.() ?? new Date().toISOString(),
    })),
    budgetBySize: budgetSizeRows.rows.map((r: any) => ({
      size: r.size,
      budget: Number(r.totalBudget),
      count: Number(r.cnt),
    })),
    monthlyTrackers: monthlyRows.rows.map((r: any) => ({
      month: r.month,
      submissions: Number(r.submissions),
    })),
  };
}

// ─── getCIDPPerformance ───────────────────────────────────────────────────────

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
    // Weighted actual (each category weighted by its share of sector target)
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

// ─── getReportProjects ────────────────────────────────────────────────────────

export async function getReportProjects(): Promise<ReportProject[]> {
  const result = await safeQuery<any>(
    `SELECT
       p.id, p.name, p.sector,
       CONCAT(ISNULL(p.ward,''), CASE WHEN p.ward IS NOT NULL AND p.subCounty IS NOT NULL THEN ', ' ELSE '' END, ISNULL(p.subCounty,'')) AS location,
       ts.overallPercent AS latestTrackerPercent, ts.submittedAt AS latestTrackerDate,
       tc.trackerCount, ISNULL(stalled.stalledCount, 0) AS stalledCount,
       prev.overallPercent AS prevTrackerPercent, ch.status AS checklistStatus,
       trc.workforceCount, trc.workforceMale, trc.workforceFemale, trc.workforcePWD,
       trc.bestPractices, trc.challenges
     FROM Project p
     INNER JOIN TrackerSubmission ts ON ts.id = (
       SELECT TOP 1 id FROM TrackerSubmission WHERE projectId = p.id ORDER BY submittedAt DESC
     )
     INNER JOIN (SELECT projectId, COUNT(*) AS trackerCount FROM TrackerSubmission GROUP BY projectId) tc ON tc.projectId = p.id
     LEFT JOIN (SELECT tsi.submissionId, COUNT(*) AS stalledCount FROM TrackerSubmissionItem tsi WHERE tsi.status = 'STALLED' GROUP BY tsi.submissionId) stalled ON stalled.submissionId = ts.id
     LEFT JOIN TrackerSubmission prev ON prev.id = (
       SELECT TOP 1 id FROM TrackerSubmission WHERE projectId = p.id AND submittedAt < ts.submittedAt ORDER BY submittedAt DESC
     )
     LEFT JOIN Checklist ch ON ch.projectId = p.id
     LEFT JOIN TrackerReviewCapture trc ON trc.projectId = p.id AND trc.trackerSubmissionId = ts.id
     WHERE p.status = 'ACTIVE'
     ORDER BY ts.overallPercent DESC`,
    [],
  );

  return result.rows.map((r: any) => {
    let bestPractice: string | null = null;
    let challenge: string | null = null;
    try {
      const bp = r.bestPractices ? JSON.parse(r.bestPractices) : null;
      if (Array.isArray(bp) && bp.length > 0) bestPractice = bp.join(" • ");
    } catch {}
    try {
      const ch = r.challenges ? JSON.parse(r.challenges) : null;
      if (Array.isArray(ch) && ch.length > 0) challenge = ch.join(" • ");
    } catch {}
    return {
      id: r.id?.toString(),
      name: r.name,
      sector: r.sector,
      location: r.location || null,
      latestTrackerPercent:
        r.latestTrackerPercent != null ? Number(r.latestTrackerPercent) : null,
      latestTrackerDate: r.latestTrackerDate?.toISOString?.() ?? null,
      trackerCount: Number(r.trackerCount ?? 0),
      stalledCount: Number(r.stalledCount ?? 0),
      weeklyVariance:
        r.prevTrackerPercent != null && r.latestTrackerPercent != null
          ? Number(r.latestTrackerPercent) - Number(r.prevTrackerPercent)
          : null,
      checklistStatus: r.checklistStatus ?? null,
      workforce:
        r.workforceCount != null
          ? {
              male: Number(r.workforceMale ?? 0),
              female: Number(r.workforceFemale ?? 0),
              pwd: Number(r.workforcePWD ?? 0),
              total: Number(r.workforceCount ?? 0),
            }
          : null,
      bestPractice,
      challenge,
    };
  });
}
