// components/ui/ChangeViewToggle.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface ChangeViewToggleProps {
  className?: string;
}

const ChangeViewToggle = ({ className = "" }: ChangeViewToggleProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialType = searchParams.get("changeView") || "table";
  const [changeViewType, setChangeViewType] = useState(initialType);

  useEffect(() => {
    setChangeViewType(initialType);
  }, [initialType]);

  const handleToggle = (type: "table" | "map") => {
    setChangeViewType(type);

    const params = new URLSearchParams(searchParams.toString());
    params.set("changeView", type);

    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      className={`flex rounded-lg bg-gray-100 p-1 dark:bg-gray-800 ${className}`}
    >
      <button
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
          changeViewType === "invoice"
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
        onClick={() => handleToggle("table")}
      >
        Table View
      </button>
      <button
        className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
          changeViewType === "receipt"
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
        onClick={() => handleToggle("map")}
      >
        Map View
      </button>
    </div>
  );
};

export default ChangeViewToggle;
