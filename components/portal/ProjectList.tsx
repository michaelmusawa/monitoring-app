"use client";

import Link from "next/link";
import { MapPin, DollarSign, TrendingUp, Calendar } from "lucide-react";
import type { PublicProject } from "@/lib/actions/publicActions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function fmtCurrency(n: number | null | undefined) {
  if (!n) return "—";
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  return `KES ${n.toLocaleString()}`;
}

export default function ProjectList({
  projects,
}: {
  projects: PublicProject[];
}) {
  if (!projects.length) {
    return (
      <div className="text-center py-16 rounded-xl border border-dashed border-muted-foreground/30 bg-card">
        <p className="text-muted-foreground">
          No projects match your criteria. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {projects.map((project) => {
        const statusVariant =
          project.status === "ACTIVE"
            ? "success"
            : project.status === "COMPLETED"
              ? "default"
              : "warning";

        const progressColor =
          (project.progress || 0) > 75
            ? "bg-emerald-500"
            : (project.progress || 0) > 50
              ? "bg-blue-500"
              : (project.progress || 0) > 25
                ? "bg-amber-500"
                : "bg-red-400";

        return (
          <Link
            href={`/portal/${project.id}`}
            key={project.id}
            className="group"
          >
            <Card className="h-full border-border/50 shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden group-hover:border-primary/50">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <h3 className="font-semibold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <Badge
                    variant={statusVariant as any}
                    className="shrink-0 text-xs capitalize"
                  >
                    {project.status === "ACTIVE"
                      ? "Active"
                      : project.status === "COMPLETED"
                        ? "Completed"
                        : "Pending"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">
                    {project.ward
                      ? `${project.ward}, ${project.subCounty}`
                      : project.subCounty || "Location TBD"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {fmtCurrency(project.budget)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Started {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
