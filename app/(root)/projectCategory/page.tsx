import { auth } from "@/auth";
import CIDPCategoriesPage from "@/components/admin/CIDPCategoriesPage";
import { getUser } from "@/lib/actions/usersActions";
import { getUserPermissions } from "@/lib/actions/adminActions";

export default async function Page() {
  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);

  // Fetch permissions from RBAC system
  let permissions: string[] = [];
  if (user?.id) {
    permissions = await getUserPermissions(user.id);
  }

  // Fallback role display string (derived from sector for backward compatibility)
  let displayRole = "viewer";
  if (user?.sector === "Monitoring And Evaluation") displayRole = "me";
  else if (user?.sector && user.sector !== "Monitoring And Evaluation")
    displayRole = "sector";
  else if (user?.role === "system admin") displayRole = "viewer";

  return (
    <CIDPCategoriesPage userPermissions={permissions} userRole={displayRole} />
  );
}
