// lib/actions/dashboardActions.ts
"use server";

import { safeQuery } from "@/lib/db";

import type { ReportProject } from "@/components/dashboard/ReportGenerator";
import {
  buildUnitLookup,
  getRootUnitName,
  type UnitLookup,
} from "./orgActions";
import { DashboardStats } from "@/components/dashboard/UnifiedDashboard";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProjectPerformance {
  id: string;
  name: string;
  categoryId: string;
  latestTrackerPercent: number;
  contributionValue: number;
  status: string;
  contribution: number;
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
  actualPercent: number;
}

export interface SectorPerformance {
  sector: string;
  categoryCount: number;
  projectCount: number;
  averageScore: number; // average of category scores
  averageCoveragePercent: number; // average of category coverage percentages
  categories: CategoryPerformance[];
  score: number;
  totalActual: number;
}

export interface CIDPPerformance {
  totalProjects: number;
  totalCategories: number;
  averageScore: number; // county‑wide average score
  averageCoveragePercent: number; // county‑wide average coverage
  sectors: SectorPerformance[];
  lastUpdated: string;
  cumulativeScore: number;
  cumulativeActual: number;
}

// ─── Helper: fetch latest tracker per project with previous percent ──────────

interface LatestTrackerInfo {
  projectId: string;
  overallPercent: number;
  submittedAt: Date;
  prevOverallPercent: number | null;
}

async function getLatestTrackerInfoMap(
  fiscalYear?: string,
): Promise<Map<string, LatestTrackerInfo>> {
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
  const params: any[] = [];
  if (fiscalYear) {
    sql += ` AND r1.projectId IN (SELECT id FROM Project WHERE fiscalYear = @p1)`;
    params.push(fiscalYear);
  }
  const { rows } = await safeQuery<{
    projectId: string;
    overallPercent: number;
    submittedAt: Date;
    prevOverallPercent: number | null;
  }>(sql, params);

  const map = new Map<string, LatestTrackerInfo>();
  for (const row of rows) {
    map.set(row.projectId, {
      projectId: row.projectId,
      overallPercent: Number(row.overallPercent),
      submittedAt: row.submittedAt,
      prevOverallPercent:
        row.prevOverallPercent != null ? Number(row.prevOverallPercent) : null,
    });
  }
  return map;
}

// ─── getDashboardStats ─────────────────────────────────────────────────────

