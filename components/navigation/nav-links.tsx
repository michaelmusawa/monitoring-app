"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FolderOpen, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Portal", href: "/portal", icon: Globe },
];

const NavLinks = ({ role }: { role?: string }) => {
  const pathname = usePathname();

  console.log("user role", role);

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {links.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
};

export default NavLinks;
