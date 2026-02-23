// app/lib/authHelpers.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUser } from "../actions/loginActions";

export type User = Awaited<ReturnType<typeof getUser>>;

/**
 * Enforces that the current user is logged in and has one of the allowed roles.
 * If they’re not logged in, or their role isn’t in `allowedRoles`, this will
 * immediately redirect them (server‐side) to either login or an unauthorized page.
 *
 * Returns the full `User` record so the page can use it freely.
 */
export async function requireRoleOrRedirect(
  allowedRoles: string[],
  {
    redirectToLogin = "/login",
    redirectToNoAccess = "/not-authorized",
  }: { redirectToLogin?: string; redirectToNoAccess?: string } = {},
): Promise<User> {
  // 1) make sure they’re authenticated
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    // not even logged in
    redirect(redirectToLogin);
  }

  // 2) load your user record
  const user = await getUser(email);
  if (!user) {
    // somehow no user in our DB
    redirect(redirectToLogin);
  }

  // 3) enforce role
  if (!allowedRoles.includes(user.role ?? "")) {
    redirect(redirectToNoAccess);
  }

  return user;
}
