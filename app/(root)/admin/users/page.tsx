// app/(root)/admin/users/page.tsx

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/usersActions";
import { fetchUsersPages } from "@/lib/actions/adminActions";
import AdminUsersClient from "@/components/admin/UsersTable";

export default async function AdminUsersPage(props: {
  searchParams?: Promise<{
    query?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
    showArchived?: string;
  }>;
}) {
  const session = await auth();
  const user = await getUser(session?.user?.email ?? "");
  if (!session || user?.role !== "system admin") redirect("/");

  const searchParams = await props.searchParams;
  const query = searchParams?.query ?? "";
  const startDate = searchParams?.startDate ?? "";
  const endDate = searchParams?.endDate ?? "";
  const showArchived = searchParams?.showArchived === "true";
  const currentPage = Number(searchParams?.page) || 1;

  const totalPages = await fetchUsersPages(
    query,
    startDate,
    endDate,
    showArchived,
  );

  return (
    <AdminUsersClient
      query={query}
      startDate={startDate}
      endDate={endDate}
      currentPage={currentPage}
      totalPages={totalPages}
      showArchived={showArchived}
    />
  );
}
