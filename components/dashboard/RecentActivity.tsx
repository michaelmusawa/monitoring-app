// File: app/(dashboard)/components/RecentActivity.tsx
"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecentActivity } from "@/lib/actions/dashboardActions";

export default function RecentActivity() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    (async () => {
      const data = await getRecentActivity();
      setItems(data);
    })();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((i) => (
          <div key={i.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{i.project}</p>
              <p className="text-sm text-muted-foreground">{i.message}</p>
            </div>
            <Badge>{i.date}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
