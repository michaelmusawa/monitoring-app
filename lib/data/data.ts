// File: data/data.ts

import {
  ChecklistParam,
  Checklist,
  PublicComment,
  Tracker,
  CIDPProject,
} from "../types/types";

export const recentActivity = [
  {
    id: "a1",
    project: "Water Pipeline Upgrade",
    message: "Tracker updated",
    date: "2025-01-10",
  },
  {
    id: "a2",
    project: "Health Facility Renovation",
    message: "Evaluation submitted",
    date: "2025-01-09",
  },
];

export const taskSummary = [
  { id: "t1", title: "Projects Ongoing", count: 12 },
  { id: "t2", title: "Projects Completed", count: 7 },
];

// --------------------------------------------------------------------------
// MAIN APPLICATION DATA
// --------------------------------------------------------------------------

export const cidpProjects: CIDPProject[] = [
  {
    id: "p1",
    code: "CIDP-001",
    name: "Road Upgrade Phase 1",
    sector: "Transport",
    budget: 5000000,
    status: "PLANNING",
    priority: "HIGH",
    prerequisites: ["Survey Report", "Environmental Assessment"],
    initialized: true,
    description: "Upgrade of the main arterial road.",
    progress: 35,
    members: [
      {
        user: {
          id: "u1",
          email: "lead@example.com",
        },
      },
    ],
    stage: "tracking",

    // NEW → map coordinates
    lat: -1.2865,
    lng: 36.8172,
    subCounty: "East SubCounty",
    ward: "Ward A",
    updates: [{ title: "Permit submitted", date: "2025-10-10" }],
  },
  {
    id: "p2",
    code: "CIDP-002",
    name: "Health Center Renovation",
    sector: "Health",
    budget: 12000000,
    status: "ACTIVE",
    priority: "HIGH",
    prerequisites: ["Building Permit", "Architectural Drawings"],
    initialized: false,
    description: "Renovation of county health centre.",
    progress: 10,
    members: [],
    stage: "initialization",

    lat: -1.29,
    lng: 36.82,
    subCounty: "West SubCounty",
    ward: "Ward B",
    updates: [{ title: "Permit submitted", date: "2025-10-10" }],
  },
  {
    id: "p3",
    code: "CIDP-003",
    name: "Water Supply Upgrade",
    sector: "Water",
    budget: 8000000,
    status: "ON_HOLD",
    priority: "MEDIUM",
    prerequisites: ["Supplier Contracts", "Environmental Permit"],
    initialized: false,
    description: "Upgrade of water pipelines.",
    progress: 0,
    members: [],
    stage: "initialization",

    lat: -1.28,
    lng: 36.83,
    subCounty: "North SubCounty",
    ward: "Ward C",
    updates: [{ title: "Permit submitted", date: "2025-10-10" }],
  },
  {
    id: "p4",
    code: "CIDP-004",
    name: "ICT Learning Center",
    sector: "ICT",
    budget: 9000000,
    status: "COMPLETED",
    priority: "LOW",
    prerequisites: ["Land Ownership Proof"],
    initialized: true,
    description: "Construct ICT center for youth training.",
    progress: 100,
    members: [
      {
        user: {
          id: "u2",
          email: "teacher@example.com",
        },
      },
    ],
    stage: "completed",

    lat: -1.27,
    lng: 36.815,
    subCounty: "South SubCounty",
    ward: "Ward F",
    updates: [{ title: "Permit submitted", date: "2025-10-10" }],
  },
];

// ---------------------------------------------------------------
// STANDARD CHECKLIST PARAMETERS
// ---------------------------------------------------------------
export const standardChecklistParams: ChecklistParam[] = [
  { id: "1.1", label: "Contract Signing & Insurances", category: "Mobilization" },
  { id: "1.2", label: "Site Possession", category: "Mobilization" },
  { id: "1.3", label: "Signboard, Site Office, and Hoarding", category: "Mobilization" },
  { id: "1.4", label: "Receipt of Drawings", category: "Mobilization" },
  { id: "2.1", label: "Excavation and Earthworks", category: "Perimeter Wall" },
  { id: "2.2", label: "Formwork", category: "Perimeter Wall" },
  { id: "2.3", label: "Substructure Reinforcement", category: "Perimeter Wall" },
  { id: "6.1", label: "Cleaning", category: "Inspection and Handing Over" },
  { id: "6.2", label: "Snagging", category: "Inspection and Handing Over" },
  { id: "6.3", label: "Handover", category: "Inspection and Handing Over" },
];

