"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserPlus,
  Mail,
  User,
  Shield,
  Trash2,
  MoreVertical,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjectMembers({
  projectId,
}: {
  projectId: string | number;
}) {
  const [members, setMembers] = useState([
    {
      id: "u1",
      name: "Sylvester Stallone",
      email: "stallon@example.com",
      role: "Owner",
    },
    {
      id: "u2",
      name: "Sarah Kim",
      email: "sarah@example.com",
      role: "Admin",
    },
    {
      id: "u3",
      name: "Joseph N.",
      email: "joseph@example.com",
      role: "Member",
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState("");

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;

    setMembers((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: "Member",
      },
    ]);

    setInviteEmail("");
  };

  const updateRole = (id: string | number, role: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  const removeMember = (id: string | number) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Project Members</h2>

        {/* Invite button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="size-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a Team Member</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 border rounded-md bg-transparent text-sm"
              />
            </div>

            <DialogFooter>
              <Button onClick={handleInvite}>Send Invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* -------------------------------------------------- */}
      {/* MEMBERS LIST */}
      {/* -------------------------------------------------- */}
      <Card className="border">
        <CardHeader>
          <CardTitle className="text-sm">Team Members</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="divide-y">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-3"
              >
                {/* Left side: avatar + info */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-semibold">
                    {m.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <p className="font-medium text-sm">{m.name}</p>
                    <p className="text-xs text-zinc-500">{m.email}</p>
                  </div>
                </div>

                {/* Role dropdown + actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => updateRole(m.id, "Owner")}>
                      <Shield className="size-4 mr-2" /> Set as Owner
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => updateRole(m.id, "Admin")}>
                      <User className="size-4 mr-2" /> Set as Admin
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => updateRole(m.id, "Member")}
                    >
                      <Mail className="size-4 mr-2" /> Set as Member
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => removeMember(m.id)}
                    >
                      <Trash2 className="size-4 mr-2" /> Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Role label */}
                <span className="px-2 py-1 text-xs rounded bg-zinc-100 dark:bg-zinc-800 border text-zinc-700 dark:text-zinc-300 ml-4">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
