// components/dashboard/ProjectsMapClient.tsx
"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ProjectDetailsMapModal from "@/components/maps/ProjectDetailsMapModal";

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
  projects: any[];
  onMarkerClick?: (project: any) => void;
  /**
   * When true the map view is constrained to Nairobi region.
   * Defaults to true since projects are within Nairobi county.
   */
  centerOnlyNairobi?: boolean;
  /**
   * Optional center override [lat, lng].
   * Ignored when centerOnlyNairobi is true.
   */
  center?: [number, number];
  /**
   * Optional zoom override.
   */
  zoom?: number;
}

export default function ProjectsMapClient({
  projects,
  onMarkerClick,
  centerOnlyNairobi = true,
  center = [-1.2921, 36.8219],
  zoom = 12,
}: ProjectsMapClientProps) {
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // Nairobi default center
  const DEFAULT_COORD: [number, number] = [-1.2921, 36.8219];

  const handleMarkerClick = (project: any) => {
    setSelectedProject(project);
    if (onMarkerClick) {
      onMarkerClick(project);
    }
  };

  // Compute effective center/zoom based on props and whether we should constrain to Nairobi
  const mapCenter: [number, number] = centerOnlyNairobi
    ? DEFAULT_COORD
    : (center as [number, number]);
  const mapZoom = zoom;

  // Approximate bounding box for Nairobi county (southWest, northEast)
  // This will keep the map constrained to Nairobi region.
  const NAIROBI_BOUNDS: [number, number][] = [
    [-1.5, 36.6], // southWest
    [-1.0, 37.0], // northEast
  ];

  return (
    <>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        // Constrain to Nairobi bounds if requested
        bounds={NAIROBI_BOUNDS}
        maxBounds={NAIROBI_BOUNDS}
        minZoom={10}
        maxZoom={16}
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
                      <em className="text-xs text-amber-600">
                        (Using default location)
                      </em>
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
