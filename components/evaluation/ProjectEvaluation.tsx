"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  BarChart3,
  QrCode,
  Link2,
  FileText,
  Users,
  Plus,
  Edit3,
  Trash2,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  Share2,
  Copy,
  Download,
  Eye,
  Settings,
  Sparkles,
  Send,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Globe,
  Mail,
  MessageSquare,
  LayoutGrid,
  List,
  TrendingUp,
  Award,
  Layers,
  Zap,
  Shield,
  Leaf,
  Target,
  Star,
  X,
  Check,
  GripVertical,
  ChevronUp,
  Info,
  PieChart,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionType =
  | "likert5"
  | "likert5b"
  | "yesno"
  | "multiple"
  | "text"
  | "rating5"
  | "scale10";

export type EvalCategory =
  | "Relevance"
  | "Coherence"
  | "Effectiveness"
  | "Efficiency"
  | "Impact"
  | "Sustainability"
  | "Background";

export interface QuestionOption {
  id: string;
  label: string;
  value: number;
}

export interface EvalQuestion {
  id: string;
  category: EvalCategory;
  text: string;
  type: QuestionType;
  options?: QuestionOption[];
  required: boolean;
  followUp?: string;
  aiGenerated?: boolean;
  order: number;
}

export interface EvalRespondentGroup {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export interface EvalDistributionChannel {
  id: string;
  type: "link" | "qr" | "email" | "sms" | "whatsapp" | "embed";
  label: string;
  value: string;
  active: boolean;
  responses: number;
}

export interface QuestionResponse {
  questionId: string;
  value: number | string | string[];
  textValue?: string;
}

export interface EvalSubmission {
  id: string;
  respondentGroup: string;
  submittedAt: string;
  responses: QuestionResponse[];
  channel: string;
}

export interface EvalConfig {
  id: string;
  projectId: string;
  projectName: string;
  projectSector: string;
  title: string;
  description: string;
  status: "draft" | "active" | "closed";
  questions: EvalQuestion[];
  respondentGroups: EvalRespondentGroup[];
  channels: EvalDistributionChannel[];
  submissions: EvalSubmission[];
  createdAt: string;
  closesAt?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  EvalCategory,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    description: string;
  }
> = {
  Background: {
    label: "Background",
    color: "text-zinc-700",
    bg: "bg-zinc-50",
    border: "border-zinc-200",
    icon: <Info className="w-4 h-4" />,
    description: "Respondent & project context",
  },
  Relevance: {
    label: "Relevance",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Target className="w-4 h-4" />,
    description: "Doing the right thing",
  },
  Coherence: {
    label: "Coherence",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    icon: <Layers className="w-4 h-4" />,
    description: "Fit with other interventions",
  },
  Effectiveness: {
    label: "Effectiveness",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: "Achievement of objectives",
  },
  Efficiency: {
    label: "Efficiency",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: <Zap className="w-4 h-4" />,
    description: "Use of resources",
  },
  Impact: {
    label: "Impact",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: <TrendingUp className="w-4 h-4" />,
    description: "Difference made",
  },
  Sustainability: {
    label: "Sustainability",
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    icon: <Leaf className="w-4 h-4" />,
    description: "Will the benefits last?",
  },
};

const LIKERT5_OPTIONS: QuestionOption[] = [
  { id: "5", label: "Strongly Agree / Very High", value: 4 },
  { id: "4", label: "Agree / High", value: 3 },
  { id: "3", label: "Neutral / Moderate", value: 2 },
  { id: "2", label: "Disagree / Low", value: 1 },
  { id: "1", label: "Strongly Disagree / Very Low", value: 0 },
];

const LIKERT5B_OPTIONS: QuestionOption[] = [
  { id: "5", label: "Very great extent", value: 4 },
  { id: "4", label: "Great extent", value: 3 },
  { id: "3", label: "Moderate extent", value: 2 },
  { id: "2", label: "Low extent", value: 1 },
  { id: "1", label: "No extent", value: 0 },
];

const RESPONDENT_GROUPS: EvalRespondentGroup[] = [
  {
    id: "community",
    label: "Community Members",
    description: "Local residents and beneficiaries",
    icon: "👥",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "officials",
    label: "County Officials",
    description: "Government staff and decision makers",
    icon: "🏛️",
    color: "bg-violet-100 text-violet-700",
  },
  {
    id: "beneficiaries",
    label: "Direct Beneficiaries",
    description: "Primary recipients of the project",
    icon: "🌟",
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "partners",
    label: "Implementing Partners",
    description: "NGOs, contractors and suppliers",
    icon: "🤝",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    id: "staff",
    label: "Project Staff",
    description: "Field and management team",
    icon: "👔",
    color: "bg-teal-100 text-teal-700",
  },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

async function generateQuestionsFromAPI(
  projectId: string,
): Promise<{
  questions: EvalQuestion[];
  ragContextUsed: boolean;
  model: string;
}> {
  const res = await fetch(`/api/projects/${projectId}/evaluation/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Generation failed (${res.status})`);
  }
  const data = await res.json();
  return {
    questions: data.questions as EvalQuestion[],
    ragContextUsed: data.meta?.ragContextUsed ?? false,
    model: data.meta?.model ?? "unknown",
  };
}

async function saveEvaluationToAPI(
  projectId: string,
  config: EvalConfig,
): Promise<EvalConfig> {
  // Use POST for first save (no id yet / id is temp), PUT for updates
  const isNew = !config.id || config.id.startsWith("eval_");
  const res = await fetch(`/api/projects/${projectId}/evaluation`, {
    method: isNew ? "POST" : "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to save evaluation");
  }
  return res.json();
}

async function updateStatusOnAPI(
  projectId: string,
  status: "draft" | "active" | "closed",
): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/evaluation`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statusOnly: true, status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update status");
  }
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function calcCategoryScore(
  category: EvalCategory,
  questions: EvalQuestion[],
  submissions: EvalSubmission[],
): number {
  if (submissions.length === 0) return 0;
  const catQs = questions.filter(
    (q) =>
      q.category === category &&
      (q.type === "likert5" || q.type === "likert5b" || q.type === "rating5"),
  );
  if (catQs.length === 0) return 0;
  let total = 0,
    count = 0;
  for (const sub of submissions) {
    for (const q of catQs) {
      const resp = sub.responses.find((r) => r.questionId === q.id);
      if (resp && typeof resp.value === "number") {
        total += (resp.value / 4) * 100;
        count++;
      }
    }
  }
  return count === 0 ? 0 : total / count;
}

// ─── Question Card (editable) ─────────────────────────────────────────────────

function QuestionCard({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: EvalQuestion;
  index: number;
  onUpdate: (q: EvalQuestion) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const meta = CATEGORY_META[question.category];

  return (
    <div
      className={cn(
        "group border rounded-xl overflow-hidden transition-all",
        meta.border,
        editing ? "shadow-md" : "hover:shadow-sm",
      )}
    >
      <div className={cn("flex items-start gap-3 p-3", meta.bg)}>
        <GripVertical className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0 cursor-grab" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                meta.color,
              )}
            >
              {meta.icon} {meta.label}
            </span>
            <Badge variant="outline" className="text-xs h-5">
              {question.type}
            </Badge>
            {question.aiGenerated && (
              <Badge
                variant="outline"
                className="text-xs h-5 border-amber-300 text-amber-600 bg-amber-50"
              >
                <Sparkles className="w-2.5 h-2.5 mr-1" /> AI
              </Badge>
            )}
            {!question.required && (
              <Badge variant="outline" className="text-xs h-5 text-zinc-400">
                Optional
              </Badge>
            )}
          </div>
          {editing ? (
            <Textarea
              value={question.text}
              onChange={(e) => onUpdate({ ...question, text: e.target.value })}
              className="text-sm min-h-[60px] resize-none mt-1"
              autoFocus
            />
          ) : (
            <p className="text-sm font-medium text-zinc-800">{question.text}</p>
          )}
          {question.followUp && !editing && (
            <p className="text-xs text-zinc-400 mt-0.5 italic">
              {question.followUp}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
            onClick={() => setEditing(!editing)}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {editing && (
        <div className="border-t p-3 space-y-3 bg-white dark:bg-zinc-900">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Category</Label>
              <Select
                value={question.category}
                onValueChange={(v) =>
                  onUpdate({ ...question, category: v as EvalCategory })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CATEGORY_META).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Question Type</Label>
              <Select
                value={question.type}
                onValueChange={(v) =>
                  onUpdate({ ...question, type: v as QuestionType })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="likert5">Likert (Agree scale)</SelectItem>
                  <SelectItem value="likert5b">
                    Likert (Extent scale)
                  </SelectItem>
                  <SelectItem value="yesno">Yes / No</SelectItem>
                  <SelectItem value="multiple">Multiple Choice</SelectItem>
                  <SelectItem value="text">Open Text</SelectItem>
                  <SelectItem value="rating5">Star Rating (1–5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">
              Follow-up prompt (optional)
            </Label>
            <Input
              value={question.followUp ?? ""}
              onChange={(e) =>
                onUpdate({ ...question, followUp: e.target.value || undefined })
              }
              placeholder="e.g. Kindly explain your answer..."
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={question.required}
                onCheckedChange={(v) => onUpdate({ ...question, required: v })}
                id={`req-${question.id}`}
              />
              <Label
                htmlFor={`req-${question.id}`}
                className="text-xs cursor-pointer"
              >
                Required
              </Label>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs ml-auto"
              onClick={() => setEditing(false)}
            >
              <Check className="w-3 h-3 mr-1" /> Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Distribution Channel Card ────────────────────────────────────────────────

function ChannelCard({
  channel,
  projectId,
}: {
  channel: EvalDistributionChannel;
  projectId: string;
}) {
  const [copied, setCopied] = useState(false);
  const icons: Record<string, React.ReactNode> = {
    link: <Link2 className="w-4 h-4" />,
    qr: <QrCode className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    sms: <MessageSquare className="w-4 h-4" />,
    whatsapp: <MessageSquare className="w-4 h-4" />,
    embed: <Globe className="w-4 h-4" />,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(channel.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div
      className={cn(
        "border rounded-xl p-4 space-y-3 transition-all",
        channel.active
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-zinc-200 bg-zinc-50/50 opacity-60",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center text-zinc-600">
            {icons[channel.type]}
          </div>
          <div>
            <p className="text-sm font-semibold">{channel.label}</p>
            <p className="text-xs text-zinc-500">
              {channel.responses} responses
            </p>
          </div>
        </div>
        {channel.active && (
          <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
            Active
          </span>
        )}
      </div>
      {channel.type === "qr" ? (
        <div className="flex items-center justify-center bg-white rounded-lg p-4 border">
          <div className="w-24 h-24 bg-zinc-100 rounded flex items-center justify-center text-zinc-400">
            <QrCode className="w-12 h-12" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            value={channel.value}
            readOnly
            className="text-xs h-8 bg-white font-mono"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0"
            onClick={copyToClipboard}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Analysis Dashboard ───────────────────────────────────────────────────────

function EvalDashboard({ config }: { config: EvalConfig }) {
  const categories: EvalCategory[] = [
    "Relevance",
    "Coherence",
    "Effectiveness",
    "Efficiency",
    "Impact",
    "Sustainability",
  ];
  const scores = useMemo(
    () =>
      Object.fromEntries(
        categories.map((cat) => [
          cat,
          calcCategoryScore(cat, config.questions, config.submissions),
        ]),
      ),
    [config.questions, config.submissions],
  );
  const overallScore = useMemo(() => {
    const vals = Object.values(scores).filter((v) => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [scores]);
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    config.submissions.forEach((s) => {
      counts[s.respondentGroup] = (counts[s.respondentGroup] ?? 0) + 1;
    });
    return counts;
  }, [config.submissions]);

  if (config.submissions.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <BarChart3 className="w-12 h-12 text-zinc-300 mx-auto" />
        <p className="font-semibold text-zinc-500">No responses yet</p>
        <p className="text-sm text-zinc-400">
          Share the evaluation link to start collecting responses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-zinc-900 bg-zinc-900 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-70">
              Overall Evaluation Score
            </p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-5xl font-black tabular-nums">
                {overallScore.toFixed(1)}
              </span>
              <span className="text-2xl opacity-60 mb-1">/ 100</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-70">Total Responses</p>
            <p className="text-3xl font-black">{config.submissions.length}</p>
          </div>
        </div>
        <Progress value={overallScore} className="mt-4 h-2 bg-white/20" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const score = scores[cat];
          const meta = CATEGORY_META[cat];
          return (
            <div
              key={cat}
              className={cn(
                "rounded-xl border p-4 space-y-2",
                meta.border,
                meta.bg,
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold",
                  meta.color,
                )}
              >
                {meta.icon} {meta.label}
              </div>
              <div
                className={cn("text-3xl font-black tabular-nums", meta.color)}
              >
                {score.toFixed(0)}
                <span className="text-base font-normal opacity-60">%</span>
              </div>
              <Progress value={score} className="h-1.5" />
              <p className="text-xs text-zinc-500">{meta.description}</p>
            </div>
          );
        })}
      </div>
      <div className="border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" /> Responses by Respondent
          Group
        </h3>
        <div className="space-y-2">
          {RESPONDENT_GROUPS.map((group) => {
            const count = groupCounts[group.id] ?? 0;
            const pct =
              config.submissions.length > 0
                ? (count / config.submissions.length) * 100
                : 0;
            return (
              <div key={group.id} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{group.icon}</span>
                <span className="text-xs text-zinc-600 w-36 truncate">
                  {group.label}
                </span>
                <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-700 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Survey Preview (read-only, no submission) ────────────────────────────────

function SurveyPreview({ config }: { config: EvalConfig }) {
  const [page, setPage] = useState(0);
  const grouped = useMemo(() => {
    const groups: Record<string, EvalQuestion[]> = {};
    config.questions.forEach((q) => {
      if (!groups[q.category]) groups[q.category] = [];
      groups[q.category].push(q);
    });
    return Object.entries(groups);
  }, [config.questions]);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const currentGroup = grouped[page];
  if (!currentGroup) return null;
  const [catName, catQs] = currentGroup;
  const meta = CATEGORY_META[catName as EvalCategory];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <p className="text-xs text-zinc-500 shrink-0">
          Section {page + 1} of {grouped.length}
        </p>
        <Progress
          value={((page + 1) / grouped.length) * 100}
          className="flex-1 h-1.5"
        />
      </div>
      <div className={cn("rounded-xl p-4 border", meta.border, meta.bg)}>
        <div
          className={cn(
            "flex items-center gap-2 font-bold text-lg",
            meta.color,
          )}
        >
          {meta.icon} {meta.label}
        </div>
        <p className="text-sm text-zinc-500 mt-1">{meta.description}</p>
      </div>
      <div className="space-y-4">
        {catQs.map((q, qi) => (
          <div key={q.id} className="border rounded-xl p-4 bg-white space-y-3">
            <p className="text-sm font-medium">
              <span className="text-zinc-400 mr-2">{qi + 1}.</span>
              {q.text}
              {q.required && <span className="text-red-500 ml-1">*</span>}
            </p>
            {(q.type === "likert5" || q.type === "likert5b") && (
              <div className="space-y-1.5">
                {(q.options ?? LIKERT5_OPTIONS).map((opt) => (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all hover:bg-zinc-50",
                      answers[q.id] === opt.value
                        ? "border-zinc-900 bg-zinc-50"
                        : "border-zinc-200",
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                        answers[q.id] === opt.value
                          ? "border-zinc-900"
                          : "border-zinc-300",
                      )}
                    >
                      {answers[q.id] === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-zinc-900" />
                      )}
                    </div>
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === "yesno" && (
              <div className="flex gap-3">
                {["Yes", "No"].map((v) => (
                  <button
                    key={v}
                    onClick={() =>
                      setAnswers((p) => ({ ...p, [q.id]: v === "Yes" ? 1 : 0 }))
                    }
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                      answers[q.id] === (v === "Yes" ? 1 : 0)
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "border-zinc-200 hover:bg-zinc-50",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
            {q.type === "text" && (
              <Textarea
                placeholder="Type your response..."
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) =>
                  setAnswers((p) => ({ ...p, [q.id]: e.target.value }))
                }
                rows={3}
                className="text-sm resize-none"
              />
            )}
            {q.type === "rating5" && (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setAnswers((p) => ({ ...p, [q.id]: star }))}
                    className={cn(
                      "w-10 h-10 rounded-lg border text-sm font-bold transition-all",
                      (answers[q.id] as number) >= star
                        ? "bg-amber-400 border-amber-400 text-white"
                        : "border-zinc-200 text-zinc-400 hover:border-amber-300",
                    )}
                  >
                    {star}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Back
        </Button>
        {page < grouped.length - 1 ? (
          <Button onClick={() => setPage((p) => p + 1)}>
            Next Section <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => toast.info("Preview mode — responses not saved")}
          >
            <Send className="w-4 h-4 mr-1" /> Submit
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  projectName: string;
  projectSector: string;
  isComplete: boolean;
  userRole: "me" | "sector" | "viewer";
  initialConfig?: EvalConfig | null;
}

export default function ProjectEvaluation({
  projectId,
  projectName,
  projectSector,
  isComplete,
  userRole,
  initialConfig,
}: Props) {
  const canManage = userRole === "me";

  const [config, setConfig] = useState<EvalConfig | null>(
    initialConfig ?? null,
  );
  const [activeTab, setActiveTab] = useState("questions");
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  // Track whether the current config has unsaved changes
  const [dirty, setDirty] = useState(false);

  // ── Generate + auto-save to DB ────────────────────────────────────────────

  const handleCreate = async () => {
    setGenerating(true);
    setGeneratingStep("Generating questions with Llama 3.3...");
    try {
      const { questions, ragContextUsed, model } =
        await generateQuestionsFromAPI(projectId);
      setGeneratingStep("Saving evaluation to database...");

      if (ragContextUsed)
        toast.info(`Questions enriched with knowledge base (${model})`);

      const baseUrl = `${window.location.origin}/eval/${projectId}`;
      const draft: EvalConfig = {
        id: `eval_${Date.now()}`, // temp — replaced by server after save
        projectId,
        projectName,
        projectSector,
        title: `${projectName} — Impact Evaluation`,
        description: `Evaluation questionnaire for ${projectName} covering all OECD DAC criteria.`,
        status: "draft",
        questions,
        respondentGroups: RESPONDENT_GROUPS,
        channels: [
          {
            id: "ch_link",
            type: "link",
            label: "Direct Link",
            value: `${baseUrl}?ref=link`,
            active: true,
            responses: 0,
          },
          {
            id: "ch_qr",
            type: "qr",
            label: "QR Code",
            value: `${baseUrl}?ref=qr`,
            active: true,
            responses: 0,
          },
          {
            id: "ch_email",
            type: "email",
            label: "Email Campaign",
            value: `${baseUrl}?ref=email`,
            active: false,
            responses: 0,
          },
          {
            id: "ch_wa",
            type: "whatsapp",
            label: "WhatsApp",
            value: `https://wa.me/?text=${encodeURIComponent(`Please complete this evaluation: ${baseUrl}?ref=wa`)}`,
            active: false,
            responses: 0,
          },
          {
            id: "ch_embed",
            type: "embed",
            label: "Embed on Website",
            value: `<iframe src="${baseUrl}?ref=embed" width="100%" height="700" frameborder="0"></iframe>`,
            active: false,
            responses: 0,
          },
        ],
        submissions: [],
        createdAt: new Date().toISOString(),
      };

      // Persist to DB immediately
      const saved = await saveEvaluationToAPI(projectId, draft);
      setConfig({ ...saved, submissions: [] });
      setDirty(false);
      toast.success(
        `Generated ${questions.length} questions and saved as draft`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate evaluation",
      );
    } finally {
      setGenerating(false);
      setGeneratingStep(null);
    }
  };

  // ── Save current question edits ───────────────────────────────────────────

  const handleSaveQuestions = async () => {
    if (!config || !dirty) return;
    setSaving(true);
    try {
      const saved = await saveEvaluationToAPI(projectId, config);
      setConfig((prev) =>
        prev ? { ...saved, submissions: prev.submissions } : prev,
      );
      setDirty(false);
      toast.success("Questions saved");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save questions",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Publish: save questions first, then flip status to active ─────────────

  const handlePublish = async () => {
    if (!config) return;
    setSaving(true);
    try {
      // 1. Save latest question edits if any
      if (dirty) {
        const saved = await saveEvaluationToAPI(projectId, config);
        setConfig((prev) =>
          prev ? { ...saved, submissions: prev.submissions } : prev,
        );
        setDirty(false);
      }
      // 2. Flip status → active
      await updateStatusOnAPI(projectId, "active");
      setConfig((prev) => (prev ? { ...prev, status: "active" } : prev));
      setPublishDialogOpen(false);
      toast.success(
        "Evaluation published — respondents can now access the survey",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  // ── Close evaluation ──────────────────────────────────────────────────────

  const handleClose = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await updateStatusOnAPI(projectId, "closed");
      setConfig((prev) => (prev ? { ...prev, status: "closed" } : prev));
      toast.success("Evaluation closed");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to close evaluation",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Question mutations (mark dirty so Save Questions button appears) ──────

  const updateQuestion = useCallback((id: string, updated: EvalQuestion) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            questions: prev.questions.map((q) => (q.id === id ? updated : q)),
          }
        : prev,
    );
    setDirty(true);
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setConfig((prev) =>
      prev
        ? { ...prev, questions: prev.questions.filter((q) => q.id !== id) }
        : prev,
    );
    setDirty(true);
  }, []);

  const addQuestion = useCallback((category: EvalCategory) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const newQ: EvalQuestion = {
        id: `q_custom_${Date.now()}`,
        category,
        text: "New question...",
        type: "likert5",
        options: LIKERT5_OPTIONS,
        required: true,
        order: prev.questions.length + 1,
        aiGenerated: false,
      };
      return { ...prev, questions: [...prev.questions, newQ] };
    });
    setDirty(true);
    toast.success("Question added — save when ready");
  }, []);

  // ── Grouped questions ─────────────────────────────────────────────────────

  const groupedQuestions = useMemo(() => {
    if (!config) return {} as Record<EvalCategory, EvalQuestion[]>;
    const groups: Record<EvalCategory, EvalQuestion[]> = {} as any;
    config.questions.forEach((q) => {
      if (!groups[q.category]) groups[q.category] = [];
      groups[q.category].push(q);
    });
    return groups;
  }, [config?.questions]);

  // ── Not complete yet guard ────────────────────────────────────────────────

  if (!isComplete && !initialConfig) {
    return (
      <div className="border-2 border-dashed rounded-2xl p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
          <Award className="w-7 h-7 text-zinc-400" />
        </div>
        <h2 className="text-xl font-bold">Evaluation not yet available</h2>
        <p className="text-zinc-500 mt-1 max-w-md mx-auto text-sm">
          The evaluation phase begins once all project trackers reach 100%
          completion.
        </p>
        <Badge
          variant="outline"
          className="text-amber-600 border-amber-300 bg-amber-50"
        >
          <Clock className="w-3 h-3 mr-1" /> Tracking in progress
        </Badge>
      </div>
    );
  }

  // ── No evaluation created yet ─────────────────────────────────────────────

  if (!config) {
    return (
      <div className="space-y-6">
        <div className="border-2 border-dashed rounded-2xl p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-zinc-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Generate Impact Evaluation</h2>
            <p className="text-zinc-500 mt-2 max-w-lg mx-auto text-sm">
              AI will generate a tailored questionnaire for{" "}
              <strong>{projectName}</strong> covering all 6 OECD DAC criteria.
            </p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-w-lg mx-auto">
            {(Object.entries(CATEGORY_META) as [EvalCategory, any][])
              .filter(([k]) => k !== "Background")
              .map(([key, meta]) => (
                <div
                  key={key}
                  className={cn(
                    "rounded-lg border p-2 text-center",
                    meta.border,
                    meta.bg,
                  )}
                >
                  <div className={cn("flex justify-center mb-1", meta.color)}>
                    {meta.icon}
                  </div>
                  <p className={cn("text-xs font-semibold", meta.color)}>
                    {meta.label}
                  </p>
                </div>
              ))}
          </div>
          {canManage && (
            <div className="space-y-3">
              <Button
                onClick={handleCreate}
                disabled={generating}
                size="lg"
                className="gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Evaluation
                  </>
                )}
              </Button>
              {generating && generatingStep && (
                <div className="flex items-center gap-2 text-sm text-zinc-500 animate-pulse justify-center">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>{generatingStep}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: <Sparkles className="w-5 h-5" />,
              title: "AI-Generated Questions",
              desc: "Generated from OECD DAC criteria, tailored to your project sector. Edit any question before publishing.",
              color: "text-amber-600 bg-amber-50 border-amber-200",
            },
            {
              icon: <Share2 className="w-5 h-5" />,
              title: "Multi-Channel Distribution",
              desc: "Share via direct link, QR code, WhatsApp, email, or website embed.",
              color: "text-blue-600 bg-blue-50 border-blue-200",
            },
            {
              icon: <BarChart3 className="w-5 h-5" />,
              title: "Automated Analysis",
              desc: "Responses scored per OECD criterion with exportable reports.",
              color: "text-emerald-600 bg-emerald-50 border-emerald-200",
            },
          ].map((item, i) => (
            <div key={i} className={cn("rounded-xl border p-4", item.color)}>
              <div className="mb-2">{item.icon}</div>
              <p className="font-semibold text-sm mb-1">{item.title}</p>
              <p className="text-xs opacity-80">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Main evaluation UI ────────────────────────────────────────────────────

  const categories = Object.keys(CATEGORY_META) as EvalCategory[];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{config.title}</h1>
            <Badge
              className={cn(
                "text-xs",
                config.status === "active"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : config.status === "closed"
                    ? "bg-zinc-100 text-zinc-600"
                    : "bg-amber-100 text-amber-700 border-amber-200",
              )}
              variant="outline"
            >
              {config.status === "active" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block" />
              )}
              {config.status.charAt(0).toUpperCase() + config.status.slice(1)}
            </Badge>
            {dirty && (
              <Badge
                variant="outline"
                className="text-xs text-orange-600 border-orange-300 bg-orange-50"
              >
                Unsaved changes
              </Badge>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-0.5">
            {config.questions.length} questions · {config.submissions.length}{" "}
            responses · {config.channels.filter((c) => c.active).length} active
            channels
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Save questions button — only visible when there are unsaved edits */}
          {canManage && dirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveQuestions}
              disabled={saving}
            >
              {saving ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 mr-1.5" />
              )}
              Save Questions
            </Button>
          )}
          {canManage && config.status === "draft" && (
            <Button
              onClick={() => setPublishDialogOpen(true)}
              disabled={saving}
              className="gap-1.5"
            >
              <Send className="w-4 h-4" /> Publish Evaluation
            </Button>
          )}
          {config.status === "active" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Report export coming soon")}
              >
                <Download className="w-4 h-4 mr-1.5" /> Export Report
              </Button>
              {canManage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={saving}
                >
                  Close Survey
                </Button>
              )}
            </>
          )}
          {config.status === "active" && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/eval/${projectId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Open Survey
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Status banners */}
      {config.status === "draft" && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              Draft — not yet visible to respondents
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              Review and edit questions below, then click{" "}
              <strong>Publish Evaluation</strong> to go live.
            </p>
          </div>
        </div>
      )}
      {config.status === "active" && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Live — accepting responses</p>
            <p className="text-emerald-700 text-xs mt-0.5">
              Survey link:{" "}
              <a
                href={`/eval/${projectId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-mono"
              >
                {typeof window !== "undefined" ? window.location.origin : ""}
                /eval/{projectId}
              </a>
            </p>
          </div>
        </div>
      )}
      {config.status === "closed" && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-600">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            This evaluation is closed. No new responses are being accepted. View
            collected data in the Analysis tab.
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="questions" className="text-xs">
            <List className="w-3.5 h-3.5 mr-1.5" /> Questions (
            {config.questions.length})
          </TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs">
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> Distribution
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs">
            <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs">
            <BarChart2 className="w-3.5 h-3.5 mr-1.5" /> Analysis
            {config.submissions.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-xs h-4 px-1">
                {config.submissions.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Questions tab */}
        <TabsContent value="questions" className="space-y-4">
          {canManage && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-sm text-zinc-500">
                Edit questions freely. Changes are saved when you click{" "}
                <strong>Save Questions</strong> or <strong>Publish</strong>.
              </p>
              <div className="flex items-center gap-2">
                {generating && generatingStep && (
                  <span className="text-xs text-zinc-400 animate-pulse flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {generatingStep}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreate}
                  disabled={generating}
                >
                  <RefreshCw
                    className={cn(
                      "w-3.5 h-3.5 mr-1.5",
                      generating && "animate-spin",
                    )}
                  />
                  {generating ? "Regenerating..." : "Regenerate"}
                </Button>
              </div>
            </div>
          )}
          <Accordion
            type="multiple"
            defaultValue={categories.filter(
              (c) => groupedQuestions[c]?.length > 0,
            )}
            className="space-y-3"
          >
            {categories.map((cat) => {
              const qs = groupedQuestions[cat] ?? [];
              if (qs.length === 0) return null;
              const meta = CATEGORY_META[cat];
              return (
                <AccordionItem
                  key={cat}
                  value={cat}
                  className={cn(
                    "border rounded-xl overflow-hidden",
                    meta.border,
                  )}
                >
                  <AccordionTrigger
                    className={cn("px-4 hover:no-underline", meta.bg)}
                  >
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-2">
                        <span className={meta.color}>{meta.icon}</span>
                        <span className={cn("font-bold text-sm", meta.color)}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {meta.description}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", meta.color, meta.border)}
                      >
                        {qs.length} q's
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="p-3 space-y-2 bg-white dark:bg-zinc-950">
                      {qs.map((q, qi) => (
                        <QuestionCard
                          key={q.id}
                          question={q}
                          index={qi}
                          onUpdate={(updated) => updateQuestion(q.id, updated)}
                          onDelete={() => deleteQuestion(q.id)}
                        />
                      ))}
                      {canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-dashed text-xs h-8 mt-1"
                          onClick={() => addQuestion(cat)}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add question to{" "}
                          {meta.label}
                        </Button>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </TabsContent>

        {/* Distribution tab */}
        <TabsContent value="distribution" className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.channels.map((ch) => (
              <ChannelCard key={ch.id} channel={ch} projectId={projectId} />
            ))}
          </div>
          <div className="border rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" /> Target Respondent
              Groups
            </h3>
            <div className="space-y-2">
              {RESPONDENT_GROUPS.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-zinc-100 bg-zinc-50"
                >
                  <span className="text-xl">{group.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{group.label}</p>
                    <p className="text-xs text-zinc-500">{group.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const url = `${window.location.origin}/eval/${projectId}?group=${group.id}`;
                      navigator.clipboard
                        .writeText(url)
                        .then(() => toast.success("Group link copied"));
                    }}
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy Link
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Preview tab */}
        <TabsContent value="preview" className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-800">
            <Eye className="w-4 h-4 shrink-0" />
            <p>
              Preview only — answers are not saved here. Publish the evaluation
              for respondents to submit real responses.
            </p>
          </div>
          <SurveyPreview config={config} />
        </TabsContent>

        {/* Analysis tab */}
        <TabsContent value="analysis" className="space-y-4">
          <EvalDashboard config={config} />
        </TabsContent>
      </Tabs>

      {/* Publish dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-500" /> Publish Evaluation
            </DialogTitle>
            <DialogDescription>
              The survey will go live immediately. Respondents with the link can
              start submitting responses.
              {dirty &&
                " Your latest question edits will be saved automatically."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-lg border p-3 bg-zinc-50 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Questions</span>
                <span className="font-medium">{config.questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Active channels</span>
                <span className="font-medium">
                  {config.channels.filter((c) => c.active).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Survey URL</span>
                <span className="font-mono text-xs text-zinc-600 truncate max-w-[180px]">
                  /eval/{projectId}
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-400">
              Tip: Copy group-specific links from the Distribution tab to track
              responses by respondent type.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />{" "}
                  Publishing...
                </>
              ) : (
                "Publish Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
