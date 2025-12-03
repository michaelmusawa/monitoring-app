"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Admin - Checklist Templates Page
 *
 * Provides a UI for administrators to:
 * - Load existing checklist templates (from /api/admin/checklists when available)
 * - Create / edit / remove categories
 * - Create / edit / remove tasks within categories
 * - Save templates back to the server
 *
 * This page is intentionally defensive: if the backend endpoints are not present
 * the UI will still work locally and allow edits in-memory.
 */

/* Local UI types */
type Task = {
  id: string;
  label: string;
};

type Category = {
  id: string;
  name: string;
  tasks: Task[];
};

const uid = (prefix = "") => `${prefix}${Math.random().toString(36).slice(2, 9)}`;

export default function AdminChecklistsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  // new category input
  const [newCategoryName, setNewCategoryName] = useState<string>("");

  // initial load: try to fetch from API; fallback to empty template
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/checklists");
        if (!res.ok) {
          // fallback to empty template if endpoint missing
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const data = await res.json();
        // Expect data to be an array of categories or templates; be permissive
        if (mounted) {
          if (Array.isArray(data)) {
            // normalize whatever shape into Category[]
            const normalized: Category[] = data.map((c: any) => ({
              id: String(c.id ?? uid("cat-")),
              name: String(c.name ?? c.category ?? "Unnamed category"),
              tasks: Array.isArray(c.tasks)
                ? c.tasks.map((t: any) => ({ id: String(t.id ?? uid("t-")), label: String(t.label ?? t) }))
                : [],
            }));
            setCategories(normalized);
          } else {
            setCategories([]);
          }
        }
      } catch (err) {
        // If server is not available, initialize with a reasonable default
        if (mounted) {
          setCategories([
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
          setMessage("Loaded fallback checklist template (API unavailable).");
          // clear message after a short time
          setTimeout(() => setMessage(null), 3500);
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

  function addCategory() {
    if (!newCategoryName.trim()) return;
    setCategories((s) => [...s, { id: uid("cat-"), name: newCategoryName.trim(), tasks: [] }]);
    setNewCategoryName("");
  }

  function removeCategory(catId: string) {
    if (!confirm("Remove category and all its tasks?")) return;
    setCategories((s) => s.filter((c) => c.id !== catId));
  }

  function addTask(catId: string) {
    const label = "New task";
    setCategories((s) =>
      s.map((c) => (c.id === catId ? { ...c, tasks: [...c.tasks, { id: uid("t-"), label }] } : c)),
    );
  }

  function removeTask(catId: string, taskId: string) {
    setCategories((s) => s.map((c) => (c.id === catId ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) } : c)));
  }

  function updateCategoryName(catId: string, name: string) {
    setCategories((s) => s.map((c) => (c.id === catId ? { ...c, name } : c)));
  }

  function updateTaskLabel(catId: string, taskId: string, label: string) {
    setCategories((s) =>
      s.map((c) => (c.id === catId ? { ...c, tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, label } : t)) } : c)),
    );
  }

  async function saveTemplates() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = categories.map((c) => ({
        id: c.id,
        name: c.name,
        tasks: c.tasks.map((t) => ({ id: t.id, label: t.label })),
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

  function importSample() {
    const sample: Category[] = [
      {
        id: uid("cat-"),
        name: "Perimeter Wall",
        tasks: [
          { id: uid("t-"), label: "Perimeter Wall" },
          { id: uid("t-"), label: "Excavation and Earthworks" },
        ],
      },
      {
        id: uid("cat-"),
        name: "Sitting Terraces & VIP Area",
        tasks: [{ id: uid("t-"), label: "Formwork" }, { id: uid("t-"), label: "Reinforcement" }],
      },
    ];
    setCategories(sample);
    setMessage("Sample template imported. Save to persist.");
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold">Checklist Templates</h1>
          <p className="text-sm text-gray-600">
            Refine standard checklist templates used when initializing projects: add/remove/edit categories and tasks.
          </p>
        </div>

        <nav className="flex items-center gap-3">
          <Link href="/admin" className="px-3 py-2 border rounded hover:bg-gray-50">
            Back to admin
          </Link>
          <Button onClick={importSample} variant="outline">
            Import Sample
          </Button>
          <Button onClick={saveTemplates} disabled={saving || loading}>
            {saving ? "Saving..." : "Save templates"}
          </Button>
        </nav>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Categories</h2>
            <div className="text-sm text-gray-500">{loading ? "Loading..." : `${categories.length} categories`}</div>
          </div>

          {message && <div className="p-3 rounded bg-amber-50 border text-amber-800">{message}</div>}

          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.id} className="border rounded p-3 bg-white">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <Input
                      value={cat.name}
                      onChange={(e) => updateCategoryName(cat.id, (e.target as HTMLInputElement).value)}
                      placeholder="Category name"
                      className="text-base font-semibold"
                    />
                    <div className="text-xs text-gray-500 mt-1">Tasks: {cat.tasks.length}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button onClick={() => addTask(cat.id)} variant="outline">
                      + Task
                    </Button>
                    <Button onClick={() => removeCategory(cat.id)} variant="destructive">
                      Remove category
                    </Button>
                  </div>
                </div>

                <ul className="space-y-2">
                  {cat.tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-3">
                      <Input
                        value={t.label}
                        onChange={(e) => updateTaskLabel(cat.id, t.id, (e.target as HTMLInputElement).value)}
                        placeholder="Task label"
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => removeTask(cat.id, t.id)} variant="ghost">
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}

                  {cat.tasks.length === 0 && <li className="text-sm text-gray-500">No tasks yet. Add one above.</li>}
                </ul>
              </div>
            ))}

            {categories.length === 0 && <div className="text-sm text-gray-500">No categories created yet.</div>}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="p-4 border rounded bg-white">
            <h3 className="font-medium mb-2">Add new category</h3>
            <div className="space-y-2">
              <Input
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName((e.target as HTMLInputElement).value)}
              />
              <div className="flex gap-2">
                <Button onClick={addCategory}>Add category</Button>
                <Button variant="ghost" onClick={() => setNewCategoryName("")}>
                  Clear
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 border rounded bg-white">
            <h3 className="font-medium mb-2">Templates</h3>
            <p className="text-sm text-gray-600 mb-3">Quick actions and export/import utilities for checklist templates.</p>

            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={async () => {
                  try {
                    const blob = new Blob([JSON.stringify(categories, null, 2)], { type: "application/json" });
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
                Export JSON
              </Button>

              <div className="text-sm text-gray-500">
                You can export the current template as JSON, or import templates by POSTing to <code className="text-xs">/api/admin/checklists</code>.
              </div>
            </div>
          </div>

          <div className="p-4 border rounded bg-white">
            <h3 className="font-medium mb-2">Help</h3>
            <p className="text-sm text-gray-600">
              Checklist templates determine the parameters a project must be evaluated against. Use this editor to keep templates up to date. Make sure to save after making changes.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
