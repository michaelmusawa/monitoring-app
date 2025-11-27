// components/portal/ProjectsList.tsx
"use client";

import Link from "next/link";

export default function ProjectsList({ projects = [], onSelect = () => {} }) {
  if (!projects.length) {
    return (
      <div className="text-sm text-muted-foreground">No projects to show.</div>
    );
  }

  return (
    <div className="grid gap-3">
      {projects.map((p) => (
        <div
          key={p.id}
          className="p-3 rounded-xl border hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex justify-between items-start"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{p.name}</h4>
              <span className="text-xs text-muted-foreground">{p.sector}</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {p.description || ""}
            </p>
            <div className="text-xs text-muted-foreground mt-2">
              Stage:{" "}
              <strong className="capitalize">{p.stage || p.status}</strong>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-xs text-muted-foreground">
              {p.progress ?? 0}%
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onSelect(p)}
                className="px-2 py-1 rounded border text-sm"
              >
                View
              </button>
              <Link
                href={`/projects/${p.id}`}
                className="px-2 py-1 rounded bg-primary text-white text-sm"
              >
                Open
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
