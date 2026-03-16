"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Trash2,
  Copy,
  Save,
  FileDown,
  FileUp,
  EyeOff,
  Eye,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Plus,
  Search,
  ArrowLeft,
  Layers,
  FolderOpen,
  CheckSquare,
  AlertCircle,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Task = { id: string; name: string };
type Category = { id: string; name: string; tasks: Task[] };
type Template = { id: string; name: string; categories: Category[] };
const uid = (p = "") => `${p}${Math.random().toString(36).slice(2, 9)}`;

function InlineEdit({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);
  const commit = () => {
    const t = draft.trim();
    if (t) onChange(t);
    else setDraft(value);
    setEditing(false);
  };
  if (disabled)
    return <span className={cn("text-sm", className)}>{value}</span>;
  if (editing)
    return (
      <input
        ref={ref}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          "bg-transparent border-b border-primary/60 outline-none text-sm w-full py-0.5",
          className,
        )}
        placeholder={placeholder}
      />
    );
  return (
    <span
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title="Click to edit"
      className={cn(
        "cursor-text text-sm hover:text-primary transition-colors border-b border-transparent hover:border-primary/30",
        className,
      )}
    >
      {value || (
        <span className="text-muted-foreground italic">{placeholder}</span>
      )}
    </span>
  );
}

