// components/public/BreakdownTable.tsx

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BreakdownItem } from "@/lib/actions/publicActions";

function formatCurrency(val: number) {
  if (val >= 1_000_000_000) return `KES ${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `KES ${(val / 1_000_000).toFixed(1)}M`;
  return `KES ${val.toLocaleString()}`;
}

interface Props {
  data: BreakdownItem[];
  type: "fiscalYear" | "sector" | "subCounty" | "ward";
  activeValue?: string;
  /** Only required when type === "ward" */
  subCounty?: string;
  currentFiscalYear?: string; // ← new prop
}

export default function BreakdownTable({
  data,
  type,
  activeValue,
  subCounty,
  currentFiscalYear,
}: Props) {
  if (!data.length) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No data available for the current selection.
      </div>
    );
  }

  // Map breakdown type to URL parameter key
  const paramKey =
    type === "fiscalYear"
      ? "fiscalYear"
      : type === "sector"
        ? "sector"
        : type === "subCounty"
          ? "subCounty"
          : "ward";

  // For ward rows, we must also pass the subCounty param in the URL
  const subCountyParam = subCounty
    ? `&subCounty=${encodeURIComponent(subCounty)}`
    : "";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="text-left p-3 font-medium">Name</th>
            <th className="text-center p-3 font-medium">Projects</th>
            <th className="text-center p-3 font-medium hidden sm:table-cell">
              Active
            </th>
            <th className="text-center p-3 font-medium hidden sm:table-cell">
              Stalled
            </th>
            <th className="text-center p-3 font-medium hidden sm:table-cell">
              Not Started
            </th>
            <th className="text-center p-3 font-medium hidden sm:table-cell">
              Completed
            </th>
            <th className="text-right p-3 font-medium hidden md:table-cell">
              Budget
            </th>
            <th className="text-center p-3 font-medium">Progress</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => {
            const isActive = row.value === activeValue;

            // Build the link that sets the filter for this row
            const hrefParams = new URLSearchParams();
            hrefParams.set("type", type);
            hrefParams.set(paramKey, row.value);
            if (currentFiscalYear && currentFiscalYear !== "ALL") {
              hrefParams.set("fiscalYear", currentFiscalYear);
            }
            const baseHref = `/portal/projects?${hrefParams.toString()}`;
            const href =
              type === "ward" ? `${baseHref}${subCountyParam}` : baseHref;

            const statusBadge = (variantClass: string, count: number) => (
              <Badge
                variant="outline"
                className={`text-xs font-normal ${variantClass}`}
              >
                {count}
              </Badge>
            );

            return (
              <tr
                key={row.value}
                className={`hover:bg-muted/30 transition-colors ${
                  isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""
                }`}
              >
                <td className="p-3 font-medium">
                  <Link
                    href={href}
                    className="flex items-center gap-2 text-foreground hover:text-primary"
                  >
                    {row.label}
                  </Link>
                </td>
                <td className="text-center p-3 tabular-nums">
                  {row.totalProjects}
                </td>
                <td className="text-center p-3 hidden sm:table-cell">
                  {statusBadge(
                    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
                    row.active,
                  )}
                </td>
                <td className="text-center p-3 hidden sm:table-cell">
                  {statusBadge(
                    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
                    row.stalled,
                  )}
                </td>
                <td className="text-center p-3 hidden sm:table-cell">
                  {statusBadge(
                    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
                    row.notStarted,
                  )}
                </td>
                <td className="text-center p-3 hidden sm:table-cell">
                  {statusBadge(
                    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
                    row.completed,
                  )}
                </td>
                <td className="text-right p-3 hidden md:table-cell tabular-nums text-muted-foreground">
                  {formatCurrency(row.totalBudget)}
                </td>
                <td className="text-center p-3 font-medium">
                  {row.avgProgress}%
                </td>
                <td className="p-3">
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
