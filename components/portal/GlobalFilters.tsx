"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { SECTORS } from "@/lib/data/data";
import { FilterX } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const SUB_COUNTIES = [
  "Central",
  "Dagoretti",
  "Embakasi",
  "Kamukunji",
  "Kasarani",
  "Kibra",
  "Lang'ata",
  "Makadara",
  "Mathare",
  "Njiru",
  "Pumwani",
  "Roysambu",
  "Ruaraka",
  "Starehe",
  "Umoja",
  "Westlands",
];

export default function GlobalFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const filters = {
    sector: searchParams.get("sector") || "ALL",
    subCounty: searchParams.get("subCounty") || "",
    ward: searchParams.get("ward") || "",
    fiscalYear: searchParams.get("fiscalYear") || "",
  };

  const updateParams = useDebouncedCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const clearAll = () => replace(pathname);

  const hasFilters = Object.values(filters).some(
    (v) => v !== "" && v !== "ALL",
  );

  return (
    <div className="space-y-3">
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-xs text-blue-600 hover:text-blue-700 -mt-1"
        >
          <FilterX className="w-3.5 h-3.5 mr-1" />
          Clear all filters
        </Button>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="w-full sm:w-44">
          <label className="text-xs text-muted-foreground mb-1 block">
            Sector
          </label>
          <Select
            value={filters.sector}
            onValueChange={(val) => updateParams("sector", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sectors</SelectItem>
              {SECTORS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-44">
          <label className="text-xs text-muted-foreground mb-1 block">
            Sub‑county
          </label>
          <Select
            value={filters.subCounty}
            onValueChange={(val) => updateParams("subCounty", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Sub‑counties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sub‑counties</SelectItem>
              {SUB_COUNTIES.map((sc) => (
                <SelectItem key={sc} value={sc}>
                  {sc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-36">
          <label className="text-xs text-muted-foreground mb-1 block">
            Ward
          </label>
          <Input
            placeholder="e.g. Mwiki"
            value={filters.ward}
            onChange={(e) => updateParams("ward", e.target.value)}
          />
        </div>

        <div className="w-full sm:w-40">
          <label className="text-xs text-muted-foreground mb-1 block">
            Fiscal Year
          </label>
          <Input
            placeholder="e.g. 2024/2025"
            value={filters.fiscalYear}
            onChange={(e) => updateParams("fiscalYear", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
