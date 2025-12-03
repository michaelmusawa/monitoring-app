// components/portal/PortalClient.tsx
"use client";

import { useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Filter,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ProjectsList from "./ProjectsList";
import ProjectDetailsModal from "./ProjectDetailsModal";
import PublicComments from "./PublicComments";
import SummaryCard from "./SummaryCard";
import {
  Project as ProjectType,
  PublicComment as PublicCommentType,
} from "@/lib/types/types";

// Dynamic imports
const ProjectsMapClient = dynamic(
  () => import("../dashboard/ProjectsMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
    ),
  },
);

const ProjectsMapClientAny =
  ProjectsMapClient as unknown as React.ComponentType<Record<string, unknown>>;
const ProjectDetailsModalAny =
  ProjectDetailsModal as unknown as React.ComponentType<
    Record<string, unknown>
  >;
const ProjectsListAny = ProjectsList as unknown as React.ComponentType<
  Record<string, unknown>
>;
const PublicCommentsAny = PublicComments as unknown as React.ComponentType<
  Record<string, unknown>
>;

// Types based on dummy data
type Project = ProjectType;

type PublicComment = PublicCommentType;

interface PortalClientProps {
  projects?: ProjectType[];
  publicComments?: PublicCommentType[];
}

type StatusTab = "ALL" | "ONGOING" | "STALLED" | "COMPLETED";

