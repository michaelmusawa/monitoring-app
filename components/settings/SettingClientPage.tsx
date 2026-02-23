"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Pencil, Trash2, Upload, Plus } from "lucide-react";

// Types
import type { Project } from "@/lib/actions/projectActions";

// Server actions (import directly or use via API)
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  batchCreateProjects,
} from "@/lib/actions/projectActions";

// -----------------------------------------------------------------------------
// Project List Component with Edit Modal
// -----------------------------------------------------------------------------
function ProjectList({
  projects,
  onUpdate,
  onDelete,
  userEmail,
}: {
  projects: Project[];
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userEmail: string;
}) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sector: "",
    budget: "",
    status: "",
    description: "",
  });
  const router = useRouter();

  const openEdit = (p: Project) => {
    setEditing(p);
    setEditForm({
      name: p.name,
      sector: p.sector || "",
      budget: p.budget?.toString() || "",
      status: p.status,
      description: p.description || "",
    });
  };

  const handleEditSave = async () => {
    if (!editing) return;
    try {
      await onUpdate(editing.id, {
        name: editForm.name,
        sector: editForm.sector || null,
        budget: editForm.budget ? parseFloat(editForm.budget) : null,
        status: editForm.status,
        description: editForm.description || null,
      });
      setEditing(null);
      toast.success("Project updated");
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/projects/${p.slug}`}
                    className="hover:underline"
                  >
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>{p.sector || "—"}</TableCell>
                <TableCell>
                  {p.budget ? `KES ${p.budget.toLocaleString()}` : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={p.status === "PENDING" ? "outline" : "default"}
                  >
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(p.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Input
              placeholder="Project name"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
            <Input
              placeholder="Sector"
              value={editForm.sector}
              onChange={(e) =>
                setEditForm({ ...editForm, sector: e.target.value })
              }
            />
            <Input
              placeholder="Budget"
              type="number"
              value={editForm.budget}
              onChange={(e) =>
                setEditForm({ ...editForm, budget: e.target.value })
              }
            />
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="PENDING">PENDING</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ON_HOLD">ON HOLD</option>
            </select>
            <Textarea
              placeholder="Description"
              value={editForm.description}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// -----------------------------------------------------------------------------
// Quick Add Form (inline)
// -----------------------------------------------------------------------------
function QuickAddForm({ onAdd }: { onAdd: (data: any) => Promise<void> }) {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [budget, setBudget] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await onAdd({
        name: name.trim(),
        sector: sector.trim() || null,
        budget: budget ? parseFloat(budget) : null,
      });
      setName("");
      setSector("");
      setBudget("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs text-muted-foreground">Project name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Huruma Market"
          required
        />
      </div>
      <div className="w-40">
        <label className="text-xs text-muted-foreground">Sector</label>
        <Input
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          placeholder="e.g. Mobility"
        />
      </div>
      <div className="w-40">
        <label className="text-xs text-muted-foreground">Budget</label>
        <Input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="KES"
        />
      </div>
      <Button type="submit" disabled={adding}>
        <Plus className="h-4 w-4 mr-2" />
        {adding ? "Adding..." : "Add"}
      </Button>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Batch Upload Component
// -----------------------------------------------------------------------------
function BatchUpload({
  onUpload,
}: {
  onUpload: (projects: any[]) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview([]);
    setError(null);
    if (!f) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        if (f.name.endsWith(".json")) {
          const data = JSON.parse(content);
          if (Array.isArray(data)) {
            setPreview(data.slice(0, 5));
          } else {
            setError("JSON must be an array of projects");
          }
        } else if (f.name.endsWith(".csv")) {
          const lines = content.split("\n").filter((l) => l.trim());
          const headers = lines[0].split(",").map((h) => h.trim());
          const required = ["name"];
          if (!required.every((r) => headers.includes(r))) {
            setError("CSV must have at least 'name' column");
            return;
          }
          const rows = lines.slice(1).map((line) => {
            const values = line.split(",").map((v) => v.trim());
            const obj: any = {};
            headers.forEach((h, i) => {
              obj[h] = values[i] || null;
            });
            return obj;
          });
          setPreview(rows.slice(0, 5));
        } else {
          setError("Only .json or .csv files are supported");
        }
      } catch (err) {
        setError("Failed to parse file");
      }
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const content = await file.text();
      let projects: any[] = [];
      if (file.name.endsWith(".json")) {
        projects = JSON.parse(content);
      } else if (file.name.endsWith(".csv")) {
        const lines = content.split("\n").filter((l) => l.trim());
        const headers = lines[0].split(",").map((h) => h.trim());
        projects = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = values[i] || null;
          });
          return obj;
        });
      }
      // Validate each project has at least name
      const valid = projects.filter((p) => p.name);
      if (valid.length === 0) {
        setError("No valid projects found");
        return;
      }
      await onUpload(valid);
      setFile(null);
      setPreview([]);
    } catch (err) {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Batch Upload Projects</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upload a CSV or JSON file with columns: <code>name</code> (required),{" "}
          <code>sector</code>, <code>budget</code>, <code>lat</code>,{" "}
          <code>long</code>, <code>description</code>.
        </p>
        <div className="flex items-center gap-4">
          <Input type="file" accept=".json,.csv" onChange={handleFileChange} />
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        {preview.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Preview (first 5 rows)</h4>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto">
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Settings Page
// -----------------------------------------------------------------------------
export default function SettingsPage({ userEmail }: { userEmail: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  const router = useRouter();

  // Load projects on mount
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  // Handlers
  const handleAdd = async (data: any) => {
    try {
      const newProj = await createProject(data);
      setProjects((prev) => [newProj, ...prev]);
      toast.success("Project added");
    } catch {
      toast.error("Failed to add project");
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    const updated = await updateProject(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleBatchUpload = async (projectsData: any[]) => {
    try {
      const created = await batchCreateProjects(projectsData);
      setProjects((prev) => [...created, ...prev]);
      toast.success(`Uploaded ${created.length} projects`);
      setActiveTab("projects");
    } catch {
      toast.error("Batch upload failed");
    }
  };

  const isAdmin = userEmail === "admin@gmail.com";

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="text-sm text-gray-600">
            Add, edit, and manage projects.
          </p>
        </div>
        {isAdmin && (
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
          </nav>
        )}
      </header>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <QuickAddForm onAdd={handleAdd} />
          {loading ? (
            <div className="text-center py-10">Loading projects...</div>
          ) : (
            <ProjectList
              projects={projects}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              userEmail={userEmail}
            />
          )}
        </TabsContent>

        <TabsContent value="upload">
          <BatchUpload onUpload={handleBatchUpload} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">System Settings</h3>
              <p className="text-sm text-muted-foreground">
                Application‑wide settings will appear here.
              </p>
              {/* You can add form elements for default visibility, etc. */}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
