// ProjectChecklistClient component - Updated to use props
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChecklistStatus } from "@/lib/types/types";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  RefreshCw,
  Download,
  Search,
  BarChart3,
  Users,
  FileText,
  Lock,
  Eye,
  EyeOff,
  MoreVertical,
  History,
  CheckSquare,
  Square,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Import types from data

// Keep your existing StandardParam type
type StandardParam = {
  id: string;
  label: string;
  category: string;
  description?: string;
  weight?: number;
  required?: boolean;
  maxScore?: number;
};

// Update Checklist type to use DataChecklist

type ChecklistPhase = {
  id: ChecklistStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  canEdit: boolean;
  requiresApproval: boolean;
  allowsTaskSelection: boolean;
  allowsWeightAssignment: boolean;
  allowsTaskModification: boolean;
  requiresReasonForChanges: boolean;
};

const PHASES: ChecklistPhase[] = [
  {
    id: ChecklistStatus.Draft,
    label: "Draft",
    description: "Select checklist tasks",
    icon: <FileText className="w-4 h-4" />,
    color: "bg-blue-500",
    canEdit: true,
    requiresApproval: false,
    allowsTaskSelection: true,
    allowsWeightAssignment: false,
    allowsTaskModification: true,
    requiresReasonForChanges: false,
  },
  {
    id: ChecklistStatus.DraftReview,
    label: "Draft Review",
    description: "Review selected tasks",
    icon: <Users className="w-4 h-4" />,
    color: "bg-amber-500",
    canEdit: true,
    requiresApproval: true,
    allowsTaskSelection: true,
    allowsWeightAssignment: false,
    allowsTaskModification: true,
    requiresReasonForChanges: true,
  },
  {
    id: ChecklistStatus.WeightsAssignment,
    label: "Weights Assignment",
    description: "Assign weights to selected tasks",
    icon: <BarChart3 className="w-4 h-4" />,
    color: "bg-purple-500",
    canEdit: true,
    requiresApproval: false,
    allowsTaskSelection: false,
    allowsWeightAssignment: true,
    allowsTaskModification: false,
    requiresReasonForChanges: false,
  },
  {
    id: ChecklistStatus.WeightsReview,
    label: "Weights Review",
    description: "Review and adjust weights",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "bg-emerald-500",
    canEdit: true,
    requiresApproval: true,
    allowsTaskSelection: false,
    allowsWeightAssignment: true,
    allowsTaskModification: false,
    requiresReasonForChanges: true,
  },
  {
    id: ChecklistStatus.Approved,
    label: "Approved",
    description: "Finalized and ready for tracking",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "bg-green-500",
    canEdit: false,
    requiresApproval: false,
    allowsTaskSelection: false,
    allowsWeightAssignment: false,
    allowsTaskModification: false,
    requiresReasonForChanges: false,
  },
];

