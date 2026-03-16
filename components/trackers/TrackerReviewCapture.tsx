"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Save,
  Users,
  BookOpen,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TrackerCaptureData {
  trackerSubmissionId: string;
  workforceCount: string; // total (kept for backward compat; auto-summed when breakdown given)
  workforceMale: string;
  workforceFemale: string;
  workforcePWD: string;
  workforceNote: string;
  bestPractices: string[];
  lessonsLearnt: string[];
}

const EMPTY_CAPTURE: TrackerCaptureData = {
  trackerSubmissionId: "",
  workforceCount: "",
  workforceMale: "",
  workforceFemale: "",
  workforcePWD: "",
  workforceNote: "",
  bestPractices: [""],
  lessonsLearnt: [""],
};

function BulletListEditor({
  items,
  onChange,
  placeholder,
  accent,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  accent: string;
}) {
  const update = (i: number, v: string) => {
    const n = [...items];
    n[i] = v;
    onChange(n);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span
            className={cn("mt-2.5 w-2 h-2 rounded-full shrink-0", accent)}
          />
          <Textarea
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="flex-1 text-sm resize-none"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 mt-0.5 shrink-0 text-zinc-400 hover:text-red-500"
            onClick={() => remove(i)}
            disabled={items.length === 1}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="border-dashed w-full text-xs h-8"
        onClick={add}
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add point
      </Button>
    </div>
  );
}

