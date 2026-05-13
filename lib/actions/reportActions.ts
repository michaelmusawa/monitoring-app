"use server";

import { safeQuery, DatabaseError } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrackerCaptureInput {
  projectId: string;
  trackerSubmissionId: string;
  capturedBy: string;
  trackingDate?: string;
  fundingSource?: string;
  employer?: string;
  employerRep?: string;
  projectManager?: string;
  fiscalYear?: string;
  contractSum?: string;
  commencementDate?: string;
  plannedCompletion?: string;
  contractDuration?: string;
  costToCompletion?: string;
  workforceCount?: number; // total (auto-computed as male+female+pwd when breakdown is provided)
  workforceMale?: number;
  workforceFemale?: number;
  workforcePWD?: number;
  workforceNote?: string;
  keyFindings?: string[];
  challenges?: string[];
  recommendations?: string[];
  bestPractices?: string[];
  lessonsLearnt?: string[];
  ongoingWorks?: string;
  pendingWorks?: string;
}

export interface TrackerCapture extends TrackerCaptureInput {
  id: string;
  capturedAt: string;
  updatedAt: string;
}

export interface ReportContent {
  projectTitle: string;
  location: string;
  trackingDate: string;
  fundingSource: string;
  employer: string;
  employerRep: string;
  projectManager: string;
  fiscalYear: string;
  contractSum: string;
  overallPercent: number;
  workforceCount: number;
  workforceNote: string;
  commencementDate: string;
  plannedCompletion: string;
  contractDuration: string;
  costToCompletion: string;
  projectOverview: string;
  projectScope: {
    category: string;
    items: { label: string; percent: number }[];
  }[];
  summaryOfCompleted: string[];
  ongoingWorks: string;
  pendingWorks: string;
  keyFindings: string[];
  challenges: string[];
  recommendations: string[];
  bestPractices: string[];
  lessonsLearnt: string[];
}

export interface StatusReportDraft {
  id: string;
  projectId: string;
  generatedBy: string;
  generatedAt: string;
  updatedAt: string;
  status: "draft" | "finalized";
  reportTitle: string;
  reportContent: ReportContent;
}

// ─── Get tracker review capture ───────────────────────────────────────────────

export async function getTrackerCapture(
  projectId: string,
  trackerSubmissionId: string,
): Promise<TrackerCapture | null> {
  try {
    const { rows } = await safeQuery<any>(
      `SELECT * FROM TrackerReviewCapture
       WHERE projectId = @p1 AND trackerSubmissionId = @p2`,
      [projectId, trackerSubmissionId],
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id.toString(),
      projectId: r.projectId,
      trackerSubmissionId: r.trackerSubmissionId,
      capturedBy: r.capturedBy,
      capturedAt: r.capturedAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
      trackingDate: r.trackingDate?.toISOString().slice(0, 10),
      fundingSource: r.fundingSource,
      employer: r.employer,
      employerRep: r.employerRep,
      projectManager: r.projectManager,
      fiscalYear: r.fiscalYear,
      contractSum: r.contractSum,
      commencementDate: r.commencementDate?.toISOString().slice(0, 10),
      plannedCompletion: r.plannedCompletion?.toISOString().slice(0, 10),
      contractDuration: r.contractDuration,
      costToCompletion: r.costToCompletion,
      workforceCount: r.workforceCount,
      workforceNote: r.workforceNote,
      keyFindings: r.keyFindings ? JSON.parse(r.keyFindings) : [],
      challenges: r.challenges ? JSON.parse(r.challenges) : [],
      recommendations: r.recommendations ? JSON.parse(r.recommendations) : [],
      bestPractices: r.bestPractices ? JSON.parse(r.bestPractices) : [],
      lessonsLearnt: r.lessonsLearnt ? JSON.parse(r.lessonsLearnt) : [],
      ongoingWorks: r.ongoingWorks,
      pendingWorks: r.pendingWorks,
    };
  } catch (error) {
    console.error("getTrackerCapture error:", error);
    throw new DatabaseError();
  }
}

// ─── Get the most recent capture for a project (for report generation) ────────

