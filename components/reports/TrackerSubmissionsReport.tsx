"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/utils/export";

export function TrackerSubmissionsReport({
  projectId: initialProjectId,
}: {
  projectId: string | null;
}) {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(
    initialProjectId,
  );
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/projects?all=true")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    fetch(`/api/projects/${selectedProject}/trackers`)
      .then((res) => res.json())
      .then((data) => setSubmissions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const handleExport = () => {
    const flattened = submissions.flatMap((sub) =>
      sub.items.map((item: any) => ({
        project: sub.projectId,
        title: sub.title,
        submittedBy: sub.submittedBy,
        submittedAt: sub.submittedAt,
        overallPercent: sub.overallPercent,
        task: item.label,
        status: item.status,
        percentComplete: item.percentComplete,
        weight: item.weight,
        challenges: item.challenges,
        recommendations: item.recommendations,
      })),
    );
    exportToCSV(flattened, `tracker-submissions-${selectedProject}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center flex-wrap gap-2">
          <span>Tracker Submissions Report</span>
          <div className="flex gap-2">
            <Select
              onValueChange={setSelectedProject}
              value={selectedProject || ""}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={!selectedProject || submissions.length === 0}
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading submissions...</div>
        ) : !selectedProject ? (
          <div className="text-center py-8 text-muted-foreground">
            Select a project to view tracker submissions.
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tracker submissions for this project.
          </div>
        ) : (
          <div className="space-y-6">
            {submissions.map((sub) => (
              <div key={sub.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">{sub.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Submitted by {sub.submittedBy} on{" "}
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">
                      {sub.overallPercent}%
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Overall Progress
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Complete %</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Challenges</TableHead>
                        <TableHead>Recommendations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sub.items.map((item: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="max-w-xs truncate">
                            {item.label}
                          </TableCell>
                          <TableCell>{item.status}</TableCell>
                          <TableCell>{item.percentComplete}%</TableCell>
                          <TableCell>{item.weight}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {item.challenges || "—"}
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {item.recommendations || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
