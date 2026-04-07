"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import NavLinks from "./nav-links";
import { LogOut, Menu, X, Activity } from "lucide-react";
import { signOutAction } from "./SignOut";

// ─── Role config ──────────────────────────────────────────────────────────────

function getRoleColors(sector: string) {
  return sector === "Monitoring and Evaluation"
    ? {
        dot: "bg-blue-400 dark:bg-blue-400",
        badge:
          "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-500/15 dark:border-blue-500/25",
      }
    : {
        dot: "bg-emerald-400 dark:bg-emerald-400",
        badge:
          "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/25",
      };
}

// ─── User initials avatar ─────────────────────────────────────────────────────

function Avatar({ name, role }: { name: string; role: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const { dot } = getRoleColors(role);

  return (
    <div className="relative shrink-0">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 dark:from-zinc-600 dark:to-zinc-700 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-white shadow-inner">
        {initials || "?"}
      </div>
      {/* Online dot */}
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900",
          dot,
        )}
      />
    </div>
  );
}

// ─── Sidebar content (shared between desktop + mobile drawer) ─────────────────

function SidebarContent({
  userName,
  userEmail,
  userRole,
  onNavigate,
  userSector,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
  onNavigate?: () => void;
  userSector?: string;
}) {
  const roleColors = getRoleColors(userSector ?? "");

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#111318] text-gray-800 dark:text-zinc-100">
      {/* ── Brand ── */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-gray-200 dark:border-white/6 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-none">
            Nairobi City County
          </p>
          <p className="text-[10px] text-gray-500 dark:text-zinc-500 tracking-widest uppercase mt-0.5">
            Monitoring System
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <NavLinks onNavigate={onNavigate} />

      {/* ── Divider ── */}
      <div className="mx-4 border-t border-gray-200 dark:border-white/6" />

      {/* ── User identity block ── */}
      <div className="p-3 shrink-0">
        <div className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-100 dark:hover:bg-white/4 transition-colors group cursor-default">
          <Avatar name={userName || userEmail} role={userRole} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate leading-tight">
              {userName || "User"}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-500 truncate mt-0.5">
              {userEmail}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded border tracking-wide",
              roleColors.badge,
            )}
          >
            {userRole}
          </span>
        </div>

        {/* Sign out */}
        <form action={signOutAction}>
          <button
            type="submit"
            className="mt-1 w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/[0.07] transition-all duration-150 group"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function SidebarClient({
  userName,
  userEmail,
  userRole,
  userSector,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
  userSector?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile menu button ── */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white dark:bg-[#111318] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white shadow-lg transition-colors"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-full w-64 flex-col border-r border-gray-200 dark:border-white/6 shadow-2xl">
        <SidebarContent
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userSector={userSector}
        />
      </aside>

      {/* ── Mobile drawer ── */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 z-50 h-full w-72 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Close button inside drawer */}
        <button
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/6 flex items-center justify-center text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white transition-colors"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userSector={userSector}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>
    </>
  );
}
