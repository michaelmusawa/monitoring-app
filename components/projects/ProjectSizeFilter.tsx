"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface ProjectSizeFilterProps {
  className?: string;
}

type ProjectSize = "ALL" | "small" | "medium" | "large";

const ProjectSizeFilter = ({ className = "" }: ProjectSizeFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSize = (searchParams.get("size") as ProjectSize) || "ALL";
  const [selectedSize, setSelectedSize] = useState<ProjectSize>(initialSize);

  useEffect(() => {
    setSelectedSize(initialSize);
  }, [initialSize]);

  const handleSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const size = event.target.value as ProjectSize;
    setSelectedSize(size);

    const params = new URLSearchParams(searchParams.toString());

    if (size === "ALL") {
      params.delete("size");
    } else {
      params.set("size", size);
    }

    // Reset to first page when filter changes
    params.set("page", "1");

    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <label
        htmlFor="project-size"
        className="text-sm text-gray-700 dark:text-gray-300"
      >
        Project Size:
      </label>
      <select
        id="project-size"
        value={selectedSize}
        onChange={handleSelect}
        className="rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
      >
        <option value="ALL">All Sizes</option>
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </select>
    </div>
  );
};

export default ProjectSizeFilter;
