import React from "react";
import Link from "next/link";
import { projects, users, checklists } from "@/lib/data/data";
import type { User, Checklist } from "@/lib/types/types";

export default function AdminPage() {
  const totalProjects = Array.isArray(projects) ? projects.length : 0;
  const totalUsers = Array.isArray(users) ? users.length : 0;
  const totalChecklists = Array.isArray(checklists) ? checklists.length : 0;

  // Small previews
  const recentUsers: User[] = Array.isArray(users) ? (users as User[]).slice(0, 5) : [];
  const recentChecklists: Checklist[] = Array.isArray(checklists)
    ? (checklists as Checklist[]).slice(0, 5)
    : [];

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-sm text-gray-600">Administration dashboard — manage users, checklists and system settings.</p>
        </div>

        <nav className="flex items-center gap-3">
          <Link href="/settings" className="px-3 py-2 border rounded hover:bg-gray-50">
            Settings
          </Link>
          <Link href="/admin/users" className="px-3 py-2 border rounded hover:bg-gray-50">
            Manage Users
          </Link>
          <Link href="/admin/checklists" className="px-3 py-2 border rounded hover:bg-gray-50">
            Checklist Templates
          </Link>
        </nav>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border rounded bg-white">
              <div className="text-xs text-gray-500">Projects</div>
              <div className="text-2xl font-semibold mt-2">{totalProjects}</div>
              <div className="mt-3 text-sm">
                <Link href="/projects" className="text-primary hover:underline">
                  View projects
                </Link>
              </div>
            </div>

            <div className="p-4 border rounded bg-white">
              <div className="text-xs text-gray-500">Users</div>
              <div className="text-2xl font-semibold mt-2">{totalUsers}</div>
              <div className="mt-3 text-sm">
                <Link href="/admin/users" className="text-primary hover:underline">
                  Manage users
                </Link>
              </div>
            </div>

            <div className="p-4 border rounded bg-white">
              <div className="text-xs text-gray-500">Checklists</div>
              <div className="text-2xl font-semibold mt-2">{totalChecklists}</div>
              <div className="mt-3 text-sm">
                <Link href="/admin/checklists" className="text-primary hover:underline">
                  Edit checklist templates
                </Link>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded bg-white">
            <h2 className="text-lg font-semibold mb-3">Quick admin actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/settings" className="px-3 py-2 border rounded text-sm">
                System settings
              </Link>
              <Link href="/admin/users" className="px-3 py-2 border rounded text-sm">
                Add / edit users
              </Link>
              <Link href="/admin/checklists" className="px-3 py-2 border rounded text-sm">
                Manage checklist templates
              </Link>
              <Link href="/projects" className="px-3 py-2 border rounded text-sm">
                Browse projects
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded bg-white">
              <h3 className="font-medium mb-2">Recent users</h3>
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No users available.</p>
              ) : (
                <ul className="text-sm space-y-2">
                  {recentUsers.map((u) => (
                    <li key={u.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </div>
                      <div className="text-xs text-gray-400">{u.role ?? "user"}</div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <Link href="/admin/users" className="text-primary text-sm hover:underline">
                  Manage users →
                </Link>
              </div>
            </div>

            <div className="p-4 border rounded bg-white">
              <h3 className="font-medium mb-2">Recent checklist templates</h3>
              {recentChecklists.length === 0 ? (
                <p className="text-sm text-gray-500">No checklist templates available.</p>
              ) : (
                <ul className="text-sm space-y-2">
                  {recentChecklists.map((c) => (
                    <li key={c.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium truncate">{c.id}</div>
                        <div className="text-xs text-gray-500">Project: {c.projectId ?? "N/A"}</div>
                      </div>
                      <div className="text-xs text-gray-400">{String(c.status ?? "unknown")}</div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <Link href="/admin/checklists" className="text-primary text-sm hover:underline">
                  Edit templates →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="p-4 border rounded bg-white">
            <h3 className="font-medium mb-2">Admin notes</h3>
            <p className="text-sm text-gray-600">
              This admin area includes links to user management and checklist template editors. Use the links above to navigate to full editors where you can add, remove or modify templates and users.
            </p>
          </div>

          <div className="p-4 border rounded bg-white">
            <h3 className="font-medium mb-2">System endpoints</h3>
            <ul className="text-sm space-y-1">
              <li>/api/admin/users - manage users (POST/GET)</li>
              <li>/api/admin/checklists - manage checklist templates (POST/GET)</li>
              <li>/api/projects/upload - project upload endpoint (POST)</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">These are example endpoints; implement server handlers to persist changes.</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
