"use client";

import { useState, useEffect } from "react";

import { toast } from "sonner";
import {
  fetchRoleWithPermissions,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole,
  fetchAllPermissions,
  type Role,
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Shield, Loader2, X } from "lucide-react";

export default function RolesClient({
  roles: initialRoles,
}: {
  roles: Role[];
}) {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [currentRoleForPerms, setCurrentRoleForPerms] = useState<Role | null>(
    null,
  );

  useEffect(() => {
    fetchAllPermissions().then(setPermissions);
  }, []);

  const openCreate = () => {
    setEditingRole(null);
    setFormName("");
    setFormDesc("");
    setSelectedPermIds([]);
    setDialogOpen(true);
  };

  const openEdit = async (role: Role) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDesc(role.description || "");
    const full = await fetchRoleWithPermissions(role.id);
    setSelectedPermIds(full.permissionIds);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Role name is required");
      return;
    }
    setLoading(true);
    try {
      let savedRole: Role;
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: formName,
          description: formDesc || undefined,
        });
        savedRole = { ...editingRole, name: formName, description: formDesc };
        setRoles((prev) =>
          prev.map((r) => (r.id === editingRole.id ? savedRole : r)),
        );
      } else {
        savedRole = await createRole({
          name: formName,
          description: formDesc || undefined,
        });
        setRoles((prev) => [...prev, savedRole]);
      }
      // Assign permissions
      await assignPermissionsToRole(savedRole.id, selectedPermIds);
      toast.success(editingRole ? "Role updated" : "Role created");
      setDialogOpen(false);
    } catch (err) {
      toast.error("Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId: number) => {
    if (!confirm("Delete this role? This will unassign it from all users."))
      return;
    setLoading(true);
    try {
      await deleteRole(roleId);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      toast.success("Role deleted");
    } catch {
      toast.error("Failed to delete role");
    } finally {
      setLoading(false);
    }
  };

  const openPermissionsDialog = async (role: Role) => {
    const full = await fetchRoleWithPermissions(role.id);
    setCurrentRoleForPerms(role);
    setSelectedPermIds(full.permissionIds);
    setPermDialogOpen(true);
  };

  const savePermissions = async () => {
    if (!currentRoleForPerms) return;
    setLoading(true);
    try {
      await assignPermissionsToRole(currentRoleForPerms.id, selectedPermIds);
      toast.success("Permissions updated");
      setPermDialogOpen(false);
    } catch {
      toast.error("Failed to update permissions");
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: number) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId],
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black">Roles & Permissions</h1>
            <p className="text-sm text-muted-foreground">
              Manage system roles and their permissions
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Create Role
          </Button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.description || "—"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPermissionsDialog(role)}
                    >
                      <Shield className="w-3.5 h-3.5 mr-1" /> Assign Permissions
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(role)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(role.id)}
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

      {/* Create/Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "New Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Role Name *</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Project Viewer"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Permissions (optional later)
              </label>
              <div className="flex flex-wrap gap-2 mt-2 max-h-48 overflow-y-auto border rounded p-2">
                {permissions.map((perm) => (
                  <Badge
                    key={perm.id}
                    variant={
                      selectedPermIds.includes(perm.id) ? "default" : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => togglePermission(perm.id)}
                  >
                    {perm.code}
                    {selectedPermIds.includes(perm.id) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
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

      {/* Assign Permissions Dialog */}
      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Permissions for {currentRoleForPerms?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {permissions.map((perm) => (
              <div
                key={perm.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted ${
                  selectedPermIds.includes(perm.id) ? "bg-primary/10" : ""
                }`}
                onClick={() => togglePermission(perm.id)}
              >
                <span className="font-mono text-sm">{perm.code}</span>
                <span className="text-xs text-muted-foreground">
                  {perm.description}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePermissions} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
