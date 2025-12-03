// components/dashboard/BestPracticesList.tsx
"use client";

export default function BestPracticesList({ stats }: { stats: any }) {
  const { bestPractices } = stats;

  return (
    <div className="p-4 border rounded-xl bg-white dark:bg-zinc-900">
      <h3 className="font-semibold mb-3">Seen Best Practices</h3>

      <ul className="space-y-2 text-sm">
        {bestPractices.map((bp: any, idx: any) => (
          <li
            key={idx}
            className="p-3 rounded border bg-gray-50 dark:bg-zinc-800"
          >
            {bp}
          </li>
        ))}
      </ul>
    </div>
  );
}