function CaptureSection({
  icon,
  title,
  description,
  children,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div className={cn("rounded-xl border p-4 space-y-3", color)}>
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  trackerSubmissionId: string;
  onSaved?: (data: TrackerCaptureData) => void;
}

export default function TrackerReviewCapture({
  open,
  onClose,
  projectId,
  projectName,
  trackerSubmissionId,
  onSaved,
}: Props) {
  const [form, setForm] = useState<TrackerCaptureData>({
    ...EMPTY_CAPTURE,
    trackerSubmissionId,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !trackerSubmissionId) return;
    setLoading(true);
    fetch(
      `/api/projects/${projectId}/tracker-capture?submissionId=${trackerSubmissionId}`,
    )
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          const male =
            data.workforceMale != null ? String(data.workforceMale) : "";
          const female =
            data.workforceFemale != null ? String(data.workforceFemale) : "";
          const pwd =
            data.workforcePWD != null ? String(data.workforcePWD) : "";
          // Derive total: prefer breakdown sum, fall back to stored workforceCount
          const derivedTotal =
            male || female || pwd
              ? String(
                  (parseInt(male) || 0) +
                    (parseInt(female) || 0) +
                    (parseInt(pwd) || 0),
                )
              : (data.workforceCount?.toString() ?? "");
          setForm({
            trackerSubmissionId,
            workforceCount: derivedTotal,
            workforceMale: male,
            workforceFemale: female,
            workforcePWD: pwd,
            workforceNote: data.workforceNote ?? "",
            bestPractices: data.bestPractices?.length
              ? data.bestPractices
              : [""],
            lessonsLearnt: data.lessonsLearnt?.length
              ? data.lessonsLearnt
              : [""],
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, projectId, trackerSubmissionId]);

  const set = useCallback(
    <K extends keyof TrackerCaptureData>(
      key: K,
      value: TrackerCaptureData[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: TrackerCaptureData = {
        ...form,
        bestPractices: form.bestPractices.filter((s) => s.trim()),
        lessonsLearnt: form.lessonsLearnt.filter((s) => s.trim()),
      };
      // Auto-compute total from breakdown if breakdown was filled
      const male = parseInt(payload.workforceMale) || 0;
      const female = parseInt(payload.workforceFemale) || 0;
      const pwd = parseInt(payload.workforcePWD) || 0;
      const hasBreakdown =
        payload.workforceMale ||
        payload.workforceFemale ||
        payload.workforcePWD;
      const total = hasBreakdown
        ? male + female + pwd
        : parseInt(payload.workforceCount) || null;
      const res = await fetch(`/api/projects/${projectId}/tracker-capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          workforceCount: total,
          workforceMale: hasBreakdown ? male : null,
          workforceFemale: hasBreakdown ? female : null,
          workforcePWD: hasBreakdown ? pwd : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save");
      }
      toast.success("Details saved — generating report…");
      if (onSaved) {
        onSaved(payload);
      } else {
        onClose();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-blue-500 shrink-0" />
            Site Visit Details
          </DialogTitle>
          <DialogDescription>
            Provide workforce count and qualitative observations for{" "}
            <strong>{projectName}</strong>. All other report data is derived
            automatically from the tracker.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
              <span className="ml-2 text-sm text-zinc-400">
                Loading saved data…
              </span>
            </div>
          ) : (
            <>
              <CaptureSection
                icon={<Users className="w-4 h-4 text-blue-500" />}
                title="Workforce on Site"
                description="Record the breakdown of personnel present at the time of the site visit."
                color="border-blue-100 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-900"
              >
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Male</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.workforceMale}
                      onChange={(e) => set("workforceMale", e.target.value)}
                      placeholder="0"
                      className="h-9 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Female</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.workforceFemale}
                      onChange={(e) => set("workforceFemale", e.target.value)}
                      placeholder="0"
                      className="h-9 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">PWDs</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.workforcePWD}
                      onChange={(e) => set("workforcePWD", e.target.value)}
                      placeholder="0"
                      className="h-9 text-sm bg-white dark:bg-zinc-900"
                    />
                  </div>
                </div>
                {/* Live total */}
                {(form.workforceMale ||
                  form.workforceFemale ||
                  form.workforcePWD) && (
                  <p className="text-xs text-blue-600 font-medium mt-1">
                    Total:{" "}
                    {(parseInt(form.workforceMale) || 0) +
                      (parseInt(form.workforceFemale) || 0) +
                      (parseInt(form.workforcePWD) || 0)}{" "}
                    personnel
                  </p>
                )}
                <div className="mt-1">
                  <Label className="text-xs mb-1.5 block">
                    Workforce Description
                  </Label>
                  <Textarea
                    value={form.workforceNote}
                    onChange={(e) => set("workforceNote", e.target.value)}
                    placeholder="e.g. 2 male personnel performing site maintenance and oversight of completed works"
                    rows={3}
                    className="text-sm resize-none bg-white dark:bg-zinc-900"
                  />
                </div>
              </CaptureSection>

              <CaptureSection
                icon={<CheckCircle2 className="w-4 h-4 text-violet-500" />}
                title="Best Practices Observed"
                description="What innovative or exemplary approaches were applied on site?"
                color="border-violet-100 bg-violet-50/50 dark:bg-violet-950/10 dark:border-violet-900"
              >
                <BulletListEditor
                  items={form.bestPractices}
                  onChange={(v) => set("bestPractices", v)}
                  placeholder="e.g. Offsite prefabrication of roller shutters shortened onsite fabrication duration by 20–30 days…"
                  accent="bg-violet-500"
                />
              </CaptureSection>

              <CaptureSection
                icon={<BookOpen className="w-4 h-4 text-teal-500" />}
                title="Lessons Learnt"
                description="What should be done differently in future similar projects?"
                color="border-teal-100 bg-teal-50/50 dark:bg-teal-950/10 dark:border-teal-900"
              >
                <BulletListEditor
                  items={form.lessonsLearnt}
                  onChange={(v) => set("lessonsLearnt", v)}
                  placeholder="e.g. County-funded projects need stronger safeguards against IPC payment delays, such as milestone-linked advance funding…"
                  accent="bg-teal-500"
                />
              </CaptureSection>

              <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border px-4 py-3 text-xs text-zinc-500 leading-relaxed">
                <strong className="text-zinc-600 dark:text-zinc-300">
                  Automatically derived from the tracker:
                </strong>{" "}
                project scope &amp; progress, key findings, challenges/risks,
                recommendations, ongoing works, and pending works.
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between gap-3 shrink-0 bg-zinc-50 dark:bg-zinc-900/50">
          <p className="text-xs text-zinc-400">
            Click Save to generate the monitoring status report draft.
          </p>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />{" "}
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save &amp; Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
