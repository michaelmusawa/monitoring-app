"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function ProjectCalendar({ projectId }: { projectId: string }) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    // Dummy events (prototype only)
    setEvents([
      {
        id: "ev1",
        title: "Site Visit",
        date: "2025-11-10",
      },
      {
        id: "ev2",
        title: "Materials Delivery",
        date: "2025-11-14",
      },
    ]);
  }, [projectId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {events.map((ev) => (
          <div key={ev.id} className="p-3 border rounded-xl">
            <p className="font-medium">{ev.title}</p>
            <p className="text-sm text-muted-foreground">{ev.date}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
