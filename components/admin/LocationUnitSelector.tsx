"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchLocationTreeFlattened } from "@/lib/actions/locationActions";

export default function LocationUnitSelector({
  value,
  onChange,
  placeholder = "Select location…",
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocationTreeFlattened()
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
      <SelectContent className="max-h-60">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="text-sm font-mono"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
