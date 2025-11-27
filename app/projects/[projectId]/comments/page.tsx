// File: app/projects/[projectId]/comments/page.tsx
"use client";
import React, { useState, useEffect } from "react";

export default function PublicComments({ params }: any) {
  const projectId = params.projectId;
  const [comments, setComments] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    fetch(`/api/mock/comments?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => setComments(d));
  }, [projectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/mock/post-comment?projectId=${projectId}`, {
      method: "POST",
      body: JSON.stringify(form),
      headers: { "Content-Type": "application/json" },
    });
    alert("Comment posted (mock)");
    setForm({ name: "", email: "", phone: "", message: "" });
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Public Comments</h2>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input w-full"
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="input w-full"
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="input w-full"
        />
        <textarea
          placeholder="Message"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
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
        <div className="mt-3 space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="border p-3 rounded">
              <div className="font-medium">
                {c.name}{" "}
                <span className="text-sm text-muted-foreground">
                  {c.createdAt}
                </span>
              </div>
              <div>{c.message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