function AddRow({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (n: string) => void;
}) {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState("");
  const commit = () => {
    const t = value.trim();
    if (t) {
      onAdd(t);
      setValue("");
    }
    setActive(false);
  };
  if (!active)
    return (
      <button
        onClick={() => setActive(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 px-1 rounded w-full text-left"
      >
        <Plus className="w-3.5 h-3.5" />
        {placeholder}
      </button>
    );
  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue("");
            setActive(false);
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
        className="flex-1 text-sm border border-primary/40 rounded-md px-2 py-1.5 bg-background outline-none focus:ring-1 focus:ring-primary/30"
      />
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          commit();
        }}
        className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          setValue("");
          setActive(false);
        }}
        className="p-1.5 rounded-md hover:bg-muted"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function CategoryCard({
  category,
  canEdit,
  onUpdateName,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onRemove,
}: {
  category: Category;
  canEdit: boolean;
  onUpdateName: (n: string) => void;
  onAddTask: (n: string) => void;
  onUpdateTask: (id: string, n: string) => void;
  onRemoveTask: (id: string) => void;
  onRemove: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
        {canEdit && (
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 cursor-grab" />
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform",
              !collapsed && "rotate-90",
            )}
          />
        </button>
        <div className="flex-1 min-w-0">
          <InlineEdit
            value={category.name}
            onChange={onUpdateName}
            placeholder="Category name"
            className="font-semibold text-sm"
            disabled={!canEdit}
          />
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          {category.tasks.length} task{category.tasks.length !== 1 ? "s" : ""}
        </Badge>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              <DropdownMenuItem onClick={() => setCollapsed((c) => !c)}>
                {collapsed ? (
                  <Eye className="w-3.5 h-3.5 mr-2" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 mr-2" />
                )}
                {collapsed ? "Expand" : "Collapse"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onRemove}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {!collapsed && (
        <div className="divide-y divide-border/60">
          {category.tasks.map((task, idx) => (
            <div
              key={task.id}
              className="flex items-center gap-2 px-4 py-2.5 group hover:bg-muted/30 transition-colors"
            >
              {canEdit && (
                <GripVertical className="w-3 h-3 text-muted-foreground/30 shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              <span className="text-xs text-muted-foreground/60 w-5 shrink-0 font-mono">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <InlineEdit
                  value={task.name}
                  onChange={(v) => onUpdateTask(task.id, v)}
                  placeholder="Task description"
                  className="text-sm"
                  disabled={!canEdit}
                />
              </div>
              {canEdit && (
                <button
                  onClick={() => onRemoveTask(task.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {canEdit && (
            <div className="px-4 py-2.5">
              <AddRow placeholder="Add task..." onAdd={onAddTask} />
            </div>
          )}
          {!canEdit && category.tasks.length === 0 && (
            <div className="px-4 py-4 text-xs text-muted-foreground italic">
              No tasks in this category.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TemplateSidebarItem({
  template,
  isSelected,
  canEdit,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
}: {
  template: Template;
  isSelected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onRename: (n: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const totalTasks = template.categories.reduce(
    (s, c) => s + c.tasks.length,
    0,
  );
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border cursor-pointer transition-all px-3 py-3 hover:border-primary/40",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {canEdit && isSelected ? (
            <InlineEdit
              value={template.name}
              onChange={onRename}
              placeholder="Template name"
              className="font-semibold text-sm"
            />
          ) : (
            <p
              className={cn(
                "text-sm font-semibold truncate",
                isSelected && "text-primary",
              )}
            >
              {template.name}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {template.categories.length} categories · {totalTasks} tasks
          </p>
        </div>
        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-all"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-r-full" />
      )}
    </div>
  );
}

export default function AdminChecklistsPage({
  canEdit = true,
}: {
  canEdit?: boolean;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [showNewTemplate, setShowNewTemplate] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch("/api/admin/checklists")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: any) => {
        if (!mounted) return;
        let loaded: Template[] = [];
        if (Array.isArray(data)) {
          const first = data[0];
          if (first && "categories" in first && "name" in first) {
            loaded = data.map((t: any) => ({
              id: t.id ?? uid("tmpl-"),
              name: t.name || "Unnamed",
              categories: normalizeCategories(t.categories),
            }));
          } else {
            loaded = [
              {
                id: uid("tmpl-"),
                name: "Default Template",
                categories: normalizeCategories(data),
              },
            ];
          }
        }
        setTemplates(loaded);
        if (loaded.length > 0) setSelectedId(loaded[0].id);
      })
      .catch(() => toast.error("Failed to load templates"))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line

  const selected = templates.find((t) => t.id === selectedId) ?? null;
  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const totalTasks =
    selected?.categories.reduce((s, c) => s + c.tasks.length, 0) ?? 0;

  function updateSelected(fn: (t: Template) => Template) {
    if (!selectedId) return;
    setTemplates((prev) => prev.map((t) => (t.id === selectedId ? fn(t) : t)));
  }

  function createTemplate() {
    const name = newTemplateName.trim();
    if (!name) return;
    const t: Template = { id: uid("tmpl-"), name, categories: [] };
    setTemplates((prev) => [...prev, t]);
    setSelectedId(t.id);
    setNewTemplateName("");
    setShowNewTemplate(false);
    toast.success(`Template "${name}" created`);
  }

  function deleteTemplate(id: string) {
    if (!confirm("Delete this template?")) return;
    const remaining = templates.filter((t) => t.id !== id);
    setTemplates(remaining);
    setSelectedId(remaining.length > 0 ? remaining[0].id : null);
    toast.info("Template deleted");
  }

  function duplicateTemplate(id: string) {
    const orig = templates.find((t) => t.id === id);
    if (!orig) return;
    const copy: Template = {
      ...orig,
      id: uid("tmpl-"),
      name: `${orig.name} (copy)`,
      categories: orig.categories.map((c) => ({
        ...c,
        id: uid("cat-"),
        tasks: c.tasks.map((tk) => ({ ...tk, id: uid("t-") })),
      })),
    };
    setTemplates((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    toast.success("Template duplicated");
  }

  async function saveTemplates() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/checklists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("All templates saved");
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function exportTemplates() {
    const blob = new Blob([JSON.stringify(templates, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checklist-templates-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Templates exported");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        const imported = (Array.isArray(data) ? data : []).map((t: any) => ({
          id: uid("tmpl-"),
          name: t.name || "Imported Template",
          categories: normalizeCategories(t.categories ?? []),
        }));
        if (!imported.length) throw new Error("No valid templates found");
        setTemplates((prev) => [...prev, ...imported]);
        setSelectedId(imported[0].id);
        toast.success(
          `${imported.length} template${imported.length > 1 ? "s" : ""} imported`,
        );
      } catch (err: any) {
        toast.error(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3 gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Admin
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Checklist Templates</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!canEdit && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border px-2.5 py-1.5 rounded-lg">
                <EyeOff className="w-3.5 h-3.5" /> Read-only
              </div>
            )}
            {canEdit && (
              <>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImport}
                  />
                  <span className="flex items-center gap-1.5 text-sm border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors cursor-pointer">
                    <FileUp className="w-3.5 h-3.5" /> Import
                  </span>
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTemplates}
                  disabled={!templates.length}
                >
                  <FileDown className="w-3.5 h-3.5 mr-1.5" /> Export
                </Button>
                <Button
                  size="sm"
                  onClick={saveTemplates}
                  disabled={saving || loading}
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {saving ? "Saving..." : "Save All"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-53px)]">
        <aside className="w-72 shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-muted/50 animate-pulse"
                />
              ))
            ) : filteredTemplates.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                {searchQuery
                  ? "No templates match your search"
                  : "No templates yet"}
              </p>
            ) : (
              filteredTemplates.map((t) => (
                <TemplateSidebarItem
                  key={t.id}
                  template={t}
                  isSelected={selectedId === t.id}
                  canEdit={canEdit}
                  onSelect={() => setSelectedId(t.id)}
                  onRename={(name) =>
                    setTemplates((prev) =>
                      prev.map((x) => (x.id === t.id ? { ...x, name } : x)),
                    )
                  }
                  onDuplicate={() => duplicateTemplate(t.id)}
                  onDelete={() => deleteTemplate(t.id)}
                />
              ))
            )}
          </div>
          {canEdit && (
            <div className="p-3 border-t border-border">
              {showNewTemplate ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") createTemplate();
                      if (e.key === "Escape") {
                        setNewTemplateName("");
                        setShowNewTemplate(false);
                      }
                    }}
                    placeholder="Template name..."
                    className="flex-1 text-sm border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      createTemplate();
                    }}
                    className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setNewTemplateName("");
                      setShowNewTemplate(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-muted"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewTemplate(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/40 rounded-xl py-2 transition-all hover:bg-muted/30"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> New Template
                </button>
              )}
            </div>
          )}
        </aside>

        <main className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                <Layers className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                {templates.length === 0
                  ? "No templates yet. Create one to get started."
                  : "Select a template from the sidebar."}
              </p>
              {canEdit && templates.length === 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewTemplate(true)}
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Create Template
                </Button>
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-8 py-6 space-y-6">
              <div>
                <h1 className="text-xl font-bold">{selected.name}</h1>
                <div className="flex items-center gap-4 mt-1.5">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span className="font-semibold text-foreground">
                      {selected.categories.length}
                    </span>{" "}
                    categories
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span className="font-semibold text-foreground">
                      {totalTasks}
                    </span>{" "}
                    tasks
                  </span>
                </div>
              </div>
              {canEdit && selected.categories.length === 0 && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-sm text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  This template has no categories yet. Add a category below,
                  then add tasks to it.
                </div>
              )}
              <div className="space-y-3">
                {selected.categories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    canEdit={canEdit}
                    onUpdateName={(name) =>
                      updateSelected((t) => ({
                        ...t,
                        categories: t.categories.map((c) =>
                          c.id === cat.id ? { ...c, name } : c,
                        ),
                      }))
                    }
                    onAddTask={(name) =>
                      updateSelected((t) => ({
                        ...t,
                        categories: t.categories.map((c) =>
                          c.id === cat.id
                            ? {
                                ...c,
                                tasks: [...c.tasks, { id: uid("t-"), name }],
                              }
                            : c,
                        ),
                      }))
                    }
                    onUpdateTask={(tid, name) =>
                      updateSelected((t) => ({
                        ...t,
                        categories: t.categories.map((c) =>
                          c.id === cat.id
                            ? {
                                ...c,
                                tasks: c.tasks.map((tk) =>
                                  tk.id === tid ? { ...tk, name } : tk,
                                ),
                              }
                            : c,
                        ),
                      }))
                    }
                    onRemoveTask={(tid) =>
                      updateSelected((t) => ({
                        ...t,
                        categories: t.categories.map((c) =>
                          c.id === cat.id
                            ? {
                                ...c,
                                tasks: c.tasks.filter((tk) => tk.id !== tid),
                              }
                            : c,
                        ),
                      }))
                    }
                    onRemove={() => {
                      if (!confirm("Remove this category and all its tasks?"))
                        return;
                      updateSelected((t) => ({
                        ...t,
                        categories: t.categories.filter((c) => c.id !== cat.id),
                      }));
                    }}
                  />
                ))}
              </div>
              {canEdit && (
                <div className="border border-dashed border-border rounded-xl px-4 py-3">
                  <AddRow
                    placeholder="Add new category..."
                    onAdd={(name) =>
                      updateSelected((t) => ({
                        ...t,
                        categories: [
                          ...t.categories,
                          { id: uid("cat-"), name, tasks: [] },
                        ],
                      }))
                    }
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
