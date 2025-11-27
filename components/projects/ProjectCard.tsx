"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const statusColors = {
  PLANNING: "bg-gray-200 text-gray-900",
  ACTIVE: "bg-emerald-200 text-emerald-900",
  ON_HOLD: "bg-amber-200 text-amber-900",
  COMPLETED: "bg-blue-200 text-blue-900",
  CANCELLED: "bg-red-200 text-red-900",
};

export default function ProjectCard({ project }) {
  const router = useRouter();

  const handleInitialize = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent link navigation
    router.push(`/projects/${project.id}/initialize`);
  };

  return (
    <Link
      href={project.initialized ? `/projects/${project.id}` : "#"}
      className="block"
    >
      <Card className="p-5 space-y-4 border hover:shadow transition">
        <CardContent className="p-0 space-y-3">
          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description || "No description"}
          </p>

          {/* Status + Priority */}
          <div className="flex items-center justify-between">
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                statusColors[project.status]
              }`}
            >
              {project.status.replace("_", " ")}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {project.priority} priority
            </span>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{project.progress || 0}%</span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded">
              <div
                className="h-1.5 rounded bg-primary"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
          </div>

          {/* Initialize button if NOT initialized */}
          {!project.initialized && (
            <Button
              size="sm"
              onClick={handleInitialize}
              className="w-full mt-3"
            >
              Initialize Project
            </Button>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
