"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchLocationUnitsForSelect } from "@/lib/actions/locationActions";

interface LocationOption {
  id: string;
  name: string;
  level: string;
}

export default function LocationUnitSelector({
  value,
  onChange,
  placeholder = "Select location…",
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocationUnitsForSelect()
      .then(setOptions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="h-9 w-full animate-pulse bg-muted rounded" />;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id} className="text-sm">
            {opt.name} ({opt.level})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
