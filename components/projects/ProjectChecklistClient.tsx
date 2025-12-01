"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChecklistStatus, ChecklistItem } from "@/lib/types/types";

/**
 * Client-side checklist editor / viewer.
 *
 * - Fetches checklist + standard params from the API route: /api/projects/[projectId]/checklist
 * - Renders categories with sum of weights for tasks included under them
 * - Allows expanding a category to see / edit individual tasks
 * - Allows creating a draft checklist from standard params and saving changes inline via POST
 *
 * Note: This component is intentionally self-contained and uses the prototype API route.
 */

type StandardParam = {
  id: string;
  label: string;
  category: string;
};

type Checklist = {
  id: string;
  projectId: string;
  status: ChecklistStatus | string;
  items: ChecklistItem[];
  draftReviewComments?: { reviewer: string; accepted: boolean; reason?: string };
  weightsReviewComments?: { reviewer: string; accepted: boolean; reason?: string };
};

export default function ProjectChecklistClient({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [standardParams, setStandardParams] = useState<StandardParam[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    {},
  );
  const [localItems, setLocalItems] = useState<Record<string, number>>({}); // parameterId -> weight (0 means excluded)

  // Fetch checklist + params from API
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}/checklist`);
        if (!res.ok) {
          throw new Error(`Failed to load checklist: ${res.status}`);
        }
        const data = await res.json();
        if (!mounted) return;
        const fetchedChecklist: Checklist = data.checklist ?? {
          id: `cl-${projectId}`,
          projectId,
          status: ChecklistStatus.Draft ?? "Draft",
          items: [],
        };
        setChecklist(fetchedChecklist);
        setStandardParams(data.standardParams ?? []);
        // populate localItems from checklist items
        const itemsMap: Record<string, number> = {};
        fetchedChecklist.items.forEach((it) => {
          itemsMap[it.parameterId] = it.weight ?? 0;
        });
        setLocalItems(itemsMap);
      } catch (err) {
        console.error("Error loading checklist data", err);
        // keep UI simple: null checklist means create flow will be available
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  // Derived grouping: categories -> array of params
  const groupedParams = useMemo(() => {
    const map: Record<string, StandardParam[]> = {};
    standardParams.forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    // sort tasks inside each category by id for consistent ordering
    Object.keys(map).forEach((k) =>
      map[k].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
    );
    return map;
  }, [standardParams]);

  // Compute total weight per category based on localItems
  const categorySums = useMemo(() => {
    const sums: Record<string, number> = {};
    Object.entries(groupedParams).forEach(([category, params]) => {
      let s = 0;
      params.forEach((p) => {
        const w = localItems[p.id] ?? 0;
        s += Number(w || 0);
      });
      sums[category] = s;
    });
    return sums;
  }, [groupedParams, localItems]);

  // Toggle category expand/collapse
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  // Toggle task include (zero weight <-> default 1)
  const toggleTaskInclude = (paramId: string) => {
    setLocalItems((prev) => {
      const copy = { ...prev };
      const current = copy[paramId] ?? 0;
      if (!current || current <= 0) {
        copy[paramId] = 1;
      } else {
        copy[paramId] = 0;
      }
      return copy;
    });
  };

  const setTaskWeight = (paramId: string, weight: number) => {
    if (weight < 0) weight = 0;
    setLocalItems((prev) => ({ ...prev, [paramId]: Math.floor(weight) }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    Object.keys(groupedParams).forEach((c) => (all[c] = true));
    setExpandedCategories(all);
  };
  const collapseAll = () => setExpandedCategories({});

  // Prepare payload for saving: items array from localItems where weight > 0
  const buildPayload = (status?: string) => {
    const items = Object.entries(localItems)
      .filter(([, w]) => Number(w) > 0)
      .map(([parameterId, weight]) => ({ parameterId, weight: Number(weight) }));
    const payload: Checklist = {
      id: checklist?.id ?? `cl-${projectId}`,
      projectId,
      status: status ?? (checklist?.status ?? ChecklistStatus.Draft),
      items,
    };
    return payload;
  };

  const handleSave = async (status?: string) => {
    setSaving(true);
    try {
      const payload = buildPayload(status);
      const res = await fetch(`/api/projects/${projectId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Save failed: ${res.status} ${text}`);
      }
      const json = await res.json();
      // optimistic update: replace local checklist with returned payload or our payload
      const updated = json.result?.payload ?? payload;
      setChecklist(payload);
      alert("Checklist saved");
    } catch (err: any) {
      console.error("Save checklist error", err);
      alert(`Failed to save checklist: ${err?.message ?? err}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading checklist…</div>;
  }

  return (
    <div className="p-4 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Checklist</h2>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
            onClick={expandAll}
            type="button"
          >
            Expand all
          </button>
          <button
            className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
            onClick={collapseAll}
            type="button"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Status / summary */}
      <div className="mb-4">
        <div className="text-sm text-muted-foreground">
          Status:{" "}
          <span className="font-medium">
            {checklist?.status ?? ChecklistStatus.Draft}
          </span>
        </div>
      </div>

      {/* Category summary list */}
      <div className="space-y-3">
        {Object.entries(groupedParams).map(([category, params]) => {
          const sum = categorySums[category] ?? 0;
          const expanded = !!expandedCategories[category];
          return (
            <div
              key={category}
              className="border rounded p-3 bg-white dark:bg-zinc-950 dark:border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="text-sm px-2 py-1 bg-gray-50 rounded hover:bg-gray-100"
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`cat-${category}`}
                  >
                    {expanded ? "▾" : "▸"}
                  </button>
                  <div>
                    <div className="text-sm font-semibold">{category}</div>
                    <div className="text-xs text-gray-500">
                      {params.length} tasks
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium">{sum} pts</div>
                  <div className="text-xs text-gray-500">
                    {params.filter((p) => (localItems[p.id] ?? 0) > 0).length} selected
                  </div>
                </div>
              </div>

              {expanded && (
                <div id={`cat-${category}`} className="mt-3 space-y-2">
                  {params.map((p) => {
                    const weight = localItems[p.id] ?? 0;
                    const included = Number(weight) > 0;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-4 border rounded p-2"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            id={`chk-${p.id}`}
                            type="checkbox"
                            checked={included}
                            onChange={() => toggleTaskInclude(p.id)}
                            className="w-4 h-4"
                          />
                          <label htmlFor={`chk-${p.id}`} className="text-sm">
                            {p.id} — {p.label}
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={included ? weight : 0}
                            onChange={(e) =>
                              setTaskWeight(p.id, Number(e.target.value || 0))
                            }
                            className="w-20 input px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-3">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:opacity-90 disabled:opacity-50"
          onClick={() => handleSave()}
          disabled={saving}
          type="button"
        >
          {saving ? "Saving…" : "Save Checklist"}
        </button>

        <button
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          onClick={() => {
            // reset localItems to server checklist
            const itemsMap: Record<string, number> = {};
            (checklist?.items ?? []).forEach((it) => {
              itemsMap[it.parameterId] = it.weight ?? 0;
            });
            setLocalItems(itemsMap);
            collapseAll();
          }}
          type="button"
        >
          Reset
        </button>

        <button
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:opacity-90"
          onClick={() => handleSave(String(ChecklistStatus.WeightsAssignment))}
          type="button"
        >
          Save & Move to Weights Assignment
        </button>
      </div>
    </div>
  );
}
