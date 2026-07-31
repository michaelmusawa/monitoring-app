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

  return <CIDPCategoriesPage userPermissions={permissions} />;
}
