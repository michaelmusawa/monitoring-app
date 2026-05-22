"use server";

import { safeQuery } from "@/lib/db";
import type { DashboardStats } from "@/components/dashboard/DashboardClient";
import type { ReportProject } from "@/components/dashboard/ReportGenerator";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProjectPerformance {
  id: string;
  name: string;
  categoryId: string;
  latestTrackerPercent: number;
  contributionValue: number;
  status: string;
}

export interface CategoryPerformance {
  id: string;
  name: string;
  sector: string;
  target: number;
  targetType: "NUMBER" | "PERCENT";
  covered: number;
  coveragePercent: number;
  score: number;
  projectCount: number;
  projects: ProjectPerformance[];
}

export interface SectorPerformance {
  sector: string;
  totalTarget: number;
  totalCovered: number;
  coveragePercent: number;
  score: number;
  projectCount: number;
  categoryCount: number;
  categories: CategoryPerformance[];
}

export interface CIDPPerformance {
  cumulativeTarget: number;
  cumulativeCovered: number;
  cumulativeCoveragePercent: number;
  cumulativeScore: number;
  totalProjects: number;
  totalCategories: number;
  sectors: SectorPerformance[];
  lastUpdated: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getLatestTrackerPercentMap(
  fiscalYear?: string,
): Promise<Map<string, number>> {
  let sql = `
    SELECT p.id AS projectId, ts.overallPercent
    FROM (
      SELECT projectId, overallPercent,
             ROW_NUMBER() OVER (PARTITION BY projectId ORDER BY submittedAt DESC) AS rn
      FROM TrackerSubmission
    ) ts
    INNER JOIN Project p ON p.id = ts.projectId
    WHERE ts.rn = 1
  `;
  const params: any[] = [];
  if (fiscalYear) {
    sql += ` AND p.fiscalYear = @p${params.length + 1}`;
    params.push(fiscalYear);
  }
  const { rows } = await safeQuery<{
    projectId: string;
    overallPercent: number;
  }>(sql, params);
  const map = new Map<string, number>();
  for (const row of rows) map.set(row.projectId, row.overallPercent);
  return map;
}

// ─── getDashboardStats (with fiscalYear) ─────────────────────────────────────

export async function getDashboardStats(
  fiscalYear?: string,
): Promise<DashboardStats> {
  const latestTrackerMap = await getLatestTrackerPercentMap(fiscalYear);

  let projectQuery = `SELECT id, name, sector, budget, progress, status, createdAt, updatedAt FROM Project WHERE 1=1`;
  const projectParams: any[] = [];
  if (fiscalYear) {
    projectQuery += ` AND fiscalYear = @p${projectParams.length + 1}`;
    projectParams.push(fiscalYear);
  }
  const { rows: allProjects } = await safeQuery<any>(
    projectQuery,
    projectParams,
  );

  let totalProjects = 0;
  let notStartedProjects = 0;
  let completedProjects = 0;
  let activeProjects = 0;
  let totalBudget = 0;
  let avgProgressSum = 0;
  let nearCompleteCount = 0;

  const sectorMap = new Map<
    string,
    { count: number; avgProgressSum: number; budgetSum: number }
  >();
  const buckets = [0, 0, 0, 0];

  for (const proj of allProjects) {
    const latestPct = latestTrackerMap.get(proj.id) ?? 0;
    totalProjects++;
    totalBudget += Number(proj.budget ?? 0);
    avgProgressSum += latestPct;

    if (latestPct === 0) {
      notStartedProjects++;
      buckets[0]++;
    } else if (latestPct === 100) {
      completedProjects++;
      buckets[3]++;
    } else {
      activeProjects++;
      if (latestPct >= 80 && latestPct < 100) nearCompleteCount++;
      if (latestPct < 50) buckets[1]++;
      else if (latestPct < 100) buckets[2]++;
    }

    const sector = proj.sector ?? "Unknown";
    const existing = sectorMap.get(sector) || {
      count: 0,
      avgProgressSum: 0,
      budgetSum: 0,
    };
    existing.count++;
    existing.avgProgressSum += latestPct;
    existing.budgetSum += Number(proj.budget ?? 0);
    sectorMap.set(sector, existing);
  }

  const avgProgress = totalProjects > 0 ? avgProgressSum / totalProjects : 0;

  const sectorBreakdown = Array.from(sectorMap.entries()).map(
    ([sector, data]) => ({
      sector,
      count: data.count,
      avgProgress: data.avgProgressSum / data.count,
      budget: data.budgetSum,
    }),
  );
  sectorBreakdown.sort((a, b) => b.count - a.count);

  const progressBuckets = [
    { label: "0%", count: buckets[0] },
    { label: "1–49%", count: buckets[1] },
    { label: "50–99%", count: buckets[2] },
    { label: "100%", count: buckets[3] },
  ];

  // Stalled projects
  let stalledQuery = `
    SELECT COUNT(*) AS cnt FROM Project WHERE status = 'STALLED'

  `;
  const stalledParams: any[] = [];
  if (fiscalYear) {
    stalledQuery += ` AND p.fiscalYear = @p${stalledParams.length + 1}`;
    stalledParams.push(fiscalYear);
  }
  const stalledRows = await safeQuery<{ cnt: number }>(
    stalledQuery,
    stalledParams,
  );
  const stalledProjects = stalledRows.rows[0]?.cnt ?? 0;

  let terminatedQuery = `
    SELECT COUNT(*) AS cnt FROM Project WHERE status = 'TERMINATED'

  `;
  const terminatedParams: any[] = [];
  if (fiscalYear) {
    terminatedQuery += ` AND p.fiscalYear = @p${terminatedParams.length + 1}`;
    terminatedParams.push(fiscalYear);
  }
  const terminatedRows = await safeQuery<{ cnt: number }>(
    terminatedQuery,
    terminatedParams,
  );
  const terminatedProjects = terminatedRows.rows[0]?.cnt ?? 0;

  // Checklist queue (unaffected by fiscal year, as checklists are not tied to fiscal year)
  const checklistQueueRows = await safeQuery<any>(
    `SELECT
       SUM(CASE WHEN status = 'DraftReview'   THEN 1 ELSE 0 END) AS draftReview,
       SUM(CASE WHEN status = 'WeightsReview' THEN 1 ELSE 0 END) AS weightsReview
     FROM Checklist`,
    [],
  );
  const cq = checklistQueueRows.rows[0] ?? {};

  // Recent trackers (7 days, filtered by fiscalYear)
  let recentQuery = `
    SELECT COUNT(DISTINCT ts.projectId) AS cnt
    FROM TrackerSubmission ts
    INNER JOIN Project p ON p.id = ts.projectId
    WHERE ts.submittedAt >= DATEADD(day, -7, GETDATE())
  `;
  const recentParams: any[] = [];
  if (fiscalYear) {
    recentQuery += ` AND p.fiscalYear = @p${recentParams.length + 1}`;
    recentParams.push(fiscalYear);
  }
  const recentTrackerRows = await safeQuery<{ cnt: number }>(
    recentQuery,
    recentParams,
  );
  const recentTrackers = recentTrackerRows.rows[0]?.cnt ?? 0;

  // Recent activity (filtered by fiscalYear)
  let activityQuery = `
    SELECT TOP 20 * FROM (
      SELECT CAST(ts.id AS NVARCHAR) AS id, p.name AS projectName, p.sector, 'tracker' AS type,
        CONCAT('Tracker submitted — ', CAST(CAST(ts.overallPercent AS INT) AS NVARCHAR), '% overall') AS detail,
        ts.submittedAt AS eventDate
      FROM TrackerSubmission ts INNER JOIN Project p ON p.id = ts.projectId
      UNION ALL
      SELECT CAST(ch.id AS NVARCHAR), p.name, p.sector, 'checklist',
        CONCAT('Checklist → ', ch.status), ch.createdAt
      FROM ChecklistHistory ch
      INNER JOIN Checklist c ON c.id = ch.checklistId
      INNER JOIN Project p ON p.id = c.projectId
      UNION ALL
      SELECT CAST(p.id AS NVARCHAR), p.name, p.sector, 'init', 'Project activated', p.updatedAt
      FROM Project p WHERE p.status = 'ACTIVE' AND p.updatedAt IS NOT NULL
    ) feed
  `;
  const activityParams: any[] = [];
  if (fiscalYear) {
    activityQuery += ` WHERE sector IN (SELECT DISTINCT sector FROM Project WHERE fiscalYear = @p${activityParams.length + 1})`;
    activityParams.push(fiscalYear);
  }
  activityQuery += ` ORDER BY eventDate DESC`;
  const activityRows = await safeQuery<any>(activityQuery, activityParams);

  // Budget by size (filtered by fiscalYear)
  let budgetSizeQuery = `
    SELECT
      CASE WHEN budget <= 500000 THEN 'Small' WHEN budget <= 1000000 THEN 'Medium' ELSE 'Large' END AS size,
      ISNULL(SUM(budget), 0) AS totalBudget, COUNT(*) AS cnt
    FROM Project WHERE budget IS NOT NULL
  `;
  const budgetParams: any[] = [];
  if (fiscalYear) {
    budgetSizeQuery += ` AND fiscalYear = @p${budgetParams.length + 1}`;
    budgetParams.push(fiscalYear);
  }
  budgetSizeQuery += ` GROUP BY CASE WHEN budget <= 500000 THEN 'Small' WHEN budget <= 1000000 THEN 'Medium' ELSE 'Large' END`;
  const budgetSizeRows = await safeQuery<any>(budgetSizeQuery, budgetParams);

  // Monthly tracker submissions (filtered by fiscalYear)
  let monthlyQuery = `
    SELECT TOP 12 FORMAT(ts.submittedAt, 'MMM yy') AS month, COUNT(*) AS submissions
    FROM TrackerSubmission ts
    INNER JOIN Project p ON p.id = ts.projectId
    WHERE ts.submittedAt >= DATEADD(month, -12, GETDATE())
  `;
  const monthlyParams: any[] = [];
  if (fiscalYear) {
    monthlyQuery += ` AND p.fiscalYear = @p${monthlyParams.length + 1}`;
    monthlyParams.push(fiscalYear);
  }
  monthlyQuery += ` GROUP BY FORMAT(ts.submittedAt, 'MMM yy'), YEAR(ts.submittedAt), MONTH(ts.submittedAt)
                   ORDER BY YEAR(ts.submittedAt) ASC, MONTH(ts.submittedAt) ASC`;
  const monthlyRows = await safeQuery<any>(monthlyQuery, monthlyParams);

  return {
    totalProjects,
    activeProjects,
    pendingProjects: notStartedProjects,
    notStartedProjects,
    completedProjects,
    totalBudget,
    avgProgress,
    awaitingDraftReview: Number(cq.draftReview ?? 0),
    awaitingWeightsReview: Number(cq.weightsReview ?? 0),
    recentTrackers,
    stalledProjects,
    terminatedProjects,
    nearCompleteProjects: nearCompleteCount,
    sectorBreakdown,
    progressBuckets,
    recentActivity: activityRows.rows.map((r: any) => ({
      id: r.id?.toString(),
      projectName: r.projectName,
      sector: r.sector ?? "Unknown",
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

// ─── getCIDPPerformance (with fiscalYear) ────────────────────────────────────

export async function getCIDPPerformance(
  fiscalYear?: string,
): Promise<CIDPPerformance> {
  const { rows: categories } = await safeQuery<any>(
    `SELECT id, name, sector, target, targetType FROM ProjectCategory WHERE status = 'APPROVED'`,
    [],
  );
  if (categories.length === 0) {
    return {
      cumulativeTarget: 100,
      cumulativeCovered: 0,
      cumulativeCoveragePercent: 0,
      cumulativeScore: 0,
      totalProjects: 0,
      totalCategories: 0,
      sectors: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  const categoryMap = new Map<string, any>();

  for (const cat of categories) {
    let projectQuery = `
      SELECT id, name, contributionValue, status,
             (SELECT TOP 1 overallPercent FROM TrackerSubmission WHERE projectId = p.id ORDER BY submittedAt DESC) AS latestTrackerPercent
      FROM Project p
      WHERE categoryId = @p1
    `;
    const params: any[] = [cat.id];
    if (fiscalYear) {
      projectQuery += ` AND fiscalYear = @p2`;
      params.push(fiscalYear);
    }
    const { rows: projRows } = await safeQuery<any>(projectQuery, params);
    categoryMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      sector: cat.sector ?? "Unknown",
      target: Number(cat.target ?? 100),
      targetType: cat.targetType ?? "NUMBER",
      projects: projRows.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        contributionValue: Number(p.contributionValue ?? 0),
        latestTrackerPercent:
          p.latestTrackerPercent != null ? Number(p.latestTrackerPercent) : 0,
        status: p.status,
      })),
    });
  }

  // Build CategoryPerformance[] (same logic as before, using the projects fetched)
  const categoriesPerf: CategoryPerformance[] = [];
  for (const cat of categoryMap.values()) {
    const covered = cat.projects.reduce(
      (sum: number, p: any) => sum + p.contributionValue,
      0,
    );
    let coveragePercent = 0;
    if (cat.target > 0)
      coveragePercent = Math.min((covered / cat.target) * 100, 100);
    const projectCount = cat.projects.length;
    const sumTracker = cat.projects.reduce(
      (sum: number, p: any) => sum + p.latestTrackerPercent,
      0,
    );
    const score = projectCount > 0 ? sumTracker / projectCount : 0;

    categoriesPerf.push({
      id: cat.id,
      name: cat.name,
      sector: cat.sector,
      target: cat.target,
      targetType: cat.targetType,
      covered,
      coveragePercent,
      score,
      projectCount,
      projects: cat.projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        categoryId: cat.id,
        latestTrackerPercent: p.latestTrackerPercent,
        contributionValue: p.contributionValue,
        status: p.status,
      })),
    });
  }

