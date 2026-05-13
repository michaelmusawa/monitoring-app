"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/utils/export";

export function ChecklistStatusReport({ initialData }: { initialData: any[] }) {
  const handleExport = () => {
    exportToCSV(initialData, "checklist-status-report");
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Draft: "bg-blue-100 text-blue-800",
      DraftReview: "bg-yellow-100 text-yellow-800",
      WeightsAssignment: "bg-purple-100 text-purple-800",
      WeightsReview: "bg-orange-100 text-orange-800",
      Approved: "bg-green-100 text-green-800",
      "No checklist": "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Checklist Status Report
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tasks Selected</TableHead>
                <TableHead>Total Weight</TableHead>
                <TableHead>Last Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.map((row) => (
                <TableRow key={row.projectId}>
                  <TableCell className="font-medium">
                    {row.projectName}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(row.status)}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.selectedItems} / {row.totalItems}
                  </TableCell>
                  <TableCell>{row.totalWeight} / 100</TableCell>
                  <TableCell>
                    {row.lastModified
                      ? new Date(row.lastModified).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
