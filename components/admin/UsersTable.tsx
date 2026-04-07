"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Shield,
  ArrowLeft,
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Loader2,
  CheckCircle2,
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
  type AdminUser,
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
import { ROLES, SECTORS } from "@/lib/data/data";

// ─── Avatar ───────────────────────────────────────────────────────────────────

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

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_CLS: Record<string, string> = {
  systemAdmin:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-800",
  admin:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800",
  user: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
};
function RoleBadge({ role }: { role: string | null }) {
  const r = role ?? "sector";
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_CLS[r] ?? ROLE_CLS.sector}`}
    >
      {r}
    </span>
  );
}

// ─── User form dialog ─────────────────────────────────────────────────────────

function UserFormDialog({
  open,
  onClose,
  initialData,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initialData?: AdminUser;
  onSave: (data: {
    name: string;
    email: string;
    role: string;
    sector?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [role, setRole] = useState(initialData?.role ?? "sector");
  const [sector, setSector] = useState(initialData?.sector ?? "none");
  const [saving, setSaving] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setEmail(initialData?.email ?? "");
      setRole(initialData?.role ?? "sector");
      setSector(initialData?.sector ?? "");
    }
  }, [open, initialData]);

  const isEdit = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        role,
        sector: sector === "none" ? undefined : sector,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update user details and role."
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem
                      key={r}
                      value={r}
                      className="text-sm capitalize"
                    >
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="none"
                    className="text-sm text-muted-foreground"
                  >
                    None
                  </SelectItem>
                  {SECTORS.map((s) => (
                    <SelectItem key={s} value={s} className="text-sm">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${variant === "destructive" ? "bg-red-100 dark:bg-red-950/30" : "bg-amber-100 dark:bg-amber-950/30"}`}
          >
            <AlertCircle
              className={`w-5 h-5 ${variant === "destructive" ? "text-red-600" : "text-amber-600"}`}
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
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminUsersClient({
  query: initialQuery,
  startDate,
  endDate,
  currentPage,
  totalPages,
  showArchived: initialShowArchived,
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
  const params = useSearchParams();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // Load users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFilteredUsers({
        query: params.get("query") ?? "",
        startDate: params.get("startDate") ?? "",
        endDate: params.get("endDate") ?? "",
        currentPage,
        showArchived: params.get("showArchived") === "true",
      });
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, [params, currentPage]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // URL helpers
  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(params.toString());
    if (value) p.set(key, value);
    else p.delete(key);
    p.delete("page");
    router.replace(`${pathname}?${p.toString()}`);
  }

  const handleSearch = useDebouncedCallback(
    (q: string) => updateParam("query", q),
    300,
  );
  const toggleArchived = () =>
    updateParam(
      "showArchived",
      params.get("showArchived") === "true" ? "" : "true",
    );

  const showArchived = params.get("showArchived") === "true";

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117] p-4 md:p-6 lg:p-8">
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
              defaultValue={params.get("query") ?? ""}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
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
                    {["#", "User", "Email", "Role", "Sector", "Status", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ),
                    )}
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
                        <RoleBadge role={user.role} />
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
                            className={`w-1.5 h-1.5 rounded-full ${user.status === "archived" ? "bg-amber-400" : "bg-emerald-400"}`}
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
                            <DropdownMenuItem
                              onClick={() => setEditTarget(user)}
                            >
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
                  href={`?${new URLSearchParams({ ...Object.fromEntries(params), page: String(currentPage - 1) })}`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${currentPage <= 1 ? "opacity-40 pointer-events-none" : "border-zinc-200 dark:border-zinc-700"}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <Link
                  href={`?${new URLSearchParams({ ...Object.fromEntries(params), page: String(currentPage + 1) })}`}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${currentPage >= totalPages ? "opacity-40 pointer-events-none" : "border-zinc-200 dark:border-zinc-700"}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <UserFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={async (data) => {
          await createUser(data);
          toast.success("User created");
          loadUsers();
        }}
      />

      {/* Edit dialog */}
      <UserFormDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initialData={editTarget ?? undefined}
        onSave={async (data) => {
          if (!editTarget) return;
          await updateUser(editTarget.id, data);
          toast.success("User updated");
          loadUsers();
        }}
      />

      {/* Archive/activate confirm */}
      {archiveTarget && (
        <ConfirmDialog
          open={!!archiveTarget}
          onClose={() => setArchiveTarget(null)}
          title={
            archiveTarget.status === "active" ? "Archive User" : "Activate User"
          }
          description={
            archiveTarget.status === "active"
              ? `Archive ${archiveTarget.name ?? archiveTarget.email}? They will lose access to the platform.`
              : `Re-activate ${archiveTarget.name ?? archiveTarget.email}? They will regain platform access.`
          }
          variant={archiveTarget.status === "active" ? "warning" : "warning"}
          onConfirm={async () => {
            if (archiveTarget.status === "active") {
              await archiveUser(archiveTarget.id);
              toast.success("User archived");
            } else {
              await activateUser(archiveTarget.id);
              toast.success("User activated");
            }
            loadUsers();
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Delete User"
          description={`Permanently delete ${deleteTarget.name ?? deleteTarget.email}? This cannot be undone.`}
          variant="destructive"
          onConfirm={async () => {
            await deleteUser(deleteTarget.id);
            toast.success("User deleted");
            loadUsers();
          }}
        />
      )}
    </div>
  );
}
