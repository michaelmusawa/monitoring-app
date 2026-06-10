// app/(root)/admin/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/actions/usersActions";
import {
  getAdminStats,
  getRecentActivity,
  getUserRoles,
  type AdminActivity,
} from "@/lib/actions/adminActions";
import {
  Users,
  FolderOpen,
  CheckSquare,
  Layers,
  ClipboardList,
  Bell,
  ArrowUpRight,
  Activity,
  UserPlus,
  TrendingUp,
  Settings,
  Shield,
  Database,
  ChevronRight,
  BarChart3,
} from "lucide-react";

// ─── Activity meta ────────────────────────────────────────────────────────────

const ACTIVITY_META: Record<
  AdminActivity["type"],
  { icon: React.ReactNode; cls: string }
> = {
  user_created: {
    icon: <UserPlus className="w-3.5 h-3.5" />,
    cls: "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900",
  },
  project_created: {
    icon: <FolderOpen className="w-3.5 h-3.5" />,
    cls: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  },
  checklist_approved: {
    icon: <CheckSquare className="w-3.5 h-3.5" />,
    cls: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
  },
  tracker_submitted: {
    icon: <Activity className="w-3.5 h-3.5" />,
    cls: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  },
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 60) return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  href,
  accentBorder,
  accentIcon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  href: string;
  accentBorder: string;
  accentIcon: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border bg-white dark:bg-zinc-900 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${accentBorder} dark:border-zinc-800`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentIcon}`}
        >
          {icon}
        </div>
        <ArrowUpRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
        {value}
      </p>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
        {label}
      </p>
      {sub && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>
      )}
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  label,
  description,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {label}
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
          {description}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors shrink-0" />
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const session = await auth();
  const user = await getUser(session?.user?.email ?? "");

  const role = await getUserRoles(user?.id ?? "");

  console.log("role", role);

  const hasAccess = (role: string) => ["System Admin", "admin"].includes(role);

  if (!user || !hasAccess(role[0].name)) {
    redirect("/");
  }

  const [stats, activity] = await Promise.all([
    getAdminStats(),
    getRecentActivity(),
  ]);

  const userName = session?.user?.name ?? session?.user?.email ?? "Admin";

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-7">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                Administration
              </span>
            </div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Admin Console
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Welcome back,{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {userName.split(" ")[0]}
              </span>
              .
              {stats.pendingReviews > 0 && (
                <>
                  {" "}
                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                    {stats.pendingReviews} checklist
                    {stats.pendingReviews !== 1 ? "s" : ""}
                  </span>{" "}
                  awaiting review.
                </>
              )}
            </p>
          </div>

          {/* Alert badge */}
          {stats.pendingReviews > 0 && (
            <Link
              href="/projects?attention=needs_draft_review"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              {stats.pendingReviews} Pending
            </Link>
          )}
        </div>

        {/* ── Stat cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            sub={`${stats.activeUsers} active · ${stats.recentSignups} new this week`}
            icon={<Users className="w-5 h-5 text-violet-600" />}
            href="/admin/users"
            accentBorder="border-violet-100"
            accentIcon="bg-violet-50 dark:bg-violet-950/30"
          />
          <StatCard
            label="Projects"
            value={stats.totalProjects}
            sub={`${stats.activeProjects} active`}
            icon={<FolderOpen className="w-5 h-5 text-blue-600" />}
            href="/projects"
            accentBorder="border-blue-100"
            accentIcon="bg-blue-50 dark:bg-blue-950/30"
          />
          <StatCard
            label="Templates"
            value={stats.totalTemplates}
            sub={`${stats.totalCategories} categories total`}
            icon={<Layers className="w-5 h-5 text-emerald-600" />}
            href="/admin/checklists"
            accentBorder="border-emerald-100"
            accentIcon="bg-emerald-50 dark:bg-emerald-950/30"
          />
          <StatCard
            label="Pending Reviews"
            value={stats.pendingReviews}
            sub="Checklists awaiting ME review"
            icon={<ClipboardList className="w-5 h-5 text-amber-600" />}
            href="/projects?attention=needs_draft_review"
            accentBorder="border-amber-100"
            accentIcon="bg-amber-50 dark:bg-amber-950/30"
          />
        </div>

        {/* ── Main grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest mb-3">
                Quick Actions
              </h2>
              <div className="space-y-2">
                {/*{role === "system admin" && (*/}
                <QuickAction
                  href="/admin/users"
                  icon={<Users className="w-5 h-5 text-violet-600" />}
                  label="Manage Users"
                  description="Add, edit or archive user accounts"
                  accent="bg-violet-50 dark:bg-violet-950/30"
                />
                {/*)}*/}

                <QuickAction
                  href="/admin/roles"
                  icon={<Shield className="w-5 h-5 text-purple-600" />}
                  label="Roles & Permissions"
                  description="Manage roles and permissions"
                  accent="bg-purple-50 dark:bg-purple-950/30"
                />
                <QuickAction
                  href="/admin/permissions"
                  icon={<Shield className="w-5 h-5 text-indigo-600" />}
                  label="Permissions"
                  description="Granular permission codes"
                  accent="bg-indigo-50 dark:bg-indigo-950/30"
                />

                <QuickAction
                  href="/admin/checklists"
                  icon={<CheckSquare className="w-5 h-5 text-emerald-600" />}
                  label="Checklist Templates"
                  description="Edit sector checklist templates"
                  accent="bg-emerald-50 dark:bg-emerald-950/30"
                />
                <QuickAction
                  href="/projects"
                  icon={<FolderOpen className="w-5 h-5 text-blue-600" />}
                  label="All Projects"
                  description="Browse and manage all projects"
                  accent="bg-blue-50 dark:bg-blue-950/30"
                />
                <QuickAction
                  href="/cidp"
                  icon={<BarChart3 className="w-5 h-5 text-teal-600" />}
                  label="CIDP Categories"
                  description="Review and approve CIDP key outputs"
                  accent="bg-teal-50 dark:bg-teal-950/30"
                />
                <QuickAction
                  href="/dashboard"
                  icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
                  label="Performance Dashboard"
                  description="CIDP target vs actual delivery"
                  accent="bg-amber-50 dark:bg-amber-950/30"
                />
                <QuickAction
                  href="/settings"
                  icon={<Settings className="w-5 h-5 text-zinc-600" />}
                  label="System Settings"
                  description="Application configuration"
                  accent="bg-zinc-100 dark:bg-zinc-800"
                />
                <QuickAction
                  href="/admin/organisation"
                  icon={<Settings className="w-5 h-5 text-zinc-600" />}
                  label="Organisation"
                  description="Organisation Structure"
                  accent="bg-zinc-100 dark:bg-zinc-800"
                />
                <QuickAction
                  href="/admin/audit"
                  icon={<Activity className="w-5 h-5 text-purple-600" />}
                  label="Audit Logs"
                  description="View all user actions"
                  accent="bg-purple-50 dark:bg-purple-950/30"
                />
              </div>
            </div>

            {/* System info */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest">
                  System Endpoints
                </h3>
              </div>
              <div className="space-y-2">
                {[
                  "/api/admin/users",
                  "/api/admin/checklists",
                  "/api/projects/upload",
                  "/api/report/pptx",
                ].map((ep) => (
                  <div
                    key={ep}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800"
                  >
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                      {ep}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-widest mb-3">
              Recent Activity
            </h2>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Activity className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" />
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    No recent activity
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {activity.slice(0, 12).map((ev) => {
                    const meta = ACTIVITY_META[ev.type];
                    return (
                      <div
                        key={ev.id}
                        className="flex items-start gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <div
                          className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center mt-0.5 ${meta.cls}`}
                        >
                          {meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {ev.label}
                          </p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {ev.detail}
                          </p>
                        </div>
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5 tabular-nums">
                          {timeAgo(ev.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                <Link
                  href="/projects"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1"
                >
                  View all projects <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
