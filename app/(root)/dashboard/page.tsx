import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import {
  getDashboardStats,
  getCIDPPerformance,
  getReportProjects,
  getFiscalYears,
} from "@/lib/actions/dashboardActions";
import UnifiedDashboard from "@/components/dashboard/UnifiedDashboard";
import { getUserRoles } from "@/lib/actions/adminActions";

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

  const userRoles = await getUserRoles(user?.id ?? "");
  const userRole = userRoles[0];
  const userName = session?.user?.name ?? userEmail;

  return (
    <UnifiedDashboard
      cidpData={cidpData}
      stats={stats}
      user={user}
      userRole={userRole}
      userName={userName}
      reportProjects={reportProjects}
      fiscalYears={fiscalYears}
      currentFiscalYear={fiscalYear}
    />
  );
}
