import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getProjectProgressData,
  getChecklistStatusData,
  getSectorPerformanceData,
  getPendingChangeRequestsData,
} from "@/lib/actions/reportActions";
import { ProjectProgressReport } from "@/components/reports/ProjectProgressReport";
import { ChecklistStatusReport } from "@/components/reports/ChecklistStatusReport";
import { TrackerSubmissionsReport } from "@/components/reports/TrackerSubmissionsReport";
import { SectorPerformanceReport } from "@/components/reports/SectorPerformanceReport";
import { PendingChangeRequestsReport } from "@/components/reports/PendingChangeRequestsReport";

export default async function ReportsPage() {
  const session = await auth();
  // Restrict to authenticated users (admin / sector officer / me officer)
  if (!session?.user?.email) redirect("/");

  // Pre-fetch data for server components
  const projectProgressData = await getProjectProgressData();
  const checklistStatusData = await getChecklistStatusData();
  const sectorPerformanceData = await getSectorPerformanceData();
  const pendingRequestsData = await getPendingChangeRequestsData();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Reports & Analytics
        </h1>
        <p className="text-muted-foreground">
          Monitor project performance, checklist status, and sector trends.
        </p>
      </div>

      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2">
          <TabsTrigger value="progress">Project Progress</TabsTrigger>
          <TabsTrigger value="checklist">Checklist Status</TabsTrigger>
          <TabsTrigger value="trackers">Tracker Submissions</TabsTrigger>
          <TabsTrigger value="sector">Sector Performance</TabsTrigger>
          <TabsTrigger value="pending">Pending Changes</TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          <Suspense fallback={<ReportSkeleton />}>
            <ProjectProgressReport initialData={projectProgressData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="checklist">
          <Suspense fallback={<ReportSkeleton />}>
            <ChecklistStatusReport initialData={checklistStatusData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="trackers">
          <Suspense fallback={<ReportSkeleton />}>
            <TrackerSubmissionsReport projectId={null} />
          </Suspense>
        </TabsContent>

        <TabsContent value="sector">
          <Suspense fallback={<ReportSkeleton />}>
            <SectorPerformanceReport initialData={sectorPerformanceData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="pending">
          <Suspense fallback={<ReportSkeleton />}>
            <PendingChangeRequestsReport initialData={pendingRequestsData} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
