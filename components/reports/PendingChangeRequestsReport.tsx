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

export function PendingChangeRequestsReport({
  initialData,
}: {
  initialData: any[];
}) {
  const handleExport = () => {
    exportToCSV(initialData, "pending-change-requests");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Pending Change Requests
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {initialData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending change requests.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead>Changes Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.map((req) => (
                  <TableRow key={req.projectId + req.requestedAt}>
                    <TableCell className="font-medium">
                      {req.projectName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{req.requestedBy}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(req.requestedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{req.changesCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
