"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function GroupByToggle({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const switchTo = (mode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("groupBy", mode);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 text-sm">
      <button
        onClick={() => switchTo("org")}
        className={`px-3 py-1 rounded ${current === "org" ? "bg-primary text-white" : "bg-muted"}`}
      >
        Organisation
      </button>
      <button
        onClick={() => switchTo("location")}
        className={`px-3 py-1 rounded ${current === "location" ? "bg-primary text-white" : "bg-muted"}`}
      >
        Location
      </button>
    </div>
  );
}
