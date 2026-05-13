"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitPublicComment } from "@/lib/actions/publicActions";
import { Paperclip, Send, FileText, Loader2 } from "lucide-react";
import type { PublicComment } from "@/lib/actions/publicActions";

export default function CommentSection({
  projectId,
  initialComments,
}: {
  projectId: string;
  initialComments: PublicComment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!authorName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!content.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setSubmitting(true);
    let fileUrl = null;
    if (file) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        fileUrl = data.fileUrl;
      } catch (err) {
        toast.error("File upload failed: " + (err as Error).message);
        setSubmitting(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("authorName", authorName);
    formData.append("authorEmail", authorEmail);
    formData.append("content", content);
    if (fileUrl) formData.append("fileUrl", fileUrl);

    const result = await submitPublicComment(formData);
    if (result.success) {
      toast.success(result.message);
      setAuthorName("");
      setAuthorEmail("");
      setContent("");
      setFile(null);
      setComments((prev) => [
        {
          id: Date.now().toString(),
          authorName,
          authorEmail: authorEmail || null,
          content,
          fileUrl,
          createdAt: new Date().toISOString(),
          isApproved: true,
        },
        ...prev,
      ]);
    } else {
      toast.error(result.message);
    }
    setSubmitting(false);
  };

  return (
    <Card className="border-border/50 shadow-md">
      <CardHeader>
        <CardTitle>Public Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Your name *"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
            <Input
              placeholder="Your email (optional)"
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
            />
          </div>
          <Textarea
            placeholder="Write your feedback or comment about this project..."
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex flex-wrap gap-3 items-center">
            <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-muted">
              <Paperclip className="w-4 h-4" />
              Attach file (max 5MB)
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,application/pdf"
              />
            </label>
            {file && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {file.name}
              </span>
            )}
            <Button
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className="ml-auto"
            >
              {submitting || uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Submit Feedback
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">
            Comments ({comments.length})
          </h3>
          {comments.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No comments yet. Be the first to share your feedback!
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{c.authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {c.fileUrl && (
                  <a
                    href={c.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm flex items-center gap-1 hover:underline"
                  >
                    <FileText className="w-3 h-3" /> Attachment
                  </a>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
