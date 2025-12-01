// File: lib/actions/actions.ts

"use server";

import { cidpProjects, dummyChecklists, dummyTrackers } from "../data/data";
import { ChecklistStatus } from "@/lib/types/types";

export async function getProjects() {
  await new Promise((r) => setTimeout(r, 30));
  return cidpProjects;
}

export async function getProjectById(id: string) {
  await new Promise((r) => setTimeout(r, 20));
  return cidpProjects.find((p) => p.id === id) ?? null;
}

export async function getChecklist(projectId: string) {
  await new Promise((r) => setTimeout(r, 20));
  const checklist = dummyChecklists.find((c) => c.projectId === projectId);
  return (
    checklist ?? {
      projectId,
      id: `cl-${projectId}`,
      status: ChecklistStatus.Draft,
      items: [],
    }
  );
}

export async function getTrackers(projectId: string) {
  await new Promise((r) => setTimeout(r, 25));
  return dummyTrackers.filter((t) => t.projectId === projectId);
}

export async function getTrackerById(projectId: string, trackerId: string) {
  await new Promise((r) => setTimeout(r, 20));
  return (
    dummyTrackers.find(
      (t) => t.projectId === projectId && t.id === trackerId,
    ) ?? null
  );
}

// simple action stubs for prototype
export async function saveChecklist(projectId: string, payload: any) {
  await new Promise((r) => setTimeout(r, 30));
  return { ok: true, id: `cl-saved-${Date.now()}` };
}

export async function saveTracker(projectId: string, payload: any) {
  await new Promise((r) => setTimeout(r, 30));
  return { ok: true, id: `t-saved-${Date.now()}` };
}

export async function getStandardParams() {
  // simulate small delay (optional)
  await new Promise((r) => setTimeout(r, 50));

  // Dummy grouped tasks
  const standardParams = [
    // --- Mobilization ---
    { id: "mob-clearance", label: "Site clearance", category: "Mobilization" },
    {
      id: "mob-fencing",
      label: "Temporary fencing & security",
      category: "Mobilization",
    },
    {
      id: "mob-storage",
      label: "Setting up storage areas",
      category: "Mobilization",
    },

    // --- Substructure ---
    { id: "sub-excavation", label: "Excavation", category: "Substructure" },
    {
      id: "sub-foundation",
      label: "Foundation construction",
      category: "Substructure",
    },
    { id: "sub-backfill", label: "Backfilling", category: "Substructure" },

    // --- Superstructure ---
    {
      id: "sup-columns",
      label: "Column construction",
      category: "Superstructure",
    },
    { id: "sup-walls", label: "Walling works", category: "Superstructure" },
    {
      id: "sup-roof",
      label: "Roof structure installation",
      category: "Superstructure",
    },

    // --- Finishing ---
    {
      id: "fin-plaster",
      label: "Plastering & smoothing",
      category: "Finishing",
    },
    { id: "fin-paint", label: "Painting", category: "Finishing" },
    {
      id: "fin-fixtures",
      label: "Installation of fixtures",
      category: "Finishing",
    },

    // --- Handover ---
    { id: "hand-testing", label: "Systems testing", category: "Handover" },
    {
      id: "hand-snagging",
      label: "Snag list inspection",
      category: "Handover",
    },
    {
      id: "hand-cleaning",
      label: "Final cleaning & site handover",
      category: "Handover",
    },
  ];

  return standardParams;
}
