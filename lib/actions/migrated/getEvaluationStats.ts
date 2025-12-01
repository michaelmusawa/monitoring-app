//monitoring-app/lib/actions/migrated/getEvaluationStats.ts
"use server";

import {
  dummyEvaluationStats,
  dummyCompletedStages,
} from "@/lib/data/migrated/migratedEvaluationStats";

/**
 * Fetches dummy evaluation statistics for a project.
 * In a real implementation, this would query a database.
 */
export async function getEvaluationStats() {
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 30));
  return dummyEvaluationStats;
}

/**
 * Fetches the list of completed evaluation stages (dummy data).
 */
export async function getCompletedStages() {
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 20));
  return dummyCompletedStages;
}
