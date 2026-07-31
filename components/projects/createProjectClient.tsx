"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Info,
  DollarSign,
  Check,
  ChevronRight,
  FolderKanban,
  CircleDot,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { ProjectLocationForm } from "@/components/projects/ProjectLocationForm";
import { createFullProject } from "@/lib/actions/projectActions";
import OrgUnitSelector from "../admin/OrgUnitSelector";
import {
  fetchCategoryStats,
  fetchProjectCategories,
} from "@/lib/actions/categoryActions";

// ─── Constants ────────────────────────────────────────────────────────────────

export const PROJECT_TYPES = [
  {
    value: "HARD",
    label: "Hard (Physical infrastructure, construction, etc.)",
  },
  {
    value: "SOFT",
    label: "Soft (Software, training, capacity building, etc.)",
  },
];

const REQUIRED_DOCS = [
  "Project concept note",
  "BQ document",
  "Work plan",
  "Contract Agreement",
  "Project Proposal",
  "CIMES",
];

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const basicsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(200, "Name too long"),
  sector: z.string().min(1, "Please select an organisational unit"), // keep key 'sector' but label updated
  budget: z
    .union([
      z.string().transform((val) => (val.trim() === "" ? undefined : val)),
      z.number().optional(),
    ])
    .pipe(
      z
        .string()
        .optional()
        .refine((val) => val === undefined || /^\d+(\.\d+)?$/.test(val), {
          message: "Budget must be a number (no commas or letters)",
        })
        .transform((val) => (val === undefined ? undefined : Number(val))),
    )
    .pipe(z.number().positive("Budget must be a positive number").optional()),
  description: z.string().max(2000, "Description too long").optional(),
  contributionValue: z.preprocess(
    (val) => (val === "" || val === undefined ? undefined : Number(val)),
    z.number().positive("Contribution must be a positive number").optional(),
  ),
  projectType: z.string().min(1, "Please select project type"),
});

const locationSchema = z
  .object({
    subCounty: z.string().min(1, "Sub-county is required"),
    ward: z.string().min(1, "Ward is required"),
    lat: z.number().min(-90).max(90),
    long: z.number().min(-180).max(180),
  })
  .nullable();

type LocationData = z.infer<typeof locationSchema>;

interface ContractDetails {
  fundingSource: string;
  employer: string;
  tenderNumber: string;
  projectScope: string;
  projectObjective: string;
  projectManager: string;
  fiscalYear: string;
  contractSum: string;
  contractDuration: string;
  commencementDate: string;
  plannedCompletion: string;
  costToCompletion: string;
}

const EMPTY_CONTRACT: ContractDetails = {
  fundingSource: "",
  employer: "",
  tenderNumber: "",
  projectScope: "",
  projectObjective: "",
  projectManager: "",
  fiscalYear: "",
  contractSum: "",
  contractDuration: "",
  commencementDate: "",
  plannedCompletion: "",
  costToCompletion: "",
};

type Step = "category" | "basics" | "location" | "contract" | "documents";
export const STEPS: { id: Step; label: string; description: string }[] = [
  {
    id: "category",
    label: "Category",
    description: "Select CIDP category",
  },
  {
    id: "basics",
    label: "Basic Info",
    description: "Project name, org unit & budget",
  },
  {
    id: "location",
    label: "Location",
    description: "Sub-county, ward & coordinates",
  },
  { id: "contract", label: "Contract", description: "Funding, scope & dates" },
  { id: "documents", label: "Documents", description: "Supporting files" },
];
const STEP_ORDER: Step[] = [
  "category",
  "basics",
  "location",
  "contract",
  "documents",
];

function getFiscalYearFromDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 6) return `${year}/${year + 1}`;
  else return `${year - 1}/${year}`;
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

