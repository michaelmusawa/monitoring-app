// app/dashboard/page.tsx

import { auth } from "@/auth";
import DashboardClient from "@/components/dashboard/DashboardPage";
import { projects as dummyProjects, publicComments } from "@/lib/data/data";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

// Helper function to calculate dashboard stats from dummy data
function calculateDashboardStats(projects: typeof dummyProjects) {
  const statusCounts = [
    {
      name: "Active",
      value: projects.filter(
        (p) => p.status === "ACTIVE" || p.status === "ongoing",
      ).length,
      color: "#10b981",
    },
    {
      name: "Planning",
      value: projects.filter(
        (p) => p.status === "PLANNED" || p.status === "PENDING",
      ).length,
      color: "#f59e0b",
    },
    {
      name: "Completed",
      value: projects.filter(
        (p) => p.status === "COMPLETE" || p.status === "completed",
      ).length,
      color: "#3b82f6",
    },
    {
      name: "Stalled",
      value: projects.filter((p) => p.status === "STALLED").length,
      color: "#8b5cf6",
    },
    {
      name: "Retired",
      value: projects.filter((p) => p.status === "RETIRED").length,
      color: "#6b7280",
    },
  ];

  const priorityCounts = [
    {
      name: "High",
      value: projects.filter((p) => p.priority === "HIGH").length,
      color: "#ef4444",
    },
    {
      name: "Medium",
      value: projects.filter((p) => p.priority === "MEDIUM").length,
      color: "#f59e0b",
    },
    {
      name: "Low",
      value: projects.filter((p) => p.priority === "LOW").length,
      color: "#10b981",
    },
  ];

  const monthlyProgress = [
    { month: "Jan", value: 20 },
    { month: "Feb", value: 34 },
    { month: "Mar", value: 56 },
    { month: "Apr", value: 72 },
    { month: "May", value: 85 },
    { month: "Jun", value: 90 },
  ];

  const bestPractices = [
    "Weekly stakeholder updates",
    "Track blockers early",
    "Document all implementation steps",
    "Regular quality checks",
    "Community engagement sessions",
  ];

  return {
    statusCounts,
    priorityCounts,
    monthlyProgress,
    bestPractices,
  };
}

export default async function DashboardPage() {
  const session = await auth();

  const userEmail = session?.user?.email || "";

  let projects;
  if (userEmail && userEmail === "ide@gmail.com") {
    projects = dummyProjects.filter((p) => p.sector === "IDE");
  } else if (userEmail && userEmail === "mw@gmail.com") {
    projects = dummyProjects.filter((p) => p.sector === "Mobility & Works");
  } else {
    projects = dummyProjects;
  }

  // Use dummy data instead of server-side fetching

  const stats = calculateDashboardStats(projects);
  const comments = publicComments;

  return (
    <DashboardClient
      projects={projects}
      stats={stats}
      userEmail={userEmail}
      comments={comments}
    />
  );
}
