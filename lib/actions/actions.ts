"use server";

import {
  cidpProjects,
  standardChecklistParams,
  dummyChecklists,
  dummyTrackers,
  publicComments,
  recentActivity,
  taskSummary,
} from "../data/data";
import { ChecklistStatus } from "@/lib/types/types";

// ======================================================
// PROJECTS
// ======================================================

export async function getProjects() {
  await new Promise((r) => setTimeout(r, 50));
  return cidpProjects;
}

export async function getProjectById(id: string) {
  await new Promise((r) => setTimeout(r, 30));
  return cidpProjects.find((p) => p.id === id) ?? null;
}

// ======================================================
// CHECKLISTS
// ======================================================

export async function getChecklistForProject(projectId: string) {
  await new Promise((r) => setTimeout(r, 30));

  const checklist = dummyChecklists.find((c) => c.projectId === projectId);

  return (
    checklist ?? {
      projectId,
      id: "cl-new",
      status: ChecklistStatus.Draft,
      items: [],
    }
  );
}

export async function getStandardParams() {
  await new Promise((r) => setTimeout(r, 20));
  return standardChecklistParams;
}

// Save checklist (dummy prototype)
export async function saveChecklist(projectId: string, payload: any) {
  await new Promise((r) => setTimeout(r, 40));

  // In real DB this would persist.
  return { ok: true, id: payload?.id ?? "cl-saved" };
}

// ======================================================
// TRACKERS
// ======================================================

export async function getTrackers(projectId: string) {
  await new Promise((r) => setTimeout(r, 20));
  return dummyTrackers.filter((t) => t.projectId === projectId);
}

export async function saveTracker(projectId: string, payload: any) {
  await new Promise((r) => setTimeout(r, 40));
  return { ok: true, id: payload?.id ?? "t-saved" };
}

// ======================================================
// PUBLIC COMMENTS
// ======================================================

export async function getPublicComments(projectId: string) {
  await new Promise((r) => setTimeout(r, 20));
  return publicComments.filter((c) => c.projectId === projectId);
}

export async function postPublicComment(projectId: string, comment: any) {
  await new Promise((r) => setTimeout(r, 40));
  return { ok: true, id: "c-new" };
}

// ======================================================
// DASHBOARD DATA
// ======================================================

export async function getRecentActivity() {
  await new Promise((r) => setTimeout(r, 20));
  return recentActivity;
}

export async function getTaskSummary() {
  await new Promise((r) => setTimeout(r, 20));
  return taskSummary;
}

export async function getDashboardStats() {
  await new Promise((r) => setTimeout(r, 50));

  return {
    statusCounts: [
      {
        name: "Planning",
        value: cidpProjects.filter((p) => p.status === "PLANNING").length,
      },
      {
        name: "Active",
        value: cidpProjects.filter((p) => p.status === "ACTIVE").length,
      },
      {
        name: "On Hold",
        value: cidpProjects.filter((p) => p.status === "ON_HOLD").length,
      },
      {
        name: "Completed",
        value: cidpProjects.filter((p) => p.status === "COMPLETED").length,
      },
    ],

    priorityCounts: [
      {
        name: "High",
        value: cidpProjects.filter((p) => p.priority === "HIGH").length,
      },
      {
        name: "Medium",
        value: cidpProjects.filter((p) => p.priority === "MEDIUM").length,
      },
      {
        name: "Low",
        value: cidpProjects.filter((p) => p.priority === "LOW").length,
      },
    ],

    monthlyProgress: [
      { month: "Jan", value: 20 },
      { month: "Feb", value: 34 },
      { month: "Mar", value: 56 },
      { month: "Apr", value: 72 },
    ],

    bestPractices: [
      "Weekly stakeholder updates",
      "Track blockers early",
      "Document all implementation steps",
      "Share transparent progress reports",
      "Use field photos for evidence validation",
    ],
  };
}
