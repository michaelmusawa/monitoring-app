"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function FeedbackSearch({
  initialQuery,
}: {
  initialQuery: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) params.set("query", term);
    else params.delete("query");
    params.delete("page"); // reset page on new search
    router.push(`${pathname}?${params.toString()}`);
  }, 400);

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("query");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by project name or comment content..."
        defaultValue={initialQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9 pr-9"
      />
      {initialQuery && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
