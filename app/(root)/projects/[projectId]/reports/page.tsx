// app/projects/[projectId]/reports/page.tsx
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/actions/projectActions";
import ReportsPage from "@/components/reports/ReportsPage";

const ME_OFFICER = "meofficer@gmail.com";
const SECTOR_OFFICER = "sectorofficer@gmail.com";

export default async function ProjectReportsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  const userEmail = session?.user?.email ?? "";

  const project = await getProject(projectId);
  if (!project) notFound();

  const userRole =
    userEmail === ME_OFFICER
      ? "me"
      : userEmail === SECTOR_OFFICER
        ? "sector"
        : "viewer";

  return (
    <ReportsPage
      projectId={projectId}
      projectName={project.name}
      userRole={userRole}
    />
  );
}
