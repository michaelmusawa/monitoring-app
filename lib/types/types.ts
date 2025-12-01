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
  status: "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED";
  priority: "HIGH" | "MEDIUM" | "LOW";
  prerequisites: string[];
  initialized: boolean;
  description: string;
  progress: number;
  members: ProjectMember[];
  stage: "initialization" | "tracking" | "completed";

  // NEW — map support
  lat: number | null;
  lng: number | null;
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
