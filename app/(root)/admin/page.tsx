import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DatabaseError, safeQuery } from "@/lib/db";
import { getUser } from "@/lib/actions/usersActions";

// Types for the data we fetch
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
}

interface Template {
  id: string;
  name: string;
  updatedAt: Date;
}

export default async function AdminPage() {
  const session = await auth();
  // Protect the page: only users with role 'admin' can view

  const user = await getUser(session?.user?.email || "");
  if (!session || user?.role !== "admin") {
    redirect("/");
  }

  // Fetch counts
  let totalProjects = 0;
  let totalUsers = 0;
  let totalTemplates = 0;
  let recentUsers: User[] = [];
  let recentTemplates: Template[] = [];

  try {
    // Total projects
    const projectsRes = await safeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM Project",
      [],
    );
    totalProjects = projectsRes.rows[0]?.count || 0;

    // Total users
    const usersRes = await safeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM [User]",
      [],
    );
    totalUsers = usersRes.rows[0]?.count || 0;

    // Total checklist templates
    const templatesRes = await safeQuery<{ count: number }>(
      "SELECT COUNT(*) as count FROM [Template]",
      [],
    );
    totalTemplates = templatesRes.rows[0]?.count || 0;

    // Recent users (last 5)
    const recentUsersRes = await safeQuery<User>(
      "SELECT TOP 5 id, name, email, role, createdAt FROM [User] ORDER BY createdAt DESC",
      [],
    );
    recentUsers = recentUsersRes.rows;

    // Recent templates (last 5)
    const recentTemplatesRes = await safeQuery<Template>(
      "SELECT TOP 5 id, name, updatedAt FROM [Template] ORDER BY updatedAt DESC",
      [],
    );
    recentTemplates = recentTemplatesRes.rows;
  } catch (error) {
    console.error("Admin page data fetch error:", error);
    // You could show an error message in the UI
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">
            Overview and quick access to administration functions.
          </p>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          {/* Statistics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Projects"
              value={totalProjects}
              link="/projects"
              linkText="View projects"
            />
            <StatCard
              title="Users"
              value={totalUsers}
              link="/admin/users"
              linkText="Manage users"
            />
            <StatCard
              title="Checklist Templates"
              value={totalTemplates}
              link="/admin/checklists"
              linkText="Edit templates"
            />
          </div>

          {/* Quick actions */}
          <div className="p-4 border rounded bg-white">
            <h2 className="text-lg font-semibold mb-3">Quick admin actions</h2>
            <div className="flex flex-wrap gap-3">
              <ActionButton href="/settings">System settings</ActionButton>
              <ActionButton href="/admin/users">Add / edit users</ActionButton>
              <ActionButton href="/admin/checklists">
                Manage checklist templates
              </ActionButton>
              <ActionButton href="/projects">Browse projects</ActionButton>
            </div>
          </div>

          {/* Recent users and templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RecentUsersCard users={recentUsers} />
            <RecentTemplatesCard templates={recentTemplates} />
          </div>
        </section>

        <aside className="space-y-6">
          <InfoCard title="Admin notes">
            <p className="text-sm text-gray-600">
              This dashboard provides an overview of key metrics. Use the links
              above to manage users, checklist templates, and system settings.
            </p>
          </InfoCard>

          <InfoCard title="System endpoints">
            <ul className="text-sm space-y-1 font-mono">
              <li>/api/admin/users</li>
              <li>/api/admin/checklists</li>
              <li>/api/projects/upload</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">
              These endpoints are available for programmatic access.
            </p>
          </InfoCard>
        </aside>
      </main>
    </div>
  );
}

// Helper components

function StatCard({
  title,
  value,
  link,
  linkText,
}: {
  title: string;
  value: number;
  link: string;
  linkText: string;
}) {
  return (
    <div className="p-4 border rounded bg-white">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
      <div className="mt-3 text-sm">
        <Link href={link} className="text-primary hover:underline">
          {linkText}
        </Link>
      </div>
    </div>
  );
}

function ActionButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-2 border rounded text-sm hover:bg-gray-50 transition"
    >
      {children}
    </Link>
  );
}

function RecentUsersCard({ users }: { users: User[] }) {
  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-medium mb-2">Recent users</h3>
      {users.length === 0 ? (
        <p className="text-sm text-gray-500">No users found.</p>
      ) : (
        <ul className="text-sm space-y-2">
          {users.map((user) => (
            <li key={user.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
              <div className="text-xs text-gray-400">{user.role}</div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <Link
          href="/admin/users"
          className="text-primary text-sm hover:underline"
        >
          Manage users →
        </Link>
      </div>
    </div>
  );
}

function RecentTemplatesCard({ templates }: { templates: Template[] }) {
  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-medium mb-2">Recent checklist templates</h3>
      {templates.length === 0 ? (
        <p className="text-sm text-gray-500">No templates found.</p>
      ) : (
        <ul className="text-sm space-y-2">
          {templates.map((tmpl) => (
            <li key={tmpl.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium truncate">{tmpl.name}</div>
                <div className="text-xs text-gray-500">
                  Updated {new Date(tmpl.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3">
        <Link
          href="/admin/checklists"
          className="text-primary text-sm hover:underline"
        >
          Edit templates →
        </Link>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 border rounded bg-white">
      <h3 className="font-medium mb-2">{title}</h3>
      {children}
    </div>
  );
}
