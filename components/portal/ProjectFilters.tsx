"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const PROJECT_STATUSES = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "STALLED", label: "Stalled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "TERMINATED", label: "Terminated" },
];

export default function ProjectFilters({ sectors }: { sectors: string[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const filters = {
    sector: searchParams.get("sector") || "ALL",
    status: searchParams.get("status") || "ALL",
    projectName: searchParams.get("projectName") || "",
    minBudget: searchParams.get("minBudget") || "",
    maxBudget: searchParams.get("maxBudget") || "",
    minProgress: searchParams.get("minProgress") || "",
    maxProgress: searchParams.get("maxProgress") || "",
  };

  const updateParams = useDebouncedCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const clearAll = () => replace(pathname);
  const hasFilters = Object.values(filters).some((v) => v && v !== "ALL");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search project..."
          className="pl-9"
          value={filters.projectName}
          onChange={(e) => updateParams("projectName", e.target.value)}
        />
      </div>

      <Select
        value={filters.sector}
        onValueChange={(val) => updateParams("sector", val)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Sectors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Sectors</SelectItem>
          {sectors.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(val) => updateParams("status", val)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Status</SelectItem>
          {PROJECT_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          placeholder="Min Budget"
          className="w-28"
          value={filters.minBudget}
          onChange={(e) => updateParams("minBudget", e.target.value)}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          placeholder="Max"
          className="w-24"
          value={filters.maxBudget}
          onChange={(e) => updateParams("maxBudget", e.target.value)}
        />
      </div>

      <div className="flex items-center gap-1">
        <Input
          type="number"
          placeholder="Min %"
          className="w-24"
          value={filters.minProgress}
          onChange={(e) => updateParams("minProgress", e.target.value)}
        />
        <span className="text-muted-foreground">–</span>
        <Input
          type="number"
          placeholder="Max %"
          className="w-24"
          value={filters.maxProgress}
          onChange={(e) => updateParams("maxProgress", e.target.value)}
        />
      </div>

      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="gap-1"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
