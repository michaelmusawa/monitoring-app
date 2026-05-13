"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { PublicFeedbackComment } from "@/lib/actions/publicActions";

interface Props {
  comments: PublicFeedbackComment[];
  page: number;
  totalPages: number;
  currentQuery: string;
}

export default function CommentsFeed({
  comments,
  page,
  totalPages,
  currentQuery,
}: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (p > 1) params.set("page", String(p));
    else params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {currentQuery
          ? "No comments match your search. Try different keywords."
          : "No comments have been submitted yet."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card
            key={comment.id}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-5">
              <div className="flex justify-between items-start gap-3 mb-2">
                <div>
                  <Link
                    href={`/projects/${comment.projectId}`}
                    className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {comment.projectName} <ExternalLink className="h-3 w-3" />
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {comment.authorName} ·{" "}
                    {new Date(comment.createdAt).toLocaleDateString("en-KE", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {comment.fileUrl && (
                  <a
                    href={comment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                  >
                    <FileText className="h-3 w-3" /> Attachment
                  </a>
                )}
              </div>
              <p className="text-sm leading-relaxed">{comment.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
