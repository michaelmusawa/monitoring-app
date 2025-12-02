"use server";

// lib/actions/actions.ts
// lib/actions/dashboardActions.ts

export async function getDashboardStats() {
  // Return dummy stats structure
  return {
    statusCounts: [
      { name: "Active", value: 12, color: "#10b981" },
      { name: "Planning", value: 6, color: "#f59e0b" },
      { name: "Completed", value: 9, color: "#3b82f6" },
    ],
    priorityCounts: [
      { name: "High", value: 8, color: "#ef4444" },
      { name: "Medium", value: 11, color: "#f59e0b" },
      { name: "Low", value: 3, color: "#10b981" },
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
