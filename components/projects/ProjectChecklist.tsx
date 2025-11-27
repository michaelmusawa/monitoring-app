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
  status: "Draft" | "Review" | "Approved";
  items: ChecklistItem[];
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
    const stages: Checklist["status"][] = ["Draft", "Review", "Approved"];
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

  if (checklist && checklist.items.length > 0) {
    // Display existing checklist
    return (
      <Card>
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStatusBar(checklist.status)}
          {checklist.items.length === 0 && <p>No items yet.</p>}
          <div className="space-y-3">
            {checklist.items.map((it) => {
              const param = standardParams.find((p) => p.id === it.parameterId);
              return (
                <div
                  key={it.parameterId}
                  className="flex justify-between p-2 border rounded"
                >
                  <div>
                    <div className="font-medium">
                      {param?.label || it.parameterId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Category: {param?.category || "Unknown"} | Weight:{" "}
                      {it.weight}
                    </div>
                  </div>
                  <div className="text-sm">{checklist.status}</div>
                </div>
              );
            })}
          </div>
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