export async function getLatestTrackerCapture(
  projectId: string,
): Promise<TrackerCapture | null> {
  try {
    const { rows } = await safeQuery<any>(
      `SELECT TOP 1 * FROM TrackerReviewCapture
       WHERE projectId = @p1
       ORDER BY updatedAt DESC`,
      [projectId],
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id.toString(),
      projectId: r.projectId,
      trackerSubmissionId: r.trackerSubmissionId,
      capturedBy: r.capturedBy,
      capturedAt: r.capturedAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
      trackingDate: r.trackingDate?.toISOString().slice(0, 10),
      fundingSource: r.fundingSource,
      employer: r.employer,
      employerRep: r.employerRep,
      projectManager: r.projectManager,
      fiscalYear: r.fiscalYear,
      contractSum: r.contractSum,
      commencementDate: r.commencementDate?.toISOString().slice(0, 10),
      plannedCompletion: r.plannedCompletion?.toISOString().slice(0, 10),
      contractDuration: r.contractDuration,
      costToCompletion: r.costToCompletion,
      workforceCount: r.workforceCount,
      workforceNote: r.workforceNote,
      keyFindings: r.keyFindings ? JSON.parse(r.keyFindings) : [],
      challenges: r.challenges ? JSON.parse(r.challenges) : [],
      recommendations: r.recommendations ? JSON.parse(r.recommendations) : [],
      bestPractices: r.bestPractices ? JSON.parse(r.bestPractices) : [],
      lessonsLearnt: r.lessonsLearnt ? JSON.parse(r.lessonsLearnt) : [],
      ongoingWorks: r.ongoingWorks,
      pendingWorks: r.pendingWorks,
    };
  } catch (error) {
    console.error("getLatestTrackerCapture error:", error);
    throw new DatabaseError();
  }
}

// ─── Save tracker capture (upsert) ───────────────────────────────────────────

export async function saveTrackerCapture(
  data: TrackerCaptureInput,
): Promise<TrackerCapture> {
  try {
    const kf = data.keyFindings ? JSON.stringify(data.keyFindings) : null;
    const ch = data.challenges ? JSON.stringify(data.challenges) : null;
    const rc = data.recommendations
      ? JSON.stringify(data.recommendations)
      : null;
    const bp = data.bestPractices ? JSON.stringify(data.bestPractices) : null;
    const ll = data.lessonsLearnt ? JSON.stringify(data.lessonsLearnt) : null;

    const existing = await safeQuery<any>(
      `SELECT id FROM TrackerReviewCapture
       WHERE projectId = @p1 AND trackerSubmissionId = @p2`,
      [data.projectId, data.trackerSubmissionId],
    );

    if (existing.rows.length > 0) {
      await safeQuery(
        `UPDATE TrackerReviewCapture SET
          capturedBy = @p3, updatedAt = GETDATE(),
          trackingDate = @p4, fundingSource = @p5, employer = @p6,
          employerRep = @p7, projectManager = @p8, fiscalYear = @p9,
          contractSum = @p10, commencementDate = @p11, plannedCompletion = @p12,
          contractDuration = @p13, costToCompletion = @p14,
          workforceCount = @p15, workforceNote = @p16,
          keyFindings = @p17, challenges = @p18, recommendations = @p19,
          bestPractices = @p20, lessonsLearnt = @p21,
          ongoingWorks = @p22, pendingWorks = @p23,
          workforceMale = @p24, workforceFemale = @p25, workforcePWD = @p26
         WHERE projectId = @p1 AND trackerSubmissionId = @p2`,
        [
          data.projectId,
          data.trackerSubmissionId,
          data.capturedBy,
          data.trackingDate ?? null,
          data.fundingSource ?? null,
          data.employer ?? null,
          data.employerRep ?? null,
          data.projectManager ?? null,
          data.fiscalYear ?? null,
          data.contractSum ?? null,
          data.commencementDate ?? null,
          data.plannedCompletion ?? null,
          data.contractDuration ?? null,
          data.costToCompletion ?? null,
          data.workforceCount ?? null,
          data.workforceNote ?? null,
          kf,
          ch,
          rc,
          bp,
          ll,
          data.ongoingWorks ?? null,
          data.pendingWorks ?? null,
          data.workforceMale ?? null,
          data.workforceFemale ?? null,
          data.workforcePWD ?? null,
        ],
      );
    } else {
      await safeQuery(
        `INSERT INTO TrackerReviewCapture
          (projectId, trackerSubmissionId, capturedBy, capturedAt, updatedAt,
           trackingDate, fundingSource, employer, employerRep, projectManager,
           fiscalYear, contractSum, commencementDate, plannedCompletion,
           contractDuration, costToCompletion, workforceCount, workforceNote,
           keyFindings, challenges, recommendations, bestPractices, lessonsLearnt,
           ongoingWorks, pendingWorks,
           workforceMale, workforceFemale, workforcePWD)
         VALUES
          (@p1, @p2, @p3, GETDATE(), GETDATE(),
           @p4, @p5, @p6, @p7, @p8,
           @p9, @p10, @p11, @p12,
           @p13, @p14, @p15, @p16,
           @p17, @p18, @p19, @p20, @p21,
           @p22, @p23,
           @p24, @p25, @p26)`,
        [
          data.projectId,
          data.trackerSubmissionId,
          data.capturedBy,
          data.trackingDate ?? null,
          data.fundingSource ?? null,
          data.employer ?? null,
          data.employerRep ?? null,
          data.projectManager ?? null,
          data.fiscalYear ?? null,
          data.contractSum ?? null,
          data.commencementDate ?? null,
          data.plannedCompletion ?? null,
          data.contractDuration ?? null,
          data.costToCompletion ?? null,
          data.workforceCount ?? null,
          data.workforceNote ?? null,
          kf,
          ch,
          rc,
          bp,
          ll,
          data.ongoingWorks ?? null,
          data.pendingWorks ?? null,
          data.workforceMale ?? null,
          data.workforceFemale ?? null,
          data.workforcePWD ?? null,
        ],
      );
    }

    revalidatePath(`/projects/${data.projectId}/reports`);
    return (await getTrackerCapture(data.projectId, data.trackerSubmissionId))!;
  } catch (error) {
    console.error("saveTrackerCapture error:", error);
    throw new DatabaseError();
  }
}

