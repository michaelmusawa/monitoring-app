import { auth } from "@/auth";

import { getUser } from "@/lib/actions/usersActions";
import { fetchAllRoles } from "@/lib/actions/adminActions";
import RolesClient from "@/components/admin/RolesClient";

export default async function AdminRolesPage() {
  const session = await auth();
  const user = await getUser(session?.user?.email ?? "");
  // if (!session || user?.role !== "system admin") redirect("/");

  const [roles] = await Promise.all([fetchAllRoles()]);

  return <RolesClient roles={roles} />;
}
