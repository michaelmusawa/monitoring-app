// app/projects/[projectId]/reports/page.tsx
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/actions/projectActions";
import { getUser } from "@/lib/actions/usersActions";
import { getChecklist } from "@/lib/actions/checklistActions";
import { getTrackerSubmissions } from "@/lib/actions/trackerActions";
import ReportsPage from "@/components/reports/ReportsPage";

export default async function ProjectReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const userEmail = session?.user?.email ?? "";

  const [user, project] = await Promise.all([
    getUser(userEmail),
    getProject(projectId),
  ]);

  if (!project) notFound();

  const isME = user?.sector === "Monitoring And Evaluation";
  const userRole = isME ? "me" : "sector";

  // Fetch additional data only for ME (to enable report generation)
  let checklistItems: any[] = [];
  let trackerItems: any[] = [];
  let latestTracker: any = null;

  if (isME) {
    // 1. Approved checklist items (with weights > 0)
    const checklist = await getChecklist(projectId);
    if (checklist && checklist.status === "Approved") {
      checklistItems = checklist.items
        .filter((i: any) => i.weight > 0)
        .map((i: any) => ({
          label: i.label,
          category: i.category,
          percent: 0, // will be updated from tracker if available
        }));
    }

    // 2. Latest tracker submission with items
    const submissions = await getTrackerSubmissions(projectId);
    if (submissions.length > 0) {
      latestTracker = submissions[submissions.length - 1]; // newest last
      // Merge tracker percent into checklistItems
      const percentMap: Record<string, number> = {};
      for (const item of latestTracker.items) {
        percentMap[item.parameterId] = item.percentComplete;
      }
      checklistItems = checklistItems.map((ci: any) => {
        const pc = percentMap[ci.parameterId];
        return { ...ci, percent: pc ?? 0 };
      });
      trackerItems = latestTracker.items;
    }
  }

  return (
    <ReportsPage
      projectId={projectId}
      projectName={project.name}
      userRole={userRole}
      // Pass generation data
      generationData={{
        projectName: project.name,
        projectSector: project.sector,
        location: project.subCounty
          ? `${project.ward ? project.ward + ", " : ""}${project.subCounty}`
          : project.ward || "Nairobi City County",
        checklistItems,
        trackerItems,
        trackerData: latestTracker
          ? {
              overallPercent: latestTracker.overallPercent,
              categories: buildCategorySummary(latestTracker),
            }
          : null,
      }}
    />
  );
}

// Helper to build category summary from tracker items (same as in trackers)
function buildCategorySummary(
  submission: any,
): { name: string; latestPercent: number }[] {
  const map: Record<string, { sum: number; count: number }> = {};
  for (const item of submission.items) {
    if (!map[item.category]) map[item.category] = { sum: 0, count: 0 };
    map[item.category].sum += item.percentComplete;
    map[item.category].count++;
  }
  return Object.entries(map).map(([name, data]) => ({
    name,
    latestPercent: data.sum / data.count,
  }));
}
