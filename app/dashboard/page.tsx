// app/dashboard/page.tsx

import { auth } from "@/auth";
import DashboardClient from "@/components/dashboard/DashboardPage";
import { getDashboardStats } from "@/lib/actions/dashboardActions";
import { getProjects } from "@/lib/actions/projectActions";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const userEmail = session?.user?.name || "";

  // SERVER-SIDE FETCHING
  const projects = await getProjects();
  const stats = await getDashboardStats();

  return (
    <DashboardClient projects={projects} stats={stats} userEmail={userEmail} />
  );
}
