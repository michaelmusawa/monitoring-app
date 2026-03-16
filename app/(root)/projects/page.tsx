// app/(root)/projects/page.tsx
import { Suspense } from "react";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import ProjectsByCategoryServer from "@/components/projects/ProjectsByCategoryServer";
import ProjectsCategoryPageClient from "@/components/projects/ProjectsCategoryPageClient";
import ProjectsTableSkeleton from "@/components/skeleton/ProjectsTableSkeleton";

const Page = async (props: {
  searchParams?: Promise<{
    query?: string;
    sector?: string;
  }>;
}) => {
  const searchParams = await props.searchParams;
  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const userRole = user?.sector === "me" ? "me" : "sector";

  const query = searchParams?.query || "";
  const sector = searchParams?.sector || "ALL";

  return (
    <main className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <ProjectsCategoryPageClient userRole={userRole} />
        <Suspense key={query + sector} fallback={<ProjectsTableSkeleton />}>
          <ProjectsByCategoryServer
            query={query}
            sector={sector}
            userRole={userRole}
            userEmail={userEmail}
          />
        </Suspense>
      </div>
    </main>
  );
};

export default Page;
