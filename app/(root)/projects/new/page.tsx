import { auth } from "@/auth";
import CreateProjectClient from "@/components/projects/createProjectClient";
import { getUser } from "@/lib/actions/usersActions";
import { safeQuery } from "@/lib/db";

export default async function NewProjectPage(props: {
  searchParams?: Promise<{
    categoryId?: string;
    categoryName?: string;
    sector?: string;
  }>;
}) {
  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const userRole = user?.role;
  const userSector = user?.sector;

  if (userSector === "Monitoring And Evaluation") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          You do not have permission to create a project.
        </h1>
      </div>
    );
  }

  const searchParams = await props.searchParams;
  const defaultSector = userSector || searchParams?.sector || "";
  const categoryId = searchParams?.categoryId;
  const categoryName = searchParams?.categoryName;

  let categoryTarget: number | null = null;
  let categoryTargetType: "NUMBER" | "PERCENT" | null = null;
  let remainingTarget: number | null = null;

  if (categoryId) {
    const catRes = await safeQuery<{ target: number; targetType: string }>(
      `SELECT target, targetType FROM ProjectCategory WHERE id = @p1`,
      [categoryId],
    );
    if (catRes.rows.length > 0) {
      categoryTarget = catRes.rows[0].target;
      categoryTargetType = catRes.rows[0].targetType as "NUMBER" | "PERCENT";
      const contribRes = await safeQuery<{ sum: number }>(
        `SELECT SUM(contributionValue) AS sum FROM Project WHERE categoryId = @p1 AND status != 'ARCHIVED'`,
        [categoryId],
      );
      const currentSum = contribRes.rows[0]?.sum ?? 0;
      remainingTarget = categoryTarget - currentSum;
      if (remainingTarget < 0) remainingTarget = 0;
    }
  }

  return (
    <CreateProjectClient
      categoryId={categoryId}
      categoryName={categoryName}
      defaultSector={defaultSector}
      categoryTarget={categoryTarget}
      categoryTargetType={categoryTargetType}
      remainingTarget={remainingTarget}
    />
  );
}
