import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/usersActions";
import { getFullProject } from "@/lib/actions/projectActions";
import EditProjectClient from "@/components/projects/EditProjectClient";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await auth();
  const user = await getUser(session?.user?.email ?? "");
  const { projectId } = await params;

  // Only sector users and admins can edit projects (ME officers cannot)
  if (!session || user?.sector === "Monitoring And Evaluation") {
    redirect(`/projects/${projectId}`);
  }

  const project = await getFullProject(projectId);
  if (!project) redirect("/projects");

  // Also fetch category target info if the project has a category
  let categoryTarget: number | null = null;
  let categoryTargetType: "NUMBER" | "PERCENT" | null = null;
  let remainingTarget: number | null = null;
  if (project.categoryId) {
    const { safeQuery } = await import("@/lib/db");
    const catRes = await safeQuery<{ target: number; targetType: string }>(
      `SELECT target, targetType FROM ProjectCategory WHERE id = @p1`,
      [project.categoryId],
    );
    if (catRes.rows.length > 0) {
      categoryTarget = catRes.rows[0].target;
      categoryTargetType = catRes.rows[0].targetType as "NUMBER" | "PERCENT";
      const contribRes = await safeQuery<{ sum: number }>(
        `SELECT SUM(contributionValue) AS sum FROM Project WHERE categoryId = @p1 AND id != @p2 AND status != 'ARCHIVED'`,
        [project.categoryId, projectId],
      );
      const currentSum = contribRes.rows[0]?.sum ?? 0;
      remainingTarget = categoryTarget - currentSum;
      if (remainingTarget < 0) remainingTarget = 0;
    }
  }

  return (
    <EditProjectClient
      project={project}
      categoryTarget={categoryTarget}
      categoryTargetType={categoryTargetType}
      remainingTarget={remainingTarget}
    />
  );
}
