// components/public/GalleryGrid.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ExternalLink, Maximize2 } from "lucide-react";
import type { GalleryImage } from "@/lib/actions/publicActions";

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
  const [selected, setSelected] = useState<GalleryImage | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative rounded-xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            onClick={() => setSelected(img)}
          >
            <div className="aspect-[4/3] relative">
              <img
                src={img.url}
                alt={img.caption || img.projectName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
            <div className="p-3">
              {/* Tracker label as primary caption */}
              {img.trackerLabel && (
                <p className="text-sm font-medium line-clamp-2 mb-0.5">
                  {img.trackerLabel}
                </p>
              )}
              {/* If caption differs (or we want to show project name) */}
              {img.caption && img.caption !== img.trackerLabel && (
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {img.caption}
                </p>
              )}
              <div className="flex items-center justify-between mt-1.5">
                <Link
                  href={`/projects/${img.projectId}`}
                  onClick={(e) => e.stopPropagation()} // open project, not lightbox
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  {img.projectName} <ExternalLink className="h-3 w-3" />
                </Link>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(img.submissionDate).toLocaleDateString("en-KE", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-none">
          {selected && (
            <div className="flex flex-col max-h-[90vh]">
              <div className="flex-1 flex items-center justify-center p-4">
                <img
                  src={selected.url}
                  alt={selected.caption || selected.projectName}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              </div>
              <div className="bg-black/60 p-4 text-white text-sm rounded-b-lg">
                <p className="font-semibold">
                  {selected.trackerLabel || selected.caption || "Project Image"}
                </p>
                <Link
                  href={`/projects/${selected.projectId}`}
                  onClick={() => setSelected(null)}
                  className="text-blue-400 hover:underline flex items-center gap-1 mt-1"
                >
                  {selected.projectName} <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
