"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createPermission,
  updatePermission,
  deletePermission,
  type Permission,
} from "@/lib/actions/adminActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export default function PermissionsClient({
  permissions: initial,
}: {
  permissions: Permission[];
}) {
  const [permissions, setPermissions] = useState<Permission[]>(initial);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Permission | null>(null);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setCode("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEdit = (perm: Permission) => {
    setEditing(perm);
    setCode(perm.code);
    setDescription(perm.description || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!code.trim()) {
      toast.error("Permission code is required");
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        await updatePermission(editing.id, {
          code,
          description: description || undefined,
        });
        setPermissions((prev) =>
          prev.map((p) =>
            p.id === editing.id ? { ...p, code, description } : p,
          ),
        );
        toast.success("Permission updated");
      } else {
        const created = await createPermission({
          code,
          description: description || undefined,
        });
        setPermissions((prev) => [...prev, created]);
        toast.success("Permission created");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save permission");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this permission? It will be removed from roles."))
      return;
    setLoading(true);
    try {
      await deletePermission(id);
      setPermissions((prev) => prev.filter((p) => p.id !== id));
      toast.success("Permission deleted");
    } catch {
      toast.error("Failed to delete permission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black">Permissions</h1>
            <p className="text-sm text-muted-foreground">
              Granular access rules (e.g. project:edit)
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Create Permission
          </Button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell className="font-mono text-sm">
                    {perm.code}
                  </TableCell>
                  <TableCell>{perm.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(perm)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(perm.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Permission" : "New Permission"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Code *</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. project:delete"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use format module:action
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="What this permission allows"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
