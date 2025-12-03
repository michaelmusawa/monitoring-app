import {
  Project,
  ChecklistParam,
  Checklist,
  Tracker,
  User,
  PublicComment,
} from "../types/types";

export const projects: Project[] = [
  // ------------------------------------------------------------
  // 1. E-Payment System
  // ------------------------------------------------------------
  {
    id: "proj-1",
    name: "E-Payment System",
    sector: "IDE",
    budget: null, // Finance to provide
    status: "PENDING",
    prerequisites: ["Requirements from Finance", "Process Mapping"],
    description:
      "Automation of County payment services through a unified digital platform.",
    progress: 10,
    members: ["user-ict-1", "user-finance-1"],
    lat: -1.286389,
    long: 36.817223,
    subCounty: "Nairobi Central",
    ward: "City Hall",
  },

  // ------------------------------------------------------------
  // 2. ICRMS - Integrated City Revenue Management System
  // ------------------------------------------------------------
  {
    id: "proj-2",
    name: "ICRMS – Integrated City Revenue Management System",
    sector: "IDE",
    budget: 847229896.67,
    status: "ACTIVE",
    prerequisites: [
      "Litigation Resolution",
      "Contract Validations",
      "Data Migration Plan",
    ],
    description:
      "Enterprise-wide automation of County revenue processes, including billing, receipting, compliance monitoring, and analytics.",
    progress: 65,
    members: ["user-ict-2", "user-revenue-1"],
    lat: -1.286389,
    long: 36.817223,
    subCounty: "Nairobi Central",
    ward: "City Hall",
  },

  // ------------------------------------------------------------
  // 3. Email System (Enterprise Email Migration)
  // ------------------------------------------------------------
  {
    id: "proj-3",
    name: "County Enterprise Email System",
    sector: "ICT",
    budget: null, // Open Source deployed internally
    status: "ACTIVE",
    prerequisites: ["Anti-Spam Strategy", "Security Audit"],
    description:
      "Deployment of a secure enterprise email platform to all County staff; project stopped due to spamming vulnerabilities.",
    progress: 70,
    members: ["user-ict-3"],
    lat: -1.286389,
    long: 36.817223,
    subCounty: "Nairobi Central",
    ward: "City Hall",
  },

  // ------------------------------------------------------------
  // 4. Smartnet, Server & Storage Infrastructure
  // ------------------------------------------------------------
  {
    id: "proj-4",
    name: "Smartnet, Server & Storage Infrastructure",
    sector: "IDE",
    budget: 80000000,
    status: "COMPLETE",
    prerequisites: ["Vendor Contracting", "Data Center Readiness"],
    description:
      "Implementation of secure device management (Smartnet), server virtualization, backup systems, and enterprise storage for County systems.",
    progress: 100,
    members: ["user-ict-4", "user-datacenter-1"],
    lat: -1.286389,
    long: 36.817223,
    subCounty: "Nairobi Central",
    ward: "City Hall",
  },

  // ------------------------------------------------------------
  // 5. Web Portal
  // ------------------------------------------------------------
  {
    id: "proj-5",
    name: "County Web Portal",
    sector: "IDE",
    budget: null, // In-house development
    size: "MEDIUM",
    status: "ACTIVE",
    prerequisites: ["Content Strategy", "UX/UI Design Approval"],
    description:
      "Development and maintenance of the official County web portal for information dissemination, services, and public engagement.",
    progress: 55,
    members: ["user-ict-5", "user-communications-1"],
    lat: -1.286389,
    long: 36.817223,
    subCounty: "Nairobi Central",
    ward: "City Hall Headquarters",
  },

  // ------------------------------------------------------------
  // 6. LAIFOMS Maintenance (Legacy System)
  // ------------------------------------------------------------
  {
    id: "proj-6",
    name: "LAIFOMS Legacy System Maintenance",
    sector: "IDE",
    budget: null, // Operational expenditure
    status: "COMPLETE",
    prerequisites: ["Nairobi Pay Rollout"],
    description:
      "Maintenance and performance optimization of LAIFOMS as a legacy system prior to decommissioning and replacement with Nairobi Pay.",
    progress: 100,
    members: ["user-ict-6"],
    lat: -1.286389,
    long: 36.817223,
    subCounty: "Nairobi Central",
    ward: "City Hall",
  },

  {
    id: "proj-dandora-stadium",
    name: "Dandora Stadium",
    sector: "Mobility & Works",
    budget: 0,
    size: "MEGA",
    status: "PENDING",
    prerequisites: [
      "Structural Assessment",
      "Contractor Procurement",
      "Budget Allocation",
    ],
    description: "Completion and rehabilitation of Dandora Stadium.",
    progress: 0,
    members: [],
    lat: -1.245, // approx. lat from open-map data :contentReference[oaicite:1]{index=1}
    long: 36.90579, // approx. long from same source :contentReference[oaicite:2]{index=2}
    subCounty: "Embakasi North", // Dandora belongs to Embakasi North sub-county :contentReference[oaicite:3]{index=3}
    ward: "Dandora Area I", // one of the Dandora wards under Embakasi North :contentReference[oaicite:4]{index=4}
  },

  {
    id: "proj-mwiki-stadium",
    name: "Mwiki Stadium",
    sector: "Mobility & Works",
    budget: 0,
    size: "LARGE",
    status: "PENDING",
    prerequisites: ["Site Survey", "EIA Report", "Budget Allocation"],
    description: "Establishment and upgrade of Mwiki Stadium facilities.",
    progress: 0,
    members: [],
    lat: null, // approximate lat/long not found
    long: null,
    subCounty: "Kasarani", // Mwiki area lies within Kasarani sub-county :contentReference[oaicite:5]{index=5}
    ward: "Mwiki", // ward name matches the neighbourhood per official listing :contentReference[oaicite:6]{index=6}
  },

  {
    id: "proj-woodley-stadium",
    name: "Woodley Stadium",
    sector: "Mobility & Works",
    budget: 0,
    size: "MEGA",
    status: "PENDING",
    prerequisites: [
      "Architectural Design",
      "Environmental Assessment",
      "Budget Allocation",
    ],
    description: "Rehabilitation and modernization of Woodley Stadium.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: "Kibra", // Woodley estate is in Kibra sub-county per Nairobi ward map :contentReference[oaicite:7]{index=7}
    ward: "Woodley/Kenyatta Golf Course", // official ward name in Kibra :contentReference[oaicite:8]{index=8}
  },

  // For other grounds/stadia where exact location not confirmed, lat/long left null:
  {
    id: "proj-bp-grounds",
    name: "BP Grounds",
    sector: "Mobility & Works",
    budget: 0,
    size: "LARGE",
    status: "PENDING",
    prerequisites: ["Site Survey", "Design Approval", "Budget Allocation"],
    description: "Upgrade and rehabilitation of BP community sports grounds.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: null,
    ward: null,
  },
  {
    id: "proj-calvary-grounds",
    name: "Calvary Grounds",
    sector: "Mobility & Works",
    budget: 0,
    size: "LARGE",
    status: "PENDING",
    prerequisites: ["Site Survey", "Design Approval", "Budget Allocation"],
    description:
      "Development and improvement of Calvary Grounds sports facilities.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: null,
    ward: null,
  },
  {
    id: "proj-camp-toyoyo",
    name: "Camp Toyoyo Stadium",
    sector: "Mobility & Works",
    budget: 0,
    size: "LARGE",
    status: "PENDING",
    prerequisites: [
      "Site Survey",
      "Architectural Design",
      "Environmental Impact Assessment",
    ],
    description:
      "Upgrading Camp Toyoyo Stadium to improve community sports infrastructure.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: null,
    ward: null,
  },
  {
    id: "proj-hamza-grounds",
    name: "Hamza Grounds",
    sector: "Mobility & Works",
    budget: 0,
    size: "LARGE",
    status: "PENDING",
    prerequisites: ["Site Survey", "Design Approval", "Budget Allocation"],
    description: "Upgrade and maintenance of Hamza recreational grounds.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: "Makadara", // Hamza is listed under Makadara sub-county wards. :contentReference[oaicite:9]{index=9}
    ward: "Maringo/Hamza", // ward name as per official ward directory. :contentReference[oaicite:10]{index=10}
  },
  {
    id: "proj-huruma-grounds",
    name: "Huruma Grounds",
    sector: "Mobility & Works",
    budget: 0,
    size: "LARGE",
    status: "PENDING",
    prerequisites: [
      "Site Survey",
      "Community Consultation",
      "Budget Allocation",
    ],
    description: "Rehabilitation of Huruma public sports grounds.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: "Mathare", // Huruma is part of Mathare sub-county per ward mapping. :contentReference[oaicite:11]{index=11}
    ward: "Huruma", // official ward name as per listing. :contentReference[oaicite:12]{index=12}
  },
  {
    id: "proj-joe-kadenge",
    name: "Joe Kadenge Stadium",
    sector: "Mobility & Works",
    budget: 0,
    size: "MEGA",
    status: "PENDING",
    prerequisites: [
      "Architectural Design",
      "Contract Signing",
      "Environmental Assessment",
    ],
    description:
      "Major upgrade of Joe Kadenge Stadium to international standards.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: null,
    ward: null,
  },
  {
    id: "proj-kahawa-west",
    name: "Kahawa West Grounds",
    sector: "Mobility & Works",
    budget: 0,
    size: "LARGE",
    status: "PENDING",
    prerequisites: ["Boundary Mapping", "Design Approval"],
    description:
      "Development and rehabilitation of Kahawa West public sports grounds.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: "Roysambu", // Kahawa West is under Roysambu sub-county ward list :contentReference[oaicite:13]{index=13}
    ward: "Kahawa West", // ward as per official record. :contentReference[oaicite:14]{index=14}
  },
  {
    id: "proj-kihumbuini",
    name: "Kihumbuini Stadium",
    sector: "Mobility & Works",
    budget: 0,
    size: "LARGE",
    status: "PENDING",
    prerequisites: ["Site Survey", "Structural Assessment"],
    description:
      "Upgrade of Kihumbuini Stadium to support community sporting events.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: null,
    ward: null,
  },
  {
    id: "proj-mukuru-grounds",
    name: "Mukuru Grounds",
    sector: "Mobility & Works",
    budget: 0,
    size: "LARGE",
    status: "PENDING",
    prerequisites: ["Community Engagement", "Design Approval"],
    description:
      "Rehabilitation of Mukuru community sports and recreational grounds.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: null,
    ward: null,
  },
  {
    id: "proj-pandpieri",
    name: "Pandpieri Grounds",
    sector: "Mobility & Works",
    budget: 0,
    size: "LARGE",
    status: "PENDING",
    prerequisites: ["Boundary Mapping", "Design Approval"],
    description: "Improvement of Pandpieri public recreational grounds.",
    progress: 0,
    members: [],
    lat: null,
    long: null,
    subCounty: null,
    ward: null,
  },
];

