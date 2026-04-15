import { Checklist } from "../types/checklistTypes";

export const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "COMPLETE", label: "Completed" },
  { value: "STALLED", label: "Stalled" },
] as const;

export const SIZE_OPTIONS = [
  { value: "ALL", label: "All Sizes" },
  { value: "SMALL", label: "Small" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LARGE", label: "Large" },
  { value: "MEGA", label: "Mega" },
] as const;

// Function to get checklist status for a project
export const getProjectChecklistStatus = (
  projectId: string,
  checklists: Checklist[],
): string | null => {
  const checklist = checklists.find((c) => c.projectId === projectId);
  return checklist?.status || null;
};

// Function to check if a project needs review (has draftReview or weightAssignment in checklist)
export const projectNeedsReview = (
  projectId: string,
  checklists: any,
): boolean => {
  const checklist = checklists.find((c: any) => c.projectId === projectId);
  if (!checklist) return false;

  // Projects in draft_review or weight_review status need review
  if (
    checklist.status === "draft_review" ||
    checklist.status === "weight_review"
  ) {
    return true;
  }

  // OR projects that have draftReview or weightAssignment objects
  if (checklist.draftReview || checklist.weightAssignment) {
    return true;
  }

  return false;
};

// Function to get the type of review needed
export const getReviewType = (checklist: any): string => {
  if (checklist.status === "draft_review") return "Draft Review";
  if (checklist.status === "weight_review") return "Weights Review";
  if (checklist.draftReview) return "Draft Review";
  if (checklist.weightAssignment) return "Weights Review";
  return "Review";
};
