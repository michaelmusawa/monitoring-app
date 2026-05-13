import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/usersActions";
import { fetchAllPermissions } from "@/lib/actions/adminActions";
import PermissionsClient from "@/components/admin/PermissionsClient";

export default async function AdminPermissionsPage() {
  const session = await auth();
  const user = await getUser(session?.user?.email ?? "");
  if (!session || user?.role !== "system admin") redirect("/");

  const permissions = await fetchAllPermissions();

  return <PermissionsClient permissions={permissions} />;
}
