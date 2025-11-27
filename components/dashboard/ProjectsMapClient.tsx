// components/dashboard/ProjectsMapClient.tsx
"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ProjectDetailsMapModal from "@/components/maps/ProjectDetailsMapModal";
import { CIDPProject } from "@/lib/types/types";

// --- Fix missing default icons in Next.js ---
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

// Create custom icons for different statuses
const createCustomIcon = (status: string) => {
  const statusColors: Record<string, string> = {
    ACTIVE: "#10b981", // emerald
    PLANNING: "#3b82f6", // blue
    ON_HOLD: "#f59e0b", // amber
    COMPLETED: "#6b7280", // gray
  };

  const color = statusColors[status] || "#3b82f6";

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

interface ProjectsMapClientProps {
  projects: CIDPProject[];
  onMarkerClick?: (project: CIDPProject) => void;
}

export default function ProjectsMapClient({
  projects,
  onMarkerClick,
}: ProjectsMapClientProps) {
  const [selectedProject, setSelectedProject] = useState<CIDPProject | null>(null);
  const DEFAULT_COORD = [-1.286389, 36.817223]; // Nairobi

  const handleMarkerClick = (project: CIDPProject) => {
    setSelectedProject(project);
    if (onMarkerClick) {
      onMarkerClick(project);
    }
  };

  return (
    <>
      <MapContainer
        center={[-1.2921, 36.8219]}
        zoom={6}
        className="h-96 w-full rounded-lg"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {projects.map((p) => {
          const lat = Number(p.lat);
          const lng = Number(p.lng);

          const valid =
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180;

          const position = valid ? [lat, lng] : DEFAULT_COORD;
          const customIcon = createCustomIcon(p.status || "PLANNING");

          return (
            <Marker
              key={p.id}
              position={position}
              icon={customIcon}
              eventHandlers={{
                click: () => handleMarkerClick(p),
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <strong className="text-sm font-semibold">{p.name}</strong>
                  <br />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    Status: {p.status || "Unknown"}
                  </span>
                  <br />
                  <span className="text-xs text-zinc-600 dark:text-zinc-400">
                    Sector: {p.sector || "N/A"}
                  </span>
                  {p.progress !== undefined && (
                    <>
                      <br />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        Progress: {p.progress}%
                      </span>
                    </>
                  )}
                  {!valid && (
                    <>
                      <br />
                      <em className="text-xs text-amber-600">(Using default location)</em>
                    </>
                  )}
                  <br />
                  <button
                    onClick={() => handleMarkerClick(p)}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Project Details Modal */}
      <ProjectDetailsMapModal
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
      />
    </>
  );
}