export const checklistParamsMobility: ChecklistParam[] = [
  // -------------------- Mobilization --------------------
  {
    id: "mob-1",
    label: "Contract Signing & Insurances",
    category: "Mobilization",
  },
  { id: "mob-2", label: "Site Possession", category: "Mobilization" },
  {
    id: "mob-3",
    label: "Signboard, Site Office, and Hoarding",
    category: "Mobilization",
  },
  { id: "mob-4", label: "Receipt of Drawings", category: "Mobilization" },

  // -------------------- Perimeter Wall --------------------
  { id: "per-1", label: "Perimeter Wall", category: "Perimeter Wall" },
  {
    id: "per-2",
    label: "Excavation and Earthworks",
    category: "Perimeter Wall",
  },
  { id: "per-3", label: "Formwork", category: "Perimeter Wall" },
  {
    id: "per-4",
    label: "Substructure Reinforcement",
    category: "Perimeter Wall",
  },
  { id: "per-5", label: "Strip Footing", category: "Perimeter Wall" },
  { id: "per-6", label: "Column Bases & Columns", category: "Perimeter Wall" },
  { id: "per-7", label: "Column Reinforcement", category: "Perimeter Wall" },
  { id: "per-8", label: "Superstructure Formwork", category: "Perimeter Wall" },
  { id: "per-9", label: "Superstructure Columns", category: "Perimeter Wall" },
  { id: "per-10", label: "Superstructure Walling", category: "Perimeter Wall" },
  {
    id: "per-11",
    label: "Installation of Coping and Razor Wire",
    category: "Perimeter Wall",
  },
  {
    id: "per-12",
    label: "Main & Pedestrian MS Gates Fitting",
    category: "Perimeter Wall",
  },
  { id: "per-13", label: "Finishes", category: "Perimeter Wall" },

  // -------------------- Playground Area --------------------
  { id: "pla-1", label: "Receipt of Drawings", category: "Playground Area" },
  { id: "pla-2", label: "Playing Area Measuring", category: "Playground Area" },
  {
    id: "pla-3",
    label: "Excavation and Earthworks",
    category: "Playground Area",
  },
  { id: "pla-4", label: "Stormwater Drainage", category: "Playground Area" },
  { id: "pla-5", label: "Artificial Turf", category: "Playground Area" },
  {
    id: "pla-6",
    label: "Warmup Area Grass Planting",
    category: "Playground Area",
  },
  {
    id: "pla-7",
    label: "Removal of Existing Turf Material",
    category: "Playground Area",
  },
  {
    id: "pla-8",
    label: "Backfilling and Compaction of the Pitch",
    category: "Playground Area",
  },
  {
    id: "pla-9",
    label: "Placing of French Drains",
    category: "Playground Area",
  },
  { id: "pla-10", label: "Leveling the Pitch", category: "Playground Area" },
  {
    id: "pla-11",
    label: "Construction of Side Drains",
    category: "Playground Area",
  },
  {
    id: "pla-12",
    label: "Placement of New Turf Material",
    category: "Playground Area",
  },
  {
    id: "pla-13",
    label: "Goals and Referee Benches",
    category: "Playground Area",
  },
  {
    id: "pla-14",
    label: "Procurement of the Turf Material",
    category: "Playground Area",
  },
  { id: "pla-15", label: "Chainlink Fence", category: "Playground Area" },

  // -------------------- Phase 4 - Fence Net --------------------
  {
    id: "fen-1",
    label: "Installation of a Fence Net above the Perimeter Wall",
    category: "Phase 4 - Fence Net",
  },

  // -------------------- Sitting Terraces & VIP Area --------------------
  {
    id: "vip-1",
    label: "Receipt of Drawings",
    category: "Sitting Terraces & VIP Area",
  },
  {
    id: "vip-2",
    label: "Excavation and Earthworks",
    category: "Sitting Terraces & VIP Area",
  },
  {
    id: "vip-3",
    label: "Renovations to Existing Sitting Terrace & VIP Area",
    category: "Sitting Terraces & VIP Area",
  },
  { id: "vip-4", label: "Formwork", category: "Sitting Terraces & VIP Area" },
  {
    id: "vip-5",
    label: "Reinforcement",
    category: "Sitting Terraces & VIP Area",
  },
  {
    id: "vip-6",
    label: "Renovations to Existing Roofing",
    category: "Sitting Terraces & VIP Area",
  },
  {
    id: "vip-7",
    label: "Strip Footing",
    category: "Sitting Terraces & VIP Area",
  },
  { id: "vip-8", label: "Walling", category: "Sitting Terraces & VIP Area" },
  {
    id: "vip-9",
    label: "Superstructure Walling",
    category: "Sitting Terraces & VIP Area",
  },
  {
    id: "vip-10",
    label: "Roof Structure and Covering",
    category: "Sitting Terraces & VIP Area",
  },
  { id: "vip-11", label: "Finishes", category: "Sitting Terraces & VIP Area" },
  {
    id: "vip-12",
    label: "Doors and Windows",
    category: "Sitting Terraces & VIP Area",
  },
  {
    id: "vip-13",
    label: "Fixtures and Fittings",
    category: "Sitting Terraces & VIP Area",
  },
  {
    id: "vip-14",
    label: "Electrical Installations",
    category: "Sitting Terraces & VIP Area",
  },
  {
    id: "vip-15",
    label: "Mechanical Installations",
    category: "Sitting Terraces & VIP Area",
  },
  {
    id: "vip-16",
    label: "Advertising Board Installation",
    category: "Sitting Terraces & VIP Area",
  },

  // -------------------- Changing Room / Toilet --------------------
  {
    id: "crt-1",
    label: "Drawings & Location",
    category: "Changing Room/ Toilet",
  },
  {
    id: "crt-2",
    label: "Excavation and Earthworks",
    category: "Changing Room/ Toilet",
  },
  { id: "crt-3", label: "Reinforcement", category: "Changing Room/ Toilet" },
  { id: "crt-4", label: "Formwork", category: "Changing Room/ Toilet" },
  { id: "crt-5", label: "Strip Footing", category: "Changing Room/ Toilet" },
  {
    id: "crt-6",
    label: "Column Bases & Columns",
    category: "Changing Room/ Toilet",
  },
  { id: "crt-7", label: "FDN Walling", category: "Changing Room/ Toilet" },
  { id: "crt-8", label: "Ground Slab", category: "Changing Room/ Toilet" },
  {
    id: "crt-9",
    label: "External and Internal Walling",
    category: "Changing Room/ Toilet",
  },
  { id: "crt-10", label: "Ring Beam", category: "Changing Room/ Toilet" },
  {
    id: "crt-11",
    label: "Roof Structure and Covering",
    category: "Changing Room/ Toilet",
  },
  {
    id: "crt-12",
    label: "Doors and Windows",
    category: "Changing Room/ Toilet",
  },
  { id: "crt-13", label: "Finishes", category: "Changing Room/ Toilet" },
  {
    id: "crt-14",
    label: "Plumbing and Drainage",
    category: "Changing Room/ Toilet",
  },
  {
    id: "crt-15",
    label: "Internal and External Painting Works",
    category: "Changing Room/ Toilet",
  },
  {
    id: "crt-16",
    label: "4,000 Litres Water Tanks Delivery & Installation",
    category: "Changing Room/ Toilet",
  },
  {
    id: "crt-17",
    label: "Electrical Installations",
    category: "Changing Room/ Toilet",
  },

  // -------------------- Inspection and Handing Over --------------------
  { id: "han-1", label: "Cleaning", category: "Inspection and Handing Over" },
  { id: "han-2", label: "Snagging", category: "Inspection and Handing Over" },
  { id: "han-3", label: "Handover", category: "Inspection and Handing Over" },
];

export const checklistParamsIDE: ChecklistParam[] = [
  // -------------------- Initiation & Mobilization --------------------
  {
    id: "init-1",
    label: "Project Kickoff",
    category: "Initiation & Mobilization",
  },
  {
    id: "init-2",
    label: "Stakeholder Identification",
    category: "Initiation & Mobilization",
  },
  {
    id: "init-3",
    label: "Project Charter Approval",
    category: "Initiation & Mobilization",
  },
  {
    id: "init-4",
    label: "Budget Confirmation",
    category: "Initiation & Mobilization",
  },
  {
    id: "init-5",
    label: "Assign Project Team",
    category: "Initiation & Mobilization",
  },

  // -------------------- Requirements & Analysis --------------------
  {
    id: "req-1",
    label: "Requirements Gathering",
    category: "Requirements & Analysis",
  },
  {
    id: "req-2",
    label: "Needs Assessment",
    category: "Requirements & Analysis",
  },
  {
    id: "req-3",
    label: "Workflow Analysis",
    category: "Requirements & Analysis",
  },
  {
    id: "req-4",
    label: "Risk Assessment",
    category: "Requirements & Analysis",
  },

  // -------------------- Design & Architecture --------------------
  {
    id: "des-1",
    label: "Solution Architecture Design",
    category: "Design & Architecture",
  },
  {
    id: "des-2",
    label: "Security Architecture",
    category: "Design & Architecture",
  },
  { id: "des-3", label: "Database Design", category: "Design & Architecture" },
  {
    id: "des-4",
    label: "API Specifications",
    category: "Design & Architecture",
  },

  // -------------------- Procurement --------------------
  { id: "pro-1", label: "Hardware Procurement", category: "Procurement" },
  { id: "pro-2", label: "Software Licensing", category: "Procurement" },
  { id: "pro-3", label: "SLA Agreements", category: "Procurement" },
  { id: "pro-4", label: "Vendor Contracting", category: "Procurement" },

  // -------------------- Infrastructure Setup --------------------
  {
    id: "inf-1",
    label: "Server Installation",
    category: "Infrastructure Setup",
  },
  {
    id: "inf-2",
    label: "Network Configuration",
    category: "Infrastructure Setup",
  },
  { id: "inf-3", label: "Firewall Setup", category: "Infrastructure Setup" },
  {
    id: "inf-4",
    label: "DNS and Domain Setup",
    category: "Infrastructure Setup",
  },
  {
    id: "inf-5",
    label: "Storage Provisioning",
    category: "Infrastructure Setup",
  },

  // -------------------- Development/Configuration --------------------
  {
    id: "dev-1",
    label: "System Installation",
    category: "System Development/ Configuration",
  },
  {
    id: "dev-2",
    label: "Module Configuration",
    category: "System Development/ Configuration",
  },
  {
    id: "dev-3",
    label: "UI/UX Implementation",
    category: "System Development/ Configuration",
  },
  {
    id: "dev-4",
    label: "CMS Development",
    category: "System Development/ Configuration",
  },

  // -------------------- Integration & Data Migration --------------------
  {
    id: "int-1",
    label: "API Integrations",
    category: "Integration & Data Migration",
  },
  {
    id: "int-2",
    label: "Data Cleaning",
    category: "Integration & Data Migration",
  },
  {
    id: "int-3",
    label: "Data Migration",
    category: "Integration & Data Migration",
  },
  {
    id: "int-4",
    label: "Legacy System Sync",
    category: "Integration & Data Migration",
  },

  // -------------------- Testing --------------------
  { id: "test-1", label: "Unit Testing", category: "Testing & QA" },
  { id: "test-2", label: "Integration Testing", category: "Testing & QA" },
  { id: "test-3", label: "User Acceptance Testing", category: "Testing & QA" },
  { id: "test-4", label: "Security Testing", category: "Testing & QA" },

  // -------------------- Training --------------------
  {
    id: "train-1",
    label: "User Training",
    category: "Training & Change Management",
  },
  {
    id: "train-2",
    label: "System Documentation",
    category: "Training & Change Management",
  },

  // -------------------- Deployment --------------------
  {
    id: "dep-1",
    label: "Production Deployment",
    category: "Deployment / Go-Live",
  },
  { id: "dep-2", label: "Go-Live Support", category: "Deployment / Go-Live" },

  // -------------------- Support --------------------
  {
    id: "sup-1",
    label: "Helpdesk Setup",
    category: "Post-Implementation Support",
  },
  {
    id: "sup-2",
    label: "System Optimization",
    category: "Post-Implementation Support",
  },

  // -------------------- Handover --------------------
  {
    id: "han-1",
    label: "Final Report",
    category: "Monitoring, Reporting & Handover",
  },
  {
    id: "han-2",
    label: "Audit Compliance",
    category: "Monitoring, Reporting & Handover",
  },
  {
    id: "han-3",
    label: "Project Closure",
    category: "Monitoring, Reporting & Handover",
  },
];

