import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getChecklistForProject, getStandardParams } from '@/lib/actions/actions';

export default async function WeightsReviewPage({ params }: any) {
  const checklist = await getChecklistForProject(params.projectId);
  const paramsList = await getStandardParams();
  // Group tasks by category
  const grouped: Record<string, { id: string, label: string, weight: number }[]> = {};
  checklist.items.forEach((t: any) => {
    const param = paramsList.find((p: any) => p.id === t.parameterId);
    if (param) {
      if (!grouped[param.category]) grouped[param.category] = [];
      grouped[param.category].push({ id: param.id, label: param.label, weight: t.weight });
    }
  });
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true})));

  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState('');
  const router = useRouter();

  const onAccept = async () => {
    await fetch(`/api/mock/approve-checklist-weights`, {
      method: 'POST',
      body: JSON.stringify({ projectId: params.projectId }),
      headers: { 'Content-Type': 'application/json' },
    });
    router.push(`/projects/${params.projectId}/checklist/finalized`);
  };
  const onSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await fetch(`/api/mock/suggest-weight-changes`, {
      method: 'POST',
      body: JSON.stringify({ projectId: params.projectId, reason }),
      headers: { 'Content-Type': 'application/json' },
    });
    router.push(`/projects/${params.projectId}/checklist/weights`);
  };
  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-xl font-semibold">Review Assigned Weights (M&E)</h2>
      <div className="my-6 space-y-2">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-4">
            <h3 className="text-md font-semibold text-blue-700 mb-2">{category}</h3>
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 border rounded p-3">
                  <span className="flex-1">{it.id} {it.label}</span>
                  <span>Weight: {it.weight}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {showReason ? (
        <form onSubmit={onSuggest} className="space-y-3 mt-4">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for weight change suggestion (required)"
            className="w-full border rounded p-2"
            required
          />
          <button type="submit" className="btn">Submit Suggestion</button>
        </form>
      ) : (
        <div className="flex gap-4 mt-6">
          <button className="btn" onClick={onAccept}>Accept Weights</button>
          <button className="btn-outline" onClick={() => setShowReason(true)}>Suggest Changes</button>
        </div>
      )}
    </div>
  );
}
