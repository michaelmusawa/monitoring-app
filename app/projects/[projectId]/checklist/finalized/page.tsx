// File: app/projects/[projectId]/checklist/finalized.tsx

import { getChecklistForProject } from '@/lib/actions/actions';

export default async function FinalizedChecklist({ params }: any) {
  const checklist = await getChecklistForProject(params.projectId);
  if (!checklist || checklist.status !== 'Approved') {
    return <div className="p-6">Checklist is not finalized yet.</div>;
  }
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold">Finalized Checklist (Project Tracker)</h3>
      <div className="mt-3">
        {checklist.items.map((i: any) => (
          <div
            key={i.parameterId}
            className="flex justify-between border p-2 rounded mb-2"
          >
            <div>{i.parameterId}</div>
            <div>Weight: {i.weight}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
