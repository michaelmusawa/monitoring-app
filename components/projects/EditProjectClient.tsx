"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FolderKanban,
  CircleDot,
  Info,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateFullProject } from "@/lib/actions/projectActions";
import OrgUnitSelector from "../admin/OrgUnitSelector";
import { ProjectLocationForm } from "./ProjectLocationForm";

import {
  basicsSchema,
  SectionBasics,
  SectionContract,
  SectionDocuments,
  Sidebar,
  StepIndicator,
  STEPS,
} from "./createProjectClient";

interface EditProjectClientProps {
  project: any;
  categoryTarget: number | null;
  categoryTargetType: "NUMBER" | "PERCENT" | null;
  remainingTarget: number | null;
}

type Step = "basics" | "location" | "contract" | "documents";
const STEP_ORDER: Step[] = ["basics", "location", "contract", "documents"];
const stepsToShow: Step[] = ["basics", "location", "contract", "documents"];

// Flatten tree helper (same as in create client)
function flattenTree(
  units: any[],
  prefix = "",
): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [];
  for (const u of units) {
    result.push({ id: u.id, label: prefix + u.name + ` (${u.level})` });
    if (u.children) result.push(...flattenTree(u.children, prefix + "  "));
  }
  return result;
}

export default function EditProjectClient({
  project,
  categoryTarget,
  categoryTargetType,
  remainingTarget,
}: EditProjectClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("basics");
  const [done, setDone] = useState<Set<Step>>(new Set());

  // Basic Info state
  const [name, setName] = useState(project.name);
  const [orgUnitId, setOrgUnitId] = useState(project.orgUnitId || "");
  const [orgUnitName, setOrgUnitName] = useState(""); // <-- new
  const [budget, setBudget] = useState(project.budget?.toString() || "");
  const [description, setDescription] = useState(project.description || "");
  const [contributionValue, setContributionValue] = useState(
    project.contributionValue?.toString() || "",
  );
  const [projectType, setProjectType] = useState(project.projectType || "");
  const [status, setStatus] = useState(project.status || "NOT-STARTED");

  // Location
  const [location, setLocation] = useState<{
    locationUnitId: string;
    lat: number;
    long: number;
  } | null>(
    project.locationUnitId
      ? {
          locationUnitId: project.locationUnitId,
          lat: project.lat ?? 0,
          long: project.long ?? 0,
        }
      : null,
  );

  // Contract
  const [contract, setContract] = useState({
    fundingSource: project.fundingSource || "",
    employer: project.employer || "",
    tenderNumber: project.tenderNumber || "",
    projectScope: project.projectScope || "",
    projectObjective: project.projectObjective || "",
    projectManager: project.projectManager || "",
    fiscalYear: project.fiscalYear || "",
    contractSum: project.contractSum || "",
    contractDuration: project.contractDuration || "",
    commencementDate: project.commencementDate || "",
    plannedCompletion: project.plannedCompletion || "",
    costToCompletion: project.costToCompletion || "",
  });
  const setContractField = useCallback(
    (key: keyof typeof contract, val: string) => {
      setContract((prev) => ({ ...prev, [key]: val }));
    },
    [],
  );

  // Documents
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [basicsErrors, setBasicsErrors] = useState<Record<string, string>>({});
  const [basicsTouched, setBasicsTouched] = useState<Record<string, boolean>>(
    {},
  );
  const setBasicsTouchedField = (field: string) =>
    setBasicsTouched((prev) => ({ ...prev, [field]: true }));

  // Resolve org unit name on mount and when orgUnitId changes
  useEffect(() => {
    if (!orgUnitId) {
      setOrgUnitName("");
      return;
    }
    let cancelled = false;
    fetch("/api/admin/organisation/tree")
      .then((res) => res.json())
      .then((tree: any[]) => {
        if (cancelled) return;
        const units = flattenTree(tree);
        const unit = units.find((u: any) => u.id === orgUnitId);
        setOrgUnitName(unit?.label ?? orgUnitId);
      })
      .catch(() => {
        if (!cancelled) setOrgUnitName(orgUnitId);
      });
    return () => {
      cancelled = true;
    };
  }, [orgUnitId]);

  // Validation
  useEffect(() => {
    const result = basicsSchema.safeParse({
      name,
      sector: orgUnitId,
      budget: budget === "" ? undefined : budget,
      description: description || undefined,
      contributionValue:
        contributionValue === "" ? undefined : contributionValue,
      projectType,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string") errors[key] = issue.message;
      });
      setBasicsErrors(errors);
    } else {
      setBasicsErrors({});
      if (project.categoryId && contributionValue) {
        const val = parseFloat(contributionValue);
        if (remainingTarget !== null && val > remainingTarget) {
          setBasicsErrors((prev) => ({
            ...prev,
            contributionValue: `Contribution cannot exceed remaining target (${remainingTarget})`,
          }));
        }
      }
    }
  }, [
    name,
    orgUnitId,
    budget,
    description,
    contributionValue,
    projectType,
    remainingTarget,
    project.categoryId,
  ]);

  const isBasicsValid =
    !basicsErrors.name &&
    !basicsErrors.sector &&
    (!project.categoryId ||
      (!basicsErrors.contributionValue &&
        contributionValue &&
        parseFloat(contributionValue) > 0));
  const isLocationValid = location !== null;
  const isContractDatesValid = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (
      contract.commencementDate &&
      new Date(contract.commencementDate) < today
    )
      return false;
    if (
      contract.plannedCompletion &&
      new Date(contract.plannedCompletion) < today
    )
      return false;
    return true;
  };
  const canProceed = () => {
    if (currentStep === "basics") return isBasicsValid;
    if (currentStep === "location") return isLocationValid;
    if (currentStep === "contract") return isContractDatesValid();
    return true;
  };

  const stepIndex = STEP_ORDER.indexOf(currentStep);
  const isLastStep = currentStep === "documents";

  function advance() {
    if (!canProceed()) {
      if (currentStep === "basics") {
        setBasicsTouched({
          name: true,
          sector: true,
          budget: true,
          description: true,
          contributionValue: true,
        });
        toast.error("Please fix the errors before continuing");
      } else if (currentStep === "location")
        toast.error("Please save a valid location before continuing");
      else if (currentStep === "contract")
        toast.error("Dates cannot be in the past");
      return;
    }
    setDone((prev) => new Set([...prev, currentStep]));
    if (stepIndex < STEP_ORDER.length - 1)
      setCurrentStep(STEP_ORDER[stepIndex + 1]);
  }

  function goBack() {
    if (stepIndex > 0) setCurrentStep(STEP_ORDER[stepIndex - 1]);
  }

  const handleLocationSaved = useCallback(
    (data: { locationUnitId: string; lat: number; long: number }) => {
      setLocation(data);
      setDone((prev) => new Set([...prev, "location" as Step]));
      toast.success("Location saved");
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = basicsSchema.safeParse({
      name,
      sector: orgUnitId,
      budget: budget === "" ? undefined : budget,
      description: description || undefined,
      contributionValue:
        contributionValue === "" ? undefined : contributionValue,
      projectType,
    });
    if (!validation.success) {
      setBasicsTouched({
        name: true,
        sector: true,
        budget: true,
        description: true,
        contributionValue: true,
      });
      toast.error("Please fix errors in the basics section");
      setCurrentStep("basics");
      return;
    }
    if (project.categoryId && !contributionValue) {
      toast.error("Contribution value is required for this category");
      setCurrentStep("basics");
      return;
    }

    setSubmitting(true);
    try {
      await updateFullProject(project.id, {
        name: name.trim(),
        orgUnitId,
        budget: budget ? Number(budget) : undefined,
        description: description || undefined,
        categoryId: project.categoryId ?? null,
        contributionValue: contributionValue ? Number(contributionValue) : null,
        locationUnitId: location?.locationUnitId ?? null,
        lat: location?.lat ?? null,
        long: location?.long ?? null,
        projectType,
        status,
        fundingSource: contract.fundingSource || null,
        employer: contract.employer || null,
        tenderNumber: contract.tenderNumber || null,
        projectScope: contract.projectScope || null,
        projectObjective: contract.projectObjective || null,
        projectManager: contract.projectManager || null,
        fiscalYear: contract.fiscalYear || null,
        contractSum: contract.contractSum || null,
        contractDuration: contract.contractDuration || null,
        commencementDate: contract.commencementDate || null,
        plannedCompletion: contract.plannedCompletion || null,
        costToCompletion: contract.costToCompletion || null,
      });
      toast.success("Project updated successfully!");
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update project");
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepMeta = STEPS.find((s) => s.id === currentStep)!;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link href={`/projects/${project.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Edit Project
            </h1>
            <p className="text-muted-foreground mt-1">Update project details</p>
          </div>
          {orgUnitName && (
            <Badge variant="outline" className="px-3 py-1 text-sm shrink-0">
              <CircleDot className="w-3 h-3 mr-1.5" /> {orgUnitName}
            </Badge>
          )}
        </div>
      </div>

      {/* Fixed: pass stepsToShow */}
      <StepIndicator
        current={currentStep}
        done={done}
        stepsToShow={stepsToShow}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary-foreground">
                    {stepIndex + 1}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-base leading-tight">
                    {currentStepMeta.label}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {currentStepMeta.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {currentStep === "basics" && (
                <SectionBasics
                  name={name}
                  setName={setName}
                  orgUnitId={orgUnitId}
                  setOrgUnitId={setOrgUnitId}
                  orgUnitName={orgUnitName}
                  setOrgUnitName={setOrgUnitName}
                  budget={budget}
                  setBudget={setBudget}
                  description={description}
                  setDescription={setDescription}
                  contributionValue={contributionValue}
                  setContributionValue={setContributionValue}
                  projectType={projectType}
                  setProjectType={setProjectType}
                  categoryName={
                    project.categoryId
                      ? project.categoryName || "Assigned category"
                      : undefined
                  }
                  categoryTarget={categoryTarget}
                  categoryTargetType={categoryTargetType}
                  remainingTarget={remainingTarget}
                  errors={basicsErrors}
                  touched={basicsTouched}
                  setTouched={setBasicsTouchedField}
                />
              )}
              {currentStep === "location" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                    <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Update the location unit and coordinates. The map will
                      update automatically.
                    </p>
                  </div>
                  <ProjectLocationForm
                    initialData={{
                      locationUnitId: location?.locationUnitId,
                      lat: location?.lat,
                      long: location?.long,
                    }}
                    onSave={handleLocationSaved}
                  />
                </div>
              )}
              {currentStep === "contract" && (
                <SectionContract form={contract} set={setContractField} />
              )}
              {currentStep === "documents" && (
                <SectionDocuments files={files} setFiles={setFiles} />
              )}
            </CardContent>
            <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                disabled={stepIndex === 0}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
              <div className="flex items-center gap-2">
                {(currentStep === "contract" ||
                  currentStep === "documents") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isLastStep ? handleSubmit : advance}
                    disabled={submitting}
                    className="text-muted-foreground text-xs"
                  >
                    {isLastStep ? "Skip & Update" : "Skip"}
                  </Button>
                )}
                {isLastStep ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    size="sm"
                    className="min-w-[130px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />{" "}
                        Updating…
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-2" /> Update Project
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={advance} size="sm" className="min-w-[100px]">
                    Continue <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Sidebar
            name={name}
            orgUnitName={orgUnitName} // pass name, not ID
            budget={budget}
            location={location}
            contractFilled={Object.values(contract).filter((v) => v).length}
            categoryName={
              project.categoryId
                ? project.categoryName || "Assigned category"
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
