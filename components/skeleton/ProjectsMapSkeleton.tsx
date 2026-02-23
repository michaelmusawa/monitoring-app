// components/projects/ProjectsMapSkeleton.tsx

import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsMapSkeleton() {
  return (
    <div className="h-[600px] rounded-xl border overflow-hidden relative bg-muted/30">
      {/* Fake map grid background */}
      <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Top-left fake controls */}
      <div className="absolute top-4 left-4 space-y-2">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>

      {/* Floating fake markers */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          <Skeleton className="absolute top-[25%] left-[40%] h-6 w-6 rounded-full" />
          <Skeleton className="absolute top-[55%] left-[65%] h-5 w-5 rounded-full" />
          <Skeleton className="absolute top-[70%] left-[30%] h-4 w-4 rounded-full" />
          <Skeleton className="absolute top-[40%] left-[75%] h-5 w-5 rounded-full" />
          <Skeleton className="absolute top-[60%] left-[20%] h-6 w-6 rounded-full" />
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-4 left-4 right-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
