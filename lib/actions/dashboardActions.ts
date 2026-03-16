// lib/actions/dashboardActions.ts
"use server";

import type { DashboardStats } from "@/components/dashboard/DashboardClient";
import { safeQuery } from "@/lib/db";
import type { ReportProject } from "@/components/dashboard/ReportGenerator";

export async function getDashboardStats(): Promise<DashboardStats> {
  // Run all queries in parallel
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
    // 1. Project summary counts + totals
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

    // 2. Sector breakdown with avg progress + budget
    safeQuery<any>(
      `SELECT
        ISNULL(sector, 'Unknown')          AS sector,
        COUNT(*)                            AS cnt,
        ISNULL(AVG(CAST(progress AS FLOAT)), 0) AS avgProgress,
        ISNULL(SUM(budget), 0)             AS budget
       FROM Project
       GROUP BY sector
       ORDER BY cnt DESC`,
      [],
    ),

    // 3. Progress bucket distribution
    safeQuery<any>(
      `SELECT
        SUM(CASE WHEN progress = 0 OR progress IS NULL          THEN 1 ELSE 0 END) AS bucket0,
        SUM(CASE WHEN progress > 0  AND progress < 50           THEN 1 ELSE 0 END) AS bucket1,
        SUM(CASE WHEN progress >= 50 AND progress < 100         THEN 1 ELSE 0 END) AS bucket2,
        SUM(CASE WHEN progress >= 100                           THEN 1 ELSE 0 END) AS bucket3
       FROM Project`,
      [],
    ),

    // 4. Checklist review queue counts
    safeQuery<any>(
      `SELECT
        SUM(CASE WHEN status = 'DraftReview'    THEN 1 ELSE 0 END) AS draftReview,
        SUM(CASE WHEN status = 'WeightsReview'  THEN 1 ELSE 0 END) AS weightsReview
       FROM Checklist`,
      [],
    ),

    // 5. Tracker submissions in last 7 days (count of projects that got one)
    safeQuery<any>(
      `SELECT COUNT(DISTINCT projectId) AS cnt
       FROM TrackerSubmission
       WHERE submittedAt >= DATEADD(day, -7, GETDATE())`,
      [],
    ),

    // 6. Projects with stalled items in their latest tracker
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

    // 7. Projects with latest tracker >= 80% and < 100%
    safeQuery<any>(
      `SELECT COUNT(*) AS cnt
       FROM (
         SELECT ts.projectId, ts.overallPercent
         FROM TrackerSubmission ts
         WHERE ts.submittedAt = (
           SELECT MAX(ts2.submittedAt) FROM TrackerSubmission ts2 WHERE ts2.projectId = ts.projectId
         )
       ) latest
       WHERE overallPercent >= 80 AND overallPercent < 100`,
      [],
    ),

    // 8. Recent activity feed (last 20 events across projects/checklists/trackers)
    safeQuery<any>(
      `SELECT TOP 20 * FROM (
        -- Tracker submissions
        SELECT
          CAST(ts.id AS NVARCHAR) AS id,
          p.name AS projectName,
          'tracker' AS type,
          CONCAT('Tracker submitted — ', CAST(ts.overallPercent AS NVARCHAR), '% overall') AS detail,
          ts.submittedAt AS eventDate
        FROM TrackerSubmission ts
        INNER JOIN Project p ON p.id = ts.projectId

        UNION ALL

        -- Checklist status changes
        SELECT
          CAST(ch.id AS NVARCHAR),
          p.name,
          'checklist',
          CONCAT('Checklist ', ch.status),
          ch.createdAt
        FROM ChecklistHistory ch
        INNER JOIN Checklist c ON c.id = ch.checklistId
        INNER JOIN Project p ON p.id = c.projectId

        UNION ALL

        -- Project activations
        SELECT
          CAST(p.id AS NVARCHAR),
          p.name,
          'init',
          'Project activated',
          p.updatedAt
        FROM Project p
        WHERE p.status = 'ACTIVE' AND p.updatedAt IS NOT NULL

      ) feed
      ORDER BY eventDate DESC`,
      [],
    ),

    // 9. Budget by project size category
    safeQuery<any>(
      `SELECT
        CASE
          WHEN budget <= 500000  THEN 'Small'
          WHEN budget <= 1000000 THEN 'Medium'
          ELSE 'Large'
        END AS size,
        ISNULL(SUM(budget), 0) AS totalBudget,
        COUNT(*) AS cnt
       FROM Project
       WHERE budget IS NOT NULL
       GROUP BY
        CASE
          WHEN budget <= 500000  THEN 'Small'
          WHEN budget <= 1000000 THEN 'Medium'
          ELSE 'Large'
        END`,
      [],
    ),

    // 10. Monthly tracker submission counts (last 12 months)
    safeQuery<any>(
      `SELECT TOP 12
        FORMAT(submittedAt, 'MMM yy') AS month,
        COUNT(*) AS submissions
       FROM TrackerSubmission
       WHERE submittedAt >= DATEADD(month, -12, GETDATE())
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

export async function getReportProjects(): Promise<ReportProject[]> {
  const result = await safeQuery<any>(
    `SELECT
       p.id,
       p.name,
       p.sector,
       CONCAT(ISNULL(p.ward, ''), CASE WHEN p.ward IS NOT NULL AND p.subCounty IS NOT NULL THEN ', ' ELSE '' END, ISNULL(p.subCounty, '')) AS location,
       ts.overallPercent        AS latestTrackerPercent,
       ts.submittedAt           AS latestTrackerDate,
       tc.trackerCount,
       ISNULL(stalled.stalledCount, 0) AS stalledCount,
       prev.overallPercent      AS prevTrackerPercent,
       ch.status                AS checklistStatus,
       -- workforce from the TrackerReviewCapture linked to the latest submission
       trc.workforceCount,
       trc.workforceMale,
       trc.workforceFemale,
       trc.workforcePWD,
       trc.workforceNote,
       trc.bestPractices,
       trc.challenges
     FROM Project p
     -- Latest tracker submission per project
     INNER JOIN TrackerSubmission ts ON ts.id = (
       SELECT TOP 1 id FROM TrackerSubmission
       WHERE projectId = p.id
       ORDER BY submittedAt DESC
     )
     -- Total tracker count per project
     INNER JOIN (
       SELECT projectId, COUNT(*) AS trackerCount
       FROM TrackerSubmission
       GROUP BY projectId
     ) tc ON tc.projectId = p.id
     -- Stalled items in the latest submission
     LEFT JOIN (
       SELECT tsi.submissionId, COUNT(*) AS stalledCount
       FROM TrackerSubmissionItem tsi
       WHERE tsi.status = 'STALLED'
       GROUP BY tsi.submissionId
     ) stalled ON stalled.submissionId = ts.id
     -- Previous submission (for weekly variance)
     LEFT JOIN TrackerSubmission prev ON prev.id = (
       SELECT TOP 1 id FROM TrackerSubmission
       WHERE projectId = p.id AND submittedAt < ts.submittedAt
       ORDER BY submittedAt DESC
     )
     -- Checklist status
     LEFT JOIN Checklist ch ON ch.projectId = p.id
     -- TrackerReviewCapture for the latest submission
     LEFT JOIN TrackerReviewCapture trc
       ON trc.projectId = p.id
      AND trc.trackerSubmissionId = ts.id
     WHERE p.status = 'ACTIVE'
     ORDER BY ts.overallPercent DESC`,
    [],
  );

  return result.rows.map((r: any) => {
    // Parse best practices and challenges (stored as JSON strings)
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

    // Weekly variance: latest % minus previous %
    const weeklyVariance =
      r.latestTrackerPercent != null && r.prevTrackerPercent != null
        ? Number(r.latestTrackerPercent) - Number(r.prevTrackerPercent)
        : null;

    // Workforce: use breakdown if available, fall back to workforceCount total
    const hasMaleFemale = r.workforceMale != null || r.workforceFemale != null;
    const workforce =
      r.workforceCount != null || hasMaleFemale
        ? {
            male: Number(r.workforceMale ?? 0),
            female: Number(r.workforceFemale ?? 0),
            pwd: Number(r.workforcePWD ?? 0),
            // Legacy: if only total was stored (no breakdown), distribute as unknown
            total: hasMaleFemale
              ? Number(r.workforceMale ?? 0) +
                Number(r.workforceFemale ?? 0) +
                Number(r.workforcePWD ?? 0)
              : Number(r.workforceCount ?? 0),
          }
        : null;

    return {
      id: r.id,
      name: r.name,
      sector: r.sector ?? null,
      location: r.location?.trim() || null,
      latestTrackerPercent:
        r.latestTrackerPercent != null ? Number(r.latestTrackerPercent) : null,
      latestTrackerDate: r.latestTrackerDate?.toISOString?.() ?? null,
      trackerCount: Number(r.trackerCount ?? 0),
      stalledCount: Number(r.stalledCount ?? 0),
      weeklyVariance,
      checklistStatus: r.checklistStatus ?? null,
      workforce,
      bestPractice,
      challenge,
    };
  });
}
