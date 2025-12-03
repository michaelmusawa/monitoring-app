"use client";

import React from "react";

import ProjectOverview from "@/components/dashboard/ProjectOverview";
import StatsCharts from "./StatsCharts";
import BestPracticesList from "./BestPracticesList";
import ProjectsMap from "./ProjectsMap";
import StatsGrid from "./StatsGrid";
import { Button } from "../ui/button";
import { ArrowUpRightIcon, Download } from "lucide-react";
import Link from "next/link";

interface DashboardClientProps {
  projects: any[];
  stats: any;
  userEmail: string;
  comments: any[];
}

export default function DashboardClient({
  projects,
  stats,
  userEmail,
  comments,
}: DashboardClientProps) {
  const user = userEmail.split("@")[0];

  return (
    <div className="max-w-7xl mx-auto p-6 pt-20 lg:pt-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 ">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Welcome back, {user || "User"}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            Your project insights at a glance
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export snapshot
        </Button>

        {userEmail && userEmail === "admin@gmail.com" && (
          <Link
            href={`/admin`}
            className="flex items-center gap-2 px-4 py-2 text-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-700"
          >
            Admin
            <ArrowUpRightIcon className="size-3.5 opacity-60" />
          </Link>
        )}
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
          <ProjectOverview projects={projects} comments={comments} />
          {/*<RecentActivity /> */}
          <BestPracticesList stats={stats} />
        </div>

        {/* RIGHT SIDE - You can add more components here */}
        <div className="space-y-8">
          {/* Add any additional components you want on the right side */}
        </div>
      </div>
    </div>
  );
}
