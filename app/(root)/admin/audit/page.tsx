import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/usersActions";
import { getUserPermissions } from "@/lib/actions/adminActions";
import { fetchAuditLogs } from "@/lib/actions/auditActions";
import AuditLogTable from "@/components/admin/AuditLogTable";

export default async function AdminAuditPage(props: {
  searchParams?: Promise<{
    page?: string;
    entity?: string;
    action?: string;
    userId?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await getUser(session.user.email);
  if (!user) redirect("/login");

  // ✅ Fetch permissions
  const permissions = await getUserPermissions(user.id);

  // ✅ Check for required permission
  const canViewAudit = permissions.some((p) =>
    ["audit:view", "audit:manage", "admin:full"].includes(p),
  );
  if (!canViewAudit) redirect("/");

  const params = await props.searchParams;
  const page = Number(params?.page) || 1;

  const { logs, totalPages } = await fetchAuditLogs({
    page,
    entityType: params?.entity,
    action: params?.action,
    userId: params?.userId,
  });

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-black mb-6">Audit Logs</h1>
        <AuditLogTable logs={logs} totalPages={totalPages} currentPage={page} />
      </div>
    </div>
  );
}
