"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import RecentActivity from "@/components/dashboard/RecentActivity";
import ProjectOverview from "@/components/dashboard/ProjectOverview";
import StatsCharts from "./StatsCharts";
import BestPracticesList from "./BestPracticesList";
import ProjectsMap from "./ProjectsMap";
import CommentsFeed from "./CommentsFeed";
import StatsGrid from "./StatsGrid";

export default function DashboardClient({ projects, stats }) {
  const user = { fullName: "User" };

  return (
    <div className="max-w-7xl mx-auto p-6 pt-20 lg:pt-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome back, {user?.fullName || "User"}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            Your project insights at a glance
          </p>
        </div>

        <Link href="/projects" className="inline-flex">
          <button className="flex items-center gap-2 px-4 py-2 text-sm rounded bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:opacity-90 transition">
            <Plus size={16} /> New Project
          </button>
        </Link>
      </div>

      <StatsGrid projects={projects} />

      {/* CHARTS SECTION */}
      <div className="mt-8">
        <StatsCharts stats={stats} />
      </div>

      {/* MAP SECTION - full width */}
      <div className="mt-10">
        <ProjectsMap projects={projects} />
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid lg:grid-cols-3 gap-8 mt-10">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-8">
          <ProjectOverview projects={projects} />
          <RecentActivity />
          <BestPracticesList stats={stats} />
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-8">
          <CommentsFeed />
        </div>
      </div>
    </div>
  );
}
