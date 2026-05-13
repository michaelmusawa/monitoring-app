import { fetchPublicProjects } from "@/lib/actions/publicActions";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function RecentUpdates() {
  const projects = await fetchPublicProjects({ limit: 3 }); // modify your function to accept a limit param
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {projects.map((p) => (
        <Link key={p.id} href={`/projects/${p.id}`}>
          <Card className="hover:shadow-md transition-shadow h-full border-border/50">
            <CardContent className="p-4">
              <p className="font-semibold line-clamp-2">{p.name}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {p.ward}, {p.subCounty}
              </p>
              <span className="text-xs text-primary mt-2 inline-flex items-center gap-1">
                View details <ArrowRight className="w-3 h-3" />
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