// ─── Get status report draft ──────────────────────────────────────────────────

export async function getStatusReportDraft(
  projectId: string,
): Promise<StatusReportDraft | null> {
  try {
    const { rows } = await safeQuery<any>(
      `SELECT id, projectId, generatedBy, generatedAt, updatedAt, status, reportTitle, reportContent
       FROM StatusReportDraft WHERE projectId = @p1`,
      [projectId],
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id.toString(),
      projectId: r.projectId,
      generatedBy: r.generatedBy,
      generatedAt: r.generatedAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
      status: r.status,
      reportTitle: r.reportTitle,
      reportContent: JSON.parse(r.reportContent),
    };
  } catch (error) {
    console.error("getStatusReportDraft error:", error);
    throw new DatabaseError();
  }
}

// ─── Save status report draft (upsert) ───────────────────────────────────────

export async function saveStatusReportDraft(data: {
  projectId: string;
  generatedBy: string;
  reportTitle: string;
  reportContent: ReportContent;
  captureSnapshot?: any;
  status?: "draft" | "finalized";
}): Promise<StatusReportDraft> {
  try {
    const contentJson = JSON.stringify(data.reportContent);
    const snapshotJson = data.captureSnapshot
      ? JSON.stringify(data.captureSnapshot)
      : null;
    const status = data.status ?? "draft";

    const existing = await safeQuery<any>(
      "SELECT id FROM StatusReportDraft WHERE projectId = @p1",
      [data.projectId],
    );

    if (existing.rows.length > 0) {
      await safeQuery(
        `UPDATE StatusReportDraft SET
          generatedBy = @p2, updatedAt = GETDATE(), status = @p3,
          reportTitle = @p4, reportContent = @p5, captureSnapshot = @p6
         WHERE projectId = @p1`,
        [
          data.projectId,
          data.generatedBy,
          status,
          data.reportTitle,
          contentJson,
          snapshotJson,
        ],
      );
    } else {
      await safeQuery(
        `INSERT INTO StatusReportDraft
          (projectId, generatedBy, generatedAt, updatedAt, status, reportTitle, reportContent, captureSnapshot)
         VALUES (@p1, @p2, GETDATE(), GETDATE(), @p3, @p4, @p5, @p6)`,
        [
          data.projectId,
          data.generatedBy,
          status,
          data.reportTitle,
          contentJson,
          snapshotJson,
        ],
      );
    }

    revalidatePath(`/projects/${data.projectId}/reports`);
    return (await getStatusReportDraft(data.projectId))!;
  } catch (error) {
    console.error("saveStatusReportDraft error:", error);
    throw new DatabaseError();
  }
}