export const checklists: Checklist[] = [
  {
    id: "cl-1",
    projectId: "proj-2",
    status: "draft",
    items: [
      { parameterId: "init-1" },
      { parameterId: "init-2" },
      { parameterId: "init-3" },
      { parameterId: "init-4" },

      { parameterId: "req-1" },
      { parameterId: "req-2" },
      { parameterId: "req-3" },
      { parameterId: "req-4" },

      { parameterId: "des-1" },
      { parameterId: "des-2" },
      { parameterId: "des-3" },
      { parameterId: "des-4" },

      { parameterId: "pro-1" },
      { parameterId: "pro-2" },
      { parameterId: "pro-3" },
      { parameterId: "pro-4" },

      { parameterId: "inf-1" },
      { parameterId: "inf-2" },
      { parameterId: "inf-3" },
      { parameterId: "inf-4" },

      { parameterId: "dev-1" },
      { parameterId: "dev-2" },
      { parameterId: "dev-3" },
      { parameterId: "dev-4" },

      { parameterId: "int-1" },
      { parameterId: "int-2" },
      { parameterId: "int-3" },
      { parameterId: "int-4" },

      { parameterId: "test-1" },
      { parameterId: "test-2" },
      { parameterId: "test-3" },
      { parameterId: "test-4" },

      { parameterId: "train-1" },
      { parameterId: "train-2" },
      { parameterId: "train-3" },
      { parameterId: "train-4" },

      { parameterId: "dep-1" },
      { parameterId: "dep-2" },
      { parameterId: "dep-3" },
      { parameterId: "dep-4" },

      { parameterId: "sup-1" },
      { parameterId: "sup-2" },
      { parameterId: "sup-3" },
      { parameterId: "sup-4" },

      { parameterId: "han-1" },
      { parameterId: "han-2" },
      { parameterId: "han-3" },
      { parameterId: "han-4" },
    ],
  },

  {
    id: "cl-2",
    projectId: "proj-3",
    status: "draft",
    items: [
      { parameterId: "init-1" },
      { parameterId: "init-2" },
      { parameterId: "init-3" },
      { parameterId: "init-4" },

      { parameterId: "req-1" },
      { parameterId: "req-2" },
      { parameterId: "req-3" },
      { parameterId: "req-4" },

      { parameterId: "des-1" },
      { parameterId: "des-2" },
      { parameterId: "des-3" },
      { parameterId: "des-4" },

      { parameterId: "pro-1" },
      { parameterId: "pro-2" },
      { parameterId: "pro-3" },
      { parameterId: "pro-4" },

      { parameterId: "inf-1" },
      { parameterId: "inf-2" },
      { parameterId: "inf-3" },
      { parameterId: "inf-4" },

      { parameterId: "dev-1" },
      { parameterId: "dev-2" },
      { parameterId: "dev-3" },
      { parameterId: "dev-4" },

      { parameterId: "test-1" },
      { parameterId: "test-2" },
      { parameterId: "test-3" },
      { parameterId: "test-4" },

      { parameterId: "train-1" },
      { parameterId: "train-2" },
      { parameterId: "train-3" },
      { parameterId: "train-4" },

      { parameterId: "dep-1" },
      { parameterId: "dep-2" },
      { parameterId: "dep-3" },
      { parameterId: "dep-4" },

      { parameterId: "sup-1" },
      { parameterId: "sup-2" },
      { parameterId: "sup-3" },
      { parameterId: "sup-4" },

      { parameterId: "han-1" },
      { parameterId: "han-2" },
      { parameterId: "han-3" },
      {
        parameterId: "han-4",
        taskEdit: { reason: "It should not miss in this kind of project" },
      },
    ],
    draftReview: {
      reviewerId: "user-10",
      reason: "Mobilization is missing Site Possession",
      date: "2025-01-15",
    },
  },

  {
    id: "cl-3",
    projectId: "proj-4",
    status: "weight_assignment",
    items: [
      { parameterId: "init-1", weight: 0.008 },
      { parameterId: "init-2", weight: 0.012 },
      { parameterId: "init-3", weight: 0.006 },
      { parameterId: "init-4", weight: 0.009 },

      { parameterId: "req-1", weight: 0.015 },
      {
        parameterId: "req-2",
        weight: 0.018,
        weigthEdit: { reason: "Should carry more weight", oldValue: "0.016" },
      },
      {
        parameterId: "req-3",
        weight: 0.011,
        weightEdit: { reason: "Should carry more weight", oldValue: "0.013" },
      },
      { parameterId: "req-4", weight: 0.014 },

      { parameterId: "des-1", weight: 0.022 },
      { parameterId: "des-2", weight: 0.025 },
      { parameterId: "des-3", weight: 0.019 },
      { parameterId: "des-4", weight: 0.016 },

      { parameterId: "pro-1", weight: 0.031 },
      { parameterId: "pro-2", weight: 0.028 },
      { parameterId: "pro-3", weight: 0.034 },
      { parameterId: "pro-4", weight: 0.026 },

      { parameterId: "inf-1", weight: 0.042 },
      { parameterId: "inf-2", weight: 0.037 },
      { parameterId: "inf-3", weight: 0.039 },
      { parameterId: "inf-4", weight: 0.045 },

      { parameterId: "dev-1", weight: 0.051 },
      { parameterId: "dev-2", weight: 0.048 },
      { parameterId: "dev-3", weight: 0.053 },
      { parameterId: "dev-4", weight: 0.046 },

      { parameterId: "int-1", weight: 0.049 },
      { parameterId: "int-2", weight: 0.052 },
      { parameterId: "int-3", weight: 0.044 },
      { parameterId: "int-4", weight: 0.047 },

      { parameterId: "test-1", weight: 0.038 },
      { parameterId: "test-2", weight: 0.041 },
      { parameterId: "test-3", weight: 0.035 },
      { parameterId: "test-4", weight: 0.043 },

      { parameterId: "train-1", weight: 0.027 },
      { parameterId: "train-2", weight: 0.032 },
      { parameterId: "train-3", weight: 0.024 },
      { parameterId: "train-4", weight: 0.029 },

      { parameterId: "dep-1", weight: 0.017 },
      { parameterId: "dep-2", weight: 0.021 },
      { parameterId: "dep-3", weight: 0.014 },
      { parameterId: "dep-4", weight: 0.019 },

      { parameterId: "sup-1", weight: 0.011 },
      { parameterId: "sup-2", weight: 0.013 },
      { parameterId: "sup-3", weight: 0.008 },
      { parameterId: "sup-4", weight: 0.01 },

      { parameterId: "han-1", weight: 0.007 },
      { parameterId: "han-2", weight: 0.009 },
      { parameterId: "han-3", weight: 0.005 },
      { parameterId: "han-4", weight: 0.006 },
    ],
    weightAssignment: {
      reviewerId: "user-5",
      reason: "Adjusted some weights that have wrong weights",
      date: "2025-01-10",
    },
  },
  {
    id: "cl-4",
    projectId: "proj-5",
    status: "tracker",
    items: [
      { parameterId: "init-1", weight: 0.007 },
      { parameterId: "init-2", weight: 0.01 },
      { parameterId: "init-3", weight: 0.005 },
      { parameterId: "init-4", weight: 0.008 },

      { parameterId: "req-1", weight: 0.013 },
      { parameterId: "req-2", weight: 0.016 },
      { parameterId: "req-3", weight: 0.012 },
      { parameterId: "req-4", weight: 0.009 },

      { parameterId: "des-1", weight: 0.024 },
      { parameterId: "des-2", weight: 0.019 },
      { parameterId: "des-3", weight: 0.021 },
      { parameterId: "des-4", weight: 0.017 },

      { parameterId: "pro-1", weight: 0.033 },
      { parameterId: "pro-2", weight: 0.029 },
      { parameterId: "pro-3", weight: 0.036 },
      { parameterId: "pro-4", weight: 0.027 },

      { parameterId: "inf-1", weight: 0.045 },
      { parameterId: "inf-2", weight: 0.039 },
      { parameterId: "inf-3", weight: 0.041 },
      { parameterId: "inf-4", weight: 0.038 },

      { parameterId: "dev-1", weight: 0.052 },
      { parameterId: "dev-2", weight: 0.049 },
      { parameterId: "dev-3", weight: 0.055 },
      { parameterId: "dev-4", weight: 0.048 },

      { parameterId: "int-1", weight: 0.047 },
      { parameterId: "int-2", weight: 0.051 },
      { parameterId: "int-3", weight: 0.044 },
      { parameterId: "int-4", weight: 0.049 },

      { parameterId: "test-1", weight: 0.039 },
      { parameterId: "test-2", weight: 0.043 },
      { parameterId: "test-3", weight: 0.036 },
      { parameterId: "test-4", weight: 0.041 },

      { parameterId: "train-1", weight: 0.028 },
      { parameterId: "train-2", weight: 0.031 },
      { parameterId: "train-3", weight: 0.025 },
      { parameterId: "train-4", weight: 0.023 },

      { parameterId: "dep-1", weight: 0.016 },
      { parameterId: "dep-2", weight: 0.019 },
      { parameterId: "dep-3", weight: 0.013 },
      { parameterId: "dep-4", weight: 0.018 },

      { parameterId: "sup-1", weight: 0.01 },
      { parameterId: "sup-2", weight: 0.014 },
      { parameterId: "sup-3", weight: 0.009 },
      { parameterId: "sup-4", weight: 0.011 },

      { parameterId: "han-1", weight: 0.006 },
      { parameterId: "han-2", weight: 0.008 },
      { parameterId: "han-3", weight: 0.004 },
      { parameterId: "han-4", weight: 0.007 },
    ],
  },

  // For Mobility and Woks projects
  //
  //
  {
    id: "cl-bp-grounds",
    projectId: "proj-bp-grounds",
    status: "draft",
    items: [
      { parameterId: "mob-1" },
      { parameterId: "mob-2" },
      { parameterId: "mob-4" },

      { parameterId: "per-2" },
      { parameterId: "per-3" },
      { parameterId: "per-8" },
      { parameterId: "per-9" },
      {
        parameterId: "per-10",
        taskEdit: {
          reason: "This should be prioritized for stadiums",
          oldValue: "per-11",
        },
      },
      { parameterId: "per-13" },

      { parameterId: "pla-3" },
      { parameterId: "pla-5" },
      { parameterId: "pla-8" },

      { parameterId: "vip-1" },
      { parameterId: "vip-8" },
      { parameterId: "vip-10" },

      { parameterId: "crt-1" },
      { parameterId: "crt-14" },

      { parameterId: "fen-1" },

      { parameterId: "han-1" },
      { parameterId: "han-2" },
      { parameterId: "han-3" },
    ],
    draftReview: {
      reviewerId: "user-15",
      reason: "Missing mobility parameter mob-3 for accessibility compliance",
      date: "2024-11-20",
    },
  },

  {
    id: "cl-calvary-grounds",
    projectId: "proj-calvary-grounds",
    status: "draft",
    items: [
      { parameterId: "mob-1" },
      { parameterId: "mob-2" },
      {
        parameterId: "mob-4",
        taskEdit: {
          reason: "Should include electric vehicle charging",
          oldValue: "mob-3",
        },
      },

      { parameterId: "per-2" },
      { parameterId: "per-3" },
      { parameterId: "per-8" },
      { parameterId: "per-9" },
      { parameterId: "per-10" },
      { parameterId: "per-13" },

      { parameterId: "pla-3" },
      { parameterId: "pla-5" },
      { parameterId: "pla-8" },

      { parameterId: "vip-1" },
      { parameterId: "vip-8" },
      { parameterId: "vip-10" },

      { parameterId: "crt-1" },
      { parameterId: "crt-14" },

      { parameterId: "fen-1" },

      { parameterId: "han-1" },
      { parameterId: "han-2" },
      { parameterId: "han-3" },
    ],
  },

  {
    id: "cl-camp-toyoyo",
    projectId: "proj-camp-toyoyo",
    status: "weight_assignment",
    items: [
      { parameterId: "mob-1", weight: 0.025 },
      {
        parameterId: "mob-2",
        weight: 0.03,
        weightEdit: {
          reason: "Increased due to high traffic area",
          oldValue: "0.022",
        },
      },
      { parameterId: "mob-4", weight: 0.028 },

      { parameterId: "per-2", weight: 0.035 },
      { parameterId: "per-3", weight: 0.032 },
      { parameterId: "per-8", weight: 0.04 },
      { parameterId: "per-9", weight: 0.038 },
      {
        parameterId: "per-10",
        weight: 0.042,
        weightEdit: {
          reason: "Critical for stadium capacity",
          oldValue: "0.035",
        },
      },
      { parameterId: "per-13", weight: 0.037 },

      { parameterId: "pla-3", weight: 0.048 },
      { parameterId: "pla-5", weight: 0.045 },
      { parameterId: "pla-8", weight: 0.05 },

      { parameterId: "vip-1", weight: 0.06 },
      { parameterId: "vip-8", weight: 0.055 },
      { parameterId: "vip-10", weight: 0.058 },

      { parameterId: "crt-1", weight: 0.042 },
      { parameterId: "crt-14", weight: 0.045 },

      { parameterId: "fen-1", weight: 0.03 },

      { parameterId: "han-1", weight: 0.028 },
      { parameterId: "han-2", weight: 0.025 },
      { parameterId: "han-3", weight: 0.022 },
    ],
    weightAssignment: {
      reviewerId: "user-8",
      reason: "Adjusted weights based on stadium capacity and traffic analysis",
      date: "2024-12-05",
    },
  },

  {
    id: "cl-dandora-stadium",
    projectId: "proj-dandora-stadium",
    status: "weight_assignment",
    items: [
      { parameterId: "mob-1", weight: 0.028 },
      { parameterId: "mob-2", weight: 0.032 },
      { parameterId: "mob-4", weight: 0.026 },

      { parameterId: "per-2", weight: 0.038 },
      { parameterId: "per-3", weight: 0.034 },
      { parameterId: "per-8", weight: 0.043 },
      { parameterId: "per-9", weight: 0.04 },
      { parameterId: "per-10", weight: 0.045 },
      { parameterId: "per-13", weight: 0.039 },

      { parameterId: "pla-3", weight: 0.052 },
      { parameterId: "pla-5", weight: 0.048 },
      { parameterId: "pla-8", weight: 0.055 },

      { parameterId: "vip-1", weight: 0.065 },
      { parameterId: "vip-8", weight: 0.06 },
      { parameterId: "vip-10", weight: 0.062 },

      { parameterId: "crt-1", weight: 0.046 },
      { parameterId: "crt-14", weight: 0.049 },

      { parameterId: "fen-1", weight: 0.033 },

      { parameterId: "han-1", weight: 0.031 },
      { parameterId: "han-2", weight: 0.027 },
      { parameterId: "han-3", weight: 0.024 },
    ],
    weightAssignment: {
      reviewerId: "user-12",
      reason: "Initial weight assignment for major stadium project",
      date: "2024-11-28",
    },
  },

  {
    id: "cl-hamza-grounds",
    projectId: "proj-hamza-grounds",
    status: "tracker",
    items: [
      { parameterId: "mob-1", weight: 0.03 },
      { parameterId: "mob-2", weight: 0.035 },
      { parameterId: "mob-4", weight: 0.032 },

      { parameterId: "per-2", weight: 0.042 },
      { parameterId: "per-3", weight: 0.038 },
      { parameterId: "per-8", weight: 0.047 },
      { parameterId: "per-9", weight: 0.044 },
      { parameterId: "per-10", weight: 0.049 },
      { parameterId: "per-13", weight: 0.043 },

      { parameterId: "pla-3", weight: 0.057 },
      { parameterId: "pla-5", weight: 0.052 },
      { parameterId: "pla-8", weight: 0.06 },

      { parameterId: "vip-1", weight: 0.072 },
      { parameterId: "vip-8", weight: 0.066 },
      { parameterId: "vip-10", weight: 0.069 },

      { parameterId: "crt-1", weight: 0.051 },
      { parameterId: "crt-14", weight: 0.054 },

      { parameterId: "fen-1", weight: 0.036 },

      { parameterId: "han-1", weight: 0.034 },
      { parameterId: "han-2", weight: 0.03 },
      { parameterId: "han-3", weight: 0.026 },
    ],
  },

  {
    id: "cl-huruma-grounds",
    projectId: "proj-huruma-grounds",
    status: "tracker",
    items: [
      { parameterId: "mob-1", weight: 0.027 },
      { parameterId: "mob-2", weight: 0.031 },
      { parameterId: "mob-4", weight: 0.029 },

      { parameterId: "per-2", weight: 0.04 },
      { parameterId: "per-3", weight: 0.036 },
      { parameterId: "per-8", weight: 0.045 },
      { parameterId: "per-9", weight: 0.042 },
      { parameterId: "per-10", weight: 0.047 },
      { parameterId: "per-13", weight: 0.041 },

      { parameterId: "pla-3", weight: 0.054 },
      { parameterId: "pla-5", weight: 0.05 },
      { parameterId: "pla-8", weight: 0.058 },

      { parameterId: "vip-1", weight: 0.068 },
      { parameterId: "vip-8", weight: 0.063 },
      { parameterId: "vip-10", weight: 0.065 },

      { parameterId: "crt-1", weight: 0.048 },
      { parameterId: "crt-14", weight: 0.051 },

      { parameterId: "fen-1", weight: 0.034 },

      { parameterId: "han-1", weight: 0.032 },
      { parameterId: "han-2", weight: 0.028 },
      { parameterId: "han-3", weight: 0.025 },
    ],
  },

  {
    id: "cl-joe-kadenge",
    projectId: "proj-joe-kadenge",
    status: "draft",
    items: [
      { parameterId: "mob-1" },
      { parameterId: "mob-2" },
      { parameterId: "mob-4" },

      { parameterId: "per-2" },
      { parameterId: "per-3" },
      { parameterId: "per-8" },
      { parameterId: "per-9" },
      { parameterId: "per-10" },
      { parameterId: "per-13" },

      { parameterId: "pla-3" },
      { parameterId: "pla-5" },
      { parameterId: "pla-8" },

      { parameterId: "vip-1" },
      { parameterId: "vip-8" },
      { parameterId: "vip-10" },

      { parameterId: "crt-1" },
      {
        parameterId: "crt-14",
        taskEdit: {
          reason: "Should include both maintenance and upgrade criteria",
          oldValue: "crt-12",
        },
      },

      { parameterId: "fen-1" },

      { parameterId: "han-1" },
      { parameterId: "han-2" },
      { parameterId: "han-3" },
    ],
    draftReview: {
      reviewerId: "user-9",
      reason: "VIP section parameters need expansion for this major stadium",
      date: "2024-12-12",
    },
  },

  {
    id: "cl-kahawa-west",
    projectId: "proj-kahawa-west",
    status: "weight_assignment",
    items: [
      { parameterId: "mob-1", weight: 0.026 },
      { parameterId: "mob-2", weight: 0.031 },
      { parameterId: "mob-4", weight: 0.028 },

      { parameterId: "per-2", weight: 0.037 },
      { parameterId: "per-3", weight: 0.033 },
      { parameterId: "per-8", weight: 0.044 },
      { parameterId: "per-9", weight: 0.041 },
      { parameterId: "per-10", weight: 0.046 },
      { parameterId: "per-13", weight: 0.04 },

      { parameterId: "pla-3", weight: 0.053 },
      { parameterId: "pla-5", weight: 0.049 },
      { parameterId: "pla-8", weight: 0.056 },

      { parameterId: "vip-1", weight: 0.067 },
      { parameterId: "vip-8", weight: 0.061 },
      { parameterId: "vip-10", weight: 0.064 },

      { parameterId: "crt-1", weight: 0.047 },
      { parameterId: "crt-14", weight: 0.05 },

      { parameterId: "fen-1", weight: 0.035 },

      { parameterId: "han-1", weight: 0.033 },
      { parameterId: "han-2", weight: 0.029 },
      { parameterId: "han-3", weight: 0.026 },
    ],
    weightAssignment: {
      reviewerId: "user-7",
      reason: "Weights adjusted after community feedback session",
      date: "2024-12-15",
    },
  },

  {
    id: "cl-kihumbuini",
    projectId: "proj-kihumbuini",
    status: "tracker",
    items: [
      { parameterId: "mob-1", weight: 0.029 },
      { parameterId: "mob-2", weight: 0.034 },
      { parameterId: "mob-4", weight: 0.031 },

      { parameterId: "per-2", weight: 0.043 },
      { parameterId: "per-3", weight: 0.039 },
      { parameterId: "per-8", weight: 0.048 },
      { parameterId: "per-9", weight: 0.045 },
      { parameterId: "per-10", weight: 0.05 },
      { parameterId: "per-13", weight: 0.044 },

      { parameterId: "pla-3", weight: 0.059 },
      { parameterId: "pla-5", weight: 0.054 },
      { parameterId: "pla-8", weight: 0.062 },

      { parameterId: "vip-1", weight: 0.074 },
      { parameterId: "vip-8", weight: 0.068 },
      { parameterId: "vip-10", weight: 0.071 },

      { parameterId: "crt-1", weight: 0.053 },
      { parameterId: "crt-14", weight: 0.056 },

      { parameterId: "fen-1", weight: 0.038 },

      { parameterId: "han-1", weight: 0.036 },
      { parameterId: "han-2", weight: 0.032 },
      { parameterId: "han-3", weight: 0.028 },
    ],
  },

  {
    id: "cl-mukuru-grounds",
    projectId: "proj-mukuru-grounds",
    status: "draft",
    items: [
      { parameterId: "mob-1" },
      { parameterId: "mob-2" },
      { parameterId: "mob-4" },

      { parameterId: "per-2" },
      { parameterId: "per-3" },
      { parameterId: "per-8" },
      { parameterId: "per-9" },
      { parameterId: "per-10" },
      { parameterId: "per-13" },

      { parameterId: "pla-3" },
      { parameterId: "pla-5" },
      { parameterId: "pla-8" },

      { parameterId: "vip-1" },
      { parameterId: "vip-8" },
      { parameterId: "vip-10" },

      { parameterId: "crt-1" },
      { parameterId: "crt-14" },

      { parameterId: "fen-1" },

      { parameterId: "han-1" },
      { parameterId: "han-2" },
      { parameterId: "han-3" },
    ],
  },

  {
    id: "cl-mwiki-stadium",
    projectId: "proj-mwiki-stadium",
    status: "weight_assignment",
    items: [
      { parameterId: "mob-1", weight: 0.024 },
      { parameterId: "mob-2", weight: 0.029 },
      { parameterId: "mob-4", weight: 0.027 },

      { parameterId: "per-2", weight: 0.036 },
      { parameterId: "per-3", weight: 0.032 },
      { parameterId: "per-8", weight: 0.041 },
      { parameterId: "per-9", weight: 0.039 },
      {
        parameterId: "per-10",
        weight: 0.044,
        weightEdit: {
          reason: "Reduced weight after safety audit",
          oldValue: "0.048",
        },
      },
      { parameterId: "per-13", weight: 0.038 },

      { parameterId: "pla-3", weight: 0.051 },
      { parameterId: "pla-5", weight: 0.047 },
      { parameterId: "pla-8", weight: 0.054 },

      { parameterId: "vip-1", weight: 0.064 },
      { parameterId: "vip-8", weight: 0.059 },
      { parameterId: "vip-10", weight: 0.061 },

      { parameterId: "crt-1", weight: 0.045 },
      { parameterId: "crt-14", weight: 0.048 },

      { parameterId: "fen-1", weight: 0.032 },

      { parameterId: "han-1", weight: 0.03 },
      { parameterId: "han-2", weight: 0.027 },
      { parameterId: "han-3", weight: 0.024 },
    ],
    weightAssignment: {
      reviewerId: "user-11",
      reason: "Final weight adjustments before project kickoff",
      date: "2025-01-05",
    },
  },

  {
    id: "cl-pandpieri-grounds",
    projectId: "proj-pandpieri-grounds",
    status: "tracker",
    items: [
      { parameterId: "mob-1", weight: 0.028 },
      { parameterId: "mob-2", weight: 0.033 },
      { parameterId: "mob-4", weight: 0.03 },

      { parameterId: "per-2", weight: 0.041 },
      { parameterId: "per-3", weight: 0.037 },
      { parameterId: "per-8", weight: 0.046 },
      { parameterId: "per-9", weight: 0.043 },
      { parameterId: "per-10", weight: 0.048 },
      { parameterId: "per-13", weight: 0.042 },

      { parameterId: "pla-3", weight: 0.055 },
      { parameterId: "pla-5", weight: 0.051 },
      { parameterId: "pla-8", weight: 0.059 },

      { parameterId: "vip-1", weight: 0.07 },
      { parameterId: "vip-8", weight: 0.065 },
      { parameterId: "vip-10", weight: 0.067 },

      { parameterId: "crt-1", weight: 0.049 },
      { parameterId: "crt-14", weight: 0.052 },

      { parameterId: "fen-1", weight: 0.035 },

      { parameterId: "han-1", weight: 0.033 },
      { parameterId: "han-2", weight: 0.029 },
      { parameterId: "han-3", weight: 0.026 },
    ],
  },

  {
    id: "cl-woodley-stadium",
    projectId: "proj-woodley-stadium",
    status: "draft",
    items: [
      { parameterId: "mob-1" },
      { parameterId: "mob-2" },
      { parameterId: "mob-4" },

      { parameterId: "per-2" },
      { parameterId: "per-3" },
      { parameterId: "per-8" },
      { parameterId: "per-9" },
      { parameterId: "per-10" },
      {
        parameterId: "per-13",
        taskEdit: {
          reason: "Should include provisions for future expansion",
          oldValue: "per-12",
        },
      },

      { parameterId: "pla-3" },
      { parameterId: "pla-5" },
      { parameterId: "pla-8" },

      { parameterId: "vip-1" },
      { parameterId: "vip-8" },
      { parameterId: "vip-10" },

      { parameterId: "crt-1" },
      { parameterId: "crt-14" },

      { parameterId: "fen-1" },

      { parameterId: "han-1" },
      { parameterId: "han-2" },
      { parameterId: "han-3" },
    ],
    draftReview: {
      reviewerId: "user-14",
      reason:
        "Additional parking parameters required for this central location",
      date: "2024-11-25",
    },
  },
];

