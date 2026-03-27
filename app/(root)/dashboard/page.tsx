import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import {
  getDashboardStats,
  getCIDPPerformance,
  getReportProjects,
} from "@/lib/actions/dashboardActions";
import UnifiedDashboard from "@/components/dashboard/UnifiedDashboard";

export default async function DashboardPage() {
  const session = await auth();
  const userEmail = session?.user?.email ?? "";

  const [user, stats, cidpData, reportProjects] = await Promise.all([
    getUser(userEmail),
    getDashboardStats(),
    getCIDPPerformance(),
    getReportProjects(),
  ]);

  const userRole: "me" | "sector" | "admin" =
    user?.sector === "me" ? "me" : user?.role === "admin" ? "admin" : "sector";
  const userName = session?.user?.name ?? userEmail;

  return (
    <UnifiedDashboard
      cidpData={cidpData}
      stats={stats}
      userRole={userRole}
      userName={userName}
      reportProjects={reportProjects}
    />
  );
}
