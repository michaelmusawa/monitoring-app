// File: app/projects/page.tsx
"use client";
import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, FolderOpen } from "lucide-react";
import { getProjects } from "@/lib/actions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import ProjectsMap from "@/components/dashboard/ProjectsMap";
import ProjectDetailsCard from "@/components/projects/ProjectDetailsCard";
import { CIDPProject } from "@/lib/types/types";

export default function ProjectsPage({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const [projects, setProjects] = useState<CIDPProject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  // filters now holds size; status is driven by the status tabs (statusTab)
  const [filters, setFilters] = useState({ size: "ALL" });
  const [statusTab, setStatusTab] = useState("ALL"); // ALL | ACTIVE | PLANNING | COMPLETED | STALLED | CANCELLED
  const [activeTab, setActiveTab] = useState("cards"); // "cards" | "map"

  useEffect(() => {
    (async () => {
      const data = await getProjects();
      setProjects(data);
    })();
  }, []);

  const visibleProjects = useMemo(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Status driven by statusTab (tabs at the top). If ALL, show everything.
    if (statusTab !== "ALL") {
      filtered = filtered.filter((p) => p.status === statusTab);
    }

    // Size filter (SMALL, MEDIUM, MEGA)
    if (filters.size && filters.size !== "ALL") {
      filtered = filtered.filter((p) => p.size === filters.size);
    }

    return filtered;
  }, [projects, searchTerm, filters, statusTab]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6 pt-20 lg:pt-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track projects
          </p>
        </div>

        {/* Removed standalone Initialize Project and Sponsored Project buttons.
            Initialization is done from the project row actions (for PLANNING projects). */}
      </div>
      {/* Tabs for switching view */}
      <div className="flex gap-3 border-b pb-2 items-center justify-between">
        <div className="flex gap-3">
          <Button
            variant={activeTab === "cards" ? "default" : "ghost"}
            onClick={() => setActiveTab("cards")}
          >
            Cards View
          </Button>
          <Button
            variant={activeTab === "map" ? "default" : "ghost"}
            onClick={() => setActiveTab("map")}
          >
            Map View
          </Button>
        </div>

        {/* Status tabs (All / Active / Planning / Completed / Stalled / Cancelled) */}
        <div className="flex gap-2">
          {[
            "ALL",
            "ACTIVE",
            "PLANNING",
            "COMPLETED",
            "STALLED",
            "CANCELLED",
          ].map((s) => (
            <Button
              key={s}
              variant={statusTab === s ? "default" : "ghost"}
              onClick={() => setStatusTab(s)}
              size="sm"
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>
      </div>
      {/* Filters/Search only visible in cards view for now (can be extended to map if desired) */}
      {activeTab === "cards" && (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* The status filter is controlled by the status tabs above (statusTab).
                Keep a size filter instead of priority. */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-500 mr-2">Status:</label>
              <div className="flex gap-1">
                {[
                  "ALL",
                  "ACTIVE",
                  "PLANNING",
                  "COMPLETED",
                  "STALLED",
                  "CANCELLED",
                ].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusTab === s ? "default" : "ghost"}
                    onClick={() => setStatusTab(s)}
                  >
                    {s === "ALL"
                      ? "All"
                      : s.charAt(0) + s.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>

            <select
              value={filters.size}
              onChange={(e) => setFilters({ ...filters, size: e.target.value })}
              className="px-3 py-2 rounded border bg-background"
            >
              <option value="ALL">All Sizes</option>
              <option value="SMALL">Small</option>
              <option value="MEDIUM">Medium</option>
              <option value="MEGA">Mega</option>
            </select>
          </div>
        </>
      )}
      {/* Tab Content */}
      {activeTab === "cards" ? (
        <div>
          {visibleProjects.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No projects found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create or initialize a project to get started
              </p>
            </div>
          ) : (
            <ProjectsTable projects={visibleProjects} />
          )}
        </div>
      ) : (
        <div className="mt-6">
          {/* Constrain map view to Nairobi center/zoom. ProjectsMapClient uses these if accepted;
              passing props here ensures the intent and will be picked up by a map client
              implementation that accepts center/zoom. */}
          <ProjectsMap
            projects={visibleProjects}
            center={[-1.2921, 36.8219]}
            zoom={12}
          />
        </div>
      )}
    </div>
  );
}

// --- Table and Popover logic ---

// duplicate React import removed

function ProjectsTable({ projects }: { projects: CIDPProject[] }) {
  const [popoverProject, setPopoverProject] = useState<CIDPProject | null>(
    null,
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);

  // Show popover on row click
  const handleRowClick = (
    project: CIDPProject,
    event: React.MouseEvent<HTMLTableRowElement>,
  ) => {
    // If clicking the same row, toggle off
    if (popoverOpen && popoverProject && popoverProject.id === project.id) {
      setPopoverOpen(false);
      setPopoverProject(null);
      setPopoverRect(null);
      return;
    }

    setPopoverProject(project);
    setPopoverOpen(true);
    // Save the bounding rect of the clicked row into state
    const rect = event.currentTarget.getBoundingClientRect();
    setPopoverRect(rect);
  };

  // Hide popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        popoverRect &&
        !document.getElementById("project-details-popover")?.contains(target)
      ) {
        setPopoverOpen(false);
        setPopoverProject(null);
        setPopoverRect(null);
      }
    }
    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popoverOpen, popoverRect]);

  const popoverStyle = popoverRect
    ? {
        // When rendering into document.body via a portal we compute document-level coordinates.
        // Use bounding rect plus page scroll offsets so the popover positions correctly relative to the document.
        top: popoverRect.bottom + window.scrollY + 4,
        left: Math.max(8, popoverRect.left + window.scrollX),
        minWidth: 360,
        maxWidth: 420,
      }
    : {};
  return (
    <div className="relative">
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Name
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Sector
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Size
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Progress
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-blue-50 dark:hover:bg-zinc-900/40 transition cursor-pointer"
                onClick={(e) => handleRowClick(project, e)}
              >
                <td className="px-4 py-2 font-medium">{project.name}</td>
                <td className="px-4 py-2">{project.sector}</td>
                <td className="px-4 py-2 capitalize">
                  {project.status?.toLowerCase()}
                </td>
                <td className="px-4 py-2 capitalize">
                  {project.size?.toLowerCase()}
                </td>
                <td className="px-4 py-2">{project.progress ?? 0}%</td>
                <td className="px-4 py-2 flex gap-2">
                  {project.status === "PLANNING" && !project.initialized && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Initialize via the project's initialize page
                        window.location.href = `/projects/${project.id}/initialize`;
                      }}
                    >
                      Initialize
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      // prevents the row click from also firing (which would toggle the popover)
                      e.stopPropagation();
                      window.location.href = `/projects/${project.id}`;
                    }}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Popover for project details rendered into document.body via portal to avoid clipping/stacking issues */}
      {popoverOpen &&
        popoverProject &&
        popoverRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id="project-details-popover"
            className="absolute z-50"
            style={{ position: "absolute", ...popoverStyle }}
            // stop click propagation inside the popover so outside-click detection works reliably
            onClick={(e) => e.stopPropagation()}
          >
            <ProjectDetailsCard
              project={popoverProject}
              showActions={true}
              onClose={() => {
                setPopoverOpen(false);
                setPopoverProject(null);
                setPopoverRect(null);
              }}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
