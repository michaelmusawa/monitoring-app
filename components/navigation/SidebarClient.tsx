"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import NavLinks from "./nav-links";
import { LogOut, Menu, X, Activity } from "lucide-react";
import { signOutAction } from "./SignOut";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Logo from "../customUI/logo";

// Role‑based colors
function getRoleColors(sector: string) {
  return sector === "Monitoring and Evaluation"
    ? {
        dot: "bg-blue-500",
        badge:
          "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20",
      }
    : {
        dot: "bg-emerald-500",
        badge:
          "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20",
      };
}

// User avatar with status dot
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative shrink-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 text-sm font-bold text-gray-700 shadow-inner dark:from-zinc-700 dark:to-zinc-800 dark:text-white">
        {initials || "U"}
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-zinc-900" />
    </div>
  );
}

// Sidebar content (shared between desktop & mobile)
function SidebarContent({
  userName,
  userEmail,
  userRole,
  userSector,
  onClose,
}: {
  userName: string;
  userEmail: string;
  userRole: string;
  userSector?: string;
  onClose?: () => void;
}) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const roleColors = getRoleColors(userSector ?? "");

  const handleLogout = () => {
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    signOutAction();
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#0f1117] text-gray-800 dark:text-zinc-100">
      {/* Brand */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 p-5 dark:border-white/5">
        <div className="h-24 w-24 rounded-full flex items-center justify-center shadow-md">
          <Logo />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">
            Nairobi City County
          </p>
          <p className="mt-0.5 text-[14px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-500">
            NEMES
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <NavLinks onNavigate={onClose} />

      {/* Divider */}
      <div className="mx-4 border-t border-gray-200 dark:border-white/5" />

      {/* User section */}
      <div className="p-3 shrink-0">
        <div className="group flex cursor-default items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/5">
          <Avatar name={userName || userEmail} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-gray-900 dark:text-zinc-100">
              {userName || "User"}
            </p>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-zinc-500">
              {userEmail}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
              roleColors.badge,
            )}
          >
            {userRole}
          </span>
        </div>

        {/* Sign out button */}
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition-all duration-150 hover:text-red-600 dark:text-zinc-500 dark:hover:text-red-400"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
          Sign out
        </button>
      </div>

      {/* Logout confirmation dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmLogout}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Main export
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
  const drawerRef = useRef<HTMLElement>(null);

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile menu toggle */}
      <button
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-lg transition-all hover:bg-gray-50 dark:border-white/10 dark:bg-[#111318] dark:hover:bg-white/5 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <Menu
          className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-90" : ""}`}
        />
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-gray-200 bg-white shadow-xl dark:border-white/5 dark:bg-[#0f1117] lg:flex">
        <SidebarContent
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userSector={userSector}
        />
      </aside>

      {/* Mobile drawer */}
      <aside
        ref={drawerRef as React.RefObject<HTMLElement>}
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 transform flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-[#0f1117] lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Close button inside drawer (optional) */}
        <button
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-white/20"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          userSector={userSector}
          onClose={() => setMobileOpen(false)}
        />
      </aside>
    </>
  );
}
