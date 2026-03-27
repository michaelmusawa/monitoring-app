// components/navigation/Sidebar.tsx
import { auth, signOut } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import SidebarClient from "./SidebarClient";

export default async function Sidebar() {
  const session = await auth();
  const userEmail = session?.user?.email ?? "";
  const userNameFromSession = session?.user?.name ?? "";

  // Fetch the real user record so we have sector/role info
  let displayName = userNameFromSession;
  let role = "sector";

  try {
    const user = await getUser(userEmail);

    if (user) {
      displayName = user.name ?? userNameFromSession;
      role =
        user.sector === "me"
          ? "me"
          : user?.sector === "sector" || user?.sector === "IDE"
            ? "sector"
            : "admin";
    }
  } catch {
    // fall back to session data
  }

  return (
    <SidebarClient
      userEmail={userEmail}
      userName={displayName}
      userRole={role}
    />
  );
}
