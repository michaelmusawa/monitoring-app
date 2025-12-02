// lib/types/types.ts
export enum ChecklistStatus {
  Draft = "draft",
  DraftReview = "draft_review",
  WeightsAssignment = "weight_assignment",
  WeightsReview = "weights_review",
  Approved = "approved",
  Completed = "completed",
}

export interface ChecklistItem {
  parameterId: string;
  weight?: number;
  taskEdit?: { reason: string; oldValue?: string };
  weightEdit?: { reason: string; oldValue?: string };
}
