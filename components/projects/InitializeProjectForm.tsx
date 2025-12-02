// File: components/projects/InitializeProjectForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface InitializeProjectFormProps {
  projectId: string;
  prerequisites: string[];
}

export function InitializeProjectForm({
  projectId,
  prerequisites,
}: InitializeProjectFormProps) {
  const router = useRouter();
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    new Array(prerequisites.length).fill(false),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<string[]>(
    new Array(prerequisites.length).fill(""),
  );

  const allChecked = checkedItems.every(Boolean);
  const progress =
    (checkedItems.filter(Boolean).length / prerequisites.length) * 100;

  const handleCheckboxChange = (index: number) => {
    const newCheckedItems = [...checkedItems];
    newCheckedItems[index] = !newCheckedItems[index];
    setCheckedItems(newCheckedItems);
  };

  const handleCommentChange = (index: number, value: string) => {
    const newComments = [...comments];
    newComments[index] = value;
    setComments(newComments);
  };

  const handleSubmit = async () => {
    if (!allChecked) {
      toast.error("Please complete all prerequisites before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      // Call server action to initialize project
      const response = await fetch(`/api/projects/${projectId}/initialize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prerequisites: prerequisites.map((prereq, index) => ({
            name: prereq,
            completed: checkedItems[index],
            comment: comments[index],
            completedAt: new Date().toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize project");
      }

      toast.success("Project initialized successfully!");
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (error) {
      console.error("Initialization error:", error);
      toast.error("Failed to initialize project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Completion Progress</span>
          <span className="text-muted-foreground">
            {checkedItems.filter(Boolean).length} of {prerequisites.length}{" "}
            completed
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Prerequisites List */}
      <div className="space-y-4">
        {prerequisites.map((prereq, index) => (
          <Card
            key={index}
            className={
              checkedItems[index]
                ? "border-green-200 dark:border-green-800"
                : ""
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`prereq-${index}`}
                  checked={checkedItems[index]}
                  onCheckedChange={() => handleCheckboxChange(index)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={`prereq-${index}`}
                      className={`text-sm font-medium cursor-pointer ${checkedItems[index] ? "line-through text-muted-foreground" : ""}`}
                    >
                      {prereq}
                    </Label>
                    {checkedItems[index] ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Notes (optional)
                    </label>
                    <textarea
                      placeholder="Add any notes or comments..."
                      value={comments[index]}
                      onChange={(e) =>
                        handleCommentChange(index, e.target.value)
                      }
                      className="w-full min-h-[60px] p-2 text-sm border rounded-md resize-none"
                      disabled={!checkedItems[index]}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button
          onClick={handleSubmit}
          disabled={!allChecked || isSubmitting}
          className="sm:flex-1"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Initializing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Initialization
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>

      {/* Validation Message */}
      {!allChecked && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-md">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">
            Please complete all {prerequisites.length} prerequisites before
            submitting.
          </p>
        </div>
      )}
    </div>
  );
}
