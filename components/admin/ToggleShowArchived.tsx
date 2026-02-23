// components/ui/ToggleShowArchived.tsx
"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Archive } from "lucide-react";

export default function ToggleShowArchived() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const showArchived = searchParams.get("showArchived") === "true";

  const handleChange = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // Reset to first page
    params.set("showArchived", showArchived ? "false" : "true");
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <button
      onClick={handleChange}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
        showArchived
          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
      }`}
      title={showArchived ? "Hide archived users" : "Show archived users"}
    >
      <Archive className="text-sm" />
    </button>
  );
}
