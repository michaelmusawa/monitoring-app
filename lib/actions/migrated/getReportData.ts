//monitoring-app/lib/actions/migrated/getReportData.ts
"use server";

import {
  dummyReportSummary,
  dummyTrackerProgress,
  dummyTimeline,
  dummyAttachments,
  ReportSummary,
  TrackerProgress,
  TimelineEvent,
  Attachment,
} from "@/lib/data/migrated/migratedReportData";

/**
 * Fetches dummy report summary data.
 */
export async function getReportSummary(): Promise<ReportSummary> {
  // Simulate async operation
  await new Promise((r) => setTimeout(r, 20));
  return dummyReportSummary;
}

/**
 * Fetches dummy tracker progress data.
 */
export async function getTrackerProgress(): Promise<TrackerProgress[]> {
  await new Promise((r) => setTimeout(r, 20));
  return dummyTrackerProgress;
}

/**
 * Fetches dummy timeline events.
 */
export async function getTimeline(): Promise<TimelineEvent[]> {
  await new Promise((r) => setTimeout(r, 20));
  return dummyTimeline;
}

/**
 * Fetches dummy report attachments.
 */
export async function getAttachments(): Promise<Attachment[]> {
  await new Promise((r) => setTimeout(r, 20));
  return dummyAttachments;
}
