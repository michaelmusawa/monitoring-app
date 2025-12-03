// File: app/projects/[projectId]/initialize/page.tsx
"use client";

import { useState, useEffect } from "react";
import { projects } from "@/lib/data/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";

// Mock InitializeProjectForm for demo purposes
function InitializeProjectForm({
  projectId,
  prerequisites,
}: {
  projectId: string;
  prerequisites: string[];
}) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize checkboxes
  useEffect(() => {
    const initialChecked: Record<string, boolean> = {};
    prerequisites.forEach((item) => {
      initialChecked[item] = false;
    });
    setCheckedItems(initialChecked);
  }, [prerequisites]);

  const handleCheckboxChange = (item: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [item]: !prev[item],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Project initialized successfully! (Demo Mode)");
      // In a real app, you would redirect or update state
    }, 1500);
  };

  const allChecked =
    prerequisites.length > 0 &&
    prerequisites.every((item) => checkedItems[item]);
  const progress =
    prerequisites.length > 0
      ? (prerequisites.filter((item) => checkedItems[item]).length /
          prerequisites.length) *
        100
      : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {prerequisites.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                Prerequisites (
                {prerequisites.filter((item) => checkedItems[item]).length}/
                {prerequisites.length})
              </h3>
              <span className="text-sm text-muted-foreground">
                {Math.round(progress)}% complete
              </span>
            </div>
            <Progress value={progress} />

            <div className="space-y-3">
              {prerequisites.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <input
                    type="checkbox"
                    id={`prereq-${index}`}
                    checked={checkedItems[item] || false}
                    onChange={() => handleCheckboxChange(item)}
                    className="mt-1 h-4 w-4"
                  />
                  <label
                    htmlFor={`prereq-${index}`}
                    className="text-sm flex-1 cursor-pointer"
                  >
                    {item}
                  </label>
                  <Badge
                    variant={checkedItems[item] ? "default" : "outline"}
                    className="text-xs"
                  >
                    {checkedItems[item] ? "Completed" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-muted-foreground">
              No prerequisites defined for this project.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}`}>Cancel</Link>
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!allChecked || isSubmitting}
          className="min-w-32"
        >
          {isSubmitting ? "Initializing..." : "Initialize Project"}
        </Button>
      </div>
    </div>
  );
}

export default function InitializePage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      const foundProject = projects.find((p) => p.id === projectId);
      setProject(foundProject || null);
      setLoading(false);
    }, 300);
  }, [projectId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 animate-pulse">
        <div className="mb-6">
          <div className="h-4 w-20 bg-muted rounded mb-4"></div>
          <div className="h-8 w-64 bg-muted rounded mb-2"></div>
          <div className="h-4 w-96 bg-muted rounded"></div>
        </div>
        <div className="space-y-4">
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return notFound();
  }

  // Determine if project is already initialized based on status
  // In dummy data, we'll consider ACTIVE, COMPLETE, and RETIRED as initialized
  const isInitialized = ["ACTIVE", "COMPLETE", "RETIRED"].includes(
    project.status,
  );

  // If project is already initialized, show a different view
  if (isInitialized) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Project Already Initialized
          </h1>
          <p className="text-muted-foreground mt-2">
            This project has already been initialized and is ready for
            execution.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle>Initialization Complete</CardTitle>
                <CardDescription>
                  Project was initialized and is currently{" "}
                  {project.status.toLowerCase()}.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Project Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{project.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Current Status
                    </p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {project.status.toLowerCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sector</p>
                    <p className="font-medium">{project.sector}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={project.progress || 0} />
                      <span className="text-sm font-medium">
                        {project.progress || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href={`/projects/${projectId}`}>
                    View Project Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/projects">Browse All Projects</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Project
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Initialize Project
            </h1>
            <p className="text-muted-foreground mt-2">
              Complete the prerequisites and upload required documents to begin
              project execution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1">
              {project.sector}
            </Badge>
            <Badge className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
              Pending Initialization
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prerequisite Checklist</CardTitle>
              <CardDescription>
                Complete all required prerequisites before initializing the
                project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InitializeProjectForm
                projectId={projectId}
                prerequisites={project.prerequisites || []}
              />
            </CardContent>
          </Card>

          {/* Document Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>
                Upload all necessary supporting documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">
                    Drop files here or click to upload
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload PDF, DOC, XLS, or image files (Max 10MB each)
                  </p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Select Files
                  </Button>
                </div>

                {/* Required Documents List */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Required Documents:</h4>
                  <div className="space-y-2">
                    {[
                      "Project Proposal Document",
                      "Budget Approval",
                      "Environmental Impact Assessment",
                      "Stakeholder Agreement",
                      "Timeline Schedule",
                    ].map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{doc}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Project Name</p>
                <p className="font-medium truncate">{project.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Project ID</p>
                <p className="font-mono text-sm">{project.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Size Category</p>
                <Badge variant="secondary" className="capitalize">
                  {project.size?.toLowerCase() || "Not specified"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Estimated Budget
                </p>
                <p className="font-medium">
                  {project.budget
                    ? `KES ${project.budget.toLocaleString()}`
                    : "Not specified"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Help & Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Initialization Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    Complete All Prerequisites
                  </p>
                  <p className="text-xs text-muted-foreground">
                    All checklist items must be completed before submission
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    Upload Required Documents
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Missing documents may delay project approval
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    Review Before Submission
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Double-check all information for accuracy
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Complete Initialization
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current step
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Checklist formulation</p>
                    <p className="text-xs text-muted-foreground">
                      Choose task parameters and assign weights
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tracking Phase</p>
                    <p className="text-xs text-muted-foreground">
                      Fill trackers and monitor progress
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
