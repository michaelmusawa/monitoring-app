// components/portal/PortalClient.tsx
"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import ProjectsList from "./ProjectsList";
import ProjectDetailsModal from "./ProjectDetailsModal";

// dynamic map (react-leaflet) client-only component
const ProjectsMapClient = dynamic(
  () => import("../dashboard/ProjectsMapClient"),
  {
    ssr: false,
  }
);

export default function PortalClient({ projects = [], publicComments = [] }) {
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | ONGOING | STALLED | COMPLETED
  const [query, setQuery] = useState("");
  const [subCounty, setSubCounty] = useState("ALL");
  const [ward, setWard] = useState("ALL");
  const [selectedProject, setSelectedProject] = useState(null);

  // Derive lists for filters (subcounty/ward) from projects (fallback to empty)
  const subCounties = useMemo(() => {
    const s = Array.from(
      new Set(projects.map((p) => p.subCounty || "Unknown"))
    );
    return ["ALL", ...s];
  }, [projects]);

  const wards = useMemo(() => {
    const w = Array.from(new Set(projects.map((p) => p.ward || "Unknown")));
    return ["ALL", ...w];
  }, [projects]);

  // Filter by tab (stage/status), search, and geography
  const filtered = useMemo(() => {
    return projects
      .filter((p) => {
        if (activeTab === "ONGOING")
          return (
            p.stage === "tracking" ||
            p.status === "ACTIVE" ||
            p.status === "ongoing"
          );
        if (activeTab === "STALLED")
          return (
            p.status === "ON_HOLD" ||
            p.status === "Stalled" ||
            p.stage === "stalled"
          );
        if (activeTab === "COMPLETED")
          return (
            p.stage === "completed" ||
            p.status === "COMPLETED" ||
            p.status === "completed"
          );
        return true;
      })
      .filter((p) => {
        if (subCounty !== "ALL" && (p.subCounty || "Unknown") !== subCounty)
          return false;
        if (ward !== "ALL" && (p.ward || "Unknown") !== ward) return false;
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.sector?.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q)
        );
      });
  }, [projects, activeTab, query, subCounty, ward]);

  // Summary counts
  const counts = useMemo(() => {
    const total = projects.length;
    const ongoing = projects.filter(
      (p) =>
        p.stage === "tracking" ||
        p.status === "ACTIVE" ||
        p.status === "ongoing"
    ).length;
    const stalled = projects.filter(
      (p) => p.status === "ON_HOLD" || p.status === "Stalled"
    ).length;
    const completed = projects.filter(
      (p) =>
        p.stage === "completed" ||
        p.status === "COMPLETED" ||
        p.status === "completed"
    ).length;
    return { total, ongoing, stalled, completed };
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900">
          <div className="text-sm text-muted-foreground">Total projects</div>
          <div className="text-2xl font-bold">{counts.total}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900">
          <div className="text-sm text-muted-foreground">Ongoing</div>
          <div className="text-2xl font-bold">{counts.ongoing}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900">
          <div className="text-sm text-muted-foreground">Stalled</div>
          <div className="text-2xl font-bold">{counts.stalled}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white dark:bg-zinc-900">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-2xl font-bold">{counts.completed}</div>
        </div>
      </div>

      {/* Tabs + search + filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1 rounded ${
              activeTab === "ALL"
                ? "bg-zinc-100 dark:bg-zinc-800"
                : "hover:bg-zinc-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("ONGOING")}
            className={`px-3 py-1 rounded ${
              activeTab === "ONGOING"
                ? "bg-emerald-100 dark:bg-emerald-800/30"
                : "hover:bg-zinc-50"
            }`}
          >
            Ongoing ({counts.ongoing})
          </button>
          <button
            onClick={() => setActiveTab("STALLED")}
            className={`px-3 py-1 rounded ${
              activeTab === "STALLED"
                ? "bg-amber-100 dark:bg-amber-800/30"
                : "hover:bg-zinc-50"
            }`}
          >
            Stalled ({counts.stalled})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-3 py-1 rounded ${
              activeTab === "COMPLETED"
                ? "bg-blue-100 dark:bg-blue-800/30"
                : "hover:bg-zinc-50"
            }`}
          >
            Completed ({counts.completed})
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative">
            <Input
              placeholder="Search projects..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>

          {/* sub-county and ward selectors */}
          <div className="flex gap-2">
            <select
              className="px-3 py-2 rounded border bg-background"
              value={subCounty}
              onChange={(e) => {
                setSubCounty(e.target.value);
                setWard("ALL");
              }}
            >
              {subCounties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              className="px-3 py-2 rounded border bg-background"
              value={ward}
              onChange={(e) => setWard(e.target.value)}
            >
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main layout: map + list */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
            <h3 className="font-semibold mb-3">Projects Map</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
              Click on markers to view project details
            </p>
            <ProjectsMapClient projects={filtered} />
          </div>

          <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
            <h3 className="font-semibold mb-3">Projects</h3>
            <ProjectsList
              projects={filtered}
              onSelect={(p) => setSelectedProject(p)}
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
            <h3 className="font-semibold">What people say</h3>
            <div className="mt-3 space-y-3">
              {publicComments.slice(0, 5).map((c) => (
                <div key={c.id} className="text-sm">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-muted-foreground">{c.message}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.createdAt}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
            <h3 className="font-semibold">Quick actions</h3>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                onClick={() => {
                  setActiveTab("ONGOING");
                }}
              >
                Show ongoing
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setActiveTab("STALLED");
                }}
              >
                Show stalled
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Project details modal */}
      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
