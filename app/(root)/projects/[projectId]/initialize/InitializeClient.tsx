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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Rocket,
  Loader2,
  MapPin,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ProjectLocationForm } from "@/components/projects/ProjectLocationForm";
import {
  updateProjectLocation,
  updateProjectDetails,
  initializeProject,
} from "@/lib/actions/projectActions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectDetails {
  fundingSource: string;
  employer: string;
  employerRep: string;
  projectManager: string;
  fiscalYear: string;
  contractSum: string;
  contractDuration: string;
  commencementDate: string;
  plannedCompletion: string;
  costToCompletion: string;
}

const EMPTY_DETAILS: ProjectDetails = {
  fundingSource: "",
  employer: "",
  employerRep: "",
  projectManager: "",
  fiscalYear: "",
  contractSum: "",
  contractDuration: "",
  commencementDate: "",
  plannedCompletion: "",
  costToCompletion: "",
};

// ─── Already Initialized View ─────────────────────────────────────────────────

function AlreadyInitialized({ project }: { project: any }) {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
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
          This project has already been initialized and is ready for execution.
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

// ─── Project Details Form ─────────────────────────────────────────────────────

function ProjectDetailsForm({
  projectId,
  initialData,
  onSaved,
}: {
  projectId: string;
  initialData: Partial<ProjectDetails>;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProjectDetails>({
    ...EMPTY_DETAILS,
    ...initialData,
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof ProjectDetails, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProjectDetails(projectId, form);
      toast.success("Project details saved");
      onSaved();
    } catch {
      toast.error("Failed to save project details");
    } finally {
      setSaving(false);
    }
  };

  const filled = Object.values(form).filter((v) => v.trim()).length;
  const total = Object.keys(form).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        These details will appear in the project monitoring report header.{" "}
        <span className="text-zinc-400 text-xs">
          ({filled}/{total} fields filled)
        </span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fundingSource" className="text-xs mb-1.5 block">
            Funding Source
          </Label>
          <Input
            id="fundingSource"
            value={form.fundingSource}
            onChange={(e) => set("fundingSource", e.target.value)}
            placeholder="e.g. Nairobi City County Government (Capital Projects)"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="employer" className="text-xs mb-1.5 block">
            Employer
          </Label>
          <Input
            id="employer"
            value={form.employer}
            onChange={(e) => set("employer", e.target.value)}
            placeholder="e.g. Nairobi City County"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="employerRep" className="text-xs mb-1.5 block">
            Employer's Representative
          </Label>
          <Input
            id="employerRep"
            value={form.employerRep}
            onChange={(e) => set("employerRep", e.target.value)}
            placeholder="e.g. County Chief Officer – Markets and Trade"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="projectManager" className="text-xs mb-1.5 block">
            Project Manager
          </Label>
          <Input
            id="projectManager"
            value={form.projectManager}
            onChange={(e) => set("projectManager", e.target.value)}
            placeholder="e.g. Director, Building Services"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="fiscalYear" className="text-xs mb-1.5 block">
            Fiscal Year
          </Label>
          <Input
            id="fiscalYear"
            value={form.fiscalYear}
            onChange={(e) => set("fiscalYear", e.target.value)}
            placeholder="e.g. 2024–2025"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="contractSum" className="text-xs mb-1.5 block">
            Contract Sum
          </Label>
          <Input
            id="contractSum"
            value={form.contractSum}
            onChange={(e) => set("contractSum", e.target.value)}
            placeholder="e.g. Kshs. 93,964,315"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="commencementDate" className="text-xs mb-1.5 block">
            Commencement Date
          </Label>
          <Input
            id="commencementDate"
            type="date"
            value={form.commencementDate}
            onChange={(e) => set("commencementDate", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="plannedCompletion" className="text-xs mb-1.5 block">
            Planned Completion
          </Label>
          <Input
            id="plannedCompletion"
            type="date"
            value={form.plannedCompletion}
            onChange={(e) => set("plannedCompletion", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="contractDuration" className="text-xs mb-1.5 block">
            Contract Duration
          </Label>
          <Input
            id="contractDuration"
            value={form.contractDuration}
            onChange={(e) => set("contractDuration", e.target.value)}
            placeholder="e.g. 8 months"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="costToCompletion" className="text-xs mb-1.5 block">
            Cost to Completion
          </Label>
          <Input
            id="costToCompletion"
            value={form.costToCompletion}
            onChange={(e) => set("costToCompletion", e.target.value)}
            placeholder="e.g. Kshs. 25,170,099"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            "Save Project Details"
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function InitializeClient({
  project,
  isInitialized,
}: {
  project: any;
  isInitialized: boolean;
}) {
  const router = useRouter();
  const [initializing, setInitializing] = useState(false);

  const [locationSaved, setLocationSaved] = useState(
    !!(project.subCounty && project.ward && project.lat && project.long),
  );
  const [detailsSaved, setDetailsSaved] = useState(
    !!(project.fundingSource || project.employer || project.contractSum),
  );

  if (isInitialized) {
    return <AlreadyInitialized project={project} />;
  }

  const handleLocationSave = async (locationData: {
    subCounty: string;
    ward: string;
    lat: number;
    long: number;
  }) => {
    await updateProjectLocation(project.id, locationData);
    setLocationSaved(true);
  };

  const handleInitialize = async () => {
    if (!locationSaved) {
      toast.error("Please save the project location first.");
      return;
    }
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
              Provide location and contract details, then initialize the
              project.
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
          {/* ── 1. Location ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <CardTitle>Project Location</CardTitle>
              </div>
              <CardDescription>
                Enter the sub‑county and ward. Coordinates can be fetched
                automatically or entered manually.
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

          {/* ── 2. Contract Details ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-violet-500" />
                <CardTitle>Project & Contract Details</CardTitle>
              </div>
              <CardDescription>
                These details populate the header of monitoring status reports
                generated after tracker review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectDetailsForm
                projectId={project.id}
                initialData={{
                  fundingSource: project.fundingSource ?? "",
                  employer: project.employer ?? "",
                  employerRep: project.employerRep ?? "",
                  projectManager: project.projectManager ?? "",
                  fiscalYear: project.fiscalYear ?? "",
                  contractSum: project.contractSum ?? "",
                  contractDuration: project.contractDuration ?? "",
                  commencementDate: project.commencementDate
                    ? project.commencementDate.slice(0, 10)
                    : "",
                  plannedCompletion: project.plannedCompletion
                    ? project.plannedCompletion.slice(0, 10)
                    : "",
                  costToCompletion: project.costToCompletion ?? "",
                }}
                onSaved={() => setDetailsSaved(true)}
              />
            </CardContent>
          </Card>

          {/* ── 3. Document Upload (optional) ── */}
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
                    PDF, DOC, XLS, or images — Max 10 MB each
                  </p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Select Files
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Required Documents:</h4>
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

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Initialization Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "Location is required",
                  body: "Sub-county, ward and coordinates must be saved before you can initialize.",
                },
                {
                  title: "Contract details power reports",
                  body: "Funding source, employer and dates appear verbatim in monitoring reports.",
                },
                {
                  title: "Review before submitting",
                  body: "Double‑check all information — it can be edited later but requires care.",
                },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{tip.title}</p>
                    <p className="text-xs text-muted-foreground">{tip.body}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Progress Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Save project location", done: locationSaved },
                  { label: "Enter contract details", done: detailsSaved },
                  { label: "Initialize project", done: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                        step.done
                          ? "bg-emerald-500 text-white"
                          : i === 0 || (i === 1 && locationSaved)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle className="w-3.5 h-3.5" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : ""}`}
                      >
                        {step.label}
                      </p>
                      {step.done && (
                        <p className="text-xs text-emerald-600">✓ Saved</p>
                      )}
                    </div>
                  </div>
                ))}
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
          {!locationSaved && (
            <p className="text-xs text-center text-muted-foreground -mt-2">
              Save the project location first
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
