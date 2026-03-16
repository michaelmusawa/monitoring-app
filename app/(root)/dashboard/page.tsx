// app/(root)/dashboard/page.tsx
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import {
  getDashboardStats,
  getReportProjects,
} from "@/lib/actions/dashboardActions";
import DashboardClient from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const userEmail = session?.user?.email ?? "";

  const [user, stats, reportProjects] = await Promise.all([
    getUser(userEmail),
    getDashboardStats(),
    getReportProjects(),
  ]);

  const userRole: "me" | "sector" | "admin" =
    user?.sector === "me" ? "me" : user?.role === "admin" ? "admin" : "sector";

  const userName = session?.user?.name ?? userEmail;

  return (
    <DashboardClient
      stats={stats}
      userRole={userRole}
      userName={userName}
      reportProjects={reportProjects}
    />
  );
}
