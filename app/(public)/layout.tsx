import { Shield } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/customUI/logo";

const navLinks = [
  { href: "/portal/projects", label: "Browse Projects" },
  { href: "/portal/feedback", label: "Community Feedback" },
  { href: "/portal/gallery", label: "Project Gallery" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      {/* Navigation – identical county branding as login */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <Link href="/portal" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Logo />
            </div>
            <span className="font-semibold text-lg text-foreground">
              Nairobi City County Project Portal
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-md"
              >
                {link.label}
              </Link>
            ))}
            {/* Optional login link */}
            <Link
              href="/"
              className="inline-flex items-center gap-1 bg-primary/5 rounded-full px-3 py-1 text-xs text-muted-foreground"
            >
              <Shield className="h-3 w-3 text-primary" />
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center text-xs text-muted-foreground">
        Secure login · Powered by Smart Nairobi
      </footer>
    </div>
  );
}
