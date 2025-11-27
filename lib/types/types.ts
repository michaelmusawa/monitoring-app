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

export interface Checklist {
  id: string;
  projectId: string;
  status: string;
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
