"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProjectById, getTrackers } from "@/lib/actions/projectActions";
import { ProjectChecklist } from "@/components/projects/ProjectChecklist";
import { ProjectReports } from "@/components/projects/ProjectReports";

export default function ProjectDetailPage({
  projectId,
}: {
  projectId: string;
}) {
  const project = getProjectById(projectId);
  const trackers = getTrackers(projectId);

  const [tab, setTab] = useState("overview");

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {[
          { id: "overview", label: "Overview" },
          { id: "checklist", label: "Checklist" },
          { id: "reports", label: "Reports" },
          { id: "trackers", label: "Trackers" },
        ].map((t) => (
          <Button
            key={t.id}
            variant={tab === t.id ? "default" : "ghost"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "overview" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-muted-foreground">{project.description}</p>
            <div className="text-sm">Status: {project.status}</div>
            <div className="text-sm">Priority: {project.priority}</div>
          </CardContent>
        </Card>
      )}

      {tab === "checklist" && <ProjectChecklist projectId={project.id} />}

      {tab === "reports" && <ProjectReports projectId={project.id} />}

      {tab === "trackers" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            {trackers.map((t) => (
              <a
                key={t.id}
                href={`/projects/${project.id}/tracker/${t.id}`}
                className="block border p-3 rounded hover:bg-accent"
              >
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">
                  Progress: {t.progress}%
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
