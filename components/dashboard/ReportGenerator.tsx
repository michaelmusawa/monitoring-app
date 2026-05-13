// components/dashboard/ReportGenerator.tsx
"use client";

import { useState, useCallback, useRef } from "react";
import {
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  X,
  Search,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Users,
  Download,
  Sparkles,
  Edit3,
  RefreshCw,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Eye,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportProject {
  id: string;
  name: string;
  sector: string | null;
  location: string | null; // ward / subCounty
  latestTrackerPercent: number | null;
  latestTrackerDate: string | null;
  trackerCount: number;
  stalledCount: number;
  weeklyVariance: number | null; // percent change from prev tracker
  checklistStatus: string | null;
  workforce?: {
    male: number;
    female: number;
    pwd: number;
    total: number;
  } | null;
  bestPractice?: string | null;
  challenge?: string | null;
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  editable: boolean;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function Steps({ current }: { current: number }) {
  const steps = [
    "Select Projects",
    "Generate Draft",
    "Review & Edit",
    "Export",
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              i < current
                ? "bg-emerald-100 text-emerald-700"
                : i === current
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-400"
            }`}
          >
            {i < current ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
            <span className="hidden sm:inline">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-6 h-px mx-0.5 ${i < current ? "bg-emerald-300" : "bg-zinc-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, label }: { value: number; label?: string }) {
  const color =
    value >= 80
      ? "bg-emerald-500"
      : value >= 50
        ? "bg-blue-500"
        : value >= 20
          ? "bg-amber-500"
          : "bg-zinc-300";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-zinc-600 w-9 text-right">
        {value.toFixed(0)}%
      </span>
    </div>
  );
}

// ─── Step 1: Project Selector ─────────────────────────────────────────────────

function ProjectSelector({
  projects,
  selected,
  onToggle,
  onSelectAll,
}: {
  projects: ReportProject[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.sector ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-800">
            Select Projects to Include
          </h3>
          <p className="text-sm text-zinc-500 mt-0.5">
            Choose the projects you want featured in this report. Only actively
            tracking projects are shown.
          </p>
        </div>
        <button
          onClick={onSelectAll}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
        >
          {selected.size === projects.length ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search projects..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      {/* Project list */}
      <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-8">
            No projects found
          </p>
        ) : (
          filtered.map((p) => {
            const sel = selected.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${sel ? "bg-blue-50" : "bg-white hover:bg-zinc-50"}`}
              >
                <div
                  className={`shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                    sel ? "bg-blue-600 border-blue-600" : "border-zinc-300"
                  }`}
                >
                  {sel && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {p.sector ?? "Unknown sector"} · {p.location ?? "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  {p.latestTrackerPercent != null ? (
                    <span
                      className={`text-sm font-bold ${
                        p.latestTrackerPercent >= 80
                          ? "text-emerald-600"
                          : p.latestTrackerPercent >= 50
                            ? "text-blue-600"
                            : "text-amber-600"
                      }`}
                    >
                      {p.latestTrackerPercent.toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">No tracker</span>
                  )}
                  {p.stalledCount > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-red-500 justify-end mt-0.5">
                      <AlertTriangle className="w-3 h-3" />
                      {p.stalledCount} stalled
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
      <p className="text-xs text-zinc-400">
        {selected.size} of {projects.length} project
        {projects.length !== 1 ? "s" : ""} selected
      </p>
    </div>
  );
}

// ─── Step 2: AI Generation ────────────────────────────────────────────────────

function GeneratingView({ progress }: { progress: number }) {
  const stages = [
    "Fetching project data...",
    "Analysing tracker trends...",
    "Identifying key observations...",
    "Drafting executive summary...",
    "Writing site-by-site breakdown...",
    "Noting best practices & challenges...",
    "Finalising report structure...",
  ];
  const stageIdx = Math.min(
    Math.floor(progress / (100 / stages.length)),
    stages.length - 1,
  );
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="relative w-20 h-20">
        <svg className="absolute inset-0 -rotate-90 w-20 h-20">
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="#e4e4e7"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="#2563eb"
            strokeWidth="6"
            strokeDasharray={2 * Math.PI * 34}
            strokeDashoffset={2 * Math.PI * 34 * (1 - progress / 100)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.4s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-blue-600" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-zinc-800">
          Generating Report Draft
        </p>
        <p className="text-sm text-zinc-500 mt-1">{stages[stageIdx]}</p>
      </div>
    </div>
  );
}

// ─── Step 3: Editable sections ────────────────────────────────────────────────

function SectionEditor({
  section,
  onChange,
  onRegenerate,
}: {
  section: ReportSection;
  onChange: (id: string, content: string) => void;
  onRegenerate: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegen = async () => {
    setRegenerating(true);
    await onRegenerate(section.id);
    setRegenerating(false);
  };

  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-700">
            {section.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {section.editable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRegen();
              }}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              {regenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Regenerate
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="p-4">
          <textarea
            value={section.content}
            onChange={(e) => onChange(section.id, e.target.value)}
            rows={section.content.split("\n").length + 2}
            className="w-full text-sm text-zinc-700 leading-relaxed border border-zinc-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-y font-mono bg-white"
          />
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Export preview ───────────────────────────────────────────────────

function ExportView({
  onExport,
  exporting,
}: {
  onExport: () => void;
  exporting: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-200">
        <FileText className="w-10 h-10 text-emerald-600" />
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-zinc-800">Ready to Export</p>
        <p className="text-sm text-zinc-500 mt-1 max-w-sm">
          Your report will be exported as a PowerPoint presentation matching the
          Dishi na County report format, with summary tables, bar charts, and
          per-project pages.
        </p>
      </div>
      <button
        onClick={onExport}
        disabled={exporting}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-60"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {exporting ? "Generating PPTX..." : "Download PPTX Report"}
      </button>
    </div>
  );
}

// ─── AI draft generation ───────────────────────────────────────────────────────

async function generateDraftSections(
  projects: ReportProject[],
  onProgress: (p: number) => void,
): Promise<ReportSection[]> {
  onProgress(10);

  const projectSummary = projects.map((p) => ({
    name: p.name,
    sector: p.sector,
    location: p.location,
    progress: p.latestTrackerPercent,
    variance: p.weeklyVariance,
    stalledCount: p.stalledCount,
    trackerCount: p.trackerCount,
    bestPractice: p.bestPractice,
    challenge: p.challenge,
    workforce: p.workforce,
  }));

  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  onProgress(25);

  const res = await fetch("/api/report/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projects: projectSummary, reportDate }),
  });

  onProgress(70);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Draft generation failed (${res.status})`);
  }

  const parsed = await res.json();

  onProgress(90);

  const sections: ReportSection[] = [
    {
      id: "executive",
      title: "Executive Summary",
      content: parsed.executiveSummary ?? "",
      editable: true,
    },
    {
      id: "observations",
      title: "Overall Observations",
      content: parsed.overallObservations ?? "",
      editable: true,
    },
    {
      id: "progress_table",
      title: "Summary Progress Table",
      content: projects
        .map(
          (p) =>
            `${p.name}: ${p.latestTrackerPercent?.toFixed(2) ?? "N/A"}% (variance: ${p.weeklyVariance != null ? `+${p.weeklyVariance.toFixed(2)}%` : "N/A"})`,
        )
        .join("\n"),
      editable: true,
    },
    {
      id: "best_practices",
      title: "Best Practices Sampled from Sites",
      content: parsed.bestPractices ?? "",
      editable: true,
    },
    {
      id: "challenges",
      title: "Challenges",
      content: parsed.challenges ?? "",
      editable: true,
    },
    {
      id: "recommendations",
      title: "Recommendations & Conclusion",
      content: parsed.recommendationsAndConclusion ?? "",
      editable: true,
    },
  ];

  onProgress(100);
  return sections;
}

// ─── Regenerate single section ────────────────────────────────────────────────

async function regenerateSection(
  sectionId: string,
  projects: ReportProject[],
): Promise<string> {
  // progress_table is data-derived, not AI-generated — no API call needed
  if (sectionId === "progress_table") return "";

  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const projectSummary = projects.map((p) => ({
    name: p.name,
    sector: p.sector,
    location: p.location,
    progress: p.latestTrackerPercent,
    variance: p.weeklyVariance,
    stalledCount: p.stalledCount,
    trackerCount: p.trackerCount,
    bestPractice: p.bestPractice,
    challenge: p.challenge,
    workforce: p.workforce,
  }));

  const res = await fetch("/api/report/draft/section", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sectionId, projects: projectSummary, reportDate }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Regeneration failed (${res.status})`);
  }

  const data = await res.json();
  return data.content ?? "";
}

// ─── PPTX Export ─────────────────────────────────────────────────────────────

async function exportToPptx(
  projects: ReportProject[],
  sections: ReportSection[],
) {
  // Dynamically load pptxgenjs from CDN via script tag (in artifact / browser context)
  // In the actual Next.js app this would use the npm package via a server action or API route.
  // Here we build the data payload and call a /api/report/pptx route.
  const payload = { projects, sections };
  const res = await fetch("/api/report/pptx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "_");
  a.download = `Dishi_na_County_Progress_Report_${dateStr}.pptx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportGenerator({
  projects,
  onClose,
}: {
  projects: ReportProject[];
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [genProgress, setGenProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProjects = projects.filter((p) => selected.has(p.id));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleProject = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selected.size === projects.length) setSelected(new Set());
    else setSelected(new Set(projects.map((p) => p.id)));
  }, [projects, selected.size]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenProgress(0);
    setError(null);
    setStep(1);
    try {
      const result = await generateDraftSections(
        selectedProjects,
        setGenProgress,
      );
      setSections(result);
      setStep(2);
    } catch (e: any) {
      setError("Failed to generate draft: " + (e?.message ?? "Unknown error"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSectionChange = (id: string, content: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content } : s)),
    );
  };

  const handleRegenSection = async (id: string) => {
    const text = await regenerateSection(id, selectedProjects);
    if (text)
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, content: text } : s)),
      );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPptx(selectedProjects, sections);
    } catch (e: any) {
      setError("Export failed: " + (e?.message ?? "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Generate Progress Report
              </h2>
              <p className="text-xs text-zinc-400">
                Dishi na County Initiative ·{" "}
                {new Date().toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Steps current={step} />

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Step 0 — Select projects */}
          {step === 0 && (
            <ProjectSelector
              projects={projects}
              selected={selected}
              onToggle={toggleProject}
              onSelectAll={selectAll}
            />
          )}

          {/* Step 1 — Generating */}
          {step === 1 && <GeneratingView progress={genProgress} />}

          {/* Step 2 — Edit sections */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold text-zinc-800">
                    Review & Edit Report
                  </h3>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    AI-generated content based on {selectedProjects.length}{" "}
                    project{selectedProjects.length !== 1 ? "s" : ""}. Edit any
                    section before exporting.
                  </p>
                </div>
              </div>
              {sections.map((s) => (
                <SectionEditor
                  key={s.id}
                  section={s}
                  onChange={handleSectionChange}
                  onRegenerate={handleRegenSection}
                />
              ))}
            </div>
          )}

          {/* Step 3 — Export */}
          {step === 3 && (
            <ExportView onExport={handleExport} exporting={exporting} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || step === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-2">
            {/* Project count badge */}
            {step === 0 && selected.size > 0 && (
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                {selected.size} selected
              </span>
            )}

            {step === 0 && (
              <button
                onClick={handleGenerate}
                disabled={selected.size === 0}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" /> Generate Draft
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-5 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded-xl text-sm font-semibold transition-colors"
              >
                <Edit3 className="w-4 h-4" /> Back to Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
