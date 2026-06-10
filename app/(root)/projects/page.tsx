import { Suspense } from "react";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import ProjectsByCategoryServer from "@/components/projects/ProjectsByCategoryServer";
import ProjectsCategoryPageClient from "@/components/projects/ProjectsCategoryPageClient";
import ProjectsTableSkeleton from "@/components/skeleton/ProjectsTableSkeleton";
import { getUserRoles } from "@/lib/actions/adminActions";

const Page = async (props: {
  searchParams?: Promise<{
    query?: string;
    sector?: string;
    projectName?: string;
    projectStatus?: string;
    minBudget?: string;
    maxBudget?: string;
    view?: string;
  }>;
}) => {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const userRole = await getUserRoles(user?.id ?? "");
  const userSector = user?.sector ?? "";

  const categoryQuery = searchParams?.query || "";
  const urlSector = searchParams?.sector || "ALL";
  const projectName = searchParams?.projectName || "";
  const projectStatus = searchParams?.projectStatus || "ALL";
  const minBudget = searchParams?.minBudget
    ? Number(searchParams.minBudget)
    : undefined;
  const maxBudget = searchParams?.maxBudget
    ? Number(searchParams.maxBudget)
    : undefined;
  const view = searchParams?.view === "flat" ? "flat" : "grouped";

  // Enforce user's sector if they have one
  const effectiveSector =
    userSector && userSector !== "Monitoring And Evaluation"
      ? userSector
      : urlSector;

  return (
    <main className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <ProjectsCategoryPageClient
          userRole={userRole}
          userSector={userSector}
          currentView={view}
        />
        <Suspense
          key={`${categoryQuery}-${effectiveSector}-${projectName}-${projectStatus}-${minBudget}-${maxBudget}-${view}`}
          fallback={<ProjectsTableSkeleton />}
        >
          <ProjectsByCategoryServer
            categoryQuery={categoryQuery}
            sector={effectiveSector}
            projectName={projectName}
            projectStatus={projectStatus}
            minBudget={minBudget}
            maxBudget={maxBudget}
            view={view}
            userRole={userRole}
            userEmail={userEmail}
          />
        </Suspense>
      </div>
    </main>
  );
};

export default Page;
