// components/portal/ProjectDetailsModal.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ProjectDetailsModal({
  project,
  onClose,
}: {
  project: any;
  onClose: any;
}) {
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [files, setFiles] = useState(null);

  useEffect(() => {
    // a small fetch to get project-specific comments
    (async () => {
      const res = await fetch(`/api/public/comments?projectId=${project.id}`);
      const data = await res.json();
      setComments(data || []);
    })();
  }, [project.id]);

  async function submitComment(e: any) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("email", form.email);
    fd.append("message", form.message);
    if (files) {
      Array.from(files).forEach((f) => fd.append("files", f));
    }

    toast.loading("Submitting comment...");
    const res = await fetch("/api/public/comment", {
      method: "POST",
      body: fd,
    });
    const payload = await res.json();
    toast.dismiss();
    if (payload?.ok) {
      toast.success("Comment submitted");
      // refresh comments
      const r2 = await fetch(`/api/public/comments?projectId=${project.id}`);
      setComments(await r2.json());
      setForm({ name: "", email: "", message: "" });
      setFiles(null);
    } else {
      toast.error("Failed to submit");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-lg p-6 z-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{project.name}</h3>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {project.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="text-sm font-medium">Details</h4>
            <div className="text-sm text-muted-foreground mt-2">
              <div>Sector: {project.sector}</div>
              <div>Status: {project.status}</div>
              <div>Stage: {project.stage}</div>
              <div>Progress: {project.progress ?? 0}%</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium">Recent updates</h4>
            <div className="mt-2 space-y-2">
              {(project.updates || []).slice(0, 5).map((u, i) => (
                <div key={i} className="text-sm text-muted-foreground">
                  <div>{u.title}</div>
                  <div className="text-xs">{u.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">Public comments</h4>
          <div className="space-y-3 max-h-40 overflow-auto">
            {comments.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No comments yet.
              </div>
            )}
            {comments.length > 0 &&
              comments.map((c) => (
                <div key={c.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.createdAt}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm mt-2">{c.message}</div>
                </div>
              ))}
          </div>
        </div>

        <form onSubmit={submitComment} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="Your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="What would you like to say?"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <div>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit">Submit comment</Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
