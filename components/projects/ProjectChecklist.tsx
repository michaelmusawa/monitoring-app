// File: components/projects/ProjectChecklist.tsx

"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  getChecklist,
  saveChecklist,
  getStandardParams,
} from "@/lib/actions/projectActions";

type ChecklistItem = {
  parameterId: string;
  weight: number;
};

type Checklist = {
  id: string;
  projectId: string;
  status:
    | "Draft"
    | "DraftReview"
    | "WeightsAssignment"
    | "WeightsReview"
    | "Approved";
  items: ChecklistItem[];
  // New fields for M&E review reasons
  draftReviewComments?: {
    reviewer: string;
    accepted: boolean;
    reason?: string;
  };
  weightsReviewComments?: {
    reviewer: string;
    accepted: boolean;
    reason?: string;
  };
};

type StandardParam = {
  id: string;
  label: string;
  category: string;
};

export function ProjectChecklist({ projectId }: { projectId: string }) {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [standardParams, setStandardParams] = useState<StandardParam[]>([]);
  const [creating, setCreating] = useState(false);
  const [newChecklistItems, setNewChecklistItems] = useState<
    Record<string, number>
  >({}); // parameterId -> weight

  useEffect(() => {
    (async () => {
      const [c, params] = await Promise.all([
        getChecklist(projectId),
        getStandardParams(),
      ]);
      setChecklist(c);
      setStandardParams(params);
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) return <div>Loading checklist…</div>;

  const handleWeightChange = (parameterId: string, weight: number) => {
    setNewChecklistItems((prev) => ({
      ...prev,
      [parameterId]: weight,
    }));
  };

  const groupedParams: Record<string, StandardParam[]> = standardParams.reduce(
    (acc, param) => {
      if (!acc[param.category]) acc[param.category] = [];
      acc[param.category].push(param);
      return acc;
    },
    {} as Record<string, StandardParam[]>
  );

  const renderStatusBar = (status: Checklist["status"]) => {
    const stages: Checklist["status"][] = [
      "Draft",
      "DraftReview",
      "WeightsAssignment",
      "WeightsReview",
      "Approved",
    ];
    return (
      <div className="flex items-center gap-2 mb-3">
        {stages.map((s, idx) => (
          <div key={s} className="flex-1">
            <div
              className={`h-2 rounded ${
                stages.indexOf(status) >= idx
                  ? "bg-green-500"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
            <p className="text-xs text-center mt-1">{s}</p>
          </div>
        ))}
      </div>
    );
  };

  console.log(checklist && checklist.items.length > 0);

  if (checklist && checklist.items.length > 0) {
    // Group selected checklist items by category
    const categoryMap: Record<
      string,
      { id: string; label: string; weight: number }[]
    > = {};
    checklist.items.forEach((it) => {
      const param = standardParams.find((p) => p.id === it.parameterId);
      if (!param) return;
      if (!categoryMap[param.category]) categoryMap[param.category] = [];
      categoryMap[param.category].push({
        id: param.id,
        label: param.label,
        weight: it.weight,
      });
    });
    // Sort categoryMap entries by task id
    Object.values(categoryMap).forEach((arr) =>
      arr.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    );
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStatusBar(checklist.status)}
          {Object.entries(categoryMap).map(([category, items]) => (
            <div key={category} className="mb-4">
              <h3 className="text-md font-semibold text-blue-700 mb-2">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex justify-between border rounded p-2"
                  >
                    <span>
                      {it.id} {it.label}
                    </span>
                    <span className="text-xs">Weight: {it.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-4">
            <Button
              onClick={async () => {
                toast.loading("Saving checklist…");
                await saveChecklist(projectId, checklist);
                toast.dismiss();
                toast.success("Checklist saved (prototype)");
              }}
            >
              Save Checklist
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No checklist exists, allow creating a new one
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        {creating ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const items = Object.entries(newChecklistItems)
                .filter(([_, weight]) => weight > 0)
                .map(([parameterId, weight]) => ({ parameterId, weight }));

              if (items.length === 0) {
                toast.error("Please select at least one task with weight");
                return;
              }

              const payload: Checklist = {
                projectId,
                id: "cl-draft",
                status: "Draft",
                items,
              };

              toast.loading("Creating checklist…");
              await saveChecklist(projectId, payload);
              toast.dismiss();
              toast.success("Draft checklist created");
              setChecklist(payload);
            }}
            className="space-y-4"
          >
            {Object.entries(groupedParams).map(([category, params]) => (
              <div key={category}>
                <h3 className="font-medium mb-2">{category}</h3>
                <div className="space-y-2">
                  {params.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={p.id}
                        onChange={(e) =>
                          handleWeightChange(
                            p.id,
                            e.target.checked ? newChecklistItems[p.id] || 1 : 0
                          )
                        }
                        checked={!!newChecklistItems[p.id]}
                      />
                      <label htmlFor={p.id} className="flex-1">
                        {p.label}
                      </label>
                      {newChecklistItems[p.id] ? (
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={newChecklistItems[p.id]}
                          onChange={(e) =>
                            handleWeightChange(p.id, Number(e.target.value))
                          }
                          className="w-16 input input-sm"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <Button type="submit">Create Draft Checklist</Button>
            </div>
          </form>
        ) : (
          <Button onClick={() => setCreating(true)}>Create Checklist</Button>
        )}
      </CardContent>
    </Card>
  );
}
