import { Suspense } from "react";
import { Image, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchGalleryImages } from "@/lib/actions/publicActions";
import GalleryFilters from "@/components/portal/GalleryFilters";
import GalleryGrid from "@/components/portal/GalleryGrid";

type SearchParams = {
  sector?: string;
  subCounty?: string;
};

export default async function GalleryPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await props.searchParams;
  const sector = params?.sector || "";
  const subCounty = params?.subCounty || "";

  const images = await fetchGalleryImages({ sector, subCounty });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Image className="h-8 w-8 text-primary" />
          Project Gallery
        </h1>
        <p className="text-muted-foreground">
          Visual updates from county development projects across Nairobi.
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border/50 shadow-md">
        <CardContent className="p-4">
          <GalleryFilters />
        </CardContent>
      </Card>

      {/* Image grid */}
      <section>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-card shadow-sm animate-pulse aspect-[4/3]"
                />
              ))}
            </div>
          }
        >
          {images.length > 0 ? (
            <GalleryGrid images={images} />
          ) : (
            <div className="text-center py-16 border border-dashed border-border/50 rounded-xl bg-card">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No images yet</h3>
              <p className="text-muted-foreground">
                Project images will appear here once added by project teams.
              </p>
            </div>
          )}
        </Suspense>
      </section>
    </div>
  );
}
