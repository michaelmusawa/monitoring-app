"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Copy, Save, FileDown, EyeOff } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type Task = {
  id: string;
  name: string;
};

type Category = {
  id: string;
  name: string;
  tasks: Task[];
};

type Template = {
  id: string;
  name: string;
  categories: Category[];
};

const uid = (prefix = "") =>
  `${prefix}${Math.random().toString(36).slice(2, 9)}`;

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

interface AdminChecklistsPageProps {
  canEdit?: boolean; // Pass false for read‑only view
}

export default function AdminChecklistsPage({
  canEdit = true,
}: AdminChecklistsPageProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "info" | "error";
    text: string;
  } | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");

  // Load templates from API
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/checklists");
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const data = await res.json();

        console.log("data", data);
        if (!mounted) return;

        // Normalize response to Template[]
        let loadedTemplates: Template[] = [];

        if (Array.isArray(data)) {
          // Check if it's an array of templates (each has name + categories) or old categories array
          const first = data[0];
          if (first && "categories" in first && "name" in first) {
            // Already in new format: list of templates
            loadedTemplates = data.map((t: any) => ({
              id: t.id ?? uid("tmpl-"),
              name: t.name || "Unnamed",
              categories: normalizeCategories(t.categories),
            }));
          } else {
            // Old format: array of categories → wrap as a single default template
            loadedTemplates = [
              {
                id: uid("tmpl-"),
                name: "Default Template",
                categories: normalizeCategories(data),
              },
            ];
          }
        }

        setTemplates(loadedTemplates);
        setSelectedTemplateId(loadedTemplates[0].id);
      } catch (err) {
        console.warn("Using fallback template", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to normalise any category-like input to our Category type
  function normalizeCategories(cats: any[]): Category[] {
    if (!Array.isArray(cats)) return [];
    return cats.map((c: any) => ({
      id: String(c.id ?? uid("cat-")),
      name: String(c.name ?? c.category ?? "Unnamed category"),
      tasks: Array.isArray(c.tasks)
        ? c.tasks.map((t: any) => ({
            id: String(t.id ?? uid("t-")),
            name: String(t.name ?? t),
          }))
        : [],
    }));
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  /* ------------------------------------------------------------------------ */
  /* Template CRUD                                                            */
  /* ------------------------------------------------------------------------ */

  function createTemplate() {
    if (!newTemplateName.trim()) return;
    const newTmpl: Template = {
      id: uid("tmpl-"),
      name: newTemplateName.trim(),
      categories: [],
    };
    setTemplates((prev) => [...prev, newTmpl]);
    setSelectedTemplateId(newTmpl.id);
    setNewTemplateName("");
  }

  function deleteTemplate(tmplId: string) {
    if (!confirm("Delete this template permanently?")) return;
    setTemplates((prev) => prev.filter((t) => t.id !== tmplId));
    if (selectedTemplateId === tmplId) {
      const remaining = templates.filter((t) => t.id !== tmplId);
      setSelectedTemplateId(remaining.length > 0 ? remaining[0].id : null);
    }
  }

  function duplicateTemplate(tmplId: string) {
    const original = templates.find((t) => t.id === tmplId);
    if (!original) return;
    const copy: Template = {
      ...original,
      id: uid("tmpl-"),
      name: `${original.name} (copy)`,
      categories: original.categories.map((cat) => ({
        ...cat,
        id: uid("cat-"),
        tasks: cat.tasks.map((task) => ({ ...task, id: uid("t-") })),
      })),
    };
    setTemplates((prev) => [...prev, copy]);
    setSelectedTemplateId(copy.id);
  }

  function updateTemplateName(tmplId: string, newName: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === tmplId ? { ...t, name: newName } : t)),
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Category / Task mutations (only applied to selected template)           */
  /* ------------------------------------------------------------------------ */

  function updateSelectedTemplate(updater: (tmpl: Template) => Template) {
    if (!selectedTemplateId) return;
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedTemplateId ? updater(t) : t)),
    );
  }

  function addCategory(name: string) {
    if (!name.trim() || !selectedTemplateId) return;
    updateSelectedTemplate((tmpl) => ({
      ...tmpl,
      categories: [
        ...tmpl.categories,
        { id: uid("cat-"), name: name.trim(), tasks: [] },
      ],
    }));
  }

  function removeCategory(catId: string) {
    if (!confirm("Remove category and all its tasks?")) return;
    updateSelectedTemplate((tmpl) => ({
      ...tmpl,
      categories: tmpl.categories.filter((c) => c.id !== catId),
    }));
  }

  function addTask(catId: string) {
    updateSelectedTemplate((tmpl) => ({
      ...tmpl,
      categories: tmpl.categories.map((c) =>
        c.id === catId
          ? { ...c, tasks: [...c.tasks, { id: uid("t-"), name: "New task" }] }
          : c,
      ),
    }));
  }

  function removeTask(catId: string, taskId: string) {
    updateSelectedTemplate((tmpl) => ({
      ...tmpl,
      categories: tmpl.categories.map((c) =>
        c.id === catId
          ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
          : c,
      ),
    }));
  }

  function updateCategoryName(catId: string, name: string) {
    updateSelectedTemplate((tmpl) => ({
      ...tmpl,
      categories: tmpl.categories.map((c) =>
        c.id === catId ? { ...c, name } : c,
      ),
    }));
  }

  function updateTaskLabel(catId: string, taskId: string, name: string) {
    updateSelectedTemplate((tmpl) => ({
      ...tmpl,
      categories: tmpl.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, name } : t)),
            }
          : c,
      ),
    }));
  }

  /* ------------------------------------------------------------------------ */
  /* Save / Export / Import                                                   */
  /* ------------------------------------------------------------------------ */

  async function saveTemplates() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = { templates };
      const res = await fetch("/api/admin/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage({ type: "info", text: "Templates saved successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: `Save failed: ${err.message}` });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  function exportTemplates() {
    try {
      const blob = new Blob([JSON.stringify(templates, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "checklist-templates.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed: " + err);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Checklist Templates</h1>
          <p className="text-sm text-gray-600">
            {canEdit
              ? "Create and edit multiple templates. Changes are saved to the server."
              : "View templates (read‑only mode)."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
          >
            Back to admin
          </Link>
          {canEdit && (
            <>
              <Button variant="outline" onClick={exportTemplates}>
                <FileDown className="w-4 h-4 mr-2" /> Export
              </Button>

              <Button onClick={saveTemplates} disabled={saving || loading}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
          {/* Optional: visual indicator for view mode */}
          {!canEdit && (
            <div className="flex items-center text-sm text-gray-500 border px-3 py-2 rounded">
              <EyeOff className="w-4 h-4 mr-2" /> Read‑only
            </div>
          )}
        </div>
      </header>

      {message && (
        <div
          className={`p-3 rounded ${
            message.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Main grid: template sidebar + editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: template list */}
        <aside className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : (
                <>
                  {templates.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        selectedTemplateId === tmpl.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {canEdit ? (
                          <Input
                            value={tmpl.name}
                            onChange={(e) =>
                              updateTemplateName(tmpl.id, e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 text-sm font-medium"
                          />
                        ) : (
                          <span className="font-medium text-sm">
                            {tmpl.name}
                          </span>
                        )}
                        {canEdit && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                duplicateTemplate(tmpl.id);
                              }}
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTemplate(tmpl.id);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {tmpl.categories.length} categories
                      </p>
                    </div>
                  ))}

                  {canEdit && (
                    <div className="pt-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="New template name"
                          value={newTemplateName}
                          onChange={(e) => setNewTemplateName(e.target.value)}
                        />
                        <Button size="sm" onClick={createTemplate}>
                          <PlusCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Editor / Viewer for the selected template */}
        <section className="lg:col-span-3 space-y-4">
          {selectedTemplate ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {selectedTemplate.name}
                </h2>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addCategory(prompt("Category name") || "")}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Category
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {selectedTemplate.categories.map((cat) => (
                  <Card key={cat.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        {canEdit ? (
                          <Input
                            value={cat.name}
                            onChange={(e) =>
                              updateCategoryName(cat.id, e.target.value)
                            }
                            className="text-lg font-semibold h-9"
                          />
                        ) : (
                          <CardTitle className="text-lg">{cat.name}</CardTitle>
                        )}
                        {canEdit && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addTask(cat.id)}
                            >
                              + Task
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => removeCategory(cat.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {cat.tasks.map((task) => (
                          <li key={task.id} className="flex items-center gap-3">
                            {canEdit ? (
                              <Input
                                value={task.name}
                                onChange={(e) =>
                                  updateTaskLabel(
                                    cat.id,
                                    task.id,
                                    e.target.value,
                                  )
                                }
                                placeholder="Task description"
                              />
                            ) : (
                              <span className="text-sm">{task.name}</span>
                            )}
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTask(cat.id, task.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </li>
                        ))}
                        {cat.tasks.length === 0 && (
                          <li className="text-sm text-gray-500 italic">
                            No tasks yet.
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                ))}

                {selectedTemplate.categories.length === 0 && (
                  <div className="text-center py-8 border rounded bg-gray-50">
                    <p className="text-gray-500">
                      This template has no categories.
                      {canEdit && " Click 'Add Category' to start."}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 border rounded bg-gray-50">
              <p className="text-gray-500">
                {templates.length === 0
                  ? "No templates yet. Create one to get started."
                  : "Select a template from the sidebar"}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
