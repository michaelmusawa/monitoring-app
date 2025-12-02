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

// Import dummy data
import {
  trackers as dummyTrackers,
  checklistParamsMobility,
  checklistParamsIDE,
} from "@/lib/data/data";
import { projects } from "@/lib/data/data";

/* Basic tracker and item shapes (compatible with lib types) */
type TrackerItem = {
  parameterId: string;
  status: string;
  percentComplete: number;
  challenges?: string;
  recommendations?: string;
  attachments?: (File | string)[] | null;
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
  // Get project from dummy data to determine sector
  const project = projects.find((p) => p.id === projectId);
  const projectSector = project?.sector;

  // Convert dummy trackers to component format
  const convertDummyTracker = (dummyTracker: any): Tracker => {
    return {
      id: dummyTracker.id,
      projectId: dummyTracker.projectId,
      title: dummyTracker.title || `Tracker for ${project?.name || "Project"}`,
      submittedBy: dummyTracker.submittedBy,
      submittedAt: dummyTracker.submittedAt,
      overallPercent: dummyTracker.overallProgress || 0,
      items: (dummyTracker.tasks || []).map((task: any) => ({
        parameterId: task.parameterId,
        status: task.status?.toUpperCase() || "ONGOING",
        percentComplete: task.percentComplete || 0,
        challenges: task.challenges || "",
        recommendations: task.recommendations || "",
        attachments: task.attachments || null,
      })),
    };
  };

  // Get initial trackers from dummy data (filtered by projectId)
  const initialTrackers = dummyTrackers
    .filter((t) => t.projectId === projectId)
    .map(convertDummyTracker);

  const [list, setList] = useState<Tracker[]>(() => [
    ...initialTrackers,
    ...(trackers ?? []).map((t) => ({ ...t })),
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [current, setCurrent] = useState<Tracker | null>(null);
  const [standardParams, setStandardParams] = useState<
    { id: string; label: string; category: string }[]
  >([]);

  // Load standard params based on project sector
  useEffect(() => {
    if (projectSector === "IDE") {
      setStandardParams(
        checklistParamsIDE.map((p) => ({
          id: p.id,
          label: p.label,
          category: p.category,
        })),
      );
    } else if (projectSector === "Mobility & Works") {
      setStandardParams(
        checklistParamsMobility.map((p) => ({
          id: p.id,
          label: p.label,
          category: p.category,
        })),
      );
    } else {
      // Default to IDE params if sector not found
      setStandardParams(
        checklistParamsIDE.map((p) => ({
          id: p.id,
          label: p.label,
          category: p.category,
        })),
      );
    }
  }, [projectSector]);

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

  // Save handler for create/edit - using local state only (no API)
  async function handleSave(updated: Tracker) {
    // compute overall
    updated.overallPercent = computeOverall(updated.items);
    updated.submittedAt = updated.submittedAt ?? new Date().toISOString();

    // Prepare a JSON-safe payload
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
    return savedTracker;
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
          {tracker.items.map((it, idx) => {
            // Find the parameter label from standardParams
            const param = standardParams.find((p) => p.id === it.parameterId);

            return (
              <div key={idx} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {param
                      ? `${param.label} (${param.category})`
                      : it.parameterId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {it.status} • {it.percentComplete}%
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={it.status}
                    onChange={(e) =>
                      updateItem(idx, { status: e.target.value })
                    }
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
                      updateItem(idx, {
                        percentComplete: Number(e.target.value),
                      })
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
                    className="w-full input"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm">Recommendations</label>
                  <textarea
                    value={it.recommendations ?? ""}
                    onChange={(e) =>
                      updateItem(idx, { recommendations: e.target.value })
                    }
                    className="w-full input"
                    rows={2}
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
                    className="w-full"
                  />
                  {it.attachments && Array.isArray(it.attachments) && (
                    <div className="text-xs mt-1">
                      {it.attachments.map((f, i: number) => (
                        <div key={i}>{typeof f === "string" ? f : f.name}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* add item picker from standard params */}
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
        </div>
      </div>

      <div className="grid gap-4">
        {list.map((tr) => {
          const trackerShare = getTrackerShare(tr.overallPercent);

          return (
            <div
              key={tr.id}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer"
              onClick={() => openView(tr)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        openView(tr);
                      }}
                      className="px-2 py-1 border rounded flex items-center gap-2 hover:bg-zinc-100 transition"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(tr);
                      }}
                      className="px-2 py-1 border rounded flex items-center gap-2 hover:bg-zinc-100 transition"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <Link
                      href={`/projects/${projectId}/trackers/${tr.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 border rounded inline-block hover:bg-zinc-100 transition"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {list.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            No trackers found for this project. Click "Add Tracker" to create
            one.
          </div>
        )}
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
                    {current.items.map((it, i) => {
                      // Find the parameter label from standardParams
                      const param = standardParams.find(
                        (p) => p.id === it.parameterId,
                      );

                      return (
                        <div key={i} className="border rounded p-3">
                          <div className="font-medium">
                            {param
                              ? `${param.label} (${param.category})`
                              : it.parameterId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {it.status} • {it.percentComplete}%
                          </div>
                          {it.challenges && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Challenges:</span>{" "}
                              {it.challenges}
                            </div>
                          )}
                          {it.recommendations && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">
                                Recommendations:
                              </span>{" "}
                              {it.recommendations}
                            </div>
                          )}
                          {it.attachments && Array.isArray(it.attachments) && (
                            <div className="mt-2">
                              <span className="text-xs font-medium">
                                Attachments:
                              </span>
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
                      );
                    })}
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
