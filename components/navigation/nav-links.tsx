"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Globe,
  Settings,
  User,
  BarChart3,
  FolderOpen,
  ChevronRight,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav structure ────────────────────────────────────────────────────────────

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Projects",
    items: [
      { name: "All Projects", href: "/projects", icon: FolderOpen },
      { name: "By Category", href: "/projectCategory", icon: FolderKanban },
      { name: "Map View", href: "/map", icon: Map },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Template", href: "/admin/checklists", icon: BarChart3 },
      { name: "Settings", href: "/admin", icon: Settings },
      { name: "Profile", href: "/profile", icon: User },
    ],
  },
];

// ─── NavLinks ─────────────────────────────────────────────────────────────────

const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi}>
          {group.label && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-zinc-500 select-none">
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href + item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-1 focus-visible:ring-blue-400",
                    isActive
                      ? "text-white bg-white/[0.08]"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]",
                  )}
                >
                  {/* Active left accent bar */}
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200",
                      isActive ? "h-5 bg-blue-400" : "h-0 bg-transparent",
                    )}
                  />

                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-150",
                      isActive
                        ? "text-blue-400"
                        : "text-zinc-500 group-hover:text-zinc-300",
                    )}
                  />

                  <span className="flex-1 truncate">{item.name}</span>

                  {isActive && (
                    <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
};

export default NavLinks;
