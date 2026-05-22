import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import {
  getDashboardStats,
  getCIDPPerformance,
  getReportProjects,
  getFiscalYears,
} from "@/lib/actions/dashboardActions";
import UnifiedDashboard from "@/components/dashboard/UnifiedDashboard";

export default async function DashboardPage(props: {
  searchParams?: Promise<{ fiscalYear?: string }>;
}) {
  const session = await auth();
  const userEmail = session?.user?.email ?? "";
  const searchParams = await props.searchParams;
  const fiscalYear = searchParams?.fiscalYear;

  const [user, stats, cidpData, reportProjects, fiscalYears] =
    await Promise.all([
      getUser(userEmail),
      getDashboardStats(fiscalYear),
      getCIDPPerformance(fiscalYear),
      getReportProjects(fiscalYear),
      getFiscalYears(),
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
      fiscalYears={fiscalYears}
      currentFiscalYear={fiscalYear}
    />
  );
}
