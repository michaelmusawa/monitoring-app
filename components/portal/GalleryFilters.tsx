"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SECTORS } from "@/lib/data/data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default function GalleryFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const sector = searchParams.get("sector") || "ALL";
  const subCounty = searchParams.get("subCounty") || "ALL";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-full sm:w-44">
        <label className="text-xs text-muted-foreground mb-1 block">
          Sector
        </label>
        <Select value={sector} onValueChange={(v) => updateParam("sector", v)}>
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
          value={subCounty}
          onValueChange={(v) => updateParam("subCounty", v)}
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
    </div>
  );
}
