import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/usersActions";
import { fetchAllRoles, fetchAllPermissions } from "@/lib/actions/adminActions";
import RolesClient from "@/components/admin/RolesClient";

export default async function AdminRolesPage() {
  const session = await auth();
  const user = await getUser(session?.user?.email ?? "");
  if (!session || user?.role !== "system admin") redirect("/");

  const [roles, permissions] = await Promise.all([
    fetchAllRoles(),
    fetchAllPermissions(),
  ]);

  return <RolesClient roles={roles} permissions={permissions} />;
}
