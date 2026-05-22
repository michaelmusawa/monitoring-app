"use server";

import { auth, signOut } from "@/auth";
import { logAuthEvent } from "@/lib/actions/auditActions";
import { getUser } from "@/lib/actions/loginActions";

export async function signOutAction() {
  const session = await auth();

  if (!session) return;

  const user = await getUser(session?.user?.email ?? "");

  if (session?.user) {
    await logAuthEvent({
      event: "logout",
      userEmail: session.user.email ?? undefined,
      userId: user?.id,
    });
  }

  await signOut({ redirectTo: "/" });
}
