// File: components/projects/ProjectReports.tsx

"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getTrackers } from "@/lib/actions/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function ProjectReports({ projectId }: { projectId: string }) {
  const [trackers, setTrackers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const t = await getTrackers(projectId);
      setTrackers(t);
    })();
  }, [projectId]);

  return (
    <Card>
      {" "}
      <CardHeader>
        {" "}
        <CardTitle>Reports</CardTitle>{" "}
      </CardHeader>{" "}
      <CardContent>
        {" "}
        <p className="text-sm text-muted-foreground">
          Auto-generated summaries from trackers.
        </p>
        <div className="mt-4 space-y-2">
          {trackers.map((tr) => (
            <div
              key={tr.id}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div>
                <div className="font-medium">{tr.title}</div>
                <div className="text-xs text-muted-foreground">
                  Submitted: {tr.submittedAt}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/projects/${projectId}/tracker/${tr.id}`)
                  }
                >
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
