import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NavLinks from "./nav-links";
import { LogOut, Menu, X } from "lucide-react";
import { auth, signOut } from "@/auth";

export default async function Sidebar() {
  const isMobileOpen = false;
  const session = await auth();
  const userRole = session?.user?.name || "";

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          className="bg-white dark:bg-zinc-900"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Monitoring App
            </h2>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <NavLinks role={userRole} />

          {/* Logout button */}
          <form
            className="border-t border-zinc-200 dark:border-zinc-800 p-4"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
