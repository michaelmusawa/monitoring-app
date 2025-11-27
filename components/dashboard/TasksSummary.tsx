// File: app/(dashboard)/components/TasksSummary.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTaskSummary } from "@/lib/actions/dashboardActions";

export default function TasksSummary() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getTaskSummary();
      setTasks(data);
    })();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Task Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between">
            <p className="font-medium">{t.title}</p>
            <Badge>{t.count}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
