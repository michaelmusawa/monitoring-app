// components/dashboard/ProjectsMap.tsx
"use client";

import dynamic from "next/dynamic";
const MapContainer = dynamic(() => import("./ProjectsMapClient"), {
  ssr: false,
});

export default function ProjectsMap({ projects }) {
  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
      <h3 className="font-semibold mb-3">Projects Map</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
        Click on markers to view project details
      </p>
      <MapContainer projects={projects} />
    </div>
  );
}
