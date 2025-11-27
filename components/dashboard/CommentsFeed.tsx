// components/dashboard/CommentsFeed.tsx
"use client";

export default function CommentsFeed() {
  const comments = [
    { user: "Admin", text: "Project X is progressing well." },
    { user: "Auditor", text: "Please update the checkpoints for Project Y." },
  ];

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
      <h3 className="font-semibold mb-3">Public Comments</h3>

      <div className="space-y-3 text-sm">
        {comments.map((c, i) => (
          <div
            key={i}
            className="p-3 rounded border bg-gray-50 dark:bg-zinc-800"
          >
            <div className="font-medium text-blue-600">{c.user}</div>
            <div>{c.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
