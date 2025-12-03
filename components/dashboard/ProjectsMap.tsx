// components/dashboard/ProjectsMap.tsx
"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";

// Fix Leaflet marker assets for Next.js
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

type Project = {
  id: string;
  name: string;
  sector?: string;
  lat?: number | null;
  long?: number | null;
  progress?: number;
  status?: string;
};

interface ProjectsMapProps {
  projects: Project[];
  center?: [number, number];
  zoom?: number;
}

// 🎨 Color based on project status
const getStatusColor = (status?: string) => {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
    case "ONGOING":
      return "#10b981";
    case "COMPLETED":
    case "COMPLETE":
      return "#8b5cf6";
    case "PENDING":
    case "PLANNED":
      return "#3b82f6";
    case "STALLED":
      return "#f59e0b";
    case "RETIRED":
      return "#6b7280";
    default:
      return "#6b7280";
  }
};

// 🖼 Generate marker icon SVG and encode it
const createSvgIcon = (color: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="14" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>
  `;

  return new Icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svg),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function ProjectsMap({
  projects,
  center = [-1.2921, 36.8219], // Nairobi
  zoom = 12,
}: ProjectsMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only allow valid lat/long values (including 0)
  const projectsWithCoords = projects.filter(
    (p) =>
      p.lat !== undefined &&
      p.long !== undefined &&
      p.lat !== null &&
      p.long !== null &&
      !isNaN(Number(p.lat)) &&
      !isNaN(Number(p.long)),
  );

  if (!isClient) {
    return (
      <div className="h-[600px] rounded-lg border bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (projectsWithCoords.length === 0) {
    return (
      <div className="h-[600px] rounded-lg border flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-400 text-2xl">📍</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No location data</h3>
          <p className="text-sm text-gray-500">
            No projects have location coordinates available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] rounded-lg border overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {projectsWithCoords.map((project) => (
          <Marker
            key={project.id}
            position={[project.lat!, project.long!]}
            icon={createSvgIcon(getStatusColor(project.status))}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm mb-1">{project.name}</h3>
                <p className="text-xs text-gray-600 mb-1">
                  Sector: {project.sector || "N/A"}
                </p>
                <p className="text-xs text-gray-600 mb-1">
                  Status: {project.status || "Unknown"}
                </p>
                <p className="text-xs text-gray-600">
                  Progress: {project.progress || 0}%
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
