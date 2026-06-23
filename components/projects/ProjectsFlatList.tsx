"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // adjust import to your shadcn/ui table components
import {
  ChevronRight,
  Eye,
  Target,
  Wallet,
  MapPin,
  Calendar,
} from "lucide-react";
import type { FlatProject } from "@/lib/actions/categoryActions";
import { Role } from "@/lib/actions/adminActions";

function fmtCurrency(n: number | null) {
  if (n == null) return "—";
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProjectsFlatList({
  projects,
  userRole,
}: {
  projects: FlatProject[];
  userRole: Role[];
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
            <TableHead className="w-[30%]">Project Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Sector</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <TableCell className="font-medium">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {project.name}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1">
                    {project.ward && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {project.ward}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {fmtDate(project.createdAt)}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {project.categoryName ? (
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {project.categoryName}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400 italic">
                    Uncategorized
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                {project.sector || "—"}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    project.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  }`}
                >
                  {project.status === "ACTIVE" ? "Active" : "Pending"}
                </span>
              </TableCell>
              <TableCell className="text-sm font-medium">
                {fmtCurrency(project.budget)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500">
                    {project.progress}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={
                    project.status === "PENDING"
                      ? `/projects/${project.id}/initialize`
                      : `/projects/${project.id}`
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-50 dark:bg-zinc-800 text-zinc-600 hover:bg-blue-600 hover:text-white border border-zinc-200 dark:border-zinc-700 transition-all"
                >
                  View
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