  // Build SectorPerformance[] (same as before)
  const sectorMap = new Map<string, CategoryPerformance[]>();
  for (const cat of categoriesPerf) {
    if (!sectorMap.has(cat.sector)) sectorMap.set(cat.sector, []);
    sectorMap.get(cat.sector)!.push(cat);
  }

  const sectors: SectorPerformance[] = [];
  for (const [sector, cats] of sectorMap) {
    let totalTarget = 0;
    let totalCovered = 0;
    let weightedScoreSum = 0;
    let projectCount = 0;
    for (const cat of cats) {
      totalTarget += cat.target;
      totalCovered += cat.covered;
      weightedScoreSum += cat.score * cat.target;
      projectCount += cat.projectCount;
    }
    let coveragePercent =
      totalTarget > 0 ? (totalCovered / totalTarget) * 100 : 0;
    let score = totalTarget > 0 ? weightedScoreSum / totalTarget : 0;
    sectors.push({
      sector,
      totalTarget,
      totalCovered,
      coveragePercent,
      score,
      projectCount,
      categoryCount: cats.length,
      categories: cats.sort((a, b) => b.score - a.score),
    });
  }
  sectors.sort((a, b) => b.score - a.score);

  let cumulativeTarget = 0,
    cumulativeCovered = 0,
    weightedCumulativeScore = 0,
    totalProjects = 0;
  for (const sector of sectors) {
    cumulativeTarget += sector.totalTarget;
    cumulativeCovered += sector.totalCovered;
    weightedCumulativeScore += sector.score * sector.totalTarget;
    totalProjects += sector.projectCount;
  }
  const cumulativeCoveragePercent =
    cumulativeTarget > 0 ? (cumulativeCovered / cumulativeTarget) * 100 : 0;
  const cumulativeScore =
    cumulativeTarget > 0 ? weightedCumulativeScore / cumulativeTarget : 0;

