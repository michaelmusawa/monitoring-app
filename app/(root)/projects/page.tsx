// app/(root)/projects/page.tsx

import { Suspense } from "react";
import { auth } from "@/auth";
import Search from "@/components/customUI/Search";
import DateRangeFilter from "@/components/customUI/DateRangeFilter";
import ChangeViewToggle from "@/components/projects/ChangeViewToggle";
import ProjectsTableSkeleton from "@/components/skeleton/ProjectsTableSkeleton";
import ProjectsMapServer from "@/components/projects/ProjectsMapServer";
import ProjectsTable from "@/components/projects/ProjectsTable";
import Pagination from "@/components/customUI/Pagination";
import ProjectsMapSkeleton from "@/components/skeleton/ProjectsMapSkeleton";
import { fetchProjectsPages } from "@/lib/actions/projectActions";
import ProjectSizeFilter from "@/components/projects/ProjectSizeFilter";

const Page = async (props: {
  searchParams?: Promise<{
    query?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    size?: string;
    page?: string;
    view?: string;
  }>;
}) => {
  const searchParams = await props.searchParams;

  const session = await auth();
  const userEmail = session?.user?.email || "";

  const query = searchParams?.query || "";
  const startDate = searchParams?.startDate || "";
  const endDate = searchParams?.endDate || "";
  const status = searchParams?.status || "ALL";
  const size = searchParams?.size || "ALL";
  const currentPage = Number(searchParams?.page) || 1;
  const view = searchParams?.view || "table";

  // imaginary server function (wire later)
  const totalPages =
    view === "table"
      ? await fetchProjectsPages(query, startDate, endDate, status, size)
      : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage and monitor all projects
          </p>
        </div>

        {/* Filters Component (Client) */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex-1 min-w-[200px]">
            <Search placeholder="Search projects..." />
          </div>

          <DateRangeFilter
            placeholderStart="Start Date"
            placeholderEnd="End Date"
          />

          <ProjectSizeFilter />

          <div className="flex-1">{/*<ChangeViewToggle />*/}</div>
        </div>

        {/* Server Table wrapped in Suspense */}
        {view === "map" ? (
          <Suspense
            key={query + status + size + view}
            fallback={<ProjectsMapSkeleton />}
          >
            <ProjectsMapServer
              query={query}
              status={status}
              size={size}
              userEmail={userEmail}
            />
          </Suspense>
        ) : (
          <Suspense
            key={query + status + size + currentPage + view}
            fallback={<ProjectsTableSkeleton />}
          >
            <ProjectsTable
              query={query}
              status={status}
              size={size}
              currentPage={currentPage}
              userEmail={userEmail}
            />
          </Suspense>
        )}

        <div className="flex justify-center">
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </main>
  );
};

export default Page;
