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
import {
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
} from "lucide-react";

import type { Project } from "@/lib/actions/projectActions";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  batchCreateProjects,
} from "@/lib/actions/projectActions";

const FASTAPI_URL = "http://127.0.0.1:8000/extract-cidp-projects";

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatBudget(n: number): string {
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n.toLocaleString()}`;
}

// ─── ProjectList ──────────────────────────────────────────────────────────────

function ProjectList({
  projects,
  onUpdate,
  onDelete,
}: {
  projects: Project[];
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sector: "",
    budget: "",
    status: "",
    description: "",
  });

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

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border rounded-md">
        No projects yet. Add one above or upload a CIDP PDF.
      </div>
    );
  }

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
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/projects/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>{p.sector || "—"}</TableCell>
                <TableCell>{p.budget ? formatBudget(p.budget) : "—"}</TableCell>
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
              className="w-full border rounded px-3 py-2 text-sm"
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

// ─── ExtractedProjectsPreview ─────────────────────────────────────────────────

type ExtractedProject = {
  name: string;
  sector: string | null;
  budget: number | null;
};

type SaveState = "idle" | "saving" | "done" | "error";

function ExtractedProjectsPreview({
  projects,
  onConfirm,
  onDiscard,
}: {
  projects: ExtractedProject[];
  onConfirm: () => Promise<void>;
  onDiscard: () => void;
}) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const preview = projects.slice(0, 5);

  const handleConfirm = async () => {
    setSaveState("saving");
    try {
      await onConfirm();
      setSaveState("done");
    } catch {
      setSaveState("error");
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium">
            {projects.length} projects extracted — preview of first 5
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDiscard}
            disabled={saveState === "saving"}
          >
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={saveState !== "idle"}
          >
            {saveState === "saving" && (
              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
            )}
            {saveState === "idle" && `Save all ${projects.length} projects`}
            {saveState === "saving" && "Saving…"}
            {saveState === "done" && "Saved!"}
            {saveState === "error" && "Retry"}
          </Button>
        </div>
      </div>

      {/* Preview table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Project Name</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Budget</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preview.map((p, i) => (
            <TableRow key={i}>
              <TableCell className="text-muted-foreground text-xs">
                {i + 1}
              </TableCell>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>
                {p.sector ? (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {p.sector}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{p.budget ? formatBudget(p.budget) : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {projects.length > 5 && (
        <p className="text-xs text-muted-foreground px-4 py-2 border-t">
          …and {projects.length - 5} more projects not shown above.
        </p>
      )}

      {saveState === "error" && (
        <p className="text-xs text-red-600 px-4 pb-3 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Failed to save. Check console for
          details and try again.
        </p>
      )}
    </div>
  );
}

// ─── BatchUpload ──────────────────────────────────────────────────────────────

function BatchUpload({
  onUpload,
}: {
  onUpload: (projects: ExtractedProject[]) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractionStep, setExtractionStep] = useState("");
  const [extracted, setExtracted] = useState<ExtractedProject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setExtracted(null);
    setError(null);
    setDone(false);
  };

  const handleExtract = async () => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported");
      return;
    }

    setExtracting(true);
    setExtractionStep("Extracting projects from PDF…");
    setError(null);
    setExtracted(null);

    try {
      // ── Step 1: extract from PDF ──────────────────────────────────────────
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(FASTAPI_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Extraction failed (${response.status}): ${detail}`);
      }

      const data = await response.json();

      if (!data.projects || data.projects.length === 0) {
        throw new Error(
          "No projects were extracted from this PDF. Ensure it contains Chapter 4.",
        );
      }

      // Initial mapping (raw names, may have spacing errors)
      let mapped: ExtractedProject[] = data.projects
        .map((p: any) => ({
          name: String(p.project_name || "").trim(),
          sector: p.sector ? String(p.sector).trim() : null,
          budget: p.budget != null ? Number(p.budget) : null,
        }))
        .filter((p: ExtractedProject) => p.name.length > 0);

      // ── Step 2: AI name cleaning ──────────────────────────────────────────
      setExtractionStep(`Cleaning ${mapped.length} project names with AI…`);
      try {
        const cleanResp = await fetch(
          `${FASTAPI_URL.replace("/extract-cidp-projects", "")}/clean-project-names`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ names: mapped.map((p) => p.name) }),
          },
        );

        if (cleanResp.ok) {
          const cleanData = await cleanResp.json();
          if (
            Array.isArray(cleanData.cleaned) &&
            cleanData.cleaned.length === mapped.length
          ) {
            mapped = mapped.map((p, i) => ({
              ...p,
              name: cleanData.cleaned[i] || p.name,
            }));
          }
        }
        // If cleaning fails for any reason, we proceed with raw names — not a hard error
      } catch (cleanErr) {
        console.warn("Name cleaning step failed, using raw names:", cleanErr);
      }

      setExtracted(mapped);
    } catch (err: any) {
      console.error("CIDP extraction error:", err);
      setError(err.message || "Extraction failed");
      toast.error("CIDP extraction failed");
    } finally {
      setExtracting(false);
      setExtractionStep("");
    }
  };

  const handleConfirm = async () => {
    if (!extracted) return;
    await onUpload(extracted); // ← calls batchCreateProjects via parent
    setDone(true);
    setExtracted(null);
    setFile(null);
  };

  const handleDiscard = () => {
    setExtracted(null);
    setFile(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-medium">
            Extract Projects from CIDP PDF
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload the County Integrated Development Plan PDF. The system will
            extract project names, sectors, and budgets from Chapter 4 and let
            you review them before saving.
          </p>
        </div>

        {/* File picker + button */}
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer border rounded px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{file ? file.name : "Choose PDF…"}</span>
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <Button onClick={handleExtract} disabled={!file || extracting}>
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {extractionStep || "Working…"}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Extract Projects
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success banner */}
        {done && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Projects saved successfully! Switch to the Projects tab to see them.
          </div>
        )}
      </div>

      {/* Preview + confirm */}
      {extracted && (
        <ExtractedProjectsPreview
          projects={extracted}
          onConfirm={handleConfirm}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
}

// ─── SettingsPage (main) ──────────────────────────────────────────────────────

export default function SettingsPage({ userEmail }: { userEmail: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id: string, data: any) => {
    const updated = await updateProject(id, data);
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  /**
   * Called after user reviews extracted projects and clicks "Save all N projects".
   * Maps to the DB shape and calls batchCreateProjects, then appends results
   * to local state so the Projects tab updates immediately.
   */
  const handleBatchUpload = async (extractedProjects: ExtractedProject[]) => {
    const payload = extractedProjects.map((p) => ({
      name: p.name,
      sector: p.sector ?? undefined,
      budget: p.budget ?? undefined,
    }));

    try {
      const created = await batchCreateProjects(payload);
      setProjects((prev) => [...created, ...prev]);
      toast.success(`${created.length} projects saved successfully`);
      setActiveTab("projects"); // switch to projects tab automatically
    } catch (err: any) {
      console.error("batchCreateProjects error:", err);
      toast.error("Failed to save projects to database");
      throw err; // re-throw so ExtractedProjectsPreview can show error state
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
          <nav className="flex items-center gap-2">
            <Link
              href="/admin"
              className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            >
              Admin dashboard
            </Link>
            <Link
              href="/admin/users"
              className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
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
          <TabsTrigger value="projects">
            Projects
            {projects.length > 0 && (
              <span className="ml-1.5 text-xs text-muted-foreground">
                ({projects.length})
              </span>
            )}
          </TabsTrigger>

          {isAdmin && (
            <>
              {" "}
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading projects…
            </div>
          ) : (
            <ProjectList
              projects={projects}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          )}
        </TabsContent>

        <TabsContent value="upload">
          <BatchUpload onUpload={handleBatchUpload} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-2">System Settings</h3>
              <p className="text-sm text-muted-foreground">
                Application-wide settings will appear here.
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
