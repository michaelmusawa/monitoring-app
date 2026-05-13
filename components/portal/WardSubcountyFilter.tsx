"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
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

export default function WardSubcountyFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentSubCounty = searchParams.get("subCounty") || "";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL" || value === "") {
      params.delete("subCounty");
      // Optionally, if subCounty removed, clear ward filter?
      // We'll keep the ward filter if present; but better to reset ward selection.
      params.delete("ward");
    } else {
      params.set("subCounty", value);
      params.delete("ward"); // reset ward if sub-county changes
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Sub‑county:
      </span>
      <Select value={currentSubCounty || "ALL"} onValueChange={handleChange}>
        <SelectTrigger className="w-44">
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
  );
}
