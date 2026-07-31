import { auth } from "@/auth";
import CreateProjectClient from "@/components/projects/createProjectClient";
import { getUser } from "@/lib/actions/usersActions";
import { safeQuery } from "@/lib/db";

async function getOrgUnitIdByName(name: string): Promise<string | null> {
  const { rows } = await safeQuery<{ id: string }>(
    `SELECT id FROM OrganisationalUnit WHERE name = @p1 AND parentId IS NULL AND isActive = 1`,
    [name],
  );
  return rows[0]?.id ?? null;
}

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
  const userSector = user?.sector; // e.g. "Mobility And Works"

  if (userSector === "Monitoring And Evaluation") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-semibold">
          You do not have permission to create a project.
        </h1>
      </div>
    );
  }

  const searchParams = await props.searchParams;

  // 1. Resolve default organisational unit ID
  let defaultOrgUnitId = "";
  if (userSector) {
    const id = await getOrgUnitIdByName(userSector);
    if (id) defaultOrgUnitId = id;
  }
  const paramSectorName = searchParams?.sector;
  if (paramSectorName) {
    const id = await getOrgUnitIdByName(paramSectorName);
    if (id) defaultOrgUnitId = id;
  }

  // 2. Pre‑selected category (if coming from “Add Project” button)
  const categoryId = searchParams?.categoryId;
  const categoryName = searchParams?.categoryName;

  let initialCategoryTarget: number | null = null;
  let initialCategoryTargetType: "NUMBER" | "PERCENT" | null = null;
  let initialRemainingTarget: number | null = null;

  if (categoryId) {
    const catRes = await safeQuery<{ target: number; targetType: string }>(
      `SELECT target, targetType FROM ProjectCategory WHERE id = @p1`,
      [categoryId],
    );
    if (catRes.rows.length > 0) {
      initialCategoryTarget = catRes.rows[0].target;
      initialCategoryTargetType = catRes.rows[0].targetType as
        | "NUMBER"
        | "PERCENT";
      const contribRes = await safeQuery<{ sum: number }>(
        `SELECT SUM(contributionValue) AS sum FROM Project WHERE categoryId = @p1`,
        [categoryId],
      );
      const currentSum = contribRes.rows[0]?.sum ?? 0;
      initialRemainingTarget = initialCategoryTarget - currentSum;
      if (initialRemainingTarget < 0) initialRemainingTarget = 0;
    }
  }

  console.log(initialCategoryTarget, initialRemainingTarget);

  return (
    <CreateProjectClient
      initialCategoryId={categoryId} // ✅ correct prop name
      initialCategoryName={categoryName} // ✅
      defaultOrgUnitId={defaultOrgUnitId}
      initialCategoryTarget={initialCategoryTarget} // ✅
      initialCategoryTargetType={initialCategoryTargetType} // ✅
      initialRemainingTarget={initialRemainingTarget} // ✅
    />
  );
}