  return {
    cumulativeTarget,
    cumulativeCovered,
    cumulativeCoveragePercent,
    cumulativeScore,
    totalProjects,
    totalCategories: categoriesPerf.length,
    sectors,
    lastUpdated: new Date().toISOString(),
  };
}

// ─── getReportProjects (with fiscalYear) ──────────────────────────────────────

export async function getReportProjects(
  fiscalYear?: string,
): Promise<ReportProject[]> {
  let query = `
    SELECT
      p.id, p.name, p.sector,
      CONCAT(ISNULL(p.ward,''), CASE WHEN p.ward IS NOT NULL AND p.subCounty IS NOT NULL THEN ', ' ELSE '' END, ISNULL(p.subCounty,'')) AS location,
      ts.overallPercent AS latestTrackerPercent, ts.submittedAt AS latestTrackerDate,
      tc.trackerCount, ISNULL(stalled.stalledCount, 0) AS stalledCount,
      prev.overallPercent AS prevTrackerPercent, ch.status AS checklistStatus,
      trc.workforceCount, trc.workforceMale, trc.workforceFemale, trc.workforcePWD,
      trc.bestPractices, trc.challenges
    FROM Project p
    INNER JOIN TrackerSubmission ts ON ts.id = (SELECT TOP 1 id FROM TrackerSubmission WHERE projectId = p.id ORDER BY submittedAt DESC)
    INNER JOIN (SELECT projectId, COUNT(*) AS trackerCount FROM TrackerSubmission GROUP BY projectId) tc ON tc.projectId = p.id
    LEFT JOIN (SELECT tsi.submissionId, COUNT(*) AS stalledCount FROM TrackerSubmissionItem tsi WHERE tsi.status = 'STALLED' GROUP BY tsi.submissionId) stalled ON stalled.submissionId = ts.id
    LEFT JOIN TrackerSubmission prev ON prev.id = (SELECT TOP 1 id FROM TrackerSubmission WHERE projectId = p.id AND submittedAt < ts.submittedAt ORDER BY submittedAt DESC)
    LEFT JOIN Checklist ch ON ch.projectId = p.id
    LEFT JOIN TrackerReviewCapture trc ON trc.projectId = p.id AND trc.trackerSubmissionId = ts.id
    WHERE p.status = 'ACTIVE'
  `;
  const params: any[] = [];
  if (fiscalYear) {
    query += ` AND p.fiscalYear = @p${params.length + 1}`;
    params.push(fiscalYear);
  }
  query += ` ORDER BY ts.overallPercent DESC`;
  const result = await safeQuery<any>(query, params);

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

// ─── getFiscalYears ──────────────────────────────────────────────────────────

export async function getFiscalYears(): Promise<string[]> {
  const { rows } = await safeQuery<{ fiscalYear: string }>(
    `SELECT DISTINCT fiscalYear FROM Project WHERE fiscalYear IS NOT NULL ORDER BY fiscalYear DESC`,
  );
  return rows.map((r) => r.fiscalYear);
}
