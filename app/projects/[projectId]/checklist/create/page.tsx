// File: app/projects/[projectId]/checklist/create/page.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import { standardChecklistParams } from "@/lib/data/data";

const ItemSchema = z.object({
  parameterId: z.string(),
  weight: z.number().min(0),
});
const ChecklistSchema = z.object({
  projectId: z.string(),
  items: z.array(ItemSchema),
});

export default function ChecklistCreatePage({ params }: any) {
  const projectId = params.projectId;
  const [items, setItems] = useState(() =>
    standardChecklistParams.map((p) => ({
      parameterId: p.id,
      weight: 1,
      include: true,
    }))
  );
  const router = useRouter();

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = { projectId, items };
    const parsed = ChecklistSchema.parse(payload);
    const res = await fetch(`/api/mock/save-checklist`, {
      method: "POST",
      body: JSON.stringify(parsed),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) router.push(`/projects/${projectId}`);
  }

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-semibold">Create Checklist</h2>
      <form onSubmit={onSave} className="mt-4 space-y-4">
        {items.map((it, idx) => (
          <div
            key={it.parameterId}
            className="flex items-center gap-3 border p-3 rounded"
          >
            <div className="flex-1">
              {
                standardChecklistParams.find((s) => s.id === it.parameterId)
                  ?.label
              }
            </div>
            <div>
              <label className="block text-sm">Weight</label>
              <input
                type="number"
                value={it.weight}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setItems((prev) => {
                    const copy = [...prev];
                    copy[idx].weight = isNaN(v) ? 0 : v;
                    return copy;
                  });
                }}
                className="w-24 input"
              />
            </div>
            <div>
              <label className="block text-sm">Include</label>
              <input
                type="checkbox"
                checked={it.include}
                onChange={(e) =>
                  setItems((prev) => {
                    const copy = [...prev];
                    copy[idx].include = e.target.checked;
                    return copy;
                  })
                }
              />
            </div>
          </div>
        ))}

        <div>
          <button type="submit" className="btn">
            Save Checklist
          </button>
        </div>
      </form>
    </div>
  );
}
