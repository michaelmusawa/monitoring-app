"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  FileText,
  User,
  Calendar,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: number;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: any;
  newValues: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export default function AuditLogTable({
  logs,
  totalPages,
  currentPage,
}: {
  logs: AuditLog[];
  totalPages: number;
  currentPage: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`/admin/audit?${params.toString()}`);
  };

  // ✅ Build pagination URLs preserving all filters
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `/admin/audit?${params.toString()}`;
  };

  const actionColors: Record<string, string> = {
    CREATE: "bg-emerald-100 text-emerald-700 border-emerald-200",
    UPDATE: "bg-blue-100 text-blue-700 border-blue-200",
    DELETE: "bg-red-100 text-red-700 border-red-200",
    APPROVE: "bg-green-100 text-green-700 border-green-200",
    SUBMIT: "bg-amber-100 text-amber-700 border-amber-200",
    ARCHIVE: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Entity type (e.g. Project)"
          value={searchParams.get("entity") || ""}
          onChange={(e) => updateParam("entity", e.target.value)}
          className="w-40"
        />
        <Input
          placeholder="Action (e.g. UPDATE)"
          value={searchParams.get("action") || ""}
          onChange={(e) => updateParam("action", e.target.value)}
          className="w-40"
        />
        <Input
          placeholder="User ID or email"
          value={searchParams.get("userId") || ""}
          onChange={(e) => updateParam("userId", e.target.value)}
          className="w-48"
        />
        <Button variant="outline" onClick={() => router.push("/admin/audit")}>
          Clear Filters
        </Button>
      </div>

      {/* Logs table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold">
                  IP
                </th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === log.id ? null : log.id)
                    }
                  >
                    <td className="px-4 py-2 text-xs font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">
                          {log.userEmail}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {log.userId}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          actionColors[log.action] || "bg-gray-100"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{log.entityType}</td>
                    <td className="px-4 py-2 text-xs font-mono">
                      {log.entityId || "—"}
                    </td>
                    <td className="px-4 py-2 text-xs font-mono">
                      {log.ipAddress || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr className="bg-muted/10">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="space-y-2 text-xs">
                          <div className="flex gap-2">
                            <span className="font-semibold">User Agent:</span>
                            <span className="text-muted-foreground truncate">
                              {log.userAgent}
                            </span>
                          </div>
                          {log.oldValues && (
                            <div>
                              <div className="font-semibold mb-1">
                                Old Values:
                              </div>
                              <pre className="bg-black/5 dark:bg-white/5 p-2 rounded text-[10px] overflow-x-auto">
                                {JSON.stringify(log.oldValues, null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.newValues && (
                            <div>
                              <div className="font-semibold mb-1">
                                New Values:
                              </div>
                              <pre className="bg-black/5 dark:bg-white/5 p-2 rounded text-[10px] overflow-x-auto">
                                {JSON.stringify(log.newValues, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No audit logs found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Link
              href={buildPageUrl(currentPage - 1)}
              className={`px-3 py-1 rounded-lg border text-sm ${
                currentPage <= 1
                  ? "opacity-40 pointer-events-none"
                  : "hover:bg-muted"
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={buildPageUrl(currentPage + 1)}
              className={`px-3 py-1 rounded-lg border text-sm ${
                currentPage >= totalPages
                  ? "opacity-40 pointer-events-none"
                  : "hover:bg-muted"
              }`}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