export async function getDashboardStats(
  fiscalYear?: string,
): Promise<DashboardStats> {
  const trackerMap = await getLatestTrackerInfoMap(fiscalYear);
  const unitLookup = await buildUnitLookup();

  // Main project query – now includes orgUnitId (no sector column used)
  let projectQuery = `
    SELECT
      p.id, p.name, p.budget, p.status, p.createdAt, p.updatedAt, p.fiscalYear,
      p.orgUnitId
    FROM Project p
    WHERE 1=1
  `;
  const projectParams: any[] = [];
  if (fiscalYear) {
    projectQuery += ` AND p.fiscalYear = @p${projectParams.length + 1}`;
    projectParams.push(fiscalYear);
  }
  const { rows: allProjects } = await safeQuery<any>(
    projectQuery,
    projectParams,
  );

  let totalProjects = 0;
  let notStartedProjects = 0;
  let completedProjects = 0;
  let ongoingProjects = 0;
  let stalledProjects = 0;
  let totalBudget = 0;
  let avgProgressSum = 0;
  let nearCompleteCount = 0;

  const sectorMap = new Map<
    string,
    { count: number; avgProgressSum: number; budgetSum: number }
  >();
  const buckets = [0, 0, 0, 0]; // 0%, 1-49%, 50-99%, 100%

  const threeMonthsMs = 3 * 30 * 24 * 60 * 60 * 1000;

  for (const proj of allProjects) {
    const tracker = trackerMap.get(proj.id);
    const rawPct = tracker?.overallPercent ?? 0;
    const dbStatus = (proj.status || "").toUpperCase();
    let effectivePct = rawPct;

    const isDBCompleted = dbStatus === "COMPLETED" || dbStatus === "COMPLETE";
    if (isDBCompleted || rawPct >= 100) {
      effectivePct = 100;
      completedProjects++;
      buckets[3]++;
    } else if (rawPct === 0) {
      notStartedProjects++;
      buckets[0]++;
    } else {
      // Determine if stalled
      const isStalled =
        tracker &&
        tracker.prevOverallPercent !== null &&
        rawPct === tracker.prevOverallPercent &&
        Date.now() - new Date(tracker.submittedAt).getTime() > threeMonthsMs;

      if (isStalled) {
        stalledProjects++;
      } else {
        ongoingProjects++;
      }

      if (rawPct > 0 && rawPct < 50) buckets[1]++;
      else if (rawPct >= 50 && rawPct < 100) buckets[2]++;

      if (rawPct >= 80 && rawPct < 100) nearCompleteCount++;
    }

    totalProjects++;
    totalBudget += Number(proj.budget ?? 0);
    avgProgressSum += effectivePct;

    // Compute root sector name
    const rootSector = proj.orgUnitId
      ? await getRootUnitName(proj.orgUnitId, unitLookup)
      : "Unknown";

    const existing = sectorMap.get(rootSector) || {
      count: 0,
      avgProgressSum: 0,
      budgetSum: 0,
    };
    existing.count++;
    existing.avgProgressSum += effectivePct;
    existing.budgetSum += Number(proj.budget ?? 0);
    sectorMap.set(rootSector, existing);
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

  // Terminated projects (based on DB status)
  let terminatedQuery = `
    SELECT COUNT(*) AS cnt FROM Project WHERE UPPER(status) = 'TERMINATED'
  `;
  const terminatedParams: any[] = [];
  if (fiscalYear) {
    terminatedQuery += ` AND fiscalYear = @p${terminatedParams.length + 1}`;
    terminatedParams.push(fiscalYear);
  }
  const terminatedRows = await safeQuery<{ cnt: number }>(
    terminatedQuery,
    terminatedParams,
  );
  const terminatedProjects = terminatedRows.rows[0]?.cnt ?? 0;

  // Checklist queue
  const checklistQueueRows = await safeQuery<any>(
    `SELECT
       SUM(CASE WHEN status = 'DraftReview'   THEN 1 ELSE 0 END) AS draftReview,
       SUM(CASE WHEN status = 'WeightsReview' THEN 1 ELSE 0 END) AS weightsReview
     FROM Checklist`,
    [],
  );
  const cq = checklistQueueRows.rows[0] ?? {};

  // Recent trackers (7 days)
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

  // Recent activity – join OrganisationalUnit to get unit name, then compute root sector
  // We'll fetch all activity, then compute root sector in code to avoid deep joins.
  let activityQuery = `
    SELECT TOP 20
      feed.id,
      feed.projectName,
      feed.orgUnitId,
      feed.type,
      feed.detail,
      feed.eventDate
    FROM (
      SELECT CAST(ts.id AS NVARCHAR) AS id, p.name AS projectName, p.orgUnitId, 'tracker' AS type,
        CONCAT('Tracker submitted — ', CAST(CAST(ts.overallPercent AS INT) AS NVARCHAR), '% overall') AS detail,
        ts.submittedAt AS eventDate
      FROM TrackerSubmission ts INNER JOIN Project p ON p.id = ts.projectId
      UNION ALL
      SELECT CAST(ch.id AS NVARCHAR), p.name, p.orgUnitId, 'checklist',
        CONCAT('Checklist → ', ch.status), ch.createdAt
      FROM ChecklistHistory ch
      INNER JOIN Checklist c ON c.id = ch.checklistId
      INNER JOIN Project p ON p.id = c.projectId
      UNION ALL
      SELECT CAST(p.id AS NVARCHAR), p.name, p.orgUnitId, 'init', 'Project activated', p.updatedAt
      FROM Project p WHERE p.status = 'ACTIVE' AND p.updatedAt IS NOT NULL
    ) feed
    WHERE 1=1
  `;
  const activityParams: any[] = [];
  if (fiscalYear) {
    activityQuery += ` AND feed.orgUnitId IN (SELECT id FROM OrganisationalUnit WHERE id IN (SELECT DISTINCT orgUnitId FROM Project WHERE fiscalYear = @p${activityParams.length + 1}))`;
    activityParams.push(fiscalYear);
  }
  activityQuery += ` ORDER BY feed.eventDate DESC`;
  const { rows: activityRowsData } = await safeQuery<any>(
    activityQuery,
    activityParams,
  );

  // Compute root sector for each activity entry
  const recentActivity = [];
  for (const r of activityRowsData) {
    recentActivity.push({
      id: r.id?.toString(),
      projectName: r.projectName,
      sector: r.orgUnitId
        ? await getRootUnitName(r.orgUnitId, unitLookup)
        : "Unknown",
      type: r.type,
      detail: r.detail,
      date: r.eventDate?.toISOString?.() ?? new Date().toISOString(),
    });
  }

  // Budget by size
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
  const { rows: budgetSizeData } = await safeQuery<any>(
    budgetSizeQuery,
    budgetParams,
  );

  // Monthly tracker submissions
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
  const { rows: monthlyData } = await safeQuery<any>(
    monthlyQuery,
    monthlyParams,
  );

  return {
    totalProjects,
    activeProjects: ongoingProjects,
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
    recentActivity,
    budgetBySize: budgetSizeData.map((r: any) => ({
      size: r.size,
      budget: Number(r.totalBudget),
      count: Number(r.cnt),
    })),
    monthlyTrackers: monthlyData.map((r: any) => ({
      month: r.month,
      submissions: Number(r.submissions),
    })),
  };
}

// ─── getCIDPPerformance ────────────────────────────────────────────────────

// lib/actions/dashboardActions.ts

// ─── New / modified interfaces ──────────────────────────────────────────────

// ─── getCIDPPerformance ────────────────────────────────────────────────────

export async function getCIDPPerformance(
  fiscalYear?: string,
): Promise<CIDPPerformance> {
  const unitLookup = await buildUnitLookup();

  const { rows: categories } = await safeQuery<any>(
    `SELECT id, name, sector, target, targetType FROM ProjectCategory WHERE status = 'APPROVED'`,
    [],
  );
  if (categories.length === 0) {
    return {
      totalProjects: 0,
      totalCategories: 0,
      averageScore: 0,
      averageCoveragePercent: 0,
      sectors: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  const categoryMap = new Map<string, any>();

  for (const cat of categories) {
    let projectQuery = `
      SELECT
        p.id,
        p.name,
        p.contributionValue,
        p.status,
        p.orgUnitId,
        CASE
          WHEN UPPER(p.status) IN ('COMPLETED', 'COMPLETE') THEN 100
          ELSE COALESCE((
            SELECT TOP 1 overallPercent
            FROM TrackerSubmission
            WHERE projectId = p.id
            ORDER BY submittedAt DESC
          ), 0)
        END AS latestTrackerPercent
      FROM Project p
      WHERE p.categoryId = @p1
    `;
    const params: any[] = [cat.id];
    if (fiscalYear) {
      projectQuery += ` AND p.fiscalYear = @p2`;
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
        latestTrackerPercent: Number(p.latestTrackerPercent),
        status: p.status,
        orgUnitId: p.orgUnitId,
      })),
    });
  }

  // Build CategoryPerformance[] with root sector and metrics
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

    // Determine root sector
    let rootSector = cat.sector; // fallback
    if (cat.projects.length > 0) {
      const firstOrg = cat.projects[0].orgUnitId;
      if (firstOrg) {
        rootSector = await getRootUnitName(firstOrg, unitLookup);
      }
    }

    categoriesPerf.push({
      id: cat.id,
      name: cat.name,
      sector: rootSector,
      target: cat.target,
      targetType: cat.targetType,
      covered, // still include for the category detail view
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

  // Build SectorPerformance[] – purely percentage‑based
  const sectorMap = new Map<string, CategoryPerformance[]>();
  for (const cat of categoriesPerf) {
    if (!sectorMap.has(cat.sector)) sectorMap.set(cat.sector, []);
    sectorMap.get(cat.sector)!.push(cat);
  }

  const sectors: SectorPerformance[] = [];
  for (const [sectorName, cats] of sectorMap) {
    const projectCount = cats.reduce((sum, c) => sum + c.projectCount, 0);
    const categoryCount = cats.length;
    const totalCoveragePercent = cats.reduce(
      (sum, c) => sum + c.coveragePercent,
      0,
    );
    const totalScore = cats.reduce((sum, c) => sum + c.score, 0);
    sectors.push({
      sector: sectorName,
      categoryCount,
      projectCount,
      averageCoveragePercent:
        categoryCount > 0 ? totalCoveragePercent / categoryCount : 0,
      averageScore: categoryCount > 0 ? totalScore / categoryCount : 0,
      categories: cats.sort((a, b) => b.score - a.score),
    });
  }
  sectors.sort((a, b) => b.averageScore - a.averageScore);

  // County‑wide aggregates
  const totalProjects = sectors.reduce((sum, s) => sum + s.projectCount, 0);
  const totalCategories = categoriesPerf.length;
  const totalScore = sectors.reduce(
    (sum, s) => sum + s.averageScore * s.categoryCount,
    0,
  );
  const totalCoveragePercent = sectors.reduce(
    (sum, s) => sum + s.averageCoveragePercent * s.categoryCount,
    0,
  );
  const averageScore = totalCategories > 0 ? totalScore / totalCategories : 0;
  const averageCoveragePercent =
    totalCategories > 0 ? totalCoveragePercent / totalCategories : 0;

  return {
    totalProjects,
    totalCategories,
    averageScore,
    averageCoveragePercent,
    sectors,
    lastUpdated: new Date().toISOString(),
  };
}

// ─── getReportProjects ──────────────────────────────────────────────────────

export async function getReportProjects(
  fiscalYear?: string,
): Promise<ReportProject[]> {
  const unitLookup = await buildUnitLookup();

  let query = `
    SELECT
      p.id,
      p.name,
      p.orgUnitId,
      ts.overallPercent AS latestTrackerPercent,
      ts.submittedAt AS latestTrackerDate,
      tc.trackerCount,
      ISNULL(stalled.stalledCount, 0) AS stalledCount,
      prev.overallPercent AS prevTrackerPercent,
      ch.status AS checklistStatus,
      trc.workforceCount,
      trc.workforceMale,
      trc.workforceFemale,
      trc.workforcePWD,
      trc.bestPractices,
      trc.challenges
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
  const { rows } = await safeQuery<any>(query, params);

  const projects = await Promise.all(
    rows.map(async (r: any) => {
      const sector = r.orgUnitId
        ? await getRootUnitName(r.orgUnitId, unitLookup)
        : "Unknown";

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
        sector, // root unit name
        location: r.location || null,
        latestTrackerPercent:
          r.latestTrackerPercent != null
            ? Number(r.latestTrackerPercent)
            : null,
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
    }),
  );
  return projects;
}

// ─── getFiscalYears ──────────────────────────────────────────────────────────

export async function getFiscalYears(): Promise<string[]> {
  const { rows } = await safeQuery<{ fiscalYear: string }>(
    `SELECT DISTINCT fiscalYear FROM Project WHERE fiscalYear IS NOT NULL ORDER BY fiscalYear DESC`,
  );
  return rows.map((r) => r.fiscalYear);
}
