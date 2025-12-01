//monitoring-app/lib/actions/migrated/getProjectTasks.ts
"use server";

import {
  dummyProjectTasks,
  ProjectTask,
} from "@/lib/data/migrated/migratedTasks";

/**
 * Fetches dummy project tasks.
 * Optionally filter by projectId if your data supports it in the future.
 */
export async function getProjectTasks(/* projectId?: string */): Promise<
  ProjectTask[]
> {
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 30));
  // If you want to filter by projectId, add logic here.
  return dummyProjectTasks;
}