// ---------------------------------------------------------------
// CHECKLISTS
// ---------------------------------------------------------------
export const dummyChecklists: Checklist[] = [
  {
    projectId: "p1",
    id: "cl-1",
    status: "Approved",
    items: [
      { parameterId: "1.1", weight: 2 },
      { parameterId: "1.2", weight: 2 },
      { parameterId: "2.2", weight: 3 },
      { parameterId: "6.3", weight: 3 },
    ],
  },
  {
    projectId: "p2",
    id: "cl-2",
    status: "DraftReview",
    items: [
      { parameterId: "1.1", weight: 0 },
      { parameterId: "1.3", weight: 0 },
      { parameterId: "2.1", weight: 0 },
    ],
    draftReviewComments: {
      reviewer: "me1@example.com", accepted: false, reason: "Add Handing Over steps"
    }
  },
  {
    projectId: "p3",
    id: "cl-3",
    status: "WeightsAssignment",
    items: [
      { parameterId: "1.2", weight: 0 },
      { parameterId: "2.1", weight: 0 },
      { parameterId: "2.3", weight: 0 },
      { parameterId: "6.1", weight: 0 },
    ],
  },
  {
    projectId: "p4",
    id: "cl-4",
    status: "WeightsReview",
    items: [
      { parameterId: "1.1", weight: 3 },
      { parameterId: "1.4", weight: 2 },
      { parameterId: "6.1", weight: 5 },
    ],
    weightsReviewComments: {
      reviewer: "me2@example.com", accepted: true, reason: "Mobilization a bit high"
    }
  }
];

// ---------------------------------------------------------------
// TRACKERS
// ---------------------------------------------------------------
export const dummyTrackers: Tracker[] = [
  {
    id: "t-1",
    projectId: "p1",
    title: "Tracker Nov 01",
    submittedBy: "tech1",
    submittedAt: "2025-11-01T09:00:00.000Z",
    overallPercent: 58.5,
    items: [
      {
        parameterId: "cid-1",
        status: "ONGOING",
        percentComplete: 60,
        challenges: "Shortage of gravel",
        recommendations: "Increase supplier deliveries",
        evidence: [],
      },
      {
        parameterId: "cid-3",
        status: "ONGOING",
        percentComplete: 40,
        challenges: "Delay in approvals",
        recommendations: "Fast-track approvals",
        evidence: [],
      },
      {
        parameterId: "cid-5",
        status: "ONGOING",
        percentComplete: 80,
        challenges: "",
        recommendations: "",
        evidence: [],
      },
    ],
  },
  {
    id: "t-2",
    projectId: "p1",
    title: "Tracker Oct 15",
    submittedBy: "tech2",
    submittedAt: "2025-10-15T09:00:00.000Z",
    overallPercent: 45.0,
    items: [
      {
        parameterId: "cid-1",
        status: "ONGOING",
        percentComplete: 40,
        challenges: "",
        recommendations: "",
        evidence: [],
      },
      {
        parameterId: "cid-3",
        status: "ONGOING",
        percentComplete: 50,
        challenges: "",
        recommendations: "",
        evidence: [],
      },
    ],
  },
];

// ---------------------------------------------------------------
// PUBLIC COMMENTS
// ---------------------------------------------------------------
export const publicComments: PublicComment[] = [
  {
    id: "c1",
    projectId: "p1",
    name: "Alice",
    email: "alice@example.com",
    phone: "+254700000001",
    message: "Good progress!",
    createdAt: "2025-11-02",
  },
];
