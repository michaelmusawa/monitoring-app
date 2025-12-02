// components/projects/ProjectDetailsCard.tsx
import React from "react";
import Link from "next/link";
import {
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Project = {
  id: string;
  name: string;
  sector?: string;
  budget?: number | null;
  status?: string;
  size?: string;
  description?: string;
  progress?: number;
  members?: string[];
  lat?: number | null;
  long?: number | null;
  prerequisites?: string[];
};

interface ProjectDetailsCardProps {
  project: Project;
  onClose?: () => void;
  showActions?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  PLANNED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ACTIVE:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  ONGOING:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  COMPLETE:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  RETIRED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  STALLED:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const sizeColors: Record<string, string> = {
  SMALL: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  LARGE:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  MEGA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function ProjectDetailsCard({
  project,
  onClose,
  showActions = true,
}: ProjectDetailsCardProps) {
  if (!project) return null;

  const formatBudget = (budget: number | null | undefined) => {
    if (budget === null || budget === undefined) return "N/A";
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  return (
    <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 max-w-md w-full">
      <div className="mb-2">
        <h2 className="text-xl font-bold">{project.name}</h2>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          ID: {project.id}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1">Description</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {project.description}
          </p>
        </div>
      )}

      {/* Key Information Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Status</p>
            <span
              className={`text-sm font-medium px-2 py-1 rounded ${
                statusColors[project.status || ""] || statusColors.PENDING
              }`}
            >
              {getStatusLabel(project.status)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-zinc-500" />
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Size</p>
            <span
              className={`text-sm font-medium px-2 py-1 rounded ${
                sizeColors[project.size || "MEDIUM"] || sizeColors.MEDIUM
              }`}
            >
              {project.size || "Medium"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-zinc-500" />
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Sector</p>
            <p className="text-sm font-medium">{project.sector || "N/A"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-zinc-500" />
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Budget</p>
            <p className="text-sm font-medium">
              {formatBudget(project.budget)}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-semibold">Progress</h3>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {project.progress || 0}%
          </span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${project.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Prerequisites */}
      {project.prerequisites && project.prerequisites.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1">Prerequisites</h3>
          <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            {project.prerequisites.map((prereq, idx) => (
              <li key={idx}>{prereq}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Location */}
      {project.lat && project.long && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1">Location</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Latitude: {project.lat.toFixed(6)}, Longitude:{" "}
            {project.long.toFixed(6)}
          </p>
        </div>
      )}

      {/* Members */}
      {project.members && project.members.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members ({project.members.length})
          </h3>
          <div className="space-y-1">
            {project.members.slice(0, 5).map((member, idx) => (
              <p key={idx} className="text-sm text-zinc-600 dark:text-zinc-400">
                {member}
              </p>
            ))}
            {project.members.length > 5 && (
              <p className="text-xs text-zinc-500">
                +{project.members.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800 mt-2">
          <Link href={`/projects/${project.id}`} className="flex-1">
            <Button className="w-full" variant="default">
              View Details
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
