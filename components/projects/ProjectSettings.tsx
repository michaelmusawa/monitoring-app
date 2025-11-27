"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProjectById } from "@/lib/actions/actions";

export function ProjectSettings({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const p = await getProjectById(projectId);
      setProject(p);
    })();
  }, [projectId]);

  if (!project) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">Project Name</p>
          <p className="text-muted-foreground text-sm">{project.name}</p>
        </div>

        <div>
          <p className="font-medium">Sector</p>
          <p className="text-muted-foreground text-sm">{project.sector}</p>
        </div>

        <div>
          <p className="font-medium">Budget</p>
          <p className="text-sm text-muted-foreground">{project.budget}</p>
        </div>

        <Button className="w-full">Update Settings</Button>
      </CardContent>
    </Card>
  );
}
