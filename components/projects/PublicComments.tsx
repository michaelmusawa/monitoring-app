"use client";

import React, { useEffect, useState } from "react";

type Attachment = { id: string; url: string; label?: string };
type Reply = { id: string; responder: string; message: string; createdAt?: string };
type PublicComment = {
  id: string;
  projectId: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  createdAt?: string;
  attachments?: Attachment[];
  replies?: Reply[];
};

export default function PublicComments({ projectId }: { projectId: string }) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [replyState, setReplyState] = useState<Record<string, { open: boolean; text: string }>>({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/mock/comments?projectId=${encodeURIComponent(projectId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const normalized: PublicComment[] = (data || []).map((c: any) => ({
          ...c,
          attachments: c.attachments ?? [],
          replies: c.replies ?? [],
        }));
        setComments(normalized);
      })
      .catch((err) => {
        console.error("Failed to load public comments", err);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [projectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Basic validation
    if (!form.message.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      const res = await fetch(`/api/mock/post-comment?projectId=${encodeURIComponent(projectId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }

      // Optimistic append (mock)
      const now = new Date().toISOString().split("T")[0];
      const newComment: PublicComment = {
        id: `c-${Date.now()}`,
        projectId,
        name: form.name || "Anonymous",
        email: form.email,
        phone: form.phone,
        message: form.message,
        createdAt: now,
        attachments: [],
        replies: [],
      };
      setComments((prev) => [newComment, ...prev]);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      console.error("Post comment failed", err);
      alert("Failed to post comment");
    }
  }

  async function submitReply(commentId: string) {
    const state = replyState[commentId];
    if (!state || !state.text.trim()) {
      alert("Please enter a reply");
      return;
    }

    try {
      const res = await fetch(
        `/api/mock/respond-comment?projectId=${encodeURIComponent(projectId)}&commentId=${encodeURIComponent(
          commentId,
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: state.text, responder: "Project Owner" }),
        },
      );

      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }

      const now = new Date().toISOString().split("T")[0];

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                replies: [
                  ...(c.replies ?? []),
                  { id: `r-${Date.now()}`, responder: "Project Owner", message: state.text, createdAt: now },
                ],
              }
            : c,
        ),
      );

      setReplyState((s) => ({ ...s, [commentId]: { open: false, text: "" } }));
    } catch (err) {
      console.error("Reply failed", err);
      alert("Failed to post reply");
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-semibold">Public Comments</h2>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="input w-full"
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="input w-full"
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="input w-full"
        />
        <textarea
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full"
        />
        <div>
          <button className="btn" type="submit">
            Submit
          </button>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="font-medium">Recent Comments</h3>

        {loading ? (
          <div className="text-sm text-gray-500 mt-2">Loading…</div>
        ) : (
          <div className="mt-3 space-y-4">
            {comments.length === 0 && <div className="text-sm text-gray-500">No comments yet</div>}

            {comments.map((c) => (
              <div key={c.id} className="border p-3 rounded">
                <div className="flex justify-between">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.createdAt}</div>
                </div>

                <div className="mt-2">{c.message}</div>

                {/* Attachments */}
                {c.attachments && c.attachments.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Attachments</div>
                    <ul className="mt-1 list-disc ml-5 text-sm">
                      {c.attachments.map((a) => (
                        <li key={a.id}>
                          <a href={a.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                            {a.label ?? a.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Replies */}
                {c.replies && c.replies.length > 0 && (
                  <div className="mt-3 border-t pt-3 space-y-2">
                    {c.replies.map((r) => (
                      <div key={r.id} className="text-sm">
                        <div className="font-medium">{r.responder}</div>
                        <div>{r.message}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply UI */}
                <div className="mt-3">
                  {replyState[c.id]?.open ? (
                    <div className="space-y-2">
                      <textarea
                        value={replyState[c.id]?.text ?? ""}
                        onChange={(e) =>
                          setReplyState((s) => ({
                            ...s,
                            [c.id]: { ...(s[c.id] || { open: true, text: "" }), text: e.target.value },
                          }))
                        }
                        className="w-full border rounded p-2"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => submitReply(c.id)} className="btn" type="button">
                          Reply
                        </button>
                        <button
                          onClick={() => setReplyState((s) => ({ ...s, [c.id]: { open: false, text: "" } }))}
                          className="btn-outline"
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyState((s) => ({ ...s, [c.id]: { open: true, text: "" } }))}
                      className="mt-2 text-sm text-blue-600"
                      type="button"
                    >
                      Respond
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
