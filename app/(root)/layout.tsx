// app/(root)/layout.tsx
import Sidebar from "@/components/navigation/Sidebar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[#F7F8FC] dark:bg-[#0E1117]">
      <Sidebar />
      {/* Offset for fixed sidebar on desktop; full width on mobile */}
      <main className="flex-1 min-w-0  bg-[#F7F8FC] dark:bg-[#0E1117]">
        {children}
      </main>
    </div>
  );
}
