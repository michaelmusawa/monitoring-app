"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, FolderOpen, MapPin, Table, X, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import ProjectsMap from "@/components/dashboard/ProjectsMap";
import ProjectDetailsCard from "@/components/projects/ProjectDetailsCard";
import { Skeleton } from "@/components/ui/skeleton";

// Import trackers data
import { trackers } from "@/lib/data/data"; // Adjust the import path as needed

// Types
type Project = {
  id: string;
  name: string;
  sector?: string;
  budget?: number | null;
  status?: string;
  size?: string;
  description?: string;
  progress?: number; // This will be overridden by tracker-based calculation
  members?: string[];
  lat?: number | null;
  long?: number | null;
  subCounty?: string | null;
  ward?: string | null;
  prerequisites?: string[];
};

type Tracker = {
  id: string;
  projectId: string;
  checklistId: string;
  submittedBy: string;
  submittedAt: string;
  overallProgress: number;
  // ... other tracker properties
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "ACTIVE", label: "Active" },

  { value: "PENDING", label: "Pending" },
  { value: "COMPLETE", label: "Completed" },

  { value: "STALLED", label: "Stalled" },
] as const;

const SIZE_OPTIONS = [
  { value: "ALL", label: "All Sizes" },
  { value: "SMALL", label: "Small" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LARGE", label: "Large" },
  { value: "MEGA", label: "Mega" },
] as const;

interface ProjectsPageProps {
  userEmail?: string;
  initialProjects: Project[];
}

export default function ProjectsPage({
  userEmail,
  initialProjects,
}: ProjectsPageProps) {
  const router = useRouter();
  const [projects] = useState<Project[]>(initialProjects);
  const [loading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ size: "ALL" });
  const [statusTab, setStatusTab] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"cards" | "map">("cards");

  // Modal for click-open project details
  const [openModalProject, setOpenModalProject] = useState<Project | null>(
    null,
  );

  // Function to get project progress from trackers
  const getProjectProgress = useCallback((projectId: string): number => {
    const projectTracker = trackers.find(
      (tracker) => tracker.projectId === projectId,
    );
    return projectTracker ? projectTracker.overallProgress : 0;
  }, []);

  // Create projects with tracker-based progress
  const projectsWithTrackerProgress = useMemo(() => {
    return projects.map((project) => ({
      ...project,
      progress: getProjectProgress(project.id),
    }));
  }, [projects, getProjectProgress]);

  const visibleProjects = useMemo(() => {
    let filtered = projectsWithTrackerProgress;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusTab !== "ALL") {
      if (statusTab === "ACTIVE") {
        filtered = filtered.filter(
          (p) => p.status === "ACTIVE" || p.status === "ONGOING",
        );
      } else if (statusTab === "COMPLETE") {
        filtered = filtered.filter(
          (p) => p.status === "COMPLETE" || p.status === "completed",
        );
      } else {
        filtered = filtered.filter((p) => p.status === statusTab);
      }
    }

    if (filters.size !== "ALL") {
      filtered = filtered.filter(
        (p) => p.size?.toUpperCase() === filters.size.toUpperCase(),
      );
    }

    return filtered;
  }, [projectsWithTrackerProgress, searchTerm, filters, statusTab]);

  const handleProjectClick = useCallback((project: Project) => {
    setOpenModalProject(project);
  }, []);

  const handleInitializeClick = useCallback(
    (projectId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/projects/${projectId}/initialize`);
    },
    [router],
  );

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({ size: "ALL" });
    setStatusTab("ALL");
  };

  const hasActiveFilters =
    searchTerm || filters.size !== "ALL" || statusTab !== "ALL";

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pt-20 lg:pt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading..."
              : `${visibleProjects.length} project${visibleProjects.length !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {activeTab === "cards" && (
          <Button
            onClick={() => router.push("/projects/reports")}
            className="gap-2"
          >
            <File className="w-4 h-4" />
            Generate report
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 border rounded-lg p-1 bg-muted/50">
          <Button
            variant={activeTab === "cards" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("cards")}
            className="gap-2"
          >
            <Table className="w-4 h-4" />
            Table View
          </Button>
          <Button
            variant={activeTab === "map" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("map")}
            className="gap-2"
          >
            <MapPin className="w-4 h-4" />
            Map View
          </Button>
        </div>

        {/* Status */}
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <Badge
              key={value}
              variant={statusTab === value ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => setStatusTab(value)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Filters */}
      {activeTab === "cards" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects by name, sector, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <select
                value={filters.size}
                onChange={(e) =>
                  setFilters({ ...filters, size: e.target.value })
                }
                className="px-3 py-2 rounded-lg border bg-background text-sm min-w-[140px]"
              >
                {SIZE_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  size="sm"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Active filters summary */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="text-muted-foreground">Active filters:</span>

              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchTerm}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSearchTerm("")}
                  />
                </Badge>
              )}

              {filters.size !== "ALL" && (
                <Badge variant="secondary" className="gap-1">
                  Size:{" "}
                  {SIZE_OPTIONS.find((s) => s.value === filters.size)?.label}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilters({ ...filters, size: "ALL" })}
                  />
                </Badge>
              )}

              {statusTab !== "ALL" && (
                <Badge variant="secondary" className="gap-1">
                  Status:{" "}
                  {STATUS_OPTIONS.find((s) => s.value === statusTab)?.label}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setStatusTab("ALL")}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <ProjectsTableSkeleton />
      ) : activeTab === "cards" ? (
        visibleProjects.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            router={router}
          />
        ) : (
          <ProjectsTable
            projects={visibleProjects}
            onProjectClick={handleProjectClick}
            onInitializeClick={handleInitializeClick}
          />
        )
      ) : (
        <div className="h-[600px] rounded-lg border overflow-hidden">
          <ProjectsMap
            projects={visibleProjects.filter((p) => p.lat && p.long)}
            center={[-1.2921, 36.8219]}
            zoom={12}
          />
        </div>
      )}

      {/* Modal */}
      <ProjectModal
        project={openModalProject}
        onClose={() => setOpenModalProject(null)}
      />
    </div>
  );
}