export default function PortalClient({
  projects = [],
  publicComments = [],
}: PortalClientProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>("ALL");
  const [query, setQuery] = useState("");
  const [subCounty, setSubCounty] = useState("ALL");
  const [ward, setWard] = useState("ALL");
  const [selectedProject, setSelectedProject] = useState<ProjectType | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);

  // Derive filter options
  const { subCounties, wards, sectors } = useMemo(() => {
    const subCountiesSet = new Set<string>();
    const wardsSet = new Set<string>();
    const sectorsSet = new Set<string>();

    projects.forEach((p) => {
      if (p.subCounty) subCountiesSet.add(p.subCounty);
      if (p.ward) wardsSet.add(p.ward);
      if (p.sector) sectorsSet.add(p.sector);
    });

    return {
      subCounties: ["ALL", ...Array.from(subCountiesSet).sort()],
      wards: ["ALL", ...Array.from(wardsSet).sort()],
      sectors: ["ALL", ...Array.from(sectorsSet).sort()],
    };
  }, [projects]);

  // Filter logic with better status handling
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Status filter
      if (activeTab === "ONGOING") {
        if (
          !["ACTIVE", "ONGOING", "tracking"].some(
            (s) =>
              String(project.status ?? "")
                .toUpperCase()
                .includes(s) ||
              String(project.stage ?? "")
                .toLowerCase()
                .includes("tracking"),
          )
        )
          return false;
      }
      if (activeTab === "STALLED") {
        if (
          !["STALLED", "ON_HOLD", "stalled"].some(
            (s) =>
              String(project.status ?? "")
                .toUpperCase()
                .includes(s) ||
              String(project.stage ?? "")
                .toLowerCase()
                .includes("stalled"),
          )
        )
          return false;
      }
      if (activeTab === "COMPLETED") {
        if (
          !["COMPLETED", "completed"].some(
            (s) =>
              String(project.status ?? "")
                .toUpperCase()
                .includes(s) ||
              String(project.stage ?? "")
                .toLowerCase()
                .includes("completed"),
          )
        )
          return false;
      }

      // Geography filter
      if (subCounty !== "ALL" && project.subCounty !== subCounty) return false;
      if (ward !== "ALL" && project.ward !== ward) return false;

      // Search filter
      if (query) {
        const searchLower = query.toLowerCase();
        return (
          project.name?.toLowerCase().includes(searchLower) ||
          project.sector?.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [projects, activeTab, query, subCounty, ward]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const ongoing = projects.filter((p) =>
      ["ACTIVE", "ONGOING", "tracking"].some(
        (s) =>
          String(p.status ?? "")
            .toUpperCase()
            .includes(s) ||
          String(p.stage ?? "")
            .toLowerCase()
            .includes("tracking"),
      ),
    ).length;
    const stalled = projects.filter((p) =>
      ["STALLED", "ON_HOLD", "stalled"].some(
        (s) =>
          String(p.status ?? "")
            .toUpperCase()
            .includes(s) ||
          String(p.stage ?? "")
            .toLowerCase()
            .includes("stalled"),
      ),
    ).length;
    const completed = projects.filter((p) =>
      ["COMPLETED", "completed"].some(
        (s) =>
          String(p.status ?? "")
            .toUpperCase()
            .includes(s) ||
          String(p.stage ?? "")
            .toLowerCase()
            .includes("completed"),
      ),
    ).length;
    const planning = projects.filter((p) => p.status === "PENDING").length;

    return { total, ongoing, stalled, completed, planning };
  }, [projects]);

  // Get recent activity (simulated from dummy data)
  const recentActivity = useMemo(() => {
    const activities = [];
    const statusMessages = {
      ACTIVE: "Project is currently active and making progress",
      PENDING: "Project is in planning phase awaiting approvals",
      COMPLETE: "Project has been completed successfully",
    };

    for (const project of projects.slice(0, 3)) {
      activities.push({
        id: project.id,
        title: project.name,
        update:
          statusMessages[project.status as keyof typeof statusMessages] ||
          `Project status: ${project.status}`,
        date: "2025-01-15", // Static date for demo
        status: project.status,
      });
    }
    return activities;
  }, [projects]);

  const handleProjectSelect = useCallback((project: Project) => {
    setSelectedProject(project);
    // Smooth scroll to top when modal opens
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleClearFilters = useCallback(() => {
    setQuery("");
    setSubCounty("ALL");
    setWard("ALL");
    setActiveTab("ALL");
  }, []);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard
          title="Total Projects"
          value={stats.total}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
        />
        <SummaryCard
          title="Active"
          value={stats.ongoing}
          icon={
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          }
          color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
        />
        <SummaryCard
          title="Stalled"
          value={stats.stalled}
          icon={<AlertCircle className="w-5 h-5" />}
          color="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
        />
        <SummaryCard
          title="Completed"
          value={stats.completed}
          icon={<CheckCircle className="w-5 h-5" />}
          color="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
        />
        <SummaryCard
          title="In Planning"
          value={stats.planning}
          icon={<MapPin className="w-5 h-5" />}
          color="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
        />
      </div>

      {/* Filters Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filter Projects</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>

            <div
              className={`space-y-4 ${showFilters ? "block" : "hidden lg:block"}`}
            >
              {/* Status Tabs */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "ALL", label: "All Projects", count: stats.total },
                  { id: "ONGOING", label: "Active", count: stats.ongoing },
                  { id: "STALLED", label: "Stalled", count: stats.stalled },
                  {
                    id: "COMPLETED",
                    label: "Completed",
                    count: stats.completed,
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;

                  // Custom colors for active tabs
                  const activeColor =
                    tab.id === "ONGOING"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : tab.id === "STALLED"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : tab.id === "COMPLETED"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-primary text-white"; // default for ALL

                  return (
                    <Button
                      key={tab.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveTab(tab.id as StatusTab)}
                      className={isActive ? activeColor : ""}
                    >
                      {tab.label}
                      <span className="ml-2 bg-black/10 px-1.5 py-0.5 rounded text-xs">
                        {tab.count}
                      </span>
                    </Button>
                  );
                })}
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search projects by name, code, or description..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <Select value={subCounty} onValueChange={setSubCounty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sub-County" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCounties.map((sc) => (
                        <SelectItem key={sc} value={sc}>
                          {sc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={ward} onValueChange={setWard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="col-span-2 md:col-span-1"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Projects Map</h3>
                  <p className="text-sm text-gray-500">
                    Showing {filteredProjects.length} projects
                    {subCounty !== "ALL" && ` in ${subCounty}`}
                    {ward !== "ALL" && `, ${ward} ward`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const element = document.querySelector(".projects-map");
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View Map
                </Button>
              </div>
              <div className="h-[400px] rounded-lg overflow-hidden border projects-map">
                <ProjectsMapClientAny
                  projects={filteredProjects.filter((p) => p.lat && p.long)}
                  onMarkerClick={handleProjectSelect}
                />
              </div>
            </CardContent>
          </Card>

          {/* Projects List */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Project List</h3>
                <span className="text-sm text-gray-500">
                  {filteredProjects.length} projects found
                </span>
              </div>
              <ProjectsListAny
                projects={filteredProjects}
                onSelect={handleProjectSelect}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Public Comments */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold">Community Feedback</h3>
              </div>
              <PublicCommentsAny comments={publicComments} />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Recent Updates</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => {
                      const project = projects.find(
                        (p) => p.id === activity.id,
                      );
                      if (project) handleProjectSelect(project);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">
                        {activity.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          activity.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : activity.status === "STALLED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {activity.update}
                    </p>
                    <span className="text-xs text-gray-500">
                      {activity.date}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    setActiveTab("ONGOING");
                    handleClearFilters();
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3 animate-pulse" />
                  View Active Projects
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    setActiveTab("STALLED");
                    handleClearFilters();
                  }}
                >
                  <AlertCircle className="w-4 h-4 mr-3 text-amber-500" />
                  View Stalled Projects
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => {
                    const mapElement = document.querySelector(".projects-map");
                    mapElement?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <MapPin className="w-4 h-4 mr-3" />
                  View on Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetailsModalAny
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          publicComments={publicComments.filter(
            (c) => c.projectId === selectedProject.id,
          )}
        />
      )}
    </div>
  );
}
