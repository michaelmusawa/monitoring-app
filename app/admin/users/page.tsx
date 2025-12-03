"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { User } from "@/lib/types/types";

/**
 * Admin Users Page
 *
 * - Lists users fetched from `/api/admin/users` (if available)
 * - Allows adding a new user (local optimisitc update and POST)
 * - Allows editing and deleting users (PUT / DELETE, optimistic local updates)
 *
 * Notes:
 * - This component expects the backend endpoints to exist. If they are not implemented,
 *   the UI will still operate locally in-memory and show clear messages about failures.
 */

/* Small utility to create a temp id for optimistic UI */
const tempId = () => `tmp_${Math.random().toString(36).slice(2, 9)}`;

type FormState = {
  name: string;
  email: string;
  role: string;
};

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({ name: "", email: "", role: "user" });
  const [saving, setSaving] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Load users from API (if available)
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) {
          throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (mounted) {
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        // If the endpoint is missing, fall back to a small local dataset so the UI is usable
        if (mounted) {
          setError(
            "Unable to load users from the server. Showing local demo users. " +
              (err?.message ? `(${err.message})` : "")
          );
          setUsers([
            { id: "u-1", name: "Alice Admin", email: "alice@example.com", role: "admin" },
            { id: "u-2", name: "Bob User", email: "bob@example.com", role: "user" },
          ] as unknown as User[]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Add user
  async function handleAdd(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);

    if (!form.name.trim() || !form.email.trim()) {
      setMessage("Name and email are required.");
      return;
    }

    const newUser: User = {
      id: tempId(),
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role as any,
    };

    // Optimistic update
    setUsers((s) => [newUser, ...s]);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        throw new Error(`Server rejected: ${res.status} ${res.statusText}`);
      }
      const saved = await res.json();
      // Replace temp id with persisted user id if provided
      setUsers((s) => s.map((u) => (u.id === newUser.id ? saved || u : u)));
      setForm({ name: "", email: "", role: "user" });
      setMessage("User added.");
    } catch (err: any) {
      // Revert optimistic update
      setUsers((s) => s.filter((u) => u.id !== newUser.id));
      setMessage("Failed to add user: " + String(err?.message || err));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  // Start editing a user
  function startEdit(u: User) {
    setEditingUser(u);
  }

  // Save user edits
  async function saveEdit(updated: User) {
    setMessage(null);
    const prev = users;
    setUsers((s) => s.map((u) => (u.id === updated.id ? updated : u)));
    setEditingUser(null);
    try {
      const res = await fetch(`/api/admin/users/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        throw new Error(`Server update failed: ${res.status} ${res.statusText}`);
      }
      setMessage("User updated.");
    } catch (err: any) {
      // revert on error
      setUsers(prev);
      setMessage("Failed to save: " + String(err?.message || err));
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  }

  // Delete user
  async function confirmDelete(id: string) {
    setDeletingUserId(id);
    // optimistic remove
    const prev = users;
    setUsers((s) => s.filter((u) => u.id !== id));
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status} ${res.statusText}`);
      }
      setMessage("User removed.");
    } catch (err: any) {
      setUsers(prev);
      setMessage("Failed to remove user: " + String(err?.message || err));
    } finally {
      setDeletingUserId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-gray-600">Add, edit or remove application users. These actions require admin permissions on the server.</p>
        </div>

        <nav className="flex items-center gap-3">
          <Link href="/admin" className="px-3 py-2 border rounded hover:bg-gray-50">
            Back to admin
          </Link>
          <Link href="/settings" className="px-3 py-2 border rounded hover:bg-gray-50">
            Settings
          </Link>
        </nav>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Users</h2>
            <div className="text-sm text-gray-600">{loading ? "Loading..." : `${users.length} users`}</div>
          </div>

          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded">{error}</div>
          )}

          <div className="overflow-auto border rounded bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 capitalize">{(u.role as string) ?? "user"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-2 py-1 text-xs border rounded"
                          onClick={() => startEdit(u)}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-1 text-xs border rounded text-rose-600"
                          onClick={() => {
                            if (!confirm(`Remove user ${u.name}? This action cannot be undone.`)) return;
                            confirmDelete(u.id);
                          }}
                          disabled={deletingUserId === u.id}
                        >
                          {deletingUserId === u.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="text-sm text-gray-500">
            Note: These actions call example server endpoints. If those routes are not implemented yet, changes are kept in-memory and a message will show.
          </div>
        </section>

        <aside className="space-y-4">
          <div className="p-4 bg-white border rounded">
            <h3 className="font-medium mb-2">Add new user</h3>
            <form
              onSubmit={(e) => {
                void handleAdd(e);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs text-gray-600 mb-1">Full name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: (e.target as HTMLInputElement).value })} placeholder="Jane Doe" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: (e.target as HTMLInputElement).value })} placeholder="jane@example.com" />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Role</label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Add user"}
                </Button>
                <button
                  type="button"
                  className="px-3 py-2 border rounded"
                  onClick={() => setForm({ name: "", email: "", role: "user" })}
                >
                  Reset
                </button>
              </div>

              {message && <div className="text-sm text-gray-700">{message}</div>}
            </form>
          </div>

          <div className="p-4 bg-white border rounded">
            <h3 className="font-medium mb-2">Bulk actions</h3>
            <div className="flex flex-col gap-2">
              <button
                className="px-3 py-2 border rounded text-sm"
                onClick={async () => {
                  if (!confirm("This will attempt to sync users with the server. Continue?")) return;
                  setMessage("Syncing...");
                  try {
                    const res = await fetch("/api/admin/users/sync", { method: "POST" });
                    if (!res.ok) throw new Error(await res.text());
                    setMessage("Sync triggered on server.");
                  } catch (err: any) {
                    setMessage("Sync failed: " + String(err?.message || err));
                  } finally {
                    setTimeout(() => setMessage(null), 3000);
                  }
                }}
              >
                Sync users
              </button>

              <button
                className="px-3 py-2 border rounded text-sm text-rose-600"
                onClick={() => {
                  if (!confirm("Remove all local users (will not call server)?")) return;
                  setUsers([]);
                }}
              >
                Clear local users
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Use server endpoints to persist changes. Example endpoints:
              <div className="mt-1">
                <code className="text-xs">GET /api/admin/users</code>
                <br />
                <code className="text-xs">POST /api/admin/users</code>
                <br />
                <code className="text-xs">PUT /api/admin/users/:id</code>
                <br />
                <code className="text-xs">DELETE /api/admin/users/:id</code>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Edit modal (simple inline form) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingUser(null)} />
          <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-lg p-6 z-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit user</h3>
              <div>
                <button className="px-3 py-1 border rounded" onClick={() => setEditingUser(null)}>
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Full name</label>
                <Input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: (e.target as HTMLInputElement).value })} />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <Input value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: (e.target as HTMLInputElement).value })} />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Role</label>
                <Select value={(editingUser.role as string) ?? "user"} onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (!editingUser) return;
                    // Validate
                    if (!editingUser.name || !editingUser.email) {
                      setMessage("Name and email required.");
                      return;
                    }
                    void saveEdit(editingUser);
                  }}
                >
                  Save
                </Button>
                <button className="px-3 py-2 border rounded" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
              </div>

              {message && <div className="text-sm text-gray-700">{message}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
