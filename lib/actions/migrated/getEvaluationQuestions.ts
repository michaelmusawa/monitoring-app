//monitoring-app/lib/actions/migrated/getEvaluationQuestions.ts
"use server";

import { dummyEvaluationQuestions } from "@/lib/data/migrated/migratedEvaluationQuestions";

/**
 * Server action to fetch dummy evaluation questions.
 * Optionally, you can filter by category or projectId in the future.
 */
export async function getEvaluationQuestions() {
  // Simulate async delay for realism
  await new Promise((resolve) => setTimeout(resolve, 30));
  return dummyEvaluationQuestions;
}
