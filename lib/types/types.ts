// File: data/models.ts

export interface ProjectMember {
  user: {
    id: string;
    email: string;
  };
}

export interface CIDPProject {
  id: string;
  code: string;
  name: string;
  sector: string;
  budget: number;

  // Status now includes broader states used across the app
  status:
    | "PLANNING"
    | "ACTIVE"
    | "ON_HOLD"
    | "COMPLETED"
    | "STALLED"
    | "CANCELLED";

  // Replaced `priority` with `size` derived from budget:
  // - SMALL: budget < 500_000
  // - MEDIUM: 500_000 <= budget <= 1_000_000
  // - MEGA: budget > 1_000_000
  size: "SMALL" | "MEDIUM" | "MEGA";

  prerequisites: string[];
  initialized: boolean;
  description: string;
  progress: number;
  members: ProjectMember[];

  // Make stage optional and more flexible (string) so pages that rely on various
  // stage naming won't fail type checks. Specific code can still narrow the type.
  stage?: string;

  // NEW — map support and optional locality information (projects are within Nairobi)
  lat: number | null;
  lng: number | null;

  // Optional administrative/location metadata used by some UI components
  subCounty?: string;
  ward?: string;

  // Optional activity/update history for the project (lightweight shape)
  updates?: { title: string; date: string }[];
}

export interface ChecklistParam {
  id: string;
  label: string;
  category: string;
}

export interface ChecklistItem {
  parameterId: string;
  weight: number;
}

/**
 * Strongly-typed checklist status enum shared across the codebase.
 * Using an enum helps ensure all checklist handling code uses a consistent set
 * of statuses instead of arbitrary strings.
 */
export enum ChecklistStatus {
  Draft = "Draft",
  DraftReview = "DraftReview",
  WeightsAssignment = "WeightsAssignment",
  WeightsReview = "WeightsReview",
  Approved = "Approved",
}

export interface Checklist {
  id: string;
  projectId: string;
  status: ChecklistStatus;
  items: ChecklistItem[];
}

export interface TrackerItem {
  parameterId: string;
  status: string;
  percentComplete: number;
  challenges: string;
  recommendations: string;
  evidence: string[];
}

export interface Tracker {
  id: string;
  projectId: string;
  title: string;
  submittedBy: string;
  submittedAt: string;
  overallPercent: number;
  items: TrackerItem[];
}

export interface PublicComment {
  id: string;
  projectId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
}
