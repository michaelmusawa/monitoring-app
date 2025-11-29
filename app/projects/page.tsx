// File: app/projects/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Search, Plus, FolderOpen } from "lucide-react";
import { getProjects } from "@/lib/actions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProjectCard from "@/components/projects/ProjectCard";
import { useRouter } from "next/navigation";
import ProjectsMap from "@/components/dashboard/ProjectsMap";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ status: "ALL", priority: "ALL" });
  const [initFilter, setInitFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState("cards"); // "cards" | "map"

  useEffect(() => {
    (async () => {
      const data = await getProjects();
      setProjects(data);
    })();
  }, []);

  useEffect(() => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.status !== "ALL") {
      filtered = filtered.filter((p) => p.status === filters.status);
    }

    if (filters.priority !== "ALL") {
      filtered = filtered.filter((p) => p.priority === filters.priority);
    }

    if (initFilter === "INIT") {
      filtered = filtered.filter((p) => p.initialized === true);
    } else if (initFilter === "NOT_INIT") {
      filtered = filtered.filter((p) => p.initialized === false);
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, filters, initFilter]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6 pt-20 lg:pt-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track projects
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setInitFilter("NOT_INIT")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Initialize Project
          </Button>
          <Button onClick={() => router.push("/projects/sponsored/new")}>Sponsored Project</Button>
        </div>
      </div>
      {/* Tabs for switching view */}
      <div className="flex gap-3 border-b pb-2">
        <Button variant={activeTab === "cards" ? "default" : "ghost"} onClick={() => setActiveTab("cards")}>Cards View</Button>
        <Button variant={activeTab === "map" ? "default" : "ghost"} onClick={() => setActiveTab("map")}>Map View</Button>
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
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 rounded border bg-background"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PLANNING">Planning</option>
              <option value="COMPLETED">Completed</option>
              <option value="STALLED">Stalled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-2 rounded border bg-background"
            >
              <option value="ALL">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select
              value={initFilter}
              onChange={(e) => setInitFilter(e.target.value)}
              className="px-3 py-2 rounded border bg-background"
            >
              <option value="ALL">All</option>
              <option value="INIT">Initialized</option>
              <option value="NOT_INIT">Not Initialized</option>
            </select>
          </div>
          {initFilter === "NOT_INIT" && (
            <p className="text-muted-foreground text-sm">Choose a project below to initialize.</p>
          )}
        </>
      )}
      {/* Tab Content */}
      {activeTab === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No projects found</h3>
              <p className="text-sm text-muted-foreground mb-6">Create or initialize a project to get started</p>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      ) : (
        <div className="mt-6">
          <ProjectsMap projects={filteredProjects} />
        </div>
      )}
    </div>
  );
}
