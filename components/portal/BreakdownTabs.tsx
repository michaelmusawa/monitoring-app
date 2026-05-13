"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Home } from "lucide-react"; // Home for Ward

const tabs = [
  { type: "sector", label: "Sector", icon: Building2 },
  { type: "subCounty", label: "Sub‑county", icon: MapPin },
  { type: "ward", label: "Ward", icon: Home },
];

export default function BreakdownTabs({
  currentType,
}: {
  currentType: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const switchType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);

    if (type !== "sector") params.delete("sector");
    if (type !== "subCounty") {
      params.delete("subCounty");
      params.delete("ward");
    }
    if (type !== "ward") params.delete("ward");
    // Keep subCounty if type === ward? we will rely on WardSubcountyFilter to set it.
    // Better: when switching to ward, we can optionally keep existing subCounty if any, but default to none.
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = currentType === tab.type;
        return (
          <Button
            key={tab.type}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => switchType(tab.type)}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
