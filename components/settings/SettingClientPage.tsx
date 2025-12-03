"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

/**
 * Settings page for the monitoring-app
 *
 * Responsibilities:
 * - Provide a project upload form so regular users can submit projects (CSV/JSON/ZIP).
 * - Expose links to admin sections:
 *   - Admin dashboard
 *   - User management
 *   - Checklist editor (refine standard checklist)
 *
 * Notes:
 * - This file is intentionally self-contained (no external UI components imported)
 *   so it can be dropped into the app/settings route without additional dependency changes.
 * - The upload and admin actions are implemented client-side and call presumed APIs.
 *   If the server endpoints are not available yet, the UI still functions locally and
 *   provides clear UX for future integration.
 */

/* Use a client component so forms and local state work as expected */

type UploadStatus = "idle" | "uploading" | "success" | "error";

type MinimalProject = {
  id?: string;
  name: string;
  sector?: string;
  budget?: number | string;
  status?: string;
  description?: string;
  lat?: number | string | null;
  long?: number | string | null;
};

type ChecklistTask = {
  id: string;
  label: string;
};

type ChecklistCategory = {
  id: string;
  name: string;
  tasks: ChecklistTask[];
};

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | string;
};

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

/* --- Project Upload Form --- */
function ProjectUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [project, setProject] = useState<MinimalProject>({
    name: "",
    sector: "",
    budget: "",
    status: "PENDING",
    description: "",
  });
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    // Basic validation
    if (!project.name) {
      setMessage("Please provide a project name.");
      return;
    }

    const form = new FormData();
    form.append("project", JSON.stringify(project));
    if (file) form.append("file", file);

    setStatus("uploading");
    try {
      // Attempt to post to API (may not yet exist in the codebase)
      const res = await fetch("/api/projects/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const text = await res.text();
        setMessage(`Upload failed: ${text || res.statusText}`);
        setStatus("error");
        return;
      }
      setMessage("Project uploaded successfully.");
      setStatus("success");
      setProject({
        name: "",
        sector: "",
        budget: "",
        status: "PENDING",
        description: "",
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err: any) {
      setMessage("Upload error: " + String(err?.message || err));
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <section className="p-4 bg-white rounded-lg shadow-sm border">
      <h2 className="text-lg font-semibold mb-3">Upload a Project</h2>
      <p className="text-sm text-gray-600 mb-4">
        Users can submit new projects using this form. Accepts JSON, CSV or ZIP
        with attachments.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Project name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={project.name}
            onChange={(e) => setProject({ ...project, name: e.target.value })}
            placeholder="Project title"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Sector</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={project.sector}
              onChange={(e) =>
                setProject({ ...project, sector: e.target.value })
              }
              placeholder="e.g. ICT, Mobility & Works"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Budget</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={String(project.budget ?? "")}
              onChange={(e) =>
                setProject({ ...project, budget: e.target.value })
              }
              placeholder="Number or 'TBD'"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2 min-h-[80px]"
            value={project.description}
            onChange={(e) =>
              setProject({ ...project, description: e.target.value })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Optional supporting file
          </label>
          <input
            ref={inputRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
            accept=".json,.csv,.zip"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-60"
            disabled={status === "uploading"}
          >
            {status === "uploading" ? "Uploading..." : "Upload Project"}
          </button>
          <button
            type="button"
            className="px-3 py-2 border rounded text-sm"
            onClick={() => {
              setProject({
                name: "",
                sector: "",
                budget: "",
                status: "PENDING",
                description: "",
              });
              setFile(null);
              inputRef.current && (inputRef.current.value = "");
              setMessage(null);
            }}
          >
            Reset
          </button>
          {message && <span className="text-sm text-gray-700">{message}</span>}
        </div>
      </form>
    </section>
  );
}

/* --- Checklist Editor (Admin) --- */
function ChecklistEditor() {
  const [categories, setCategories] = useState<ChecklistCategory[]>(() => [
    {
      id: uid("cat-"),
      name: "Mobilization",
      tasks: [
        { id: uid("t-"), label: "Contract Signing & Insurances" },
        { id: uid("t-"), label: "Site Possession" },
      ],
    },
    {
      id: uid("cat-"),
      name: "Playground Area",
      tasks: [{ id: uid("t-"), label: "Artificial Turf" }],
    },
  ]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function addCategory() {
    if (!newCategoryName.trim()) return;
    const cat: ChecklistCategory = {
      id: uid("cat-"),
      name: newCategoryName.trim(),
      tasks: [],
    };
    setCategories((s) => [...s, cat]);
    setNewCategoryName("");
  }

  function removeCategory(id: string) {
    setCategories((s) => s.filter((c) => c.id !== id));
  }

  function addTask(categoryId: string, label = "") {
    setCategories((s) =>
      s.map((c) =>
        c.id === categoryId
          ? { ...c, tasks: [...c.tasks, { id: uid("t-"), label }] }
          : c,
      ),
    );
  }

  function removeTask(categoryId: string, taskId: string) {
    setCategories((s) =>
      s.map((c) =>
        c.id === categoryId
          ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
          : c,
      ),
    );
  }

  async function saveTemplate() {
    setSaving(true);
    setMessage(null);
    try {
      // POST to a hypothetical admin endpoint.
      const res = await fetch("/api/admin/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      if (!res.ok) {
        const txt = await res.text();
        setMessage("Save failed: " + (txt || res.statusText));
        setSaving(false);
        return;
      }
      setMessage("Checklist template saved.");
    } catch (err: any) {
      setMessage("Error: " + String(err?.message || err));
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <section className="p-4 bg-white rounded-lg shadow-sm border">
      <h2 className="text-lg font-semibold mb-3">Checklist Editor (Admin)</h2>
      <p className="text-sm text-gray-600 mb-4">
        Add/remove categories and tasks for the standard checklist.
      </p>

      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <strong>{cat.name}</strong>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 text-xs border rounded"
                  onClick={() => addTask(cat.id, "New task")}
                >
                  + Task
                </button>
                <button
                  className="px-2 py-1 text-xs border rounded text-rose-600"
                  onClick={() => removeCategory(cat.id)}
                >
                  Remove category
                </button>
              </div>
            </div>

            <ul className="pl-4 list-disc space-y-1">
              {cat.tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3"
                >
                  <input
                    className="flex-1 border rounded px-2 py-1"
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
            </ul>
          </div>
        ))}

        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2 flex-1"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button
            className="px-3 py-2 bg-primary text-white rounded"
            onClick={addCategory}
          >
            Add category
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 bg-primary text-white rounded"
            onClick={saveTemplate}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Template"}
          </button>
          {message && <span className="text-sm text-gray-700">{message}</span>}
        </div>
      </div>
    </section>
  );
}

/* --- Users Manager (Admin) --- */
function UsersManager() {
  const [users, setUsers] = useState<AppUser[]>(() => [
    {
      id: uid("u-"),
      name: "Alice Admin",
      email: "alice@example.com",
      role: "admin",
    },
    { id: uid("u-"), name: "Bob User", email: "bob@example.com", role: "user" },
  ]);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: string;
  }>({ name: "", email: "", role: "user" });
  const [message, setMessage] = useState<string | null>(null);

  function addUser() {
    if (!newUser.name || !newUser.email) {
      setMessage("Name and email required");
      return;
    }
    const u: AppUser = {
      id: uid("u-"),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as any,
    };
    setUsers((s) => [...s, u]);
    setNewUser({ name: "", email: "", role: "user" });
    setMessage("User added (local only)");
    setTimeout(() => setMessage(null), 2000);
  }

  function removeUser(id: string) {
    setUsers((s) => s.filter((u) => u.id !== id));
  }

  async function persistChanges() {
    setMessage("Saving...");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users }),
      });
      if (!res.ok) {
        const t = await res.text();
        setMessage("Save failed: " + (t || res.statusText));
        return;
      }
      setMessage("Saved.");
    } catch (err: any) {
      setMessage("Error: " + String(err?.message || err));
    } finally {
      setTimeout(() => setMessage(null), 2000);
    }
  }

  return (
    <section className="p-4 bg-white rounded-lg shadow-sm border">
      <h2 className="text-lg font-semibold mb-3">User Management (Admin)</h2>
      <p className="text-sm text-gray-600 mb-4">
        Add, edit or remove application users and set roles.
      </p>

      <div className="space-y-3 mb-3">
        <div className="grid grid-cols-3 gap-2">
          <input
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="Full name"
            className="border rounded px-2 py-1"
          />
          <input
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="Email"
            className="border rounded px-2 py-1"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="border rounded px-2 py-1"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-primary text-white rounded"
            onClick={addUser}
          >
            Add user
          </button>
          <button
            className="px-3 py-1 border rounded"
            onClick={() => setNewUser({ name: "", email: "", role: "user" })}
          >
            Reset
          </button>
          <div className="text-sm text-gray-600 ml-auto">{message}</div>
        </div>
      </div>

      <div className="max-h-40 overflow-auto border rounded p-2">
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-gray-500">
                  {u.email} • <span className="capitalize">{u.role}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 text-xs border rounded"
                  onClick={() =>
                    alert("Edit flow not implemented in this demo")
                  }
                >
                  Edit
                </button>
                <button
                  className="px-2 py-1 text-xs border rounded text-rose-600"
                  onClick={() => removeUser(u.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          className="px-4 py-2 bg-primary text-white rounded"
          onClick={persistChanges}
        >
          Save changes
        </button>
        <span className="text-sm text-gray-600">{message}</span>
      </div>
    </section>
  );
}

/* --- Settings Page --- */
export default function SettingsPage({ userEmail }: { userEmail: string }) {
  // When an app is small it's handy to keep the admin sections accessible from settings.
  // The real app would gate these behind an auth/permission layer.
  useEffect(() => {
    // Page title enhancement for clarity when navigating
    document.title = "Settings — Monitoring App";
  }, []);

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-600">
            Manage application settings, upload projects and administer
            users/checklists.
          </p>
        </div>
        {userEmail && userEmail === "admin@gmail.com" && (
          <nav className="space-x-3">
            <Link
              href="/admin"
              className="px-3 py-2 border rounded hover:bg-gray-50"
            >
              Admin dashboard
            </Link>
            <Link
              href="/admin/users"
              className="px-3 py-2 border rounded hover:bg-gray-50"
            >
              Manage users
            </Link>
            <Link
              href="/admin/checklists"
              className="px-3 py-2 border rounded hover:bg-gray-50"
            >
              Checklist templates
            </Link>
          </nav>
        )}
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProjectUploadForm />

          {userEmail && userEmail === "admin@gmail.com" && (
            <section className="p-4 bg-white rounded-lg shadow-sm border">
              <h2 className="text-lg font-semibold mb-3">
                Application settings (Preview)
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                This area will be used to manage system-wide settings (feature
                toggles, default checklist templates, sectors).
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded">
                  <label className="text-xs text-gray-600">
                    Default project visibility
                  </label>
                  <div className="mt-2">
                    <select className="w-full border rounded px-2 py-1">
                      <option>Public</option>
                      <option>Internal</option>
                      <option>Private</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 border rounded">
                  <label className="text-xs text-gray-600">
                    Enable public comments
                  </label>
                  <div className="mt-2">
                    <select className="w-full border rounded px-2 py-1">
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {userEmail && userEmail === "admin@gmail.com" && (
          <aside className="space-y-6">
            <ChecklistEditor />
            <UsersManager />
          </aside>
        )}
      </main>
    </div>
  );
}
