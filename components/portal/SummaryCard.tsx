// components/portal/SummaryCard.tsx
interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export default function SummaryCard({
  title,
  value,
  icon,
  color,
}: SummaryCardProps) {
  return (
    <div
      className={`p-4 rounded-xl border ${color.split(" ")[0]} dark:border-gray-800`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      </div>
    </div>
  );
}