export interface ProjectProgress {
  id: string;
  name: string;
  sector: string;
  status: string;
  progress: number;
  budget: number | null;
  createdAt: Date;
}

export async function getProjectProgressData(): Promise<ProjectProgress[]> {
  const sql = `
    SELECT id, name, sector, status, progress, budget, createdAt
    FROM Project
    ORDER BY createdAt DESC
  `;
  const { rows } = await safeQuery<any>(sql, []);
  return rows.map((r) => ({
    id: r.id.toString(),
    name: r.name,
    sector: r.sector,
    status: r.status,
    progress: r.progress || 0,
    budget: r.budget,
    createdAt: r.createdAt,
  }));
}

export interface ChecklistStatus {
  projectId: string;
  projectName: string;
  status: string;
  totalItems: number;
  selectedItems: number;
  totalWeight: number;
  lastModified: Date;
}

export async function getChecklistStatusData(): Promise<ChecklistStatus[]> {
  const sql = `
    SELECT
      p.id as projectId,
      p.name as projectName,
      c.status,
      COUNT(ci.id) as totalItems,
      SUM(CASE WHEN ci.weight > 0 THEN 1 ELSE 0 END) as selectedItems,
      SUM(ci.weight) as totalWeight,
      c.lastModified
    FROM Project p
    LEFT JOIN Checklist c ON p.id = c.projectId
    LEFT JOIN ChecklistItem ci ON ci.checklistId = c.id
    GROUP BY p.id, p.name, c.status, c.lastModified
    ORDER BY p.name
  `;
  const { rows } = await safeQuery<any>(sql, []);
  return rows.map((r) => ({
    projectId: r.projectId.toString(),
    projectName: r.projectName,
    status: r.status || "No checklist",
    totalItems: r.totalItems || 0,
    selectedItems: r.selectedItems || 0,
    totalWeight: r.totalWeight || 0,
    lastModified: r.lastModified,
  }));
}

export interface SectorPerformance {
  sector: string;
  projectCount: number;
  avgProgress: number;
  totalBudget: number;
  completedProjects: number;
  activeProjects: number;
}

export async function getSectorPerformanceData(): Promise<SectorPerformance[]> {
  const sql = `
    SELECT
      COALESCE(sector, 'Unspecified') as sector,
      COUNT(*) as projectCount,
      AVG(progress) as avgProgress,
      SUM(COALESCE(budget, 0)) as totalBudget,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completedProjects,
      SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as activeProjects
    FROM Project
    GROUP BY COALESCE(sector, 'Unspecified')
    ORDER BY avgProgress DESC
  `;
  const { rows } = await safeQuery<any>(sql, []);
  return rows.map((r) => ({
    sector: r.sector,
    projectCount: r.projectCount,
    avgProgress: Math.round(r.avgProgress * 10) / 10,
    totalBudget: r.totalBudget,
    completedProjects: r.completedProjects,
    activeProjects: r.activeProjects,
  }));
}

export interface PendingChangeRequest {
  projectId: string;
  projectName: string;
  requestedBy: string;
  requestedAt: Date;
  changesCount: number;
}

export async function getPendingChangeRequestsData(): Promise<
  PendingChangeRequest[]
> {
  const sql = `
    SELECT
      p.id as projectId,
      p.name as projectName,
      cr.requestedBy,
      cr.requestedAt,
      COUNT(ci.id) as changesCount
    FROM ChecklistChangeRequest cr
    JOIN Checklist c ON cr.checklistId = c.id
    JOIN Project p ON c.projectId = p.id
    JOIN ChecklistChangeItem ci ON cr.id = ci.requestId
    WHERE cr.status = 'PENDING'
    GROUP BY p.id, p.name, cr.requestedBy, cr.requestedAt
    ORDER BY cr.requestedAt DESC
  `;
  const { rows } = await safeQuery<any>(sql, []);
  return rows.map((r) => ({
    projectId: r.projectId.toString(),
    projectName: r.projectName,
    requestedBy: r.requestedBy,
    requestedAt: r.requestedAt,
    changesCount: r.changesCount,
  }));
}