export const trackers: Tracker[] = [
  // Mobility and works trackers
  {
    id: "trk-hamza-grounds",
    projectId: "proj-hamza-grounds",
    checklistId: "cl-hamza-grounds",
    submittedBy: "user-3",
    submittedAt: "2025-01-25",
    overallProgress: 68,
    reviewed: {
      reviewerId: "user-7",
      reason: "Mobility parameters need more evidence of completion",
      date: "2025-01-28",
    },

    tasks: [
      {
        parameterId: "mob-1",
        status: "completed",
        percentComplete: 100,
        challenges: ["Initial site access issues"],
        recommendations: ["Coordinate with local authorities"],
        attachments: ["site_access_approval.pdf", "site_survey.jpg"],
        edits: {
          reason: "Updated from 85% to 100% after final inspection",
          oldValue: 85,
          evidence: ["final_inspection_report.pdf"],
        },
      },
      {
        parameterId: "mob-2",
        status: "ongoing",
        percentComplete: 75,
        challenges: ["Equipment delivery delays", "Weather conditions"],
        recommendations: [
          "Source local equipment",
          "Schedule indoor work during rains",
        ],
        attachments: ["equipment_delivery_schedule.pdf"],
      },
      {
        parameterId: "mob-4",
        status: "ongoing",
        percentComplete: 80,
        challenges: ["Material procurement"],
        recommendations: ["Fast-track procurement process"],
        attachments: ["procurement_documents.zip"],
      },
      {
        parameterId: "per-2",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["permit_approval.jpg"],
      },
      {
        parameterId: "per-3",
        status: "ongoing",
        percentComplete: 60,
        challenges: ["Environmental compliance documentation"],
        recommendations: ["Hire environmental consultant"],
        attachments: ["environmental_assessment.pdf"],
      },
      {
        parameterId: "per-8",
        status: "stalled",
        percentComplete: 30,
        challenges: ["Funding delays", "Contractor negotiations"],
        recommendations: [
          "Explore alternative funding",
          "Re-negotiate contracts",
        ],
        attachments: ["funding_proposal.pdf", "contract_draft.doc"],
      },
      {
        parameterId: "per-9",
        status: "ongoing",
        percentComplete: 70,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "per-10",
        status: "completed",
        percentComplete: 100,
        challenges: ["Community objections"],
        recommendations: ["Hold community engagement meetings"],
        attachments: ["community_meeting_minutes.pdf", "engagement_photos.jpg"],
      },
      {
        parameterId: "per-13",
        status: "ongoing",
        percentComplete: 50,
        challenges: ["Technical specifications review"],
        recommendations: ["Consult with engineering team"],
        attachments: ["technical_specs.pdf"],
      },
      {
        parameterId: "pla-3",
        status: "ongoing",
        percentComplete: 65,
        challenges: ["Site topography issues"],
        recommendations: ["Additional grading required"],
        attachments: ["topography_map.jpg"],
      },
      {
        parameterId: "pla-5",
        status: "stalled",
        percentComplete: 20,
        challenges: ["Material shortages", "Supplier issues"],
        recommendations: [
          "Find alternative suppliers",
          "Revise material specifications",
        ],
        attachments: ["material_list.xlsx"],
      },
      {
        parameterId: "pla-8",
        status: "ongoing",
        percentComplete: 85,
        challenges: [],
        recommendations: [],
        attachments: ["construction_progress.jpg"],
      },
      {
        parameterId: "vip-1",
        status: "ongoing",
        percentComplete: 90,
        challenges: ["Special material requirements"],
        recommendations: ["Import materials"],
        attachments: ["vip_section_design.pdf"],
      },
      {
        parameterId: "vip-8",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["vip_facilities_photo.jpg"],
      },
      {
        parameterId: "vip-10",
        status: "ongoing",
        percentComplete: 70,
        challenges: ["Electrical work delays"],
        recommendations: ["Hire additional electricians"],
        attachments: ["electrical_plan.pdf"],
      },
      {
        parameterId: "crt-1",
        status: "completed",
        percentComplete: 100,
        challenges: ["Initial design revisions"],
        recommendations: ["Finalize design early"],
        attachments: ["court_design_final.pdf", "construction_site.jpg"],
      },
      {
        parameterId: "crt-14",
        status: "ongoing",
        percentComplete: 55,
        challenges: ["Quality control issues"],
        recommendations: ["Increase supervision"],
        attachments: ["qc_report.pdf"],
      },
      {
        parameterId: "fen-1",
        status: "stalled",
        percentComplete: 10,
        challenges: ["Fencing material not available", "Budget constraints"],
        recommendations: [
          "Source cheaper materials",
          "Request additional funding",
        ],
        attachments: ["fencing_quote.pdf"],
      },
      {
        parameterId: "han-1",
        status: "ongoing",
        percentComplete: 0,
        challenges: ["Not yet started"],
        recommendations: ["Schedule handover planning"],
        attachments: [],
      },
      {
        parameterId: "han-2",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "han-3",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
    ],
  },
  {
    id: "trk-huruma-grounds",
    projectId: "proj-huruma-grounds",
    checklistId: "cl-huruma-grounds",
    submittedBy: "user-4",
    submittedAt: "2025-02-05",
    overallProgress: 72,
    reviewed: {
      reviewerId: "user-8",
      reason: "Progress looks good, but documentation needs improvement",
      date: "2025-02-08",
    },

    tasks: [
      {
        parameterId: "mob-1",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["mobilization_complete.jpg"],
      },
      {
        parameterId: "mob-2",
        status: "ongoing",
        percentComplete: 80,
        challenges: ["Equipment maintenance"],
        recommendations: ["Regular maintenance schedule"],
        attachments: [],
      },
      {
        parameterId: "mob-4",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["equipment_setup.jpg"],
      },
      {
        parameterId: "per-2",
        status: "completed",
        percentComplete: 100,
        challenges: ["Permit processing time"],
        recommendations: ["Start permit applications early"],
        attachments: ["permit_certificate.pdf"],
      },
      {
        parameterId: "per-3",
        status: "ongoing",
        percentComplete: 85,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "per-8",
        status: "ongoing",
        percentComplete: 65,
        challenges: ["Contractor performance issues"],
        recommendations: ["Regular performance reviews"],
        attachments: ["contractor_evaluation.pdf"],
        edits: {
          reason: "Corrected from 70% to 65% after assessment",
          oldValue: 70,
          evidence: ["site_assessment_report.pdf"],
        },
      },
      {
        parameterId: "per-9",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "per-10",
        status: "ongoing",
        percentComplete: 75,
        challenges: ["Safety compliance"],
        recommendations: ["Conduct safety training"],
        attachments: ["safety_manual.pdf"],
      },
      {
        parameterId: "per-13",
        status: "stalled",
        percentComplete: 40,
        challenges: ["Technical difficulties", "Skilled labor shortage"],
        recommendations: ["Train local workers", "Hire specialists"],
        attachments: ["technical_assessment.pdf"],
      },
      {
        parameterId: "pla-3",
        status: "ongoing",
        percentComplete: 90,
        challenges: [],
        recommendations: [],
        attachments: ["planning_document.pdf"],
      },
      {
        parameterId: "pla-5",
        status: "ongoing",
        percentComplete: 70,
        challenges: ["Design changes"],
        recommendations: ["Finalize design decisions"],
        attachments: ["design_revisions.pdf"],
      },
      {
        parameterId: "pla-8",
        status: "completed",
        percentComplete: 100,
        challenges: ["Initial delays"],
        recommendations: ["Better scheduling"],
        attachments: ["planning_complete.jpg"],
      },
      {
        parameterId: "vip-1",
        status: "stalled",
        percentComplete: 25,
        challenges: [
          "VIP requirements not finalized",
          "Budget allocation pending",
        ],
        recommendations: ["Clarify requirements", "Secure funding"],
        attachments: ["vip_requirements.doc"],
      },
      {
        parameterId: "vip-8",
        status: "ongoing",
        percentComplete: 60,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "vip-10",
        status: "ongoing",
        percentComplete: 50,
        challenges: ["Material quality issues"],
        recommendations: ["Source better materials"],
        attachments: ["material_samples.jpg"],
      },
      {
        parameterId: "crt-1",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["court_complete.jpg"],
      },
      {
        parameterId: "crt-14",
        status: "ongoing",
        percentComplete: 80,
        challenges: ["Weather affecting work"],
        recommendations: ["Work during dry periods"],
        attachments: ["weather_log.pdf"],
      },
      {
        parameterId: "fen-1",
        status: "ongoing",
        percentComplete: 95,
        challenges: ["Final section completion"],
        recommendations: ["Complete this week"],
        attachments: ["fencing_progress.jpg"],
      },
      {
        parameterId: "han-1",
        status: "ongoing",
        percentComplete: 30,
        challenges: ["Handover documentation"],
        recommendations: ["Prepare documents early"],
        attachments: ["handover_checklist.pdf"],
      },
      {
        parameterId: "han-2",
        status: "ongoing",
        percentComplete: 10,
        challenges: ["Training schedule not set"],
        recommendations: ["Schedule training sessions"],
        attachments: [],
      },
      {
        parameterId: "han-3",
        status: "ongoing",
        percentComplete: 5,
        challenges: ["Final inspection pending"],
        recommendations: ["Schedule final inspection"],
        attachments: [],
      },
    ],
  },
  {
    id: "trk-kihumbuini",
    projectId: "proj-kihumbuini",
    checklistId: "cl-kihumbuini",
    submittedBy: "user-5",
    submittedAt: "2025-01-30",
    overallProgress: 58,
    reviewed: {
      reviewerId: "user-9",
      reason: "Several critical tasks are stalled, need urgent attention",
      date: "2025-02-02",
    },

    tasks: [
      {
        parameterId: "mob-1",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["site_mobilization.jpg"],
      },
      {
        parameterId: "mob-2",
        status: "stalled",
        percentComplete: 45,
        challenges: ["Major equipment breakdown", "Repair parts unavailable"],
        recommendations: ["Rent alternative equipment", "Order parts urgently"],
        attachments: ["equipment_breakdown_report.pdf", "repair_quote.pdf"],
      },
      {
        parameterId: "mob-4",
        status: "ongoing",
        percentComplete: 70,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "per-2",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["permit_documents.pdf"],
      },
      {
        parameterId: "per-3",
        status: "stalled",
        percentComplete: 35,
        challenges: ["Environmental impact assessment delayed"],
        recommendations: ["Hire external assessors"],
        attachments: ["eia_status.pdf"],
      },
      {
        parameterId: "per-8",
        status: "ongoing",
        percentComplete: 65,
        challenges: ["Contract disputes"],
        recommendations: ["Mediation required"],
        attachments: ["contract_dispute_notice.pdf"],
      },
      {
        parameterId: "per-9",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "per-10",
        status: "ongoing",
        percentComplete: 55,
        challenges: ["Community resistance"],
        recommendations: ["Enhanced community engagement"],
        attachments: ["community_meeting_notes.pdf"],
      },
      {
        parameterId: "per-13",
        status: "stalled",
        percentComplete: 15,
        challenges: ["Technical specifications not approved"],
        recommendations: ["Expedite approval process"],
        attachments: ["specifications_draft.pdf"],
      },
      {
        parameterId: "pla-3",
        status: "ongoing",
        percentComplete: 80,
        challenges: [],
        recommendations: [],
        attachments: ["planning_documents.pdf"],
      },
      {
        parameterId: "pla-5",
        status: "ongoing",
        percentComplete: 75,
        challenges: ["Design modifications"],
        recommendations: ["Finalize design"],
        attachments: ["design_modifications.pdf"],
      },
      {
        parameterId: "pla-8",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["planning_complete_cert.jpg"],
      },
      {
        parameterId: "vip-1",
        status: "stalled",
        percentComplete: 10,
        challenges: ["VIP section funding frozen"],
        recommendations: ["Reallocate funds", "Seek additional funding"],
        attachments: ["budget_report.pdf"],
      },
      {
        parameterId: "vip-8",
        status: "ongoing",
        percentComplete: 40,
        challenges: ["Material delivery delays"],
        recommendations: ["Source locally"],
        attachments: ["delivery_schedule.pdf"],
      },
      {
        parameterId: "vip-10",
        status: "ongoing",
        percentComplete: 60,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "crt-1",
        status: "completed",
        percentComplete: 100,
        challenges: ["Foundation work took longer"],
        recommendations: ["Better foundation planning"],
        attachments: ["court_foundation.jpg", "court_complete.jpg"],
      },
      {
        parameterId: "crt-14",
        status: "ongoing",
        percentComplete: 85,
        challenges: ["Quality control"],
        recommendations: ["Increase inspection frequency"],
        attachments: ["qc_checklist.pdf"],
      },
      {
        parameterId: "fen-1",
        status: "ongoing",
        percentComplete: 90,
        challenges: [],
        recommendations: [],
        attachments: ["fencing_progress_photo.jpg"],
      },
      {
        parameterId: "han-1",
        status: "ongoing",
        percentComplete: 20,
        challenges: ["Handover process not defined"],
        recommendations: ["Define handover procedure"],
        attachments: [],
      },
      {
        parameterId: "han-2",
        status: "ongoing",
        percentComplete: 15,
        challenges: ["Training materials not ready"],
        recommendations: ["Develop training materials"],
        attachments: [],
      },
      {
        parameterId: "han-3",
        status: "ongoing",
        percentComplete: 5,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
    ],
  },
  {
    id: "trk-pandpieri-grounds",
    projectId: "proj-pandpieri-grounds",
    checklistId: "cl-pandpieri-grounds",
    submittedBy: "user-6",
    submittedAt: "2025-02-15",
    overallProgress: 82,
    reviewed: {
      reviewerId: "user-10",
      reason: "Excellent progress, keep up the good work",
      date: "2025-02-18",
    },

    tasks: [
      {
        parameterId: "mob-1",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["mobilization_done.jpg"],
      },
      {
        parameterId: "mob-2",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["equipment_ready.jpg"],
      },
      {
        parameterId: "mob-4",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "per-2",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["all_permits_approved.pdf"],
      },
      {
        parameterId: "per-3",
        status: "completed",
        percentComplete: 100,
        challenges: ["Environmental compliance"],
        recommendations: ["Maintain compliance"],
        attachments: ["environmental_certificate.pdf"],
      },
      {
        parameterId: "per-8",
        status: "ongoing",
        percentComplete: 95,
        challenges: ["Final contractor payments"],
        recommendations: ["Process payments promptly"],
        attachments: ["payment_processing.pdf"],
      },
      {
        parameterId: "per-9",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "per-10",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["safety_certificate.pdf"],
      },
      {
        parameterId: "per-13",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["technical_approval.pdf"],
      },
      {
        parameterId: "pla-3",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["planning_complete.pdf"],
      },
      {
        parameterId: "pla-5",
        status: "ongoing",
        percentComplete: 90,
        challenges: ["Final design touches"],
        recommendations: ["Complete design this week"],
        attachments: ["design_final_draft.pdf"],
        edits: {
          reason: "Increased from 85% to 90% after design review",
          oldValue: 85,
          evidence: ["design_review_meeting.pdf"],
        },
      },
      {
        parameterId: "pla-8",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "vip-1",
        status: "ongoing",
        percentComplete: 85,
        challenges: ["Premium material installation"],
        recommendations: ["Ensure quality installation"],
        attachments: ["vip_section_progress.jpg"],
      },
      {
        parameterId: "vip-8",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["vip_facilities.jpg"],
      },
      {
        parameterId: "vip-10",
        status: "ongoing",
        percentComplete: 75,
        challenges: ["Electrical work ongoing"],
        recommendations: ["Complete electrical work"],
        attachments: ["electrical_work_progress.jpg"],
      },
      {
        parameterId: "crt-1",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["main_court_complete.jpg"],
      },
      {
        parameterId: "crt-14",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["court_quality_certificate.pdf"],
      },
      {
        parameterId: "fen-1",
        status: "ongoing",
        percentComplete: 98,
        challenges: ["Final gate installation"],
        recommendations: ["Install main gates"],
        attachments: ["fencing_almost_complete.jpg"],
      },
      {
        parameterId: "han-1",
        status: "ongoing",
        percentComplete: 70,
        challenges: ["Documentation preparation"],
        recommendations: ["Complete handover documents"],
        attachments: ["handover_document_draft.pdf"],
      },
      {
        parameterId: "han-2",
        status: "ongoing",
        percentComplete: 50,
        challenges: ["Training schedule"],
        recommendations: ["Finalize training dates"],
        attachments: ["training_schedule_draft.pdf"],
      },
      {
        parameterId: "han-3",
        status: "ongoing",
        percentComplete: 40,
        challenges: ["Final inspection planning"],
        recommendations: ["Schedule final inspection"],
        attachments: ["inspection_checklist.pdf"],
      },
    ],
  },

  // IDE trackers
  //

  {
    id: "trk-ide-1",
    projectId: "proj-5",
    checklistId: "cl-4",
    submittedBy: "user-8",
    submittedAt: "2025-02-10",
    overallProgress: 65,
    reviewed: {
      reviewerId: "user-12",
      reason:
        "Development phase progressing well but testing phase needs acceleration",
      date: "2025-02-15",
    },
    tasks: [
      {
        parameterId: "init-1",
        status: "completed",
        percentComplete: 100,
        challenges: ["Stakeholder availability"],
        recommendations: ["Schedule meetings in advance"],
        attachments: ["kickoff_meeting_minutes.pdf"],
        edits: {
          reason: "Updated to 100% after final documentation submitted",
          oldValue: 95,
          evidence: ["project_charter_final.pdf"],
        },
      },
      {
        parameterId: "init-2",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["stakeholder_register.xlsx"],
      },
      {
        parameterId: "init-3",
        status: "completed",
        percentComplete: 100,
        challenges: ["Charter revisions required"],
        recommendations: ["Include risk management section"],
        attachments: ["project_charter_approved.pdf"],
      },
      {
        parameterId: "init-4",
        status: "completed",
        percentComplete: 100,
        challenges: ["Budget approval delays"],
        recommendations: ["Streamline approval process"],
        attachments: ["budget_approval_document.pdf"],
      },
      {
        parameterId: "req-1",
        status: "completed",
        percentComplete: 100,
        challenges: ["Changing requirements"],
        recommendations: ["Implement change control process"],
        attachments: ["requirements_document_v2.pdf"],
      },
      {
        parameterId: "req-2",
        status: "completed",
        percentComplete: 100,
        challenges: ["User interviews scheduling"],
        recommendations: ["Use online survey tools"],
        attachments: ["needs_assessment_report.pdf"],
      },
      {
        parameterId: "req-3",
        status: "completed",
        percentComplete: 100,
        challenges: ["Complex existing workflows"],
        recommendations: ["Document current processes first"],
        attachments: ["workflow_diagrams.zip"],
      },
      {
        parameterId: "req-4",
        status: "completed",
        percentComplete: 100,
        challenges: ["Identifying all potential risks"],
        recommendations: ["Conduct risk workshops"],
        attachments: ["risk_register.pdf"],
      },
      {
        parameterId: "des-1",
        status: "completed",
        percentComplete: 100,
        challenges: ["Scalability concerns"],
        recommendations: ["Design for future growth"],
        attachments: ["solution_architecture_diagram.pdf"],
      },
      {
        parameterId: "des-2",
        status: "completed",
        percentComplete: 100,
        challenges: ["Compliance requirements"],
        recommendations: ["Consult security expert"],
        attachments: ["security_architecture_document.pdf"],
      },
      {
        parameterId: "des-3",
        status: "completed",
        percentComplete: 100,
        challenges: ["Data model complexity"],
        recommendations: ["Simplify where possible"],
        attachments: ["database_schema.pdf"],
      },
      {
        parameterId: "des-4",
        status: "completed",
        percentComplete: 100,
        challenges: ["API standardization"],
        recommendations: ["Follow REST best practices"],
        attachments: ["api_specification_v1.pdf"],
      },
      {
        parameterId: "pro-1",
        status: "ongoing",
        percentComplete: 85,
        challenges: ["Supply chain delays"],
        recommendations: ["Order in advance"],
        attachments: ["hardware_procurement_list.xlsx"],
      },
      {
        parameterId: "pro-2",
        status: "completed",
        percentComplete: 100,
        challenges: ["License negotiations"],
        recommendations: ["Consider open source alternatives"],
        attachments: ["software_licenses_approved.pdf"],
      },
      {
        parameterId: "pro-3",
        status: "ongoing",
        percentComplete: 70,
        challenges: ["SLA terms negotiation"],
        recommendations: ["Standardize SLA templates"],
        attachments: ["sla_draft_agreement.pdf"],
      },
      {
        parameterId: "pro-4",
        status: "completed",
        percentComplete: 100,
        challenges: ["Vendor selection"],
        recommendations: ["Use scoring matrix"],
        attachments: ["vendor_contracts_signed.pdf"],
      },
      {
        parameterId: "inf-1",
        status: "ongoing",
        percentComplete: 90,
        challenges: ["Server configuration issues"],
        recommendations: ["Use configuration management"],
        attachments: ["server_setup_checklist.pdf"],
      },
      {
        parameterId: "inf-2",
        status: "ongoing",
        percentComplete: 80,
        challenges: ["Network security concerns"],
        recommendations: ["Implement VLAN segmentation"],
        attachments: ["network_diagram.pdf"],
      },
      {
        parameterId: "inf-3",
        status: "completed",
        percentComplete: 100,
        challenges: ["Firewall rule complexity"],
        recommendations: ["Document all rules"],
        attachments: ["firewall_configuration.pdf"],
      },
      {
        parameterId: "inf-4",
        status: "ongoing",
        percentComplete: 75,
        challenges: ["DNS propagation delays"],
        recommendations: ["Plan for propagation time"],
        attachments: ["dns_configuration.txt"],
      },
      {
        parameterId: "dev-1",
        status: "ongoing",
        percentComplete: 95,
        challenges: ["System compatibility issues"],
        recommendations: ["Test on multiple environments"],
        attachments: ["system_installation_logs.pdf"],
      },
      {
        parameterId: "dev-2",
        status: "ongoing",
        percentComplete: 85,
        challenges: ["Module dependencies"],
        recommendations: ["Document dependencies"],
        attachments: ["module_configuration_docs.pdf"],
      },
      {
        parameterId: "dev-3",
        status: "ongoing",
        percentComplete: 70,
        challenges: ["User feedback incorporation"],
        recommendations: ["Iterative design process"],
        attachments: ["uiux_mockups_feedback.pdf"],
      },
      {
        parameterId: "dev-4",
        status: "stalled",
        percentComplete: 40,
        challenges: [
          "CMS customization complexity",
          "Developer resource constraints",
        ],
        recommendations: [
          "Hire additional developers",
          "Simplify requirements",
        ],
        attachments: ["cms_development_plan.pdf"],
      },
      {
        parameterId: "int-1",
        status: "ongoing",
        percentComplete: 60,
        challenges: ["Third-party API limitations"],
        recommendations: ["Implement fallback mechanisms"],
        attachments: ["api_integration_documentation.pdf"],
      },
      {
        parameterId: "int-2",
        status: "ongoing",
        percentComplete: 55,
        challenges: ["Data quality issues"],
        recommendations: ["Implement data validation"],
        attachments: ["data_cleaning_scripts.zip"],
      },
      {
        parameterId: "int-3",
        status: "ongoing",
        percentComplete: 50,
        challenges: ["Large data volumes"],
        recommendations: ["Batch migration approach"],
        attachments: ["data_migration_plan.pdf"],
      },
      {
        parameterId: "int-4",
        status: "stalled",
        percentComplete: 25,
        challenges: ["Legacy system compatibility", "Data format conversion"],
        recommendations: ["Develop custom adapters", "Schedule downtime"],
        attachments: ["legacy_system_documentation.pdf"],
      },
      {
        parameterId: "test-1",
        status: "ongoing",
        percentComplete: 45,
        challenges: ["Test coverage gaps"],
        recommendations: ["Increase unit test coverage"],
        attachments: ["unit_test_results.pdf"],
      },
      {
        parameterId: "test-2",
        status: "ongoing",
        percentComplete: 35,
        challenges: ["Integration test environment"],
        recommendations: ["Set up dedicated test environment"],
        attachments: ["integration_test_plan.pdf"],
      },
      {
        parameterId: "test-3",
        status: "ongoing",
        percentComplete: 20,
        challenges: ["User availability for testing"],
        recommendations: ["Schedule UAT sessions"],
        attachments: ["uat_schedule.xlsx"],
      },
      {
        parameterId: "test-4",
        status: "ongoing",
        percentComplete: 15,
        challenges: ["Security testing tools"],
        recommendations: ["Use automated security scanning"],
        attachments: ["security_test_plan.pdf"],
      },
      {
        parameterId: "train-1",
        status: "ongoing",
        percentComplete: 10,
        challenges: ["Training material development"],
        recommendations: ["Start material development early"],
        attachments: ["training_outline.pdf"],
      },
      {
        parameterId: "train-2",
        status: "ongoing",
        percentComplete: 25,
        challenges: ["Technical documentation"],
        recommendations: ["Use documentation tools"],
        attachments: ["documentation_template.doc"],
      },
      {
        parameterId: "train-3",
        status: "ongoing",
        percentComplete: 0,
        challenges: ["Not yet started"],
        recommendations: ["Schedule training sessions"],
        attachments: [],
      },
      {
        parameterId: "train-4",
        status: "ongoing",
        percentComplete: 0,
        challenges: ["Not yet started"],
        recommendations: ["Prepare training environment"],
        attachments: [],
      },
      {
        parameterId: "dep-1",
        status: "ongoing",
        percentComplete: 5,
        challenges: ["Deployment planning"],
        recommendations: ["Create detailed deployment plan"],
        attachments: ["deployment_checklist_draft.pdf"],
      },
      {
        parameterId: "dep-2",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "dep-3",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "dep-4",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "sup-1",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "sup-2",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "sup-3",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "sup-4",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "han-1",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "han-2",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "han-3",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "han-4",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
    ],
  },
  {
    id: "trk-ide-2",
    projectId: "proj-6",
    checklistId: "cl-5",
    submittedBy: "user-9",
    submittedAt: "2025-02-20",
    overallProgress: 78,
    reviewed: {
      reviewerId: "user-13",
      reason:
        "Excellent progress on infrastructure setup, focus on integration phase",
      date: "2025-02-25",
    },
    tasks: [
      {
        parameterId: "init-1",
        status: "completed",
        percentComplete: 100,
        challenges: [],
        recommendations: [],
        attachments: ["project_kickoff_agenda.pdf"],
      },
      {
        parameterId: "init-2",
        status: "completed",
        percentComplete: 100,
        challenges: ["Identifying all stakeholders"],
        recommendations: ["Conduct stakeholder analysis"],
        attachments: ["stakeholder_analysis_matrix.xlsx"],
      },
      {
        parameterId: "init-3",
        status: "completed",
        percentComplete: 100,
        challenges: ["Charter approval delays"],
        recommendations: ["Pre-approval consultations"],
        attachments: ["project_charter_signed.pdf"],
      },
      {
        parameterId: "init-4",
        status: "completed",
        percentComplete: 100,
        challenges: ["Budget constraints"],
        recommendations: ["Phased implementation"],
        attachments: ["approved_budget_breakdown.pdf"],
      },
      {
        parameterId: "init-5",
        status: "completed",
        percentComplete: 100,
        challenges: ["Resource allocation"],
        recommendations: ["Use resource management tools"],
        attachments: ["project_team_roster.pdf"],
      },
      {
        parameterId: "req-1",
        status: "completed",
        percentComplete: 100,
        challenges: ["Changing user requirements"],
        recommendations: ["Establish requirements baseline"],
        attachments: ["requirements_specification_v3.pdf"],
      },
      {
        parameterId: "req-2",
        status: "completed",
        percentComplete: 100,
        challenges: ["Quantifying business needs"],
        recommendations: ["Use metrics and KPIs"],
        attachments: ["needs_assessment_final.pdf"],
      },
      {
        parameterId: "req-3",
        status: "completed",
        percentComplete: 100,
        challenges: ["Process mapping complexity"],
        recommendations: ["Use BPMN notation"],
        attachments: ["workflow_analysis_report.pdf"],
      },
      {
        parameterId: "req-4",
        status: "completed",
        percentComplete: 100,
        challenges: ["Risk identification"],
        recommendations: ["Use risk assessment framework"],
        attachments: ["risk_assessment_matrix.pdf"],
      },
      {
        parameterId: "des-1",
        status: "completed",
        percentComplete: 100,
        challenges: ["Architecture decisions"],
        recommendations: ["Document architecture decisions"],
        attachments: ["solution_architecture_document.pdf"],
      },
      {
        parameterId: "des-2",
        status: "completed",
        percentComplete: 100,
        challenges: ["Security compliance"],
        recommendations: ["Follow security standards"],
        attachments: ["security_architecture_approval.pdf"],
      },
      {
        parameterId: "des-3",
        status: "completed",
        percentComplete: 100,
        challenges: ["Database performance"],
        recommendations: ["Performance testing early"],
        attachments: ["database_design_document.pdf"],
      },
      {
        parameterId: "des-4",
        status: "completed",
        percentComplete: 100,
        challenges: ["API design standards"],
        recommendations: ["Use API design guidelines"],
        attachments: ["api_specifications_final.pdf"],
      },
      {
        parameterId: "pro-1",
        status: "completed",
        percentComplete: 100,
        challenges: ["Hardware delivery"],
        recommendations: ["Order with buffer time"],
        attachments: ["hardware_delivery_confirmation.pdf"],
      },
      {
        parameterId: "pro-2",
        status: "completed",
        percentComplete: 100,
        challenges: ["Software licensing costs"],
        recommendations: ["Negotiate volume discounts"],
        attachments: ["software_license_agreements.pdf"],
      },
      {
        parameterId: "pro-3",
        status: "completed",
        percentComplete: 100,
        challenges: ["SLA negotiations"],
        recommendations: ["Define clear metrics"],
        attachments: ["sla_final_agreement.pdf"],
      },
      {
        parameterId: "pro-4",
        status: "completed",
        percentComplete: 100,
        challenges: ["Vendor management"],
        recommendations: ["Regular vendor meetings"],
        attachments: ["vendor_management_plan.pdf"],
      },
      {
        parameterId: "inf-1",
        status: "ongoing",
        percentComplete: 95,
        challenges: ["Server configuration"],
        recommendations: ["Automate configuration"],
        attachments: ["server_configuration_scripts.zip"],
      },
      {
        parameterId: "inf-2",
        status: "completed",
        percentComplete: 100,
        challenges: ["Network segmentation"],
        recommendations: ["Follow security best practices"],
        attachments: ["network_configuration_diagram.pdf"],
      },
      {
        parameterId: "inf-3",
        status: "completed",
        percentComplete: 100,
        challenges: ["Firewall rule management"],
        recommendations: ["Document all firewall rules"],
        attachments: ["firewall_configuration_final.pdf"],
      },
      {
        parameterId: "inf-4",
        status: "completed",
        percentComplete: 100,
        challenges: ["Domain registration"],
        recommendations: ["Register domains early"],
        attachments: ["domain_registration_certificate.pdf"],
      },
      {
        parameterId: "inf-5",
        status: "ongoing",
        percentComplete: 90,
        challenges: ["Storage allocation"],
        recommendations: ["Plan for growth"],
        attachments: ["storage_provisioning_plan.pdf"],
      },
      {
        parameterId: "dev-1",
        status: "ongoing",
        percentComplete: 85,
        challenges: ["System dependencies"],
        recommendations: ["Manage dependencies"],
        attachments: ["system_installation_progress.pdf"],
      },
      {
        parameterId: "dev-2",
        status: "ongoing",
        percentComplete: 80,
        challenges: ["Module configuration complexity"],
        recommendations: ["Standardize configurations"],
        attachments: ["module_configuration_docs.zip"],
      },
      {
        parameterId: "dev-3",
        status: "ongoing",
        percentComplete: 75,
        challenges: ["User interface feedback"],
        recommendations: ["Iterative UI development"],
        attachments: ["uiux_design_mockups.pdf"],
      },
      {
        parameterId: "dev-4",
        status: "ongoing",
        percentComplete: 70,
        challenges: ["CMS customization"],
        recommendations: ["Follow CMS best practices"],
        attachments: ["cms_customization_plan.pdf"],
      },
      {
        parameterId: "int-1",
        status: "ongoing",
        percentComplete: 65,
        challenges: ["Third-party API changes"],
        recommendations: ["Implement API versioning"],
        attachments: ["api_integration_test_results.pdf"],
      },
      {
        parameterId: "int-2",
        status: "ongoing",
        percentComplete: 60,
        challenges: ["Data quality issues"],
        recommendations: ["Implement data quality checks"],
        attachments: ["data_cleaning_report.pdf"],
      },
      {
        parameterId: "int-3",
        status: "ongoing",
        percentComplete: 55,
        challenges: ["Migration performance"],
        recommendations: ["Optimize migration scripts"],
        attachments: ["data_migration_progress.pdf"],
      },
      {
        parameterId: "int-4",
        status: "stalled",
        percentComplete: 30,
        challenges: ["Legacy system downtime", "Data consistency issues"],
        recommendations: [
          "Schedule maintenance window",
          "Implement data validation",
        ],
        attachments: ["legacy_system_integration_plan.pdf"],
      },
      {
        parameterId: "test-1",
        status: "ongoing",
        percentComplete: 40,
        challenges: ["Test automation"],
        recommendations: ["Implement test automation"],
        attachments: ["unit_test_coverage_report.pdf"],
      },
      {
        parameterId: "test-2",
        status: "ongoing",
        percentComplete: 35,
        challenges: ["Integration test environment"],
        recommendations: ["Maintain test environment"],
        attachments: ["integration_test_results.pdf"],
      },
      {
        parameterId: "test-3",
        status: "ongoing",
        percentComplete: 25,
        challenges: ["User acceptance criteria"],
        recommendations: ["Define clear acceptance criteria"],
        attachments: ["uat_test_cases.pdf"],
      },
      {
        parameterId: "test-4",
        status: "ongoing",
        percentComplete: 20,
        challenges: ["Security testing resources"],
        recommendations: ["Use automated security tools"],
        attachments: ["security_testing_plan.pdf"],
      },
      {
        parameterId: "train-1",
        status: "ongoing",
        percentComplete: 15,
        challenges: ["Training material development"],
        recommendations: ["Develop training materials"],
        attachments: ["training_curriculum_outline.pdf"],
      },
      {
        parameterId: "train-2",
        status: "ongoing",
        percentComplete: 30,
        challenges: ["Technical writing"],
        recommendations: ["Use technical writers"],
        attachments: ["system_documentation_draft.pdf"],
      },
      {
        parameterId: "dep-1",
        status: "ongoing",
        percentComplete: 10,
        challenges: ["Deployment planning"],
        recommendations: ["Create deployment checklist"],
        attachments: ["deployment_plan_draft.pdf"],
      },
      {
        parameterId: "dep-2",
        status: "ongoing",
        percentComplete: 5,
        challenges: ["Go-live support planning"],
        recommendations: ["Plan support rota"],
        attachments: ["go_live_support_plan.pdf"],
      },
      {
        parameterId: "sup-1",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "sup-2",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "han-1",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "han-2",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
      {
        parameterId: "han-3",
        status: "ongoing",
        percentComplete: 0,
        challenges: [],
        recommendations: [],
        attachments: [],
      },
    ],
  },
];

export const users = [
  {
    id: "user-1",
    name: "John Mwangi",
    email: "john.mwangi@company.com",
    role: "admin",
    department: "Administration",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    phone: "+254712345678",
    createdAt: "2024-01-15",
  },
  {
    id: "user-2",
    name: "Sarah Achieng",
    email: "sarah.achieng@company.com",
    role: "M&E",
    department: "Monitoring & Evaluation",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    phone: "+254723456789",
    createdAt: "2024-02-10",
  },
  {
    id: "user-3",
    name: "David Omondi",
    email: "david.omondi@company.com",
    role: "technical",
    department: "Engineering",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    phone: "+254734567890",
    createdAt: "2024-01-20",
  },
  {
    id: "user-4",
    name: "Grace Wanjiku",
    email: "grace.wanjiku@company.com",
    role: "management",
    department: "Project Management",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    phone: "+254745678901",
    createdAt: "2024-01-05",
  },
  {
    id: "user-5",
    name: "Michael Kamau",
    email: "michael.kamau@company.com",
    role: "admin",
    department: "IT Administration",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    phone: "+254756789012",
    createdAt: "2024-03-01",
  },
  {
    id: "user-6",
    name: "Elizabeth Akinyi",
    email: "elizabeth.akinyi@company.com",
    role: "M&E",
    department: "Quality Assurance",
    avatar: "https://randomuser.me/api/portraits/women/26.jpg",
    phone: "+254767890123",
    createdAt: "2024-02-15",
  },
  {
    id: "user-7",
    name: "Robert Njoroge",
    email: "robert.njoroge@company.com",
    role: "technical",
    department: "Infrastructure",
    avatar: "https://randomuser.me/api/portraits/men/81.jpg",
    phone: "+254778901234",
    createdAt: "2024-01-25",
  },
  {
    id: "user-8",
    name: "Susan Mumbi",
    email: "susan.mumbi@company.com",
    role: "management",
    department: "Operations",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    phone: "+254789012345",
    createdAt: "2024-02-20",
  },
  {
    id: "user-9",
    name: "Peter Kariuki",
    email: "peter.kariuki@company.com",
    role: "technical",
    department: "Development",
    avatar: "https://randomuser.me/api/portraits/men/55.jpg",
    phone: "+254790123456",
    createdAt: "2024-02-05",
  },
  {
    id: "user-10",
    name: "Maryanne Chebet",
    email: "maryanne.chebet@company.com",
    role: "M&E",
    department: "Compliance",
    avatar: "https://randomuser.me/api/portraits/women/56.jpg",
    phone: "+254701234567",
    createdAt: "2024-03-05",
  },
];

export const publicComments = [
  {
    id: "comment-1",
    projectId: "proj-5",
    userId: "user-3", // David Omondi (technical)
    content:
      "The foundation work at the north end of the stadium appears to be settling unevenly. We've noticed cracks forming in the concrete base. Need immediate inspection.",
    createdAt: "2025-01-15T09:30:00Z",
    updatedAt: "2025-01-15T09:30:00Z",
    attachments: [
      {
        id: "att-1-1",
        fileName: "crack_in_foundation.jpg",
        fileUrl: "https://storage.company.com/proj-5/crack_foundation_001.jpg",
        fileType: "image/jpeg",
        fileSize: "2.4 MB",
      },
      {
        id: "att-1-2",
        fileName: "foundation_inspection_report.pdf",
        fileUrl: "https://storage.company.com/proj-5/foundation_report.pdf",
        fileType: "application/pdf",
        fileSize: "1.8 MB",
      },
    ],
    replies: [
      {
        id: "reply-1-1",
        commentId: "comment-1",
        userId: "user-4", // Grace Wanjiku (management)
        content:
          "Thank you for reporting this. I've asked the structural engineering team to visit the site tomorrow morning. Please ensure the area is cordoned off for safety.",
        createdAt: "2025-01-15T11:45:00Z",
        attachments: [
          {
            id: "att-1-1-1",
            fileName: "safety_protocols.pdf",
            fileUrl: "https://storage.company.com/proj-5/safety_protocols.pdf",
            fileType: "application/pdf",
            fileSize: "890 KB",
          },
        ],
      },
      {
        id: "reply-1-2",
        commentId: "comment-1",
        userId: "user-7", // Robert Njoroge (technical)
        content:
          "I've just reviewed the photos. This appears to be a soil compaction issue. We need to conduct soil tests before proceeding. I'm attaching the required test procedures.",
        createdAt: "2025-01-15T14:20:00Z",
        attachments: [
          {
            id: "att-1-2-1",
            fileName: "soil_test_procedures.pdf",
            fileUrl:
              "https://storage.company.com/proj-5/soil_test_procedures.pdf",
            fileType: "application/pdf",
            fileSize: "1.2 MB",
          },
          {
            id: "att-1-2-2",
            fileName: "compaction_requirements.doc",
            fileUrl:
              "https://storage.company.com/proj-5/compaction_requirements.doc",
            fileType: "application/msword",
            fileSize: "560 KB",
          },
        ],
      },
    ],
  },
  {
    id: "comment-2",
    projectId: "proj-5",
    userId: "user-2", // Sarah Achieng (M&E)
    content:
      "Progress update: Week 8 completion at 68% is 5% behind schedule. The main delay factors are material procurement and contractor performance. See attached detailed report.",
    createdAt: "2025-01-20T14:00:00Z",
    updatedAt: "2025-01-20T14:00:00Z",
    attachments: [
      {
        id: "att-2-1",
        fileName: "week8_progress_report.pdf",
        fileUrl: "https://storage.company.com/proj-5/week8_progress.pdf",
        fileType: "application/pdf",
        fileSize: "3.2 MB",
      },
      {
        id: "att-2-2",
        fileName: "schedule_variance_analysis.xlsx",
        fileUrl: "https://storage.company.com/proj-5/schedule_variance.xlsx",
        fileType: "application/vnd.ms-excel",
        fileSize: "890 KB",
      },
    ],
    replies: [
      {
        id: "reply-2-1",
        commentId: "comment-2",
        userId: "user-8", // Susan Mumbi (management)
        content:
          "Thanks for the detailed report. I've approved the accelerated procurement process. Let's hold a meeting on Wednesday to realign the schedule.",
        createdAt: "2025-01-20T16:30:00Z",
        attachments: [
          {
            id: "att-2-1-1",
            fileName: "procurement_approval.pdf",
            fileUrl:
              "https://storage.company.com/proj-5/procurement_approval.pdf",
            fileType: "application/pdf",
            fileSize: "450 KB",
          },
        ],
      },
      {
        id: "reply-2-2",
        commentId: "comment-2",
        userId: "user-6", // Elizabeth Akinyi (M&E)
        content:
          "I've reviewed the quality metrics from last week. While we're behind schedule, the quality scores remain high (92%). Let's maintain quality while catching up on schedule.",
        createdAt: "2025-01-21T09:15:00Z",
        attachments: [
          {
            id: "att-2-2-1",
            fileName: "quality_metrics_week8.pdf",
            fileUrl: "https://storage.company.com/proj-5/quality_week8.pdf",
            fileType: "application/pdf",
            fileSize: "1.5 MB",
          },
        ],
      },
    ],
  },
  {
    id: "comment-3",
    projectId: "proj-5",
    userId: "user-9", // Peter Kariuki (technical)
    content:
      "The VIP section electrical wiring does not meet the specified standards. The conduit sizes are incorrect and insulation ratings are below requirements. Photos attached.",
    createdAt: "2025-01-25T10:45:00Z",
    updatedAt: "2025-01-25T10:45:00Z",
    attachments: [
      {
        id: "att-3-1",
        fileName: "vip_electrical_issues_1.jpg",
        fileUrl: "https://storage.company.com/proj-5/vip_electrical_1.jpg",
        fileType: "image/jpeg",
        fileSize: "3.1 MB",
      },
      {
        id: "att-3-2",
        fileName: "vip_electrical_issues_2.jpg",
        fileUrl: "https://storage.company.com/proj-5/vip_electrical_2.jpg",
        fileType: "image/jpeg",
        fileSize: "2.8 MB",
      },
      {
        id: "att-3-3",
        fileName: "electrical_specifications.pdf",
        fileUrl: "https://storage.company.com/proj-5/electrical_specs.pdf",
        fileType: "application/pdf",
        fileSize: "2.1 MB",
      },
    ],
    replies: [
      {
        id: "reply-3-1",
        commentId: "comment-3",
        userId: "user-1", // John Mwangi (admin)
        content:
          "This is a critical safety issue. I'm immediately halting all electrical work in the VIP section until this is resolved. All materials must be replaced with approved specifications.",
        createdAt: "2025-01-25T11:30:00Z",
        attachments: [
          {
            id: "att-3-1-1",
            fileName: "work_stoppage_order.pdf",
            fileUrl: "https://storage.company.com/proj-5/work_stoppage.pdf",
            fileType: "application/pdf",
            fileSize: "780 KB",
          },
        ],
      },
      {
        id: "reply-3-2",
        commentId: "comment-3",
        userId: "user-7", // Robert Njoroge (technical)
        content:
          "I've sourced the correct materials from our approved vendor. They will be delivered tomorrow morning. I'll personally supervise the replacement work.",
        createdAt: "2025-01-25T15:20:00Z",
        attachments: [
          {
            id: "att-3-2-1",
            fileName: "material_delivery_confirmation.pdf",
            fileUrl:
              "https://storage.company.com/proj-5/delivery_confirmation.pdf",
            fileType: "application/pdf",
            fileSize: "640 KB",
          },
        ],
      },
    ],
  },
  {
    id: "comment-4",
    projectId: "proj-5",
    userId: "user-10", // Maryanne Chebet (M&E)
    content:
      "Community engagement meeting held today. Local residents raised concerns about construction noise during evening hours. They've requested work to stop by 6 PM.",
    createdAt: "2025-01-28T16:00:00Z",
    updatedAt: "2025-01-28T16:00:00Z",
    attachments: [
      {
        id: "att-4-1",
        fileName: "community_meeting_minutes.pdf",
        fileUrl: "https://storage.company.com/proj-5/community_minutes.pdf",
        fileType: "application/pdf",
        fileSize: "1.9 MB",
      },
      {
        id: "att-4-2",
        fileName: "noise_complaints_summary.xlsx",
        fileUrl: "https://storage.company.com/proj-5/noise_complaints.xlsx",
        fileType: "application/vnd.ms-excel",
        fileSize: "420 KB",
      },
    ],
    replies: [
      {
        id: "reply-4-1",
        commentId: "comment-4",
        userId: "user-4", // Grace Wanjiku (management)
        content:
          "We need to comply with local regulations. Let's adjust the work schedule to 7 AM - 6 PM weekdays, and 8 AM - 2 PM Saturdays. No work on Sundays. Please communicate this to all contractors.",
        createdAt: "2025-01-28T17:30:00Z",
        attachments: [
          {
            id: "att-4-1-1",
            fileName: "updated_work_schedule.pdf",
            fileUrl: "https://storage.company.com/proj-5/updated_schedule.pdf",
            fileType: "application/pdf",
            fileSize: "520 KB",
          },
        ],
      },
      {
        id: "reply-4-2",
        commentId: "comment-4",
        userId: "user-2", // Sarah Achieng (M&E)
        content:
          "Good decision. I'll update the project schedule and assess the impact on completion date. We may need to add weekend work within the allowed hours to stay on track.",
        createdAt: "2025-01-29T09:00:00Z",
        attachments: [
          {
            id: "att-4-2-1",
            fileName: "schedule_impact_analysis.pdf",
            fileUrl: "https://storage.company.com/proj-5/schedule_impact.pdf",
            fileType: "application/pdf",
            fileSize: "980 KB",
          },
        ],
      },
    ],
  },
  {
    id: "comment-5",
    projectId: "proj-5",
    userId: "user-5", // Michael Kamau (admin)
    content:
      "Budget review: We've used 72% of allocated funds but completed only 68% of work. Cost overrun risk identified. Need cost-saving measures for remaining work. Detailed analysis attached.",
    createdAt: "2025-02-01T08:30:00Z",
    updatedAt: "2025-02-01T08:30:00Z",
    attachments: [
      {
        id: "att-5-1",
        fileName: "budget_analysis_feb1.pdf",
        fileUrl: "https://storage.company.com/proj-5/budget_analysis.pdf",
        fileType: "application/pdf",
        fileSize: "4.2 MB",
      },
      {
        id: "att-5-2",
        fileName: "cost_overrun_risks.xlsx",
        fileUrl: "https://storage.company.com/proj-5/cost_risks.xlsx",
        fileType: "application/vnd.ms-excel",
        fileSize: "1.1 MB",
      },
    ],
    replies: [
      {
        id: "reply-5-1",
        commentId: "comment-5",
        userId: "user-8", // Susan Mumbi (management)
        content:
          "We've identified three areas for cost optimization: 1) Bulk material purchases for remaining work, 2) Reduced overtime by better scheduling, 3) Negotiating rates with subcontractors. Action plan attached.",
        createdAt: "2025-02-01T11:15:00Z",
        attachments: [
          {
            id: "att-5-1-1",
            fileName: "cost_optimization_plan.pdf",
            fileUrl: "https://storage.company.com/proj-5/cost_plan.pdf",
            fileType: "application/pdf",
            fileSize: "1.3 MB",
          },
        ],
      },
      {
        id: "reply-5-2",
        commentId: "comment-5",
        userId: "user-3", // David Omondi (technical)
        content:
          "Technical team can contribute by optimizing material usage. We've identified 15% waste in current processes. Implementing lean construction methods could save approximately KES 2.5M.",
        createdAt: "2025-02-01T14:45:00Z",
        attachments: [
          {
            id: "att-5-2-1",
            fileName: "material_optimization_plan.pdf",
            fileUrl:
              "https://storage.company.com/proj-5/material_optimization.pdf",
            fileType: "application/pdf",
            fileSize: "890 KB",
          },
        ],
      },
    ],
  },
  {
    id: "comment-6",
    projectId: "proj-5",
    userId: "user-6", // Elizabeth Akinyi (M&E)
    content:
      "Quality inspection passed for Phase 1 (Foundation & Structure). All tests meet or exceed specifications. Certificate of compliance attached. Ready to proceed with Phase 2.",
    createdAt: "2025-02-05T13:20:00Z",
    updatedAt: "2025-02-05T13:20:00Z",
    attachments: [
      {
        id: "att-6-1",
        fileName: "phase1_quality_certificate.pdf",
        fileUrl: "https://storage.company.com/proj-5/phase1_certificate.pdf",
        fileType: "application/pdf",
        fileSize: "2.3 MB",
      },
      {
        id: "att-6-2",
        fileName: "structural_test_results.pdf",
        fileUrl: "https://storage.company.com/proj-5/structural_tests.pdf",
        fileType: "application/pdf",
        fileSize: "3.8 MB",
      },
      {
        id: "att-6-3",
        fileName: "inspection_photos.zip",
        fileUrl: "https://storage.company.com/proj-5/inspection_photos.zip",
        fileType: "application/zip",
        fileSize: "24.5 MB",
      },
    ],
    replies: [
      {
        id: "reply-6-1",
        commentId: "comment-6",
        userId: "user-4", // Grace Wanjiku (management)
        content:
          "Excellent work! Phase 1 completion is a major milestone. I'm authorizing Phase 2 commencement. Let's maintain this quality standard throughout the project.",
        createdAt: "2025-02-05T15:00:00Z",
        attachments: [
          {
            id: "att-6-1-1",
            fileName: "phase2_authorization.pdf",
            fileUrl: "https://storage.company.com/proj-5/phase2_auth.pdf",
            fileType: "application/pdf",
            fileSize: "680 KB",
          },
        ],
      },
      {
        id: "reply-6-2",
        commentId: "comment-6",
        userId: "user-9", // Peter Kariuki (technical)
        content:
          "Great news! The team has already begun preparations for Phase 2. Materials are staged and equipment is ready. We expect to start vertical construction tomorrow.",
        createdAt: "2025-02-05T16:45:00Z",
        attachments: [
          {
            id: "att-6-2-1",
            fileName: "phase2_preparation_photos.jpg",
            fileUrl: "https://storage.company.com/proj-5/phase2_prep.jpg",
            fileType: "image/jpeg",
            fileSize: "3.5 MB",
          },
        ],
      },
    ],
  },
];
