// app/dashboard/[role]/billers/page.tsx

import AddUserModal from "@/components/admin/AddUserModal";
import ToggleShowArchived from "@/components/admin/ToggleShowArchived";
import UsersTable from "@/components/admin/UsersTable";
import DateRangeFilter from "@/components/customUI/DateRangeFilter";
import Pagination from "@/components/customUI/Pagination";
import Search from "@/components/customUI/Search";
import UsersTableSkeleton from "@/components/skeleton/UsersTableSkeleton";
import { fetchUsersPages } from "@/lib/actions/usersActions";
import { requireRoleOrRedirect } from "@/lib/utils/authHelper";
import React, { Suspense } from "react";

const Page = async (props: {
  searchParams?: Promise<{
    query?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    deleted?: boolean;
    success?: boolean;
    showArchived?: string; // Add this line to handle showArchived
  }>;
}) => {
  // Ensure the user is logged in and has the correct role
  await requireRoleOrRedirect(["admin"]);

  const searchParams = await props.searchParams;

  const query = searchParams?.query || "";
  const startDate = searchParams?.startDate || "";
  const endDate = searchParams?.endDate || "";
  const showArchived = searchParams?.showArchived === "true"; // Add this line
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchUsersPages(query, startDate, endDate);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage users accounts and permissions
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div className="w-full md:w-auto">
              <AddUserModal />
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              {/* ... existing components */}
              <ToggleShowArchived /> {/* Add this component */}
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex-1 min-w-[200px]">
                <Search placeholder="Search users..." />
              </div>
              <DateRangeFilter
                placeholderStart="Start Date"
                placeholderEnd="End Date"
              />
            </div>
          </div>

          <Suspense key={query + currentPage} fallback={<UsersTableSkeleton />}>
            <UsersTable
              query={query}
              startDate={startDate}
              endDate={endDate}
              currentPage={currentPage}
              showArchived={showArchived}
            />
          </Suspense>

          <div className="mt-6 flex justify-center">
            <Pagination totalPages={totalPages} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
