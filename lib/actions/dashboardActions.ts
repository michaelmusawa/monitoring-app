"use server";

import { recentActivity, taskSummary } from "../data/data";

export async function getRecentActivity() {
  return recentActivity;
}

export async function getTaskSummary() {
  return taskSummary;
}

// lib/actions/actions.ts
export async function getDashboardStats() {
  return {
    statusCounts: [
      { name: "Active", value: 12 },
      { name: "Planning", value: 6 },
      { name: "Completed", value: 9 },
    ],
    priorityCounts: [
      { name: "High", value: 8 },
      { name: "Medium", value: 11 },
      { name: "Low", value: 3 },
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
    ],
  };
}
