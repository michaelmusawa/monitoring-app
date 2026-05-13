"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FiscalYearFilter({ years }: { years: string[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentFy = searchParams.get("fiscalYear") || "ALL";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "ALL") params.delete("fiscalYear");
    else params.set("fiscalYear", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Financial Year:
      </span>
      <Select value={currentFy} onValueChange={handleChange}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All Years" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Years</SelectItem>
          {years.map((fy) => (
            <SelectItem key={fy} value={fy}>
              {fy}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