export default function ProjectChecklistClient({
  projectId,
  checklist: initialChecklist,
  standardParams: initialStandardParams,
  userEmail,
}: any) {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [checklist, setChecklist] = useState<any | null>(null);
  const [standardParams, setStandardParams] = useState<StandardParam[]>([]);
  const [localItems, setLocalItems] = useState<Record<string, number>>({});
  const [editReason, setEditReason] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showIncludedOnly, setShowIncludedOnly] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("items");
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);
  const router = useRouter();

  console.log("user", userEmail);

  // Initialize from props instead of API call
  useEffect(() => {
    setLoading(true);

    // Convert DataChecklist to our component Checklist type
    const convertedChecklist: any = {
      ...initialChecklist,
      version: 1,
      lastModified: new Date().toISOString(),
      lastModifiedBy: "Demo User",
      // Map the draftReview and weightAssignment fields
      draftReviewComments: initialChecklist.draftReview
        ? {
            reviewer: initialChecklist.draftReview.reviewerId || "Reviewer",
            accepted: false,
            reason: initialChecklist.draftReview.reason,
            reviewedAt: initialChecklist.draftReview.date,
          }
        : undefined,
      weightsReviewComments: initialChecklist.weightAssignment
        ? {
            reviewer:
              initialChecklist.weightAssignment.reviewerId || "Reviewer",
            accepted: false,
            reason: initialChecklist.weightAssignment.reason,
            reviewedAt: initialChecklist.weightAssignment.date,
          }
        : undefined,
    };

    // Convert ChecklistParam to StandardParam
    const convertedStandardParams: any = initialStandardParams.map(
      (param: any) => ({
        id: param.id,
        label: param.label,
        category: param.category,
        description: param.description || "",
        maxScore: 10,
        required: false,
      }),
    );

    setChecklist(convertedChecklist);
    setStandardParams(convertedStandardParams);

    // Initialize local items from checklist
    const itemsMap: Record<string, number> = {};
    initialChecklist.items.forEach((it: any) => {
      itemsMap[it.parameterId] = it.weight ?? 0;
    });
    setLocalItems(itemsMap);

    setLoading(false);
    setPendingChanges(false);
  }, [initialChecklist, initialStandardParams]);

  // Get current phase
  const currentPhase = useMemo(() => {
    return PHASES.find((p) => p.id === checklist?.status) || PHASES[0];
  }, [checklist?.status]);

  // Filter params based on current phase
  const filteredStandardParams = useMemo(() => {
    let params = standardParams;

    // In WeightsAssignment and later phases, only show selected tasks
    if (
      currentPhase.id === ChecklistStatus.DraftReview ||
      currentPhase.id === ChecklistStatus.WeightsAssignment ||
      currentPhase.id === ChecklistStatus.WeightsReview ||
      currentPhase.id === ChecklistStatus.Approved
    ) {
      params = params.filter((p) => (localItems[p.id] ?? 0) > 0);
    }

    // Apply search filter
    if (searchQuery) {
      params = params.filter(
        (p) =>
          p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply included filter (for Draft and DraftReview phases)
    if (showIncludedOnly && currentPhase.allowsTaskSelection) {
      params = params.filter((p) => (localItems[p.id] ?? 0) > 0);
    }

    return params;
  }, [standardParams, currentPhase, searchQuery, showIncludedOnly, localItems]);

  // Derived grouping: categories -> array of params
  const groupedParams = useMemo(() => {
    const map: Record<string, StandardParam[]> = {};

    filteredStandardParams.forEach((p) => {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });

    // Sort categories and items
    Object.keys(map).forEach((k) =>
      map[k].sort((a, b) =>
        a.id.localeCompare(b.id, undefined, { numeric: true }),
      ),
    );

    return map;
  }, [filteredStandardParams]);

  // Compute statistics
  const stats = useMemo(() => {
    const totalParams = standardParams.length;
    const includedParams = Object.values(localItems).filter(
      (w) => w > 0,
    ).length;
    const totalWeight = Object.values(localItems).reduce(
      (sum, w) => sum + w,
      0,
    );

    const categoryStats: Record<
      string,
      { included: number; total: number; weight: number }
    > = {};
    Object.entries(groupedParams).forEach(([category, params]) => {
      const included = params.filter((p) => (localItems[p.id] ?? 0) > 0).length;
      const weight = params.reduce(
        (sum, p) => sum + (localItems[p.id] ?? 0),
        0,
      );
      categoryStats[category] = {
        included,
        total: params.length,
        weight,
      };
    });

    return {
      totalParams,
      includedParams,
      totalWeight,
      categoryStats,
    };
  }, [standardParams, groupedParams, localItems]);

  // Handle task inclusion toggle (only for Draft and DraftReview phases)
  const toggleTaskInclude = (paramId: string) => {
    if (!currentPhase.allowsTaskSelection) return;

    const newWeight = (localItems[paramId] ?? 0) > 0 ? 0 : 1;
    const newItems = { ...localItems, [paramId]: newWeight };

    setLocalItems(newItems);
    setPendingChanges(true);

    if (currentPhase.requiresReasonForChanges) {
      toast.info("Please provide a reason for your changes before saving");
    }
  };

  // Handle weight change (only for WeightsAssignment and WeightsReview phases)
  const setTaskWeight = (paramId: string, weight: number) => {
    if (!currentPhase.allowsWeightAssignment) return;

    const maxScore =
      standardParams.find((p) => p.id === paramId)?.maxScore || 10;
    const newWeight = Math.max(1, Math.min(weight, maxScore));
    const newItems = { ...localItems, [paramId]: newWeight };

    setLocalItems(newItems);
    setPendingChanges(true);

    if (currentPhase.requiresReasonForChanges) {
      toast.info("Please provide a reason for weight changes before saving");
    }
  };

  // Save checklist (simulated for demo)
  const handleSave = async (status?: ChecklistStatus) => {
    if (currentPhase.requiresReasonForChanges && !editReason.trim()) {
      toast.error("Please provide a reason for your changes");
      return;
    }

    setSaving(true);

    // Simulate API delay
    setTimeout(() => {
      try {
        const items = Object.entries(localItems)
          .filter(([, w]) => Number(w) > 0)
          .map(([parameterId, weight]) => ({
            parameterId,
            weight: Number(weight),
          }));

        const payload = {
          id: checklist?.id ?? `cl-${projectId}`,
          projectId,
          status: status ?? checklist?.status ?? ChecklistStatus.Draft,
          items,
          version: (checklist?.version ?? 0) + 1,
          lastModified: new Date().toISOString(),
          lastModifiedBy: "Current User",
          ...(currentPhase.requiresReasonForChanges &&
            editReason.trim() && {
              editReason: editReason,
            }),
        };

        // In real app, this would be an API call
        setChecklist(payload);
        setPendingChanges(false);
        setEditReason("");

        toast.success("Checklist saved successfully (Demo Mode)");

        if (projectId === "proj-mukuru-grounds") {
          router.push(`/projects/proj-dandora-stadium`);
        } else if (projectId === "proj-dandora-stadium") {
          router.push(`/projects/proj-pandpieri`);
        }
      } catch (err) {
        console.error("Save checklist error", err);
        toast.error("Failed to save checklist");
      } finally {
        setSaving(false);
      }
    }, 1000);
  };

  // Submit for review
  const handleSubmitForReview = async () => {
    await handleSave();
  };

  // Reset to server state
  const handleReset = () => {
    const itemsMap: Record<string, number> = {};
    (checklist?.items ?? []).forEach((it: any) => {
      itemsMap[it.parameterId] = it.weight ?? 0;
    });
    setLocalItems(itemsMap);
    setPendingChanges(false);
    setEditReason("");
    toast.info("Reset to last saved state");
  };

  // Export checklist
  const handleExport = () => {
    const data = {
      projectId,
      checklist,
      items: Object.entries(localItems)
        .filter(([, w]) => Number(w) > 0)
        .map(([parameterId, weight]) => ({
          parameterId,
          weight,
        })),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checklist-${projectId}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Checklist exported successfully");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isReadOnly = currentPhase.id === ChecklistStatus.Approved;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Project Checklist
          </h1>
          <p className="text-muted-foreground">{currentPhase.description}</p>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {currentPhase.allowsTaskSelection && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowIncludedOnly(!showIncludedOnly)}
              >
                {showIncludedOnly ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" /> Show All
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" /> Included Only
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={saving || !pendingChanges}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            {currentPhase.canEdit && (
              <Button
                onClick={() => handleSave()}
                disabled={saving || (!pendingChanges && !editReason.trim())}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Phase Progress */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            {/* Phase Steps */}
            <div className="relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
              <div className="relative flex justify-between">
                {PHASES.map((phase, index) => {
                  const isCurrent = phase.id === checklist?.status;
                  const isCompleted =
                    PHASES.findIndex((p) => p.id === checklist?.status) > index;
                  const isFuture =
                    PHASES.findIndex((p) => p.id === checklist?.status) < index;

                  return (
                    <div
                      key={phase.id}
                      className="flex flex-col items-center relative z-10"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2",
                          isCurrent &&
                            "border-primary bg-primary text-primary-foreground",
                          isCompleted &&
                            "border-primary bg-primary text-primary-foreground",
                          isFuture &&
                            "border-muted bg-background text-muted-foreground",
                          isReadOnly && "opacity-60",
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          phase.icon
                        )}
                      </div>
                      <div className="text-center mt-2">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isCurrent && "text-primary",
                            isCompleted && "text-primary",
                            isFuture && "text-muted-foreground",
                            isReadOnly && "opacity-60",
                          )}
                        >
                          {phase.label}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-[120px]">
                          {phase.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Details */}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="items">
              {isReadOnly ? "Checklist" : "Edit Checklist"}
            </TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="font-bold">
                {stats.includedParams}
                {currentPhase.allowsTaskSelection && `/${stats.totalParams}`}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentPhase.allowsTaskSelection
                  ? "Selected Tasks"
                  : "Total Tasks"}
              </p>
            </div>

            {currentPhase.allowsWeightAssignment && (
              <div className="text-center">
                <p className="font-bold">{stats.totalWeight}</p>
                <p className="text-sm text-muted-foreground">Total Weight</p>
              </div>
            )}

            <div className="text-center">
              <p className="font-bold">{Object.keys(groupedParams).length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                  disabled={isReadOnly}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isReadOnly}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExport}>
                    Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => toast.info("Print feature coming soon")}
                  >
                    Print Checklist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Checklist Items Tab */}
        <TabsContent value="items" className="space-y-4">
          {isReadOnly ? (
            <Card>
              <CardHeader>
                <CardTitle>Finalized Checklist</CardTitle>
                <CardDescription>
                  This checklist has been approved and is now active for
                  tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Checklist Approved
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    This checklist is now in tracking mode. No further edits are
                    allowed. Visit the Trackers section to monitor progress.
                  </p>
                  <Button variant="outline" asChild>
                    <a href={`/projects/${projectId}?tab=trackers`}>
                      Go to Trackers
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {pendingChanges && currentPhase.requiresReasonForChanges && (
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <Label className="font-medium">
                          Reason for Changes (Required)
                        </Label>
                      </div>
                      <Textarea
                        placeholder={`Explain why you ${currentPhase.allowsTaskSelection ? "added/removed tasks" : "adjusted weights"}...`}
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        rows={3}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        All changes in this phase require a reason for review.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Accordion type="multiple" className="space-y-4">
                {Object.entries(groupedParams).map(([category, params]) => {
                  const categoryStat = stats.categoryStats[category];
                  const allIncluded = params.every(
                    (p) => (localItems[p.id] ?? 0) > 0,
                  );
                  const someIncluded = params.some(
                    (p) => (localItems[p.id] ?? 0) > 0,
                  );

                  return (
                    <AccordionItem
                      key={category}
                      value={category}
                      className="border rounded-lg"
                    >
                      <AccordionTrigger className="px-6 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-4">
                            {currentPhase.allowsTaskSelection && (
                              <Checkbox
                                checked={allIncluded}
                                onCheckedChange={() => {
                                  const newItems = { ...localItems };
                                  const newValue = allIncluded ? 0 : 1;
                                  params.forEach((p) => {
                                    newItems[p.id] = newValue;
                                  });
                                  setLocalItems(newItems);
                                  setPendingChanges(true);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                disabled={!currentPhase.allowsTaskModification}
                              />
                            )}
                            <div className="text-left">
                              <div className="font-semibold">{category}</div>
                              <div className="text-sm text-muted-foreground">
                                {params.length} items
                                {currentPhase.allowsTaskSelection &&
                                  ` • ${categoryStat.included} selected`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {currentPhase.allowsWeightAssignment && (
                              <Badge variant="outline" className="font-mono">
                                {categoryStat.weight} pts
                              </Badge>
                            )}
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className="px-6 pb-4 space-y-3">
                          {params.map((param) => {
                            const weight = localItems[param.id] ?? 0;
                            const included = weight > 0;
                            const maxScore = param.maxScore || 10;

                            return (
                              <div
                                key={param.id}
                                className="flex items-center justify-between gap-4 p-3 border rounded-lg"
                              >
                                <div className="flex items-start gap-3 flex-1">
                                  {currentPhase.allowsTaskSelection && (
                                    <Checkbox
                                      checked={included}
                                      onCheckedChange={() =>
                                        toggleTaskInclude(param.id)
                                      }
                                      className="mt-1"
                                      disabled={
                                        !currentPhase.allowsTaskModification
                                      }
                                    />
                                  )}
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <Label
                                        className={cn(
                                          "font-medium cursor-pointer",
                                          !currentPhase.allowsTaskSelection &&
                                            "cursor-default",
                                        )}
                                      >
                                        {param.id} — {param.label}
                                      </Label>
                                      {param.required && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Required
                                        </Badge>
                                      )}
                                    </div>
                                    {param.description && (
                                      <p className="text-sm text-muted-foreground">
                                        {param.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  {currentPhase.allowsWeightAssignment &&
                                  included ? (
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <div className="text-lg font-bold">
                                          {weight}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          points
                                        </div>
                                      </div>
                                      <div className="w-32">
                                        <Slider
                                          value={[weight]}
                                          onValueChange={([value]) =>
                                            setTaskWeight(param.id, value)
                                          }
                                          max={maxScore}
                                          step={1}
                                          className="w-full"
                                          disabled={isReadOnly}
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                          <span>1</span>
                                          <span>{maxScore}</span>
                                        </div>
                                      </div>
                                      <Input
                                        type="number"
                                        value={weight}
                                        onChange={(e) =>
                                          setTaskWeight(
                                            param.id,
                                            Number(e.target.value),
                                          )
                                        }
                                        className="w-20"
                                        min={1}
                                        max={maxScore}
                                        disabled={isReadOnly}
                                      />
                                    </div>
                                  ) : included &&
                                    currentPhase.allowsTaskSelection ? (
                                    <Badge
                                      variant="outline"
                                      className="text-green-600 border-green-200 bg-green-50"
                                    >
                                      <CheckSquare className="w-3 h-3 mr-1" />
                                      Selected
                                    </Badge>
                                  ) : currentPhase.allowsTaskSelection ? (
                                    <Badge
                                      variant="outline"
                                      className="text-muted-foreground"
                                    >
                                      <Square className="w-3 h-3 mr-1" />
                                      Not Selected
                                    </Badge>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Checklist Preview</CardTitle>
              <CardDescription>
                How your checklist will appear to reviewers and in tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedParams).map(([category, params]) => {
                  const includedParams = params.filter(
                    (p) => (localItems[p.id] ?? 0) > 0,
                  );
                  if (includedParams.length === 0) return null;

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{category}</h3>
                        <Badge variant="outline">
                          {includedParams.reduce(
                            (sum, p) => sum + (localItems[p.id] ?? 0),
                            0,
                          )}{" "}
                          pts
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {includedParams.map((param) => (
                          <div
                            key={param.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{param.label}</p>
                              {param.description && (
                                <p className="text-sm text-muted-foreground">
                                  {param.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold">
                                {localItems[param.id] ?? 0}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                points
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Checklist History</CardTitle>
              <CardDescription>Previous versions and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="p-2 rounded-full bg-primary/10">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      Current Version {checklist?.version || 1}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last modified:{" "}
                      {checklist?.lastModified
                        ? new Date(checklist.lastModified).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                  <Badge>Current</Badge>
                </div>
                <p className="text-center text-muted-foreground text-sm">
                  Version history feature coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Footer - Only show if not read-only */}
      {!isReadOnly && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Review Comments if any */}
              {checklist?.draftReviewComments &&
                !checklist.draftReviewComments.accepted && (
                  <div className="p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          Review Comment from{" "}
                          {checklist.draftReviewComments.reviewer}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {checklist.draftReviewComments.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {userEmail &&
                  userEmail === "meofficer@gmail.com" &&
                  currentPhase.canEdit && (
                    <Button
                      onClick={() => handleSave()}
                      disabled={
                        saving || (!pendingChanges && !editReason.trim())
                      }
                      className="sm:flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  )}

                {userEmail &&
                  (userEmail === "ide@gmail.com" ||
                    userEmail === "mw@gmail.com") &&
                  checklist?.status === ChecklistStatus.Draft && (
                    <Button
                      variant="outline"
                      onClick={() => handleSave(ChecklistStatus.DraftReview)}
                      disabled={saving}
                    >
                      Submit for Draft Review
                    </Button>
                  )}

                {userEmail &&
                  (userEmail === "ide@gmail.com" ||
                    userEmail === "mw@gmail.com") &&
                  checklist?.status === ChecklistStatus.WeightsAssignment && (
                    <Button
                      onClick={() => handleSave(ChecklistStatus.WeightsReview)}
                      disabled={saving}
                    >
                      Submit for Weights Review
                    </Button>
                  )}

                {userEmail &&
                  userEmail === "meofficer@gmail.com" &&
                  checklist?.status === ChecklistStatus.WeightsReview && (
                    <Button
                      variant="default"
                      onClick={() => handleSave(ChecklistStatus.Approved)}
                      disabled={saving || !editReason.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Finalize
                    </Button>
                  )}
              </div>

              {userEmail &&
                userEmail === "meofficer@gmail.com" &&
                pendingChanges &&
                currentPhase.requiresReasonForChanges &&
                !editReason.trim() && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Please provide a reason for your changes before saving
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
