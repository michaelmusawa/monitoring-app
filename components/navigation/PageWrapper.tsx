"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/";

  return (
    <main
      className={`min-h-screen bg-zinc-50 dark:bg-zinc-950 ${
        !isLoginPage ? "lg:pl-64" : ""
      }`}
    >
      {children}
    </main>
  );
}

