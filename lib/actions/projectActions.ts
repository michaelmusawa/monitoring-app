// File: lib/actions/actions.ts

"use server";

// lib/actions/projectActions.ts
import { projects } from "@/lib/data/data";

export async function getProjects() {
  // Return dummy projects
  return projects;
}

export async function getProjectById(id: string) {
  return projects.find((project) => project.id === id);
}