// ================================================================
// FULL MODAL (click-only)
// ================================================================
function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!project) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [project, onClose]);

  if (!project) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl max-w-4xl w-full p-6 shadow-xl">
        <button className="absolute top-4 right-4" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>

        <ProjectDetailsCard project={project} showActions={true} />
      </div>
    </div>,
    document.body,
  );
}

// ================================================================
// TABLE COMPONENT — NO HOVER LOGIC
// ================================================================
function ProjectsTable({
  projects,
  onProjectClick,
  onInitializeClick,
}: {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onInitializeClick: (id: string, e: React.MouseEvent) => void;
}) {
  const getStatusColor = (status: string = "") => {
    const s = status.toUpperCase();
    const map: any = {
      ACTIVE: "bg-green-100 text-green-800",
      PENDING: "bg-blue-100 text-blue-800",
      COMPLETE: "bg-purple-100 text-purple-800",
      STALLED: "bg-yellow-100 text-yellow-800",
    };
    return map[s] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Project
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Sector
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Size
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Progress
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {projects.map((project) => (
            <tr
              key={project.id}
              className="hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={(e) => {
                // avoid clicking "view" or "initialize" buttons triggering modal double-open
                if (!(e.target as HTMLElement).closest("button")) {
                  onProjectClick(project);
                }
              }}
            >
              <td className="px-4 py-3">
                <div className="font-medium group-hover:text-primary">
                  {project.name}
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-xs">
                  {project.description?.substring(0, 60)}...
                </div>
              </td>

              <td className="px-4 py-3">
                <Badge variant="outline">{project.sector || "N/A"}</Badge>
              </td>

              <td className="px-4 py-3">
                <Badge className={getStatusColor(project.status)}>
                  {project.status?.toLowerCase() || "unknown"}
                </Badge>
              </td>

              <td className="px-4 py-3 capitalize">
                {project.size?.toLowerCase() || "medium"}
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${project.progress ?? 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium min-w-[40px]">
                    {project.progress ?? 0}%
                  </span>
                </div>
              </td>

              <td className="px-4 py-3">
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(project.status === "PLANNED" ||
                    project.status === "PENDING") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => onInitializeClick(project.id, e)}
                    >
                      Initialize
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onProjectClick(project)}
                  >
                    View
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ================================================================
// Empty State & Skeleton
// ================================================================

function EmptyState({
  hasFilters,
  onClearFilters,
  router,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  router: any;
}) {
  return (
    <div className="text-center py-16 border-2 border-dashed rounded-xl">
      <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
        <FolderOpen className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No projects found</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {hasFilters
          ? "No projects match your current filters. Try adjusting your search criteria."
          : "Get started by creating a new project or importing existing data."}
      </p>
      <div className="flex gap-3 justify-center">
        {hasFilters && (
          <Button onClick={onClearFilters} variant="outline">
            Clear all filters
          </Button>
        )}
        <Button onClick={() => router.push("/projects/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </div>
    </div>
  );
}

function ProjectsTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
