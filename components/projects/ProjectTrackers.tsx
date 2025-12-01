"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { CheckIcon, Plus, Edit3, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * Enhanced ProjectTrackers component
 *
 * - Accepts an initial list of trackers (server-provided) and manages local state.
 * - Supports viewing tracker details in a dialog.
 * - Supports creating and editing trackers inline via a dialog and saving to the
 *   prototype API at /api/projects/[projectId]/trackers (created earlier).
 * - Tracks attachments locally (File objects) but does not implement upload storage.
 *
 * This is intentionally self-contained so the UI remains responsive and usable
 * without requiring full backend persistence.
 */

/* Basic tracker and item shapes (compatible with lib types) */
type TrackerItem = {
  parameterId: string;
  status: string;
  percentComplete: number;
  challenges?: string;
  recommendations?: string;
  attachments?: File[] | null;
};

type Tracker = {
  id: string;
  projectId?: string;
  title: string;
  submittedBy?: string;
  submittedAt?: string;
  overallPercent?: number;
  items: TrackerItem[];
};

export function ProjectTrackers({
  projectId,
  trackers = [],
  projectProgress = 0,
}: {
  projectId: string;
  projectProgress?: number;
  trackers?: Tracker[];
}) {
  const [list, setList] = useState<Tracker[]>(() =>
    (trackers ?? []).map((t) => ({ ...t })),
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [current, setCurrent] = useState<Tracker | null>(null);
  const [standardParams, setStandardParams] = useState<
    { id: string; label: string; category: string }[]
  >([]);

  // Load standard params for creating trackers (pull from checklist API)
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/projects/${projectId}/checklist`);
        if (!res.ok) {
          // fallback to empty list
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setStandardParams(data.standardParams ?? []);
      } catch (err) {
        // ignore
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  // Derived: project progress share for each tracker (helper)
  const getTrackerShare = (overallPercent?: number) =>
    projectProgress > 0 && overallPercent
      ? ((overallPercent / projectProgress) * 100).toFixed(1)
      : "0";

  // Open dialog helpers
  function openView(tr: Tracker) {
    setCurrent(tr);
    setMode("view");
    setDialogOpen(true);
  }
  function openEdit(tr: Tracker) {
    // Make a shallow clone for editing
    setCurrent({
      ...tr,
      items: tr.items.map((it) => ({
        ...it,
        attachments: it.attachments ?? null,
      })),
    });
    setMode("edit");
    setDialogOpen(true);
  }
  async function openCreate() {
    // Build initial tracker using first N standard params (or none)
    const items: TrackerItem[] = (
      standardParams.length > 0
        ? standardParams.slice(0, 4).map((p) => ({
            parameterId: p.id,
            status: "ONGOING",
            percentComplete: 0,
            challenges: "",
            recommendations: "",
            attachments: null,
          }))
        : []
    ) as TrackerItem[];

    const tr: Tracker = {
      id: `t-${Date.now()}`,
      projectId,
      title: `Tracker ${new Date().toLocaleString()}`,
      submittedBy: "you",
      submittedAt: new Date().toISOString(),
      overallPercent: 0,
      items,
    };
    setCurrent(tr);
    setMode("create");
    setDialogOpen(true);
  }

  // Compute overall percent from items (simple average)
  function computeOverall(items: TrackerItem[]) {
    if (!items || items.length === 0) return 0;
    const sum = items.reduce((s, it) => s + (it.percentComplete ?? 0), 0);
    return Math.round((sum / items.length) * 10) / 10;
  }

  // Save handler for create/edit
  async function handleSave(updated: Tracker) {
    // compute overall
    updated.overallPercent = computeOverall(updated.items);
    updated.submittedAt = updated.submittedAt ?? new Date().toISOString();

    // Prepare a JSON-safe payload by serializing File objects (attachments)
    // into filenames. This ensures the POST body can be JSON.stringified.
    const safeItems = (updated.items || []).map((it) => {
      const attachments = Array.isArray(it.attachments)
        ? it.attachments.map((f) =>
            typeof f === "string" ? f : ((f && (f as File).name) ?? String(f)),
          )
        : null;
      return {
        ...it,
        // ensure numeric fields are numbers
        percentComplete: Number(it.percentComplete ?? 0),
        attachments,
      };
    });

    const payload = {
      ...updated,
      items: safeItems,
    };

    try {
      const res = await fetch(`/api/projects/${projectId}/trackers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Save failed");
      }
      const json = await res.json();
      // optimistic local update: use a version without File objects (use safeItems)
      const savedTracker: Tracker = {
        ...updated,
        items: safeItems as TrackerItem[],
        overallPercent: updated.overallPercent,
      };

      setList((prev) => {
        const exists = prev.find((p) => p.id === savedTracker.id);
        if (exists) {
          return prev.map((p) =>
            p.id === savedTracker.id ? { ...savedTracker } : p,
          );
        } else {
          return [savedTracker, ...prev];
        }
      });
      setDialogOpen(false);
      setCurrent(null);
      setMode("view");
      return json;
    } catch (error) {
      console.error("Failed to save tracker", error);
      alert("Failed to save tracker (see console)");
      throw error;
    }
  }

  // UI for editing/creating tracker inside dialog
  function TrackerForm({
    tracker,
    onChange,
  }: {
    tracker: Tracker;
    onChange: (t: Tracker) => void;
  }) {
    if (!tracker) return null;

    const updateItem = (index: number, patch: Partial<TrackerItem>) => {
      const items = tracker.items.map((it, i) =>
        i === index ? { ...it, ...patch } : it,
      );
      onChange({ ...tracker, items, overallPercent: computeOverall(items) });
    };

    const addItemFromParam = (paramId: string) => {
      const items = [
        ...tracker.items,
        {
          parameterId: paramId,
          status: "ONGOING",
          percentComplete: 0,
          challenges: "",
          recommendations: "",
          attachments: null,
        },
      ];
      onChange({ ...tracker, items, overallPercent: computeOverall(items) });
    };

    const removeItem = (index: number) => {
      const items = tracker.items.filter((_, i) => i !== index);
      onChange({ ...tracker, items, overallPercent: computeOverall(items) });
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm">Title</label>
          <input
            value={tracker.title}
            onChange={(e) => onChange({ ...tracker, title: e.target.value })}
            className="w-full input"
          />
        </div>

        <div className="space-y-2">
          {tracker.items.map((it, idx) => (
            <div key={idx} className="border rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{it.parameterId}</div>
                <div className="text-xs text-muted-foreground">
                  {it.status} • {it.percentComplete}%
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={it.status}
                  onChange={(e) => updateItem(idx, { status: e.target.value })}
                  className="input"
                >
                  <option value="ONGOING">Ongoing</option>
                  <option value="STALLED">Stalled</option>
                  <option value="COMPLETED">Completed</option>
                </select>

                <input
                  type="number"
                  min={0}
                  max={100}
                  value={it.percentComplete}
                  onChange={(e) =>
                    updateItem(idx, { percentComplete: Number(e.target.value) })
                  }
                  className="w-24 input"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(idx)}
                >
                  Remove
                </Button>
              </div>

              <div>
                <label className="block text-sm">Challenges</label>
                <textarea
                  value={it.challenges ?? ""}
                  onChange={(e) =>
                    updateItem(idx, { challenges: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm">Recommendations</label>
                <textarea
                  value={it.recommendations ?? ""}
                  onChange={(e) =>
                    updateItem(idx, { recommendations: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm">Attachments</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    updateItem(idx, {
                      attachments:
                        e.target.files && e.target.files.length > 0
                          ? Array.from(e.target.files)
                          : null,
                    })
                  }
                />
                {it.attachments && Array.isArray(it.attachments) && (
                  <div className="text-xs mt-1">
                    {it.attachments.map((f: File, i: number) => (
                      <div key={i}>{f.name}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* add item picker from standard params */}
        {standardParams.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-sm text-muted-foreground mb-2">
              Add task from standard params
            </div>
            <div className="flex gap-2 flex-wrap">
              {standardParams.map((p) => (
                <button
                  key={p.id}
                  className="px-2 py-1 bg-zinc-100 rounded text-sm"
                  type="button"
                  onClick={() => addItemFromParam(p.id)}
                >
                  {p.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-lg font-semibold">Project Trackers</h2>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Tracker
          </Button>
          <Button
            size="sm"
            onClick={() => alert("Mark project complete - implement")}
          >
            <CheckIcon className="size-4 mr-2" />
            Mark project complete
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {list.map((tr) => {
          const trackerShare = getTrackerShare(tr.overallPercent);

          return (
            <div
              key={tr.id}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="font-medium text-base">{tr.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Submitted by{" "}
                    <span className="font-medium">
                      {tr.submittedBy ?? "Unknown"}
                    </span>{" "}
                    on{" "}
                    {tr.submittedAt
                      ? new Date(tr.submittedAt).toLocaleDateString()
                      : "N/A"}
                  </p>

                  <p className="text-sm font-medium">
                    Overall Progress:{" "}
                    <span className="text-blue-600">
                      {tr.overallPercent ?? 0}%
                    </span>
                  </p>

                  <p className="text-xs text-zinc-500">
                    Represents{" "}
                    <span className="text-blue-500 font-medium">
                      {trackerShare}%
                    </span>{" "}
                    of total project progress
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="w-32 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: `${tr.overallPercent ?? 0}%` }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => openView(tr)}
                      className="px-2 py-1 border rounded flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => openEdit(tr)}
                      className="px-2 py-1 border rounded flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <Link
                      href={`/projects/${projectId}/trackers/${tr.id}`}
                      className="px-2 py-1 border rounded inline-block"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog for view/edit/create */}
      <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? "Create Tracker"
                : mode === "edit"
                  ? "Edit Tracker"
                  : "Tracker Details"}
            </DialogTitle>
            <DialogDescription>{current?.title}</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {current ? (
              <>
                {mode === "view" ? (
                  <div className="space-y-3">
                    <div className="text-sm">
                      Overall Progress: {current.overallPercent ?? 0}%
                    </div>
                    {current.items.map((it, i) => (
                      <div key={i} className="border rounded p-3">
                        <div className="font-medium">{it.parameterId}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.status} • {it.percentComplete}%
                        </div>
                        {it.challenges && (
                          <div className="mt-2 text-sm">
                            Challenges: {it.challenges}
                          </div>
                        )}
                        {it.recommendations && (
                          <div className="mt-2 text-sm">
                            Recommendations: {it.recommendations}
                          </div>
                        )}
                        {it.attachments && Array.isArray(it.attachments) && (
                          <div className="mt-2">
                            {it.attachments.map(
                              (f: File | string, idx: number) => (
                                <div key={idx} className="text-xs">
                                  {typeof f === "string" ? f : f.name}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <TrackerForm
                    tracker={current}
                    onChange={(t) => setCurrent(t)}
                  />
                )}
              </>
            ) : (
              <div>No tracker selected</div>
            )}
          </div>

          <DialogFooter>
            {mode !== "view" ? (
              <>
                <Button
                  onClick={async () => {
                    if (!current) return;
                    await handleSave(current);
                  }}
                >
                  Save
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
