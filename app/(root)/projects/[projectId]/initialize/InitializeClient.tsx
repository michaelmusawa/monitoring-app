"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Rocket,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ProjectLocationForm } from "@/components/projects/ProjectLocationForm";
import {
  updateProjectLocation,
  initializeProject,
} from "@/lib/actions/projectActions";

export default function InitializeClient({
  project,
  isInitialized,
}: {
  project: any;
  isInitialized: boolean;
}) {
  const router = useRouter();
  const [savingLocation, setSavingLocation] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [locationSaved, setLocationSaved] = useState(
    !!(project.subCounty && project.ward && project.lat && project.long),
  );

  if (isInitialized) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* ... already initialized view (unchanged) ... */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href={`/projects/${project.slug}`}>
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
                  <Link href={`/projects/${project.slug}`}>
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

  const handleLocationSave = async (locationData: {
    subCounty: string;
    ward: string;
    lat: number;
    long: number;
  }) => {
    setSavingLocation(true);
    try {
      await updateProjectLocation(project.id, locationData);
      setLocationSaved(true);
      toast.success("Location saved");
    } catch {
      toast.error("Failed to save location");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleInitialize = async () => {
    setInitializing(true);
    try {
      await initializeProject(project.id);
      toast.success("Project initialized successfully!");
      router.push(`/projects/${project.id}`);
    } catch {
      toast.error("Failed to initialize project");
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/projects/${project.id}`}>
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
              Provide location details and then initialize the project.
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
              <CardTitle>Project Location</CardTitle>
              <CardDescription>
                Enter the sub‑county and ward where the project is located.
                Coordinates can be fetched automatically or entered manually.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectLocationForm
                initialData={{
                  subCounty: project.subCounty,
                  ward: project.ward,
                  lat: project.lat,
                  long: project.long,
                }}
                onSave={handleLocationSave}
              />
            </CardContent>
          </Card>

          {/* Document Upload Section (optional) */}
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

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Required Documents:</h4>
                  <div className="space-y-2">
                    {[
                      "Project Proposal Document",
                      "Public participation plan",
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
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-medium">
                  {project.budget
                    ? `KES ${project.budget.toLocaleString()}`
                    : "Not specified"}
                </p>
              </div>
              {project.subCounty && (
                <div>
                  <p className="text-sm text-muted-foreground">Sub‑County</p>
                  <p className="font-medium">{project.subCounty}</p>
                </div>
              )}
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
                    Provide Accurate Location
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Coordinates help display the project on maps.
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
                    Missing documents may delay project approval.
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
                    Double‑check all information for accuracy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
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
                    <p className="font-medium text-sm">Complete Location</p>
                    <p className="text-xs text-muted-foreground">
                      {locationSaved ? "✓ Saved" : "Fill location form"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      locationSaved
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Initialize Project</p>
                    <p className="text-xs text-muted-foreground">
                      Click the button below
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Checklist & Tracking</p>
                    <p className="text-xs text-muted-foreground">
                      Proceed to project dashboard
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Initialize Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleInitialize}
            disabled={!locationSaved || initializing}
          >
            {initializing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-2" />
                Initialize Project
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
