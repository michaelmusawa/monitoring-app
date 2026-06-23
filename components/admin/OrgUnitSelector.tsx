"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrgUnit {
  id: string;
  name: string;
  level: string;
  parentId: string | null;
  children?: OrgUnit[];
}

async function fetchOrgUnits(): Promise<OrgUnit[]> {
  const res = await fetch("/api/admin/organisation/tree");
  return res.json();
}

function flattenTree(
  units: OrgUnit[],
  prefix = "",
): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [];
  for (const u of units) {
    result.push({ id: u.id, label: prefix + u.name + ` (${u.level})` });
    if (u.children) result.push(...flattenTree(u.children, prefix + "  "));
  }
  return result;
}

export default function OrgUnitSelector({
  value,
  onChange,
  placeholder = "Select organisational unit",
  className,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [units, setUnits] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgUnits()
      .then((tree) => setUnits(flattenTree(tree)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div
        className={`h-9 w-full animate-pulse bg-muted rounded ${className ?? ""}`}
      />
    );

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`h-9 text-sm ${className ?? ""}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {units.map((unit) => (
          <SelectItem
            key={unit.id}
            value={unit.id}
            className="font-mono text-xs"
          >
            {unit.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
