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
  { id: "cid-1", label: "Material Availability", category: "Logistics" },
  { id: "cid-2", label: "Workforce Adequacy", category: "HR" },
  { id: "cid-3", label: "Adherence to Timeline", category: "Schedule" },
  { id: "cid-4", label: "Financial Utilization", category: "Finance" },
  { id: "cid-5", label: "Quality Assurance", category: "Quality" },
];

// ---------------------------------------------------------------
// CHECKLISTS
// ---------------------------------------------------------------
export const dummyChecklists: Checklist[] = [
  {
    projectId: "p1",
    id: "cl-1",
    status: "Finalized",
    items: [
      { parameterId: "cid-1", weight: 3 },
      { parameterId: "cid-3", weight: 2 },
      { parameterId: "cid-5", weight: 5 },
    ],
  },
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
