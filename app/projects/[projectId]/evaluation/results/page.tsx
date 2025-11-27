// File: app/projects/[projectId]/evaluation/results/page.tsx
import React from "react";

export default async function EvalResults({ params }: any) {
  // Mocked analytics
  const summary = {
    relevance: 4.1,
    coherence: 3.9,
    effectiveness: 4.0,
    efficiency: 3.7,
    impact: 4.2,
    sustainability: 3.8,
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Evaluation Summary</h2>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {Object.entries(summary).map(([k, v]) => (
          <div key={k} className="border p-3 rounded">
            <div className="text-sm text-muted-foreground">{k}</div>
            <div className="font-medium text-lg">{v.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
