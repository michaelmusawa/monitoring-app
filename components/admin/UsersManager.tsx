//monitoring-app/components/admin/UsersManager.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { User as AppUserType } from "@/lib/types/userTypes";

/*
 * UsersManager component
 *
 * Lightweight, self-contained user management UI that:
 * - Loads users from `/api/admin/users` if available (falls back to local demo users)
 * - Allows adding, editing, removing users (optimistic local updates)
 * - Calls example server endpoints for persistence; falls back gracefully when endpoints are missing
 *
 * This component is exported as default for use in admin pages.
 */

const tempId = () => `tmp_${Math.random().toString(36).slice(2, 9)}`;

type FormState = {
  name: string;
  email: string;
  role: string;
};

export default function UsersManager() {
  const [users, setUsers] = useState<AppUserType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    role: "user",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<AppUserType | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Load users from API (if available), otherwise fallback to demo users.
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) {
          throw new Error(`Failed to fetch users (${res.status})`);
        }
        const data = await res.json();
        if (mounted) {
          setUsers(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        // Fallback demo users so the UI remains useful without backend.
        console.log("Error loading users, falling back to demo data:", err);
        if (mounted) {
          setError(
            "Unable to load users from server — showing demo users. Implement /api/admin/users to persist changes.",
          );
          setUsers([
            {
              id: "u-1",
              name: "Alice Admin",
              email: "alice@example.com",
              role: "admin",
            },
            {
              id: "u-2",
              name: "Bob User",
              email: "bob@example.com",
              role: "user",
            },
          ] as unknown as AppUserType[]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  // Add a new user (optimistic local update + POST to server)
  async function addUser(e?: React.FormEvent) {
    e?.preventDefault();
    setMessage(null);
    if (!form.name.trim() || !form.email.trim()) {
      setMessage("Name and email are required.");
      return;
    }

    const newUser: any = {
      id: tempId(),
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    };

    setUsers((s) => [newUser, ...s]);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        throw new Error(`Server rejected user addition: ${res.status}`);
      }
      const saved = await res.json();
      // replace temp id with persisted id if returned
      setUsers((s) => s.map((u) => (u.id === newUser.id ? saved || u : u)));
      setForm({ name: "", email: "", role: "user" });
      setMessage("User added.");
    } catch (err: any) {
      // revert optimistic update
      setUsers((s) => s.filter((u) => u.id !== newUser.id));
      setMessage("Failed to add user: " + String(err?.message || err));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 2500);
    }
  }

  // Start edit flow
  function startEdit(u: AppUserType) {
    setEditingUser(u);
  }

  // Save edits (optimistic + PUT)
  async function saveEdit(updated: AppUserType) {
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
        throw new Error(`Server update failed (${res.status})`);
      }
      setMessage("User updated.");
    } catch (err: any) {
      setUsers(prev);
      setMessage("Failed to save: " + String(err?.message || err));
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  }

  // Delete user (optimistic + DELETE)
  async function removeUser(id: any) {
    if (!confirm("Remove user? This action cannot be undone.")) return;
    const prev = users;
    setUsers((s) => s.filter((u) => u.id !== id));
    setDeletingUserId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setMessage("User removed.");
    } catch (err: any) {
      setUsers(prev);
      setMessage("Failed to remove user: " + String(err?.message || err));
    } finally {
      setDeletingUserId(null);
      setTimeout(() => setMessage(null), 2500);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">User Management</h2>
          <p className="text-sm text-gray-600">
            Add, edit or remove application users. Changes are posted to example
            admin endpoints.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin"
            className="px-3 py-2 border rounded hover:bg-gray-50"
          >
            Back
          </Link>
          <Link
            href="/settings"
            className="px-3 py-2 border rounded hover:bg-gray-50"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Add user form */}
      <div className="p-4 border rounded bg-white">
        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          onSubmit={addUser}
        >
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="Full name"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Email</label>
            <Input
              value={form.email}
              onChange={(e) =>
                setForm((s) => ({ ...s, email: e.target.value }))
              }
              placeholder="email@domain"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Role</label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((s) => ({ ...s, role: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1 flex gap-2">
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
        </form>
        {message && <div className="mt-3 text-sm text-gray-700">{message}</div>}
        {error && <div className="mt-3 text-sm text-amber-700">{error}</div>}
      </div>

      {/* Users table */}
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
                <td className="px-4 py-3 capitalize">
                  {(u.role as string) ?? "user"}
                </td>
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
                      onClick={() => removeUser(u.id)}
                      disabled={deletingUserId === String(u.id)}
                    >
                      {deletingUserId === String(u.id)
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-4 text-center text-sm text-gray-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inline edit modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditingUser(null)}
          />
          <div className="relative w-full max-w-xl bg-white rounded-lg p-6 z-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit user</h3>
              <div>
                <button
                  className="px-3 py-1 border rounded"
                  onClick={() => setEditingUser(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Full name
                </label>
                <Input
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Email
                </label>
                <Input
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Role</label>
                <Select
                  value={(editingUser.role as string) || "user"}
                  onValueChange={(v) =>
                    setEditingUser({ ...editingUser, role: v })
                  }
                >
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
                    if (!editingUser.name || !editingUser.email) {
                      setMessage("Name and email required.");
                      return;
                    }
                    void saveEdit(editingUser);
                  }}
                >
                  Save
                </Button>
                <button
                  className="px-3 py-2 border rounded"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
              </div>

              {message && (
                <div className="text-sm text-gray-700">{message}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ChecklistEditor component
 *
 * A compact editor to allow admins refine standard checklist templates:
 * - Add/remove/edit categories and tasks
 * - Export templates to JSON and POST to example server endpoint
 *
 * This component is exported as a named export for convenience so it can be
 * imported alongside UsersManager if desired.
 */

export function ChecklistEditor() {
  type Task = { id: string; label: string };
  type Category = { id: string; name: string; tasks: Task[] };

  const uid = (prefix = "") =>
    `${prefix}${Math.random().toString(36).slice(2, 9)}`;

  const [categories, setCategories] = useState<Category[]>([
    {
      id: uid("cat-"),
      name: "Mobilization",
      tasks: [{ id: uid("t-"), label: "Contract signing" }],
    },
  ]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Add category
  function addCategory() {
    if (!newCategoryName.trim()) return;
    setCategories((s) => [
      ...s,
      { id: uid("cat-"), name: newCategoryName.trim(), tasks: [] },
    ]);
    setNewCategoryName("");
  }

  function removeCategory(id: string) {
    if (!confirm("Remove category and all tasks?")) return;
    setCategories((s) => s.filter((c) => c.id !== id));
  }

  function addTask(catId: string) {
    setCategories((s) =>
      s.map((c) =>
        c.id === catId
          ? { ...c, tasks: [...c.tasks, { id: uid("t-"), label: "New task" }] }
          : c,
      ),
    );
  }

  function removeTask(catId: string, taskId: string) {
    setCategories((s) =>
      s.map((c) =>
        c.id === catId
          ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
          : c,
      ),
    );
  }

  async function saveTemplates() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = categories.map((c) => ({
        id: c.id,
        name: c.name,
        tasks: c.tasks,
      }));
      const res = await fetch("/api/admin/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: payload }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
      }
      setMessage("Checklist templates saved.");
    } catch (err: any) {
      setMessage("Save failed: " + String(err?.message || err));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Checklist Editor</h3>
        <div className="flex gap-2">
          <Button onClick={saveTemplates} disabled={saving}>
            {saving ? "Saving..." : "Save templates"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {categories.map((cat) => (
          <div key={cat.id} className="border rounded p-3 bg-white">
            <div className="flex items-center justify-between mb-2">
              <input
                className="font-semibold text-base border px-2 py-1 rounded"
                value={cat.name}
                onChange={(e) =>
                  setCategories((s) =>
                    s.map((c) =>
                      c.id === cat.id ? { ...c, name: e.target.value } : c,
                    ),
                  )
                }
              />
              <div className="flex items-center gap-2">
                <Button onClick={() => addTask(cat.id)} variant="outline">
                  + Task
                </Button>
                <Button
                  onClick={() => removeCategory(cat.id)}
                  variant="destructive"
                >
                  Remove category
                </Button>
              </div>
            </div>

            <ul className="space-y-2">
              {cat.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2">
                  <input
                    className="flex-1 border px-2 py-1 rounded"
                    value={t.label}
                    onChange={(e) =>
                      setCategories((s) =>
                        s.map((c) =>
                          c.id === cat.id
                            ? {
                                ...c,
                                tasks: c.tasks.map((x) =>
                                  x.id === t.id
                                    ? { ...x, label: e.target.value }
                                    : x,
                                ),
                              }
                            : c,
                        ),
                      )
                    }
                  />
                  <button
                    className="px-2 py-1 text-xs border rounded text-rose-600"
                    onClick={() => removeTask(cat.id, t.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {cat.tasks.length === 0 && (
                <li className="text-sm text-gray-500">No tasks yet</li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-center">
        <input
          className="border px-2 py-1 rounded flex-1"
          placeholder="New category name"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
        />
        <Button onClick={addCategory}>Add category</Button>
        <Button
          variant="outline"
          onClick={() => {
            // Export as JSON for convenience
            try {
              const blob = new Blob([JSON.stringify(categories, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "checklist-templates.json";
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
            } catch (err) {
              alert("Export failed: " + String(err));
            }
          }}
        >
          Export
        </Button>
      </div>

      {message && <div className="text-sm text-gray-700">{message}</div>}
    </div>
  );
}
