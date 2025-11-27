"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getTrackers } from "@/lib/actions/actions";

export function ProjectAnalytics({ projectId }: { projectId: string }) {
  const [analytics, setAnalytics] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const trackers = await getTrackers(projectId);
      const latest = trackers[0];

      const stats = [
        {
          id: "a1",
          label: "Overall Completion",
          value: `${latest?.overallPercent ?? 0}%`,
        },
        {
          id: "a2",
          label: "Checklist Items",
          value: latest?.items?.length ?? 0,
        },
        {
          id: "a3",
          label: "Completed Items",
          value:
            latest?.items?.filter((i: any) => i.percentComplete === 100)
              ?.length ?? 0,
        },
      ];

      setAnalytics(stats);
    })();
  }, [projectId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {analytics.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle>{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
