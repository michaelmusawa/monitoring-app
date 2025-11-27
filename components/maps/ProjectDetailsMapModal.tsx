"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, MapPin, Calendar, DollarSign, Users } from "lucide-react";
import { CIDPProject } from "@/lib/types/types";

interface ProjectDetailsMapModalProps {
  project: CIDPProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProjectDetailsMapModal({
  project,
  open,
  onOpenChange,
}: ProjectDetailsMapModalProps) {
  if (!project) return null;

  const statusColors = {
    PLANNING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    ON_HOLD: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };

  const priorityColors = {
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    LOW: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{project.name}</DialogTitle>
          <DialogDescription>{project.code}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Description */}
          {project.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {project.description}
              </p>
            </div>
          )}

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Status</p>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    statusColors[project.status] || statusColors.PLANNING
                  }`}
                >
                  {project.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Priority</p>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded ${
                    priorityColors[project.priority] || priorityColors.MEDIUM
                  }`}
                >
                  {project.priority}
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
                  {project.budget
                    ? new Intl.NumberFormat("en-KE", {
                        style: "currency",
                        currency: "KES",
                        minimumFractionDigits: 0,
                      }).format(project.budget)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
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

          {/* Stage */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Stage</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 capitalize">
              {project.stage || "Not started"}
            </p>
          </div>

          {/* Location */}
          {project.lat && project.lng && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Location</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Latitude: {project.lat.toFixed(6)}, Longitude: {project.lng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Members */}
          {project.members && project.members.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members ({project.members.length})
              </h3>
              <div className="space-y-1">
                {project.members.slice(0, 5).map((member, idx) => (
                  <p key={idx} className="text-sm text-zinc-600 dark:text-zinc-400">
                    {member.user?.email || "Unknown"}
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
          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link href={`/projects/${project.id}`} className="flex-1">
              <Button className="w-full" variant="default">
                View Details
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