export function StepIndicator({
  current,
  done,
  stepsToShow, // only the steps that should appear
}: {
  current: Step;
  done: Set<Step>;
  stepsToShow: Step[];
}) {
  return (
    <div className="flex items-center mb-8">
      {stepsToShow.map((stepId, i) => {
        const s = STEPS.find((st) => st.id === stepId)!;
        const isActive = s.id === current;
        const isDone = done.has(s.id);
        const isLast = i === stepsToShow.length - 1;
        return (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all duration-200 ${
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : isActive
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span
                className={`text-[11px] font-medium hidden sm:block leading-tight text-center ${
                  isActive
                    ? "text-primary"
                    : isDone
                      ? "text-emerald-600"
                      : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-px mx-2 mb-4 transition-colors ${
                  isDone ? "bg-emerald-400" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Category Selection Step ──────────────────────────────────────────────────

function SectionCategory({
  categories,
  onSelect,
}: {
  categories: {
    id: string;
    name: string;
    target?: number;
    targetType?: string;
  }[];
  onSelect: (id: string, name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>
      <div className="grid gap-2 max-h-80 overflow-auto">
        {filtered.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id, cat.name)}
            className="flex items-center justify-between p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
          >
            <div>
              <p className="text-sm font-medium">{cat.name}</p>
              {cat.target != null && (
                <p className="text-xs text-muted-foreground">
                  Target: {cat.target}
                  {cat.targetType === "PERCENT" ? "%" : ""}
                </p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No categories found
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Section: Basic Info (updated to use orgUnitId) ─────────────────────────

export function SectionBasics({
  name,
  setName,
  orgUnitId,
  setOrgUnitId,
  orgUnitName, // ⬅️ new
  setOrgUnitName, // ⬅️ new
  budget,
  setBudget,
  description,
  setDescription,
  contributionValue,
  setContributionValue,
  projectType,
  setProjectType,
  categoryName,
  categoryTarget,
  categoryTargetType,
  remainingTarget,
  errors,
  touched,
  setTouched,
}: {
  name: string;
  setName: (v: string) => void;
  orgUnitId: string;
  setOrgUnitId: (v: string) => void;
  orgUnitName: string; // added
  setOrgUnitName: (v: string) => void; // added
  budget: string;
  setBudget: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  contributionValue: string;
  projectType: string;
  setProjectType: (v: string) => void;
  setContributionValue: (v: string) => void;
  categoryName?: string;
  categoryTarget?: number | null;
  categoryTargetType?: "NUMBER" | "PERCENT" | null;
  remainingTarget?: number | null;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setTouched: (field: string) => void;
}) {
  return (
    <div className="space-y-5">
      {categoryName && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
          <FolderKanban className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-0.5">
              CIDP Category
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium leading-snug">
              {categoryName}
            </p>
            {categoryTarget !== undefined && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Target:{" "}
                {categoryTargetType === "PERCENT"
                  ? `${categoryTarget}%`
                  : categoryTarget?.toLocaleString()}
                {remainingTarget !== undefined &&
                  ` · Remaining: ${categoryTargetType === "PERCENT" ? `${remainingTarget}%` : remainingTarget?.toLocaleString()}`}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="proj-name" className="text-xs font-semibold">
          Project Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="proj-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (touched.name) setTouched("name");
          }}
          onBlur={() => setTouched("name")}
          placeholder="e.g. Construction of Pumwani Health Centre Extension"
          className={`h-9 text-sm ${errors.name && touched.name ? "border-destructive" : ""}`}
        />
        {errors.name && touched.name && (
          <p className="text-xs text-destructive mt-1">{errors.name}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            Organisation Unit <span className="text-destructive">*</span>
          </Label>
          <OrgUnitSelector
            value={orgUnitId}
            onChange={setOrgUnitId}
            onLabelChange={setOrgUnitName} // <-- update name on change
            placeholder="Select a unit…"
          />
          {errors.sector && touched.sector && (
            <p className="text-xs text-destructive mt-1">{errors.sector}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proj-budget" className="text-xs font-semibold">
            Budget (KES)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              id="proj-budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 5000000"
              className="h-9 text-sm pl-8"
            />
          </div>
          {errors.budget && touched.budget && (
            <p className="text-xs text-destructive mt-1">{errors.budget}</p>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">
          Project Type <span className="text-destructive">*</span>
        </Label>
        <Select value={projectType} onValueChange={setProjectType}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Select project type" />
          </SelectTrigger>
          <SelectContent>
            {PROJECT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.projectType && touched.projectType && (
          <p className="text-xs text-destructive mt-1">{errors.projectType}</p>
        )}
      </div>

      {categoryName && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">
            Contribution to Category Target{" "}
            <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="any"
              value={contributionValue}
              onChange={(e) => {
                setContributionValue(e.target.value);
                if (touched.contributionValue) setTouched("contributionValue");
              }}
              onBlur={() => setTouched("contributionValue")}
              placeholder="e.g., 30"
              className={`h-9 text-sm ${errors.contributionValue && touched.contributionValue ? "border-destructive" : ""}`}
            />
            {remainingTarget !== undefined && remainingTarget !== null && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                (Max:{" "}
                {categoryTargetType === "PERCENT"
                  ? `${remainingTarget}%`
                  : remainingTarget.toLocaleString()}
                )
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            How much of the category target will this project achieve when
            completed?
          </p>
          {errors.contributionValue && touched.contributionValue && (
            <p className="text-xs text-destructive mt-1">
              {errors.contributionValue}
            </p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="proj-description" className="text-xs font-semibold">
          Description
        </Label>
        <Textarea
          id="proj-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief overview..."
          className="text-sm resize-none"
          rows={3}
        />
        {errors.description && touched.description && (
          <p className="text-xs text-destructive mt-1">{errors.description}</p>
        )}
      </div>
    </div>
  );
}
// ─── Section: Contract Details (updated) ─────────────────────────────────────

export function SectionContract({
  form,
  set,
}: {
  form: ContractDetails;
  set: (key: keyof ContractDetails, val: string) => void;
}) {
  const filled = Object.values(form).filter((v) => String(v).trim()).length;
  const total = Object.keys(form).length;

  // Auto‑set fiscal year when commencementDate changes
  useEffect(() => {
    if (form.commencementDate) {
      const autoFiscal = getFiscalYearFromDate(form.commencementDate);
      if (autoFiscal && autoFiscal !== form.fiscalYear) {
        set("fiscalYear", autoFiscal);
      }
    }
  }, [form.commencementDate, form.fiscalYear, set]);

  const today = new Date().toISOString().split("T")[0];

  const fields: {
    key: keyof ContractDetails;
    label: string;
    placeholder: string;
    type?: string;
    min?: string;
  }[] = [
    {
      key: "tenderNumber",
      label: "Tender Number",
      placeholder: "e.g. NCC/PROC/01/2024-2025",
    },
    {
      key: "fundingSource",
      label: "Funding Source",
      placeholder: "e.g. Nairobi City County Government (Capital Projects)",
    },
    {
      key: "employer",
      label: "Contractor Name",
      placeholder: "e.g. Nairobi City County",
    },
    {
      key: "projectScope",
      label: "Project Scope",
      placeholder: "Describe the scope of works / services",
    },
    {
      key: "projectObjective",
      label: "Project Objective",
      placeholder: "Main objective of the project",
    },
    {
      key: "projectManager",
      label: "Project Manager",
      placeholder: "e.g. Director, Building Services",
    },
    {
      key: "commencementDate",
      label: "Commencement Date",
      placeholder: "",
      type: "date",
      min: today,
    },
    {
      key: "plannedCompletion",
      label: "Planned Completion",
      placeholder: "",
      type: "date",
      min: today,
    },
    {
      key: "fiscalYear",
      label: "Fiscal Year",
      placeholder: "Auto‑filled from commencement date",
    },
    {
      key: "contractSum",
      label: "Contract Sum",
      placeholder: "e.g. Kshs. 93,964,315",
    },

    {
      key: "contractDuration",
      label: "Contract Duration",
      placeholder: "e.g. 8 months",
    },
    {
      key: "costToCompletion",
      label: "Cost to Completion",
      placeholder: "e.g. Kshs. 25,170,099",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          These details appear verbatim in monitoring status reports.{" "}
          <span className="font-semibold">
            {filled}/{total} fields filled.
          </span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label
              htmlFor={`contract-${f.key}`}
              className="text-xs font-semibold"
            >
              {f.label}
            </Label>
            {f.key === "projectScope" || f.key === "projectObjective" ? (
              <Textarea
                id={`contract-${f.key}`}
                value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="text-sm resize-none"
                rows={2}
              />
            ) : f.type === "date" ? (
              <Input
                id={`contract-${f.key}`}
                type="date"
                value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                min={f.min}
                className="h-9 text-sm"
              />
            ) : (
              <Input
                id={`contract-${f.key}`}
                type={f.type || "text"}
                value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="h-9 text-sm"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section: Documents (unchanged) ───────────────────────────────────────────

export function SectionDocuments({
  files,
  setFiles,
}: {
  files: File[];
  setFiles: (f: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      setFiles([...files, ...Array.from(e.dataTransfer.files)]);
    },
    [files, setFiles],
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="font-semibold mb-1 text-sm">
          Drop files here or click to upload
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          PDF, DOC, XLS or images — max 10 MB each
        </p>
        <Button variant="outline" size="sm" type="button" asChild>
          <label className="cursor-pointer">
            <Upload className="w-3.5 h-3.5 mr-2" />
            Select Files
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) =>
                setFiles([...files, ...Array.from(e.target.files || [])])
              }
            />
          </label>
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Uploaded ({files.length})
          </p>
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-medium truncate">{f.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(f.size / 1024).toFixed(0)} KB
                </span>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Required Documents
        </p>
        {REQUIRED_DOCS.map((doc, i) => {
          const uploaded = files.some((f) =>
            f.name.toLowerCase().includes(doc.toLowerCase().slice(0, 8)),
          );
          return (
            <div
              key={i}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <FileText
                  className={`w-4 h-4 shrink-0 ${uploaded ? "text-emerald-500" : "text-muted-foreground"}`}
                />
                <span className="text-sm">{doc}</span>
              </div>
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${
                  uploaded
                    ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20"
                    : ""
                }`}
              >
                {uploaded ? "Uploaded" : "Required"}
              </Badge>
            </div>
          );
        })}
      </div>

      <div className="p-3 rounded-lg bg-muted/50 border">
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Document upload is optional at this stage. You can add documents later
          from the project dashboard.
        </p>
      </div>
    </div>
  );
}

// ─── Sidebar (unchanged) ──────────────────────────────────────────────────────

type SidebarLocation = {
  locationUnitId: string;
  lat: number;
  long: number;
  subCounty?: string;
  ward?: string;
} | null;

export function Sidebar({
  name,
  orgUnitName, // <-- changed
  budget,
  location,
  contractFilled,
  categoryName,
}: {
  name: string;
  orgUnitName: string; // <-- changed
  budget: string;
  location: SidebarLocation;
  contractFilled: number;
  categoryName?: string;
}) {
  const checks = [
    { label: "Project name entered", done: name.trim().length > 0 },
    { label: "Organisational unit selected", done: orgUnitName.length > 0 },
    { label: "Location saved", done: !!location },
    { label: "Contract details (3+ fields)", done: contractFilled >= 3 },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {categoryName && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Category</p>
              <p className="font-medium text-blue-700 dark:text-blue-400 line-clamp-2 text-xs leading-snug">
                {categoryName}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Name</p>
            <p className="font-medium truncate text-sm">
              {name || (
                <span className="text-muted-foreground italic text-xs">
                  Not entered
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Org Unit</p>
            {orgUnitName ? (
              <Badge variant="outline" className="text-xs">
                {orgUnitName}
              </Badge>
            ) : (
              <p className="text-muted-foreground italic text-xs">
                Not selected
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Budget</p>
            <p className="font-medium text-sm">
              {budget ? (
                `KES ${Number(budget).toLocaleString()}`
              ) : (
                <span className="text-muted-foreground italic text-xs">
                  Not specified
                </span>
              )}
            </p>
          </div>
          {location && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Location</p>
              <p className="font-medium text-sm">
                {location.ward || location.locationUnitId}
                {location.subCounty && `, ${location.subCounty}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checks.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    c.done ? "bg-emerald-500" : "bg-muted border border-border"
                  }`}
                >
                  {c.done && <Check className="w-3 h-3 text-white" />}
                </div>
                <p
                  className={`text-sm leading-snug ${c.done ? "line-through text-muted-foreground" : "font-medium"}`}
                >
                  {c.label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              title: "Name & org unit are required",
              body: "All other fields are optional and can be updated later.",
            },
            {
              title: "Location enables the map",
              body: "Sub-county, ward and coordinates power the projects map view.",
            },
            {
              title: "Contract details power reports",
              body: "Funding, scope, dates, and tender info appear in monitoring reports.",
            },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold mb-0.5">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.body}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

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

// ─── Main Component (updated) ─────────────────────────────────────────────────

interface Props {
  initialCategoryId?: string; // from server if adding to specific category
  initialCategoryName?: string;
  defaultOrgUnitId?: string;
  initialCategoryTarget?: number | null;
  initialCategoryTargetType?: "NUMBER" | "PERCENT" | null;
  initialRemainingTarget?: number | null;
}

export default function CreateProjectClient({
  initialCategoryId,
  initialCategoryName,
  defaultOrgUnitId = "",
  initialCategoryTarget = null,
  initialCategoryTargetType = null,
  initialRemainingTarget = null,
}: Props) {
  const router = useRouter();

  // If initialCategoryId exists, skip category step.
  const hasPreSelectedCategory = !!initialCategoryId;

  // Category state
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId || "");
  const [categoryName, setCategoryName] = useState<string>(
    initialCategoryName || "",
  );
  const [categoryTarget, setCategoryTarget] = useState<number | null>(
    initialCategoryTarget,
  );
  const [categoryTargetType, setCategoryTargetType] = useState<
    "NUMBER" | "PERCENT" | null
  >(initialCategoryTargetType);
  const [remainingTarget, setRemainingTarget] = useState<number | null>(
    initialRemainingTarget,
  );
  const [categories, setCategories] = useState<
    { id: string; name: string; target?: number; targetType?: string }[]
  >([]);
  const [categoriesLoading, setCategoriesLoading] = useState(
    !hasPreSelectedCategory,
  );

  // Steps & navigation
  const [currentStep, setCurrentStep] = useState<Step>(
    hasPreSelectedCategory ? "basics" : "category",
  );
  const [done, setDone] = useState<Set<Step>>(new Set());

  const stepsToShow: Step[] = hasPreSelectedCategory
    ? ["basics", "location", "contract", "documents"]
    : ["category", "basics", "location", "contract", "documents"];

  const [name, setName] = useState("");
  const [orgUnitId, setOrgUnitId] = useState(defaultOrgUnitId);
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [contributionValue, setContributionValue] = useState("");
  const [projectType, setProjectType] = useState("");

  const [location, setLocation] = useState<{
    locationUnitId: string;
    lat: number;
    long: number;
  } | null>(null);
  const [contract, setContract] = useState<ContractDetails>(EMPTY_CONTRACT);
  const setContractField = useCallback(
    (key: keyof ContractDetails, val: string) => {
      setContract((prev) => ({ ...prev, [key]: val }));
    },
    [],
  );
  const contractFilled = Object.values(contract).filter((v) =>
    String(v).trim(),
  ).length;

  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [orgUnitName, setOrgUnitName] = useState("");

  const [basicsErrors, setBasicsErrors] = useState<Record<string, string>>({});
  const [basicsTouched, setBasicsTouched] = useState<Record<string, boolean>>(
    {},
  );
  const setBasicsTouchedField = (field: string) =>
    setBasicsTouched((prev) => ({ ...prev, [field]: true }));

  // ── Resolve initial org unit name from ID ─────────────────────────
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
        const units = flattenTree(tree); // reuse the same flatten logic
        const unit = units.find((u: any) => u.id === orgUnitId);
        setOrgUnitName(unit?.label ?? orgUnitId); // fallback to ID if not found
      })
      .catch(() => {
        if (!cancelled) setOrgUnitName(orgUnitId);
      });
    return () => {
      cancelled = true;
    };
  }, [orgUnitId]);

  // Helper: flatten the organisational unit tree (identical to the one in OrgUnitSelector)

  // Load categories if needed
  useEffect(() => {
    if (!hasPreSelectedCategory) {
      fetchProjectCategories()
        .then((cats) => setCategories(cats))
        .catch(() => toast.error("Failed to load categories"))
        .finally(() => setCategoriesLoading(false));
    }
  }, [hasPreSelectedCategory]);

  // When user picks a category, fetch its target/remaining info (same as server page does)
  const handleCategorySelect = useCallback(async (id: string, name: string) => {
    setCategoryId(id);
    setCategoryName(name);
    // Fetch target and remaining via server action
    try {
      const stats = await fetchCategoryStats(id);
      setCategoryTarget(stats.target);
      setCategoryTargetType(stats.targetType as "NUMBER" | "PERCENT" | null);
      setRemainingTarget(stats.remaining);
    } catch (err) {
      console.error("Failed to fetch category stats", err);
      toast.error("Could not load category details");
    }
    // Mark category as done and move to next step
    setDone((prev) => new Set([...prev, "category" as Step]));
    setCurrentStep("basics");
  }, []);

  // Validate basics including contribution if category is provided
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
      if (categoryId && contributionValue) {
        const val = parseFloat(contributionValue);
        if (remainingTarget != null && val > remainingTarget) {
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
    categoryId,
    remainingTarget,
  ]);

  const isBasicsValid =
    !basicsErrors.name &&
    !basicsErrors.sector &&
    (!categoryId ||
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
    if (currentStep === "category") return true; // category selection is always valid if an item is selected (handled by onSelect)
    if (currentStep === "basics") return isBasicsValid;
    if (currentStep === "location") return isLocationValid;
    if (currentStep === "contract") return isContractDatesValid();
    return true;
  };

  const currentStepIndex = stepsToShow.indexOf(currentStep);
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
        toast.error(
          "Commencement and planned completion dates cannot be in the past",
        );
      return;
    }
    setDone((prev) => new Set([...prev, currentStep]));
    const nextIndex = stepsToShow.indexOf(currentStep) + 1;
    if (nextIndex < stepsToShow.length) {
      setCurrentStep(stepsToShow[nextIndex]);
    }
  }

  function goBack() {
    const prevIndex = stepsToShow.indexOf(currentStep) - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepsToShow[prevIndex]);
    }
  }

  const handleLocationSaved = useCallback(
    (data: { locationUnitId: string; lat: number; long: number }) => {
      setLocation(data);
      setDone((prev) => new Set([...prev, "location" as Step]));
      toast.success("Location saved");
    },
    [],
  );

  async function handleCreate() {
    const basicsResult = basicsSchema.safeParse({
      name,
      sector: orgUnitId,
      budget: budget === "" ? undefined : budget,
      description: description || undefined,
      contributionValue:
        contributionValue === "" ? undefined : contributionValue,
      projectType,
    });
    if (!basicsResult.success) {
      setBasicsTouched({
        name: true,
        sector: true,
        budget: true,
        description: true,
        contributionValue: true,
        projectType: true,
      });
      toast.error("Please fill in the required fields correctly");
      setCurrentStep("basics");
      return;
    }
    if (categoryId && !contributionValue) {
      toast.error("Contribution value is required for this category");
      setCurrentStep("basics");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (
      contract.commencementDate &&
      new Date(contract.commencementDate) < today
    ) {
      toast.error("Commencement date cannot be in the past");
      setCurrentStep("contract");
      return;
    }
    if (
      contract.plannedCompletion &&
      new Date(contract.plannedCompletion) < today
    ) {
      toast.error("Planned completion date cannot be in the past");
      setCurrentStep("contract");
      return;
    }

    setSubmitting(true);
    try {
      const project = await createFullProject({
        name: name.trim(),
        orgUnitId: orgUnitId,
        budget: budget ? Number(budget) : undefined,
        description: description || undefined,
        categoryId,
        contributionValue: contributionValue
          ? Number(contributionValue)
          : undefined,
        lat: location?.lat,
        long: location?.long,
        projectType,
        fundingSource: contract.fundingSource || undefined,
        employer: contract.employer || undefined,
        tenderNumber: contract.tenderNumber || undefined,
        projectScope: contract.projectScope || undefined,
        projectObjective: contract.projectObjective || undefined,
        projectManager: contract.projectManager || undefined,
        fiscalYear: contract.fiscalYear || undefined,
        contractSum: contract.contractSum || undefined,
        contractDuration: contract.contractDuration || undefined,
        commencementDate: contract.commencementDate || undefined,
        plannedCompletion: contract.plannedCompletion || undefined,
        costToCompletion: contract.costToCompletion || undefined,
      });
      toast.success("Project created successfully!");
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create project. Please try again.");
      setSubmitting(false);
    }
  }

  const currentStepMeta = STEPS.find((s) => s.id === currentStep)!;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-2">
          <Link href="/projects">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              New Project
            </h1>
            {categoryName ? (
              <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                <FolderKanban className="w-4 h-4 text-blue-500 shrink-0" />
                Adding to{" "}
                <span className="font-medium text-foreground">
                  {categoryName}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground mt-1">
                Fill in the details below to create and activate a new project.
              </p>
            )}
          </div>
          {orgUnitName && (
            <Badge variant="outline" className="px-3 py-1 text-sm shrink-0">
              <CircleDot className="w-3 h-3 mr-1.5" /> {orgUnitName}
            </Badge>
          )}
        </div>
      </div>

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
                    {stepsToShow.indexOf(currentStep) + 1}
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
              {currentStep === "category" && (
                <>
                  {categoriesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : (
                    <SectionCategory
                      categories={categories}
                      onSelect={handleCategorySelect}
                    />
                  )}
                </>
              )}
              {currentStep === "basics" && (
                <SectionBasics
                  name={name}
                  setName={setName}
                  orgUnitId={orgUnitId}
                  setOrgUnitId={setOrgUnitId}
                  orgUnitName={orgUnitName} // pass the name
                  setOrgUnitName={setOrgUnitName} // pass the setter
                  budget={budget}
                  setBudget={setBudget}
                  description={description}
                  setDescription={setDescription}
                  contributionValue={contributionValue}
                  setContributionValue={setContributionValue}
                  projectType={projectType}
                  setProjectType={setProjectType}
                  categoryName={categoryName}
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
                      Enter the sub-county and ward. Coordinates can be fetched
                      automatically or set manually on the map.
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
                disabled={stepsToShow.indexOf(currentStep) === 0}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
              <div className="flex items-center gap-2">
                {/* Skip button: only on contract and documents if not required */}
                {(currentStep === "contract" ||
                  currentStep === "documents") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isLastStep ? handleCreate : advance}
                    disabled={submitting}
                    className="text-muted-foreground text-xs"
                  >
                    {isLastStep ? "Skip & Create" : "Skip"}
                  </Button>
                )}
                {isLastStep ? (
                  <Button
                    onClick={handleCreate}
                    disabled={submitting}
                    size="sm"
                    className="min-w-[130px]"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />{" "}
                        Creating…
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-2" /> Create Project
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
            orgUnitName={orgUnitName}
            budget={budget}
            location={location}
            contractFilled={contractFilled}
            categoryName={categoryName}
          />
        </div>
      </div>
    </div>
  );
}
