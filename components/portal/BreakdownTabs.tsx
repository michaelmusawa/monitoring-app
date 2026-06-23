"use client";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, MapPin } from "lucide-react";

export default function DynamicBreakdownTabs({
  orgLevels,
  locationLevels,
  currentType,
}: {
  orgLevels: string[];
  locationLevels: string[];
  currentType: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    // clear previous breakdown-specific params
    params.delete("sector");
    params.delete("subCounty");
    params.delete("ward");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={currentType} onValueChange={handleChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select breakdown" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Organisation</SelectLabel>
          {orgLevels.map((level) => (
            <SelectItem key={`org-${level}`} value={`org-${level}`}>
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" /> {level}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Location</SelectLabel>
          {locationLevels.map((level) => (
            <SelectItem key={`loc-${level}`} value={`loc-${level}`}>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {level}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
