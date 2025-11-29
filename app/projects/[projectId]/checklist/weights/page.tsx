import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getChecklistForProject, getStandardParams } from '@/lib/actions/actions';

export default async function WeightsAssignmentPage({ params }: any) {
  const checklist = await getChecklistForProject(params.projectId);
  const paramsList = await getStandardParams();
  // Group checklist items by parameter category
  const categoryMap: Record<string, { idx: number, id: string, label: string, weight: number }> = {};
  let grouped: Record<string, { idx: number, id: string, label: string, weight: number }[]> = {};
  checklist.items.forEach((it: any, idx: number) => {
    const param = paramsList.find((p: any) => p.id === it.parameterId);
    if (!param) return;
    if (!grouped[param.category]) grouped[param.category] = [];
    grouped[param.category].push({ idx, id: param.id, label: param.label, weight: it.weight });
  });
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true})));
  // Flatten for weights array
  const allTasks = Object.values(grouped).flat();
  const [weights, setWeights] = useState(allTasks.map((t) => t.weight || 1));
  const router = useRouter();

  const onSaveWeights = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`/api/mock/save-checklist-weights`, {
      method: 'POST',
      body: JSON.stringify({ projectId: params.projectId, weights }),
      headers: { 'Content-Type': 'application/json' },
    });
    router.push(`/projects/${params.projectId}/checklist/weights-review`);
  };

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-semibold">Assign Weights to Tasks</h2>
      <form onSubmit={onSaveWeights} className="mt-4 space-y-6">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-4">
            <h3 className="text-md font-semibold text-blue-700 mb-2">{category}</h3>
            <div className="space-y-2">
              {items.map((task) => (
                <div key={task.id} className="flex items-center gap-3 border rounded p-3">
                  <div className="flex-1">{task.id} {task.label}</div>
                  <input
                    type="number"
                    value={weights[task.idx]}
                    min={1}
                    max={100}
                    onChange={e => setWeights(w => w.map((v, i) => i === task.idx ? Number(e.target.value) : v))}
                    className="w-20 input"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div>
          <button type="submit" className="btn">Submit Weights</button>
        </div>
      </form>
    </div>
  );
}
