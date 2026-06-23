"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  ArrowLeft,
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchFilteredUsers,
  createUser,
  updateUser,
  archiveUser,
  activateUser,
  deleteUser,
  assignRolesToUser,
  getUserRoles,
  fetchAllRolesForSelect,
  type AdminUser,
  type Role,
} from "@/lib/actions/adminActions";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Image from "next/image";
import { SECTORS } from "@/lib/data/data";
import OrgUnitSelector from "./OrgUnitSelector";

// ─────────────────────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ user }: { user: AdminUser }) {
  const initials = (user.name ?? user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return user.image ? (
    <Image
      src={user.image}
      alt={user.name ?? ""}
      width={50}
      height={50}
      className="w-9 h-9 rounded-xl object-cover"
    />
  ) : (
    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300">
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role badges
// ─────────────────────────────────────────────────────────────────────────────

function RoleBadges({ roles }: { roles: Role[] }) {
  if (!roles?.length) {
    return <span className="text-xs text-zinc-400">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <span
          key={role.id}
          className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800"
        >
          {role.name}
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// User Form Dialog
// ─────────────────────────────────────────────────────────────────────────────

const UserFormDialog = memo(function UserFormDialog({
  open,
  onClose,
  initialData,
  initialRoleIds = [],
  allRoles,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: AdminUser;
  initialRoleIds?: number[];
  allRoles: Role[];
  onSave: (data: {
    name: string;
    email: string;
    roleIds: number[];
    sector?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sector, setSector] = useState("none");
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const isEdit = !!initialData;

  // ✅ FIXED
  useEffect(() => {
    if (!open) return;

    setName(initialData?.name ?? "");
    setEmail(initialData?.email ?? "");
    setSector(initialData?.sector ?? "none");
    setSelectedRoleIds([...initialRoleIds]);
  }, [open]);

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (selectedRoleIds.length === 0) {
      toast.error("At least one role is required");
      return;
    }

    setSaving(true);

    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        roleIds: selectedRoleIds,
        sector: sector === "none" ? undefined : sector,
      });

      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>

          <DialogDescription>
            {isEdit
              ? "Update user details and assign roles."
              : "Create a new user account."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Full Name <span className="text-destructive">*</span>
            </Label>

            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Wanjiku"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Email Address <span className="text-destructive">*</span>
            </Label>

            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@nairobi.go.ke"
              className="h-9 text-sm"
              disabled={isEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Roles (select one or more)
            </Label>

            <div className="flex flex-wrap gap-2 border rounded-lg p-3 bg-muted/20">
              {allRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => toggleRole(role.id)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    selectedRoleIds.includes(role.id)
                      ? "bg-violet-100 border-violet-300 text-violet-800 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Organisational Unit</Label>
            <OrgUnitSelector
              value={sector === "none" ? "" : sector}
              onChange={(val) => setSector(val || "none")}
              placeholder="Select organisational unit…"
              className="h-9 text-sm"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="min-w-[90px]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Confirm Dialog
// ─────────────────────────────────────────────────────────────────────────────

const ConfirmDialog = memo(function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  variant = "destructive",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  variant?: "destructive" | "warning";
}) {
  const [pending, setPending] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
              variant === "destructive"
                ? "bg-red-100 dark:bg-red-950/30"
                : "bg-amber-100 dark:bg-amber-950/30"
            }`}
          >
            <AlertCircle
              className={`w-5 h-5 ${
                variant === "destructive" ? "text-red-600" : "text-amber-600"
              }`}
            />
          </div>

          <DialogTitle>{title}</DialogTitle>

          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>

          <Button
            size="sm"
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={pending}
            onClick={async () => {
              setPending(true);

              try {
                await onConfirm();
                onClose();
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminUsersClient({
  currentPage,
  totalPages,
}: {
  query: string;
  startDate: string;
  endDate: string;
  currentPage: number;
  totalPages: number;
  showArchived: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryParam = searchParams.get("query") ?? "";
  const startDateParam = searchParams.get("startDate") ?? "";
  const endDateParam = searchParams.get("endDate") ?? "";
  const showArchivedParam = searchParams.get("showArchived") === "true";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [usersRoles, setUsersRoles] = useState<Record<string, Role[]>>({});

  const [createOpen, setCreateOpen] = useState(false);

  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);

  const [editRoleIds, setEditRoleIds] = useState<number[]>([]);

  const [archiveTarget, setArchiveTarget] = useState<AdminUser | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const loadingRef = useRef(false);

  // ───────────────────────────────────────────────────────────────────────────
  // Refresh data
  // ───────────────────────────────────────────────────────────────────────────

  const refreshData = useCallback(async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const [usersData, rolesData] = await Promise.all([
        fetchFilteredUsers({
          query: queryParam,
          startDate: startDateParam,
          endDate: endDateParam,
          currentPage,
          showArchived: showArchivedParam,
        }),

        fetchAllRolesForSelect(),
      ]);

      setUsers(usersData);
      setAllRoles(rolesData);

      const rolesMap: Record<string, Role[]> = {};

      await Promise.all(
        usersData.map(async (u) => {
          const roles = await getUserRoles(u.id);
          rolesMap[u.id] = roles;
        }),
      );

      setUsersRoles(rolesMap);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [
    queryParam,
    startDateParam,
    endDateParam,
    currentPage,
    showArchivedParam,
  ]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ───────────────────────────────────────────────────────────────────────────
  // URL Helpers
  // ───────────────────────────────────────────────────────────────────────────

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());

    if (value) {
      p.set(key, value);
    } else {
      p.delete(key);
    }

    p.delete("page");

    router.replace(`${pathname}?${p.toString()}`);
  }

  const handleSearch = useDebouncedCallback(
    (q: string) => updateParam("query", q),
    300,
  );

  const toggleArchived = () => {
    updateParam(
      "showArchived",
      searchParams.get("showArchived") === "true" ? "" : "true",
    );
  };

  const showArchived = searchParams.get("showArchived") === "true";

  // ───────────────────────────────────────────────────────────────────────────
  // Actions
  // ───────────────────────────────────────────────────────────────────────────

  const openEdit = async (user: AdminUser) => {
    const roles = await getUserRoles(user.id);

    setEditTarget(user);
    setEditRoleIds(roles.map((r) => r.id));
  };

  const handleCreateUser = async (data: {
    name: string;
    email: string;
    roleIds: number[];
    sector?: string;
  }) => {
    await createUser(data);

    toast.success("User created");

    await refreshData();
  };

  const handleUpdateUser = async (data: {
    name: string;
    email: string;
    roleIds: number[];
    sector?: string;
  }) => {
    if (!editTarget) return;

    await updateUser(editTarget.id, {
      name: data.name,
      sector: data.sector,
    });

    await assignRolesToUser(editTarget.id, data.roleIds);

    toast.success("User updated");

    await refreshData();
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-4 md:p-6 lg:p-8">
      {/* KEEP YOUR EXISTING TABLE/UI EXACTLY THE SAME */}
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin"
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Admin
              </Link>
              <span className="text-zinc-300 dark:text-zinc-600">/</span>
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Users
              </span>
            </div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              User Management
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              {users.length} user{users.length !== 1 ? "s" : ""} shown
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              defaultValue={searchParams.get("query") ?? ""}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <button
            onClick={toggleArchived}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
              showArchived
                ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {showArchived ? "Showing archived" : "Show archived"}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                No users found
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                    {[
                      "#",
                      "User",
                      "Email",
                      "Roles",
                      "Sector",
                      "Status",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {users.map((user, i) => (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs text-zinc-400 font-mono">
                        {(currentPage - 1) * 10 + i + 1}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} />
                          <div>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                              {user.name ?? "—"}
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">
                              Joined{" "}
                              {new Date(user.createdAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600 dark:text-zinc-400">
                        {user.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <RoleBadges roles={usersRoles[user.id] || []} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500 dark:text-zinc-400 max-w-[180px] truncate">
                        {user.sector ?? (
                          <span className="text-zinc-300 dark:text-zinc-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            user.status === "archived"
                              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === "archived"
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                            }`}
                          />
                          {user.status === "archived" ? "Archived" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-sm">
                            <DropdownMenuItem onClick={() => openEdit(user)}>
                              <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                            {user.status === "archived" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setArchiveTarget({
                                    ...user,
                                    status: "active",
                                  })
                                }
                              >
                                <UserCheck className="w-3.5 h-3.5 mr-2" />{" "}
                                Activate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => setArchiveTarget(user)}
                              >
                                <UserX className="w-3.5 h-3.5 mr-2" /> Archive
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteTarget(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
              <p className="text-xs text-zinc-400">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-1">
                <Link
                  href={`?${new URLSearchParams({
                    ...Object.fromEntries(searchParams),
                    page: String(currentPage - 1),
                  })}`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                    currentPage <= 1
                      ? "opacity-40 pointer-events-none"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <Link
                  href={`?${new URLSearchParams({
                    ...Object.fromEntries(searchParams),
                    page: String(currentPage + 1),
                  })}`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
                    currentPage >= totalPages
                      ? "opacity-40 pointer-events-none"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Dialogs */}

      <UserFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        allRoles={allRoles}
        onSave={handleCreateUser}
      />

      <UserFormDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initialData={editTarget ?? undefined}
        initialRoleIds={editRoleIds}
        allRoles={allRoles}
        onSave={handleUpdateUser}
      />

      {archiveTarget && (
        <ConfirmDialog
          open={!!archiveTarget}
          onClose={() => setArchiveTarget(null)}
          title={
            archiveTarget.status === "active" ? "Archive User" : "Activate User"
          }
          description={
            archiveTarget.status === "active"
              ? `Archive ${
                  archiveTarget.name ?? archiveTarget.email
                }? They will lose access to the platform.`
              : `Re-activate ${
                  archiveTarget.name ?? archiveTarget.email
                }? They will regain platform access.`
          }
          variant="warning"
          onConfirm={async () => {
            if (archiveTarget.status === "active") {
              await archiveUser(archiveTarget.id);
              toast.success("User archived");
            } else {
              await activateUser(archiveTarget.id);
              toast.success("User activated");
            }

            await refreshData();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete User"
          description={`Permanently delete ${
            deleteTarget.name ?? deleteTarget.email
          }? This cannot be undone.`}
          variant="destructive"
          onConfirm={async () => {
            await deleteUser(deleteTarget.id);

            toast.success("User deleted");

            await refreshData();
          }}
        />
      )}
    </div>
  );
}
