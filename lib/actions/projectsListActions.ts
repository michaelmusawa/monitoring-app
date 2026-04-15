// lib/actions/projectsListActions.ts
"use server";

import { safeQuery } from "@/lib/db";
import { fetchFilteredProjects } from "./projectActions";

export type AttentionFlag =
  | "needs_draft_review"
  | "needs_weights_review"
  | "new_tracker"
  | "pending_init"
  | "stalled_items"
  | "near_complete";

export interface EnrichedProject {
  id: string;
  name: string;
  sector: string | null;
  status: string;
  budget: number | null;
  progress: number | null;
  size: "Small" | "Medium" | "Large" | null;
  createdAt: Date;
  lat: number | null;
  long: number | null;
  subCounty: string | null;
  ward: string | null;
  categoryId: string | null;
  checklistStatus: string | null;
  checklistVersion: number | null;
  checklistLastModified: string | null;
  latestTrackerPercent: number | null;
  latestTrackerDate: string | null;
  trackerCount: number;
  stalledCount: number;
  attentionFlags: AttentionFlag[];
}

export async function fetchEnrichedProjects(params: {
  query: string;
  startDate?: string;
  endDate?: string;
  status: string;
  size: string;
  attention: string;
  currentPage: number;
  userEmail: string;
}): Promise<EnrichedProject[]> {
  const baseProjects = await fetchFilteredProjects({
    query: params.query,
    startDate: params.startDate,
    endDate: params.endDate,
    status: params.status,
    size: params.size,
    currentPage: params.currentPage,
    userEmail: params.userEmail,
  });

  if (baseProjects.length === 0) return [];

  const projectIds = baseProjects.map((p) => p.id);
  const placeholders = projectIds.map((_, i) => `@p${i + 1}`).join(", ");

  const { rows: checklistRows } = await safeQuery<any>(
    `SELECT projectId, status, version, lastModified FROM Checklist WHERE projectId IN (${placeholders})`,
    projectIds,
  );

  const checklistByProject = new Map<string, any>();
  for (const row of checklistRows) {
    checklistByProject.set(row.projectId.toString(), row);
  }

  // Latest tracker per project with stalled count
  const { rows: trackerRows } = await safeQuery<any>(
    `SELECT t.projectId,
            t.overallPercent,
            t.submittedAt,
            (SELECT COUNT(*) FROM TrackerSubmissionItem i WHERE i.submissionId = t.id AND i.status = 'STALLED') AS stalledItems
     FROM TrackerSubmission t
     WHERE t.projectId IN (${placeholders})
       AND t.submittedAt = (SELECT MAX(t2.submittedAt) FROM TrackerSubmission t2 WHERE t2.projectId = t.projectId)`,
    projectIds,
  );

  const trackerByProject = new Map<string, any>();
  for (const row of trackerRows) {
    trackerByProject.set(row.projectId.toString(), row);
  }

  const { rows: countRows } = await safeQuery<any>(
    `SELECT projectId, COUNT(*) AS cnt FROM TrackerSubmission WHERE projectId IN (${placeholders}) GROUP BY projectId`,
    projectIds,
  );

  const countByProject = new Map<string, number>();
  for (const row of countRows) {
    countByProject.set(row.projectId.toString(), Number(row.cnt));
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const enriched: any = baseProjects.map((p) => {
    const cl = checklistByProject.get(p.id);
    const tr = trackerByProject.get(p.id);
    const trackerCount = countByProject.get(p.id) ?? 0;
    const stalledCount = tr ? Number(tr.stalledItems) : 0;
    const latestTrackerPercent = tr ? Number(tr.overallPercent) : null;
    const latestTrackerDate = tr ? tr.submittedAt?.toISOString() : null;

    const flags: any = [];
    if (p.status === "PENDING") flags.push("pending_init");
    if (cl?.status === "DraftReview") flags.push("needs_draft_review");
    if (cl?.status === "WeightsReview") flags.push("needs_weights_review");
    if (tr && new Date(tr.submittedAt) > sevenDaysAgo)
      flags.push("new_tracker");
    if (stalledCount > 0) flags.push("stalled_items");
    if (
      latestTrackerPercent !== null &&
      latestTrackerPercent >= 80 &&
      latestTrackerPercent < 100
    ) {
      flags.push("near_complete");
    }

    return {
      id: p.id,
      name: p.name,
      sector: p.sector,
      status: p.status,
      budget: p.budget,
      progress: p.progress,
      size: p.size,
      createdAt: p.createdAt,
      lat: p.lat ?? null,
      long: p.long ?? null,
      subCounty: (p as any).subCounty ?? null,
      ward: (p as any).ward ?? null,
      categoryId: (p as any).categoryId ?? null,
      checklistStatus: cl?.status ?? null,
      checklistVersion: cl?.version ?? null,
      checklistLastModified: cl?.lastModified?.toISOString() ?? null,
      latestTrackerPercent,
      latestTrackerDate,
      trackerCount,
      stalledCount,
      attentionFlags: flags,
    };
  });

  if (params.attention && params.attention !== "ALL") {
    return enriched.filter((p: any) =>
      p.attentionFlags.includes(params.attention as AttentionFlag),
    );
  }

  return enriched;
}
