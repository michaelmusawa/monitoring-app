// components/navigation/Sidebar.tsx
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import SidebarClient from "./SidebarClient";

export default async function Sidebar() {
  const session = await auth();
  const userEmail = session?.user?.email ?? "";
  const userNameFromSession = session?.user?.name ?? "";

  // Fetch the real user record so we have sector/role info
  let displayName = userNameFromSession;
  let role = "user";
  let sector = "";

  try {
    const user = await getUser(userEmail);

    if (user) {
      displayName = user.name ?? userNameFromSession;
      role = user.role;
      sector = user.sector ?? "";
    }
  } catch {
    // fall back to session data
  }

  return (
    <SidebarClient
      userEmail={userEmail}
      userName={displayName}
      userRole={role}
      userSector={sector}
    />
  );
}
