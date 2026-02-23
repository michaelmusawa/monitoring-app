// Types used across the mock data files in /lib/data
// Add or expand types here when the data shape grows.

export type Nullable<T> = T | null | undefined;

export type ProjectSector = string; // free-form sector strings (e.g. "IDE", "ICT", "Mobility & Works")

export type ProjectSize = "SMALL" | "MEDIUM" | "LARGE" | "MEGA" | string;

export type ProjectStatus =
  | "PENDING"
  | "ACTIVE"
  | "COMPLETE"
  | "CANCELLED"
  | "ON_HOLD"
  | string;

export interface Project {
  id: string;
  name: string;
  sector: ProjectSector;
  // budget in fixtures may be a number or a string (e.g. 'TBD' or '0')
  budget: Nullable<number | string>;
  size?: ProjectSize;
  status: ProjectStatus;
  prerequisites?: string[];
  description?: string;
  // progress may occasionally be represented as a string in fixtures
  progress?: number | string; // 0-100 or string
  members?: string[]; // array of user ids
  // lat/long may be numbers or strings (or null) in fixtures
  lat?: Nullable<number | string>;
  long?: Nullable<number | string>;
  subCounty?: Nullable<string>;
  ward?: Nullable<string>;
  [key: string]: unknown; // allow other legacy fields
}

/**
 * Checklist parameter definition (catalog of parameters)
 */
export interface ChecklistParam {
  id: string;
  label: string;
  category?: string;
  description?: string;
  [key: string]: unknown;
}

/**
 * Re-usable small shapes
 */
export interface FileAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  // some fixtures contain file sizes as strings (e.g. \"12KB\") — accept both
  fileSize?: number | string;
  [key: string]: unknown;
}

export interface EditRecord {
  reason: string;
  oldValue?: string | number | boolean | null;
  evidence?:
    | string
    | string[]
    | FileAttachment
    | FileAttachment[]
    | (FileAttachment | string)[]
    | null;
  date?: string;
  [key: string]: unknown;
}

/**
 * Checklist related types
 */
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
  // weights in fixtures may be numbers or string representations
  weight?: number | string;
  // used in some checklist items when someone edits a task/parameter
  taskEdit?: {
    reason: string;
    oldValue?: string | number | boolean | null;
    [key: string]: unknown;
  };
  // used in some checklist items when a weight was modified
  weightEdit?: {
    reason: string;
    oldValue?: number | string | null;
    [key: string]: unknown;
  };
  // generic catch-all for fields that appear in the data (e.g. comments)
  [key: string]: unknown;
}

export interface ChecklistReview {
  reviewerId: string;
  reason?: string | null;
  date?: string | null;
  [key: string]: unknown;
}

export interface Checklist {
  id: string;
  projectId: string;
  // some data files use string statuses; prefer typed enum but allow string
  status: ChecklistStatus | string;
  items: ChecklistItem[];
  draftReview?: ChecklistReview;
  weightAssignment?: ChecklistReview;
  // there are cases where a checklist has additional nested objects for weight edits, assignments, etc.
  [key: string]: unknown;
}

/**
 * Tracker related types (submissions)
 */
export type TaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETE"
  | "BLOCKED"
  | string;

export interface TrackerTask {
  parameterId: string;
  status?: TaskStatus | null;
  // percentComplete may be a number or string in some fixtures
  percentComplete?: number | string | null; // 0-100 or string
  challenges?: string | string[] | null;
  recommendations?: string | string[] | null;
  // attachments in fixtures can be full objects or simple string references/URLs
  attachments?: (FileAttachment | string)[];
  // edits may be represented as a single object, an array of edit objects,
  // or simple string reference(s) in fixtures
  edits?: EditRecord | EditRecord[] | string | string[] | null;
  // other legacy fields sometimes present in the dataset
  [key: string]: unknown;
}

export interface TrackerReview {
  reviewerId: string;
  reason?: string | null;
  date?: string | null;
  [key: string]: unknown;
}

export interface Tracker {
  id: string;
  projectId: string;
  checklistId?: string;
  submittedBy?: string;
  submittedAt?: string;
  // overallProgress may be numeric or a string in fixtures
  overallProgress?: number | string;
  reviewed?: TrackerReview;
  tasks: TrackerTask[];
  // allow additional fields present in the mock data
  [key: string]: unknown;
}

export interface CommentReply {
  id: string;
  commentId?: string;
  userId: string;
  content: string;
  createdAt?: string;
  // attachments may be objects or string references in fixtures
  attachments?: (FileAttachment | string)[];
  [key: string]: unknown;
}

export interface PublicComment {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  createdAt?: string;
  updatedAt?: string | null;
  // attachments may be objects or string references in fixtures
  attachments?: (FileAttachment | string)[];
  // replies may be objects or simple string identifiers in fixtures
  replies?: (CommentReply | string)[];
  [key: string]: unknown;
}

/**
 * Convenience exports for arrays used in data files
 */
export type Projects = Project[];
export type ChecklistParams = ChecklistParam[];
export type Checklists = Checklist[];
export type Trackers = Tracker[];
export type Users = User[];
export type PublicComments = PublicComment[];
