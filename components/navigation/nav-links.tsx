"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  User,
  BarChart3,
  FolderOpen,
  ChevronRight,
  File,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      { name: "Categories", href: "/projectCategory", icon: FolderKanban },
    ],
  },
  {
    label: "Administration",
    items: [
      { name: "Settings", href: "/admin", icon: Settings },
      { name: "Profile", href: "/profile", icon: User },
    ],
  },
  {
    label: "Reports",
    items: [{ name: "Reports", href: "/reports", icon: File }],
  },
  {
    label: "Public",
    items: [{ name: "Portal", href: "/portal", icon: ExternalLink }],
  },
];

const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-none">
      {NAV_GROUPS.map((group, idx) => (
        <div key={idx} className="space-y-1">
          {group.label && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
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
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-green-500/10 to-transparent text-green-600 dark:from-green-500/15 dark:text-green-400"
                      : "text-zinc-600 hover:bg-gray-100 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white",
                  )}
                >
                  {/* Active left accent bar */}
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-all duration-200",
                      isActive ? "bg-green-500" : "h-0 bg-transparent",
                    )}
                  />
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive
                        ? "text-green-500"
                        : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300",
                    )}
                  />
                  <span className="flex-1 truncate">{item.name}</span>
                  {isActive && (
                    <ChevronRight className="h-3 w-3 shrink-0 text-green-400" />
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
