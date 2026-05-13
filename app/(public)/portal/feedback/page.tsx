import { Suspense } from "react";
import { MessageSquare, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchAllPublicComments } from "@/lib/actions/publicActions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import FeedbackSearch from "@/components/portal/FeedbackSearch";
import CommentsFeed from "@/components/portal/CommentsFeed";

type SearchParams = {
  query?: string;
  page?: string;
};

export default async function FeedbackPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = await props.searchParams;
  const query = params?.query || "";
  const page = Number(params?.page || 1);

  const { comments, total, totalPages } = await fetchAllPublicComments({
    query,
    page,
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Page header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          Community Feedback
        </h1>
        <p className="text-muted-foreground">
          Public comments on county development projects – see what your
          neighbours are saying.
        </p>
      </div>

      {/* Search */}
      <Card className="border-border/50 shadow-md">
        <CardContent className="p-4">
          <FeedbackSearch initialQuery={query} />
        </CardContent>
      </Card>

      {/* Comments feed */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {total} Comment{total !== 1 ? "s" : ""}
          </h2>
        </div>

        <Suspense
          fallback={<p className="text-muted-foreground">Loading comments…</p>}
        >
          <CommentsFeed
            comments={comments}
            page={page}
            totalPages={totalPages}
            currentQuery={query}
          />
        </Suspense>
      </section>

      {/* CTA */}
      {total === 0 && !query && (
        <div className="text-center py-12 border border-dashed border-border/50 rounded-xl bg-card">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">No comments yet</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to share your feedback on a project.
          </p>
          <Button asChild>
            <Link href="/portal/projects">Browse Projects</Link>
          </Button>
        </div>
      )}

      <div className="bg-muted/30 rounded-lg p-4 text-center text-sm text-muted-foreground">
        <p>
          Don’t see your project?{" "}
          <Link
            href="/portal/projects"
            className="text-primary font-medium hover:underline"
          >
            Browse all projects
          </Link>{" "}
          and leave your feedback directly on the project page.
        </p>
      </div>
    </div>
  );
}
