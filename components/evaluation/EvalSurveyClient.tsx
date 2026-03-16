"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType =
  | "likert5"
  | "likert5b"
  | "yesno"
  | "multiple"
  | "text"
  | "rating5";
type EvalCategory =
  | "Background"
  | "Relevance"
  | "Coherence"
  | "Effectiveness"
  | "Efficiency"
  | "Impact"
  | "Sustainability";

interface QuestionOption {
  id: string;
  label: string;
  value: number;
}
interface EvalQuestion {
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
interface EvalConfig {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description?: string;
  status: "draft" | "active" | "closed";
  questions: EvalQuestion[];
}
interface QuestionResponse {
  questionId: string;
  value: number | string;
  textValue?: string;
}

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  EvalCategory,
  { label: string; color: string; accent: string; number: number }
> = {
  Background: {
    label: "Background",
    color: "#4b5563",
    accent: "#e5e7eb",
    number: 1,
  },
  Relevance: {
    label: "Relevance",
    color: "#1d4a2e",
    accent: "#d1fae5",
    number: 2,
  },
  Coherence: {
    label: "Coherence",
    color: "#312e81",
    accent: "#e0e7ff",
    number: 3,
  },
  Effectiveness: {
    label: "Effectiveness",
    color: "#064e3b",
    accent: "#d1fae5",
    number: 4,
  },
  Efficiency: {
    label: "Efficiency",
    color: "#78350f",
    accent: "#fef3c7",
    number: 5,
  },
  Impact: { label: "Impact", color: "#7f1d1d", accent: "#fee2e2", number: 6 },
  Sustainability: {
    label: "Sustainability",
    color: "#134e4a",
    accent: "#ccfbf1",
    number: 7,
  },
};

const CATEGORY_ORDER: EvalCategory[] = [
  "Background",
  "Relevance",
  "Coherence",
  "Effectiveness",
  "Efficiency",
  "Impact",
  "Sustainability",
];

// ─── Likert option constants (fallback when DB-stored options are missing) ────

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

const RESPONDENT_GROUPS = [
  { id: "community", label: "Community Member", icon: "👥" },
  { id: "officials", label: "County Official", icon: "🏛️" },
  { id: "beneficiaries", label: "Direct Beneficiary", icon: "🌟" },
  { id: "partners", label: "Implementing Partner", icon: "🤝" },
  { id: "staff", label: "Project Staff", icon: "👔" },
];

// ─── Inline styles (no Tailwind dependency for public page) ──────────────────
// We use inline styles + a <style> tag for this public-facing page so it works
// even if Tailwind purges these classes (they only exist in this file).

const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Sans+3:wght@300;400;500;600&display=swap";

// ─── Progress bar component ───────────────────────────────────────────────────

function SurveyProgress({
  sections,
  current,
  answers,
  questions,
}: {
  sections: EvalCategory[];
  current: number;
  answers: Record<string, number | string>;
  questions: EvalQuestion[];
}) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {sections.map((sec, i) => {
        const qs = questions.filter((q) => q.category === sec);
        const answered = qs.filter((q) => answers[q.id] !== undefined).length;
        const complete = qs.length > 0 && answered === qs.length;
        const active = i === current;
        const past = i < current;
        const meta = CATEGORY_META[sec];

        return (
          <React.Fragment key={sec}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                flex: active ? 2 : 1,
                transition: "flex 0.3s ease",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "4px",
                  borderRadius: "2px",
                  background:
                    complete || past
                      ? meta.color
                      : active
                        ? meta.color + "99"
                        : "#e5e7eb",
                  transition: "background 0.3s ease",
                }}
              />
              {active && (
                <span
                  style={{
                    fontSize: "10px",
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontWeight: 600,
                    color: meta.color,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {meta.label}
                </span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Likert radio row ─────────────────────────────────────────────────────────

function LikertRow({
  options,
  value,
  onChange,
  color,
}: {
  options: QuestionOption[];
  value: number | undefined;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              border: selected ? `2px solid ${color}` : "2px solid #e5e7eb",
              borderRadius: "10px",
              background: selected ? color + "0d" : "#fff",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            <span
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                border: selected ? `5px solid ${color}` : "2px solid #d1d5db",
                flexShrink: 0,
                transition: "all 0.15s ease",
                background: selected ? "#fff" : "transparent",
              }}
            />
            <span
              style={{
                fontSize: "14px",
                color: selected ? color : "#374151",
                fontWeight: selected ? 600 : 400,
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Yes / No toggle ──────────────────────────────────────────────────────────

function YesNo({
  value,
  onChange,
  color,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
      {[
        { label: "Yes", v: 1 },
        { label: "No", v: 0 },
      ].map(({ label, v }) => {
        const selected = value === v;
        return (
          <button
            key={label}
            onClick={() => onChange(v)}
            style={{
              flex: 1,
              padding: "14px",
              border: selected ? `2px solid ${color}` : "2px solid #e5e7eb",
              borderRadius: "10px",
              background: selected ? color : "#fff",
              color: selected ? "#fff" : "#374151",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Source Sans 3', sans-serif",
              transition: "all 0.15s ease",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Multiple choice ──────────────────────────────────────────────────────────

function MultipleChoice({
  options,
  value,
  onChange,
  color,
}: {
  options: QuestionOption[];
  value: number | undefined;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.value)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              border: selected ? `2px solid ${color}` : "2px solid #e5e7eb",
              borderRadius: "10px",
              background: selected ? color + "0d" : "#fff",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            <span
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "4px",
                border: selected ? `2px solid ${color}` : "2px solid #d1d5db",
                background: selected ? color : "transparent",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              {selected && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path
                    d="M1 4L3.5 6.5L9 1"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span
              style={{
                fontSize: "14px",
                color: selected ? color : "#374151",
                fontWeight: selected ? 600 : 400,
              }}
            >
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  color,
}: {
  value: number | undefined;
  onChange: (v: number) => void;
  color: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value ?? 0;

  const labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star - 1)} // 0-indexed to match value scale
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            style={{
              width: "48px",
              height: "48px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              transition: "transform 0.1s ease",
              transform: hovered === star ? "scale(1.2)" : "scale(1)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill={star <= display ? color : "#e5e7eb"}
              style={{
                width: "100%",
                height: "100%",
                transition: "fill 0.15s ease",
              }}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        ))}
      </div>
      {display > 0 && (
        <span
          style={{
            fontSize: "13px",
            color,
            fontWeight: 600,
            fontFamily: "'Source Sans 3', sans-serif",
          }}
        >
          {labels[display - 1]}
        </span>
      )}
    </div>
  );
}

// ─── Single question card ─────────────────────────────────────────────────────

function QuestionCard({
  question,
  value,
  textValue,
  onAnswer,
  onTextAnswer,
  sectionColor,
  index,
}: {
  question: EvalQuestion;
  value: number | string | undefined;
  textValue: string | undefined;
  onAnswer: (v: number | string) => void;
  onTextAnswer: (v: string) => void;
  sectionColor: string;
  index: number;
}) {
  const needsFollowUp =
    question.followUp &&
    (question.type === "yesno" ||
      question.type === "likert5" ||
      question.type === "likert5b");

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        animation: "slideUp 0.3s ease",
      }}
    >
      {/* Question header */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <span
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: sectionColor + "15",
            color: sectionColor,
            fontFamily: "'Source Sans 3', sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "1px",
          }}
        >
          {index + 1}
        </span>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: "15px",
              fontWeight: 500,
              color: "#111827",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {question.text}
            {question.required && (
              <span style={{ color: "#ef4444", marginLeft: "4px" }}>*</span>
            )}
          </p>
        </div>
      </div>

      {/* Answer input */}
      <div style={{ paddingLeft: "40px" }}>
        {(question.type === "likert5" || question.type === "likert5b") && (
          <LikertRow
            options={
              question.options?.length
                ? question.options
                : question.type === "likert5b"
                  ? LIKERT5B_OPTIONS
                  : LIKERT5_OPTIONS
            }
            value={typeof value === "number" ? value : undefined}
            onChange={onAnswer}
            color={sectionColor}
          />
        )}

        {question.type === "yesno" && (
          <YesNo
            value={typeof value === "number" ? value : undefined}
            onChange={onAnswer}
            color={sectionColor}
          />
        )}

        {question.type === "multiple" &&
          (question.options?.length ?? 0) > 0 && (
            <MultipleChoice
              options={question.options!}
              value={typeof value === "number" ? value : undefined}
              onChange={onAnswer}
              color={sectionColor}
            />
          )}

        {question.type === "multiple" && !question.options?.length && (
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Type your response here..."
            rows={2}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: "14px",
              color: "#374151",
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
              lineHeight: 1.6,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = sectionColor;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
            }}
          />
        )}

        {question.type === "rating5" && (
          <StarRating
            value={typeof value === "number" ? value : undefined}
            onChange={onAnswer}
            color={sectionColor}
          />
        )}

        {question.type === "text" && (
          <textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Type your response here..."
            rows={4}
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "2px solid #e5e7eb",
              borderRadius: "10px",
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: "14px",
              color: "#374151",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s ease",
              lineHeight: 1.6,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = sectionColor;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e5e7eb";
            }}
          />
        )}

        {/* Follow-up text */}
        {needsFollowUp && value !== undefined && (
          <div style={{ marginTop: "12px" }}>
            <p
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "13px",
                color: "#6b7280",
                fontStyle: "italic",
                marginBottom: "8px",
              }}
            >
              {question.followUp}
            </p>
            <textarea
              value={textValue ?? ""}
              onChange={(e) => onTextAnswer(e.target.value)}
              placeholder="Please explain..."
              rows={2}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "2px solid #e5e7eb",
                borderRadius: "10px",
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "13px",
                color: "#374151",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
                background: "#f9fafb",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = sectionColor;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e5e7eb";
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Closed / Not found states ────────────────────────────────────────────────

function StatusScreen({
  type,
  title,
  message,
}: {
  type: "closed" | "draft" | "done";
  title: string;
  message: string;
}) {
  const icons: Record<string, string> = {
    closed: "🔒",
    draft: "🚧",
    done: "✅",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f3ee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Source Sans 3', sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "48px 40px",
          maxWidth: "440px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
          {icons[type]}
        </div>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "24px",
            color: "#111827",
            margin: "0 0 12px",
          }}
        >
          {title}
        </h1>
        <p style={{ color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
          {message}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EvalSurveyClient({
  config,
  prefilledGroup,
  channel,
  projectId,
}: {
  config: EvalConfig;
  prefilledGroup: string | null;
  channel: string;
  projectId: string;
}) {
  // Group questions by category, preserving canonical order
  const sections = useMemo<EvalCategory[]>(() => {
    const present = new Set(config.questions.map((q) => q.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [config.questions]);

  const questionsBySection = useMemo(() => {
    const map: Record<EvalCategory, EvalQuestion[]> = {} as any;
    sections.forEach((s) => {
      map[s] = config.questions
        .filter((q) => q.category === s)
        .sort((a, b) => a.order - b.order);
    });
    return map;
  }, [config.questions, sections]);

  // State
  const [step, setStep] = useState<"group" | "survey" | "review" | "done">(
    prefilledGroup ? "survey" : "group",
  );
  const [respondentGroup, setRespondentGroup] = useState(prefilledGroup ?? "");
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topRef = useRef<HTMLDivElement>(null);

  // Scroll to top on section change
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentSection, step]);

  const currentCat = sections[currentSection];
  const currentQs = questionsBySection[currentCat] ?? [];
  const meta = CATEGORY_META[currentCat];

  // Validation: all required questions in current section answered
  const sectionValid = useMemo(() => {
    return currentQs
      .filter((q) => q.required)
      .every((q) => answers[q.id] !== undefined);
  }, [currentQs, answers]);

  // Count total answered
  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = config.questions.length;

  const handleAnswer = useCallback(
    (questionId: string, value: number | string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    [],
  );

  const handleTextAnswer = useCallback((questionId: string, value: string) => {
    setTextAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection((s) => s + 1);
    } else {
      setStep("review");
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection((s) => s - 1);
    } else {
      setStep("group");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const responses = config.questions.map((q) => ({
        questionId: q.id,
        value: answers[q.id] ?? "",
        textValue: textAnswers[q.id] ?? undefined,
      }));

      const res = await fetch(`/api/projects/${projectId}/evaluation/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respondentGroup, channel, responses }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Submission failed");
      }

      setStep("done");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status screens ─────────────────────────────────────────────────────────

  if (config.status === "closed") {
    return (
      <StatusScreen
        type="closed"
        title="Evaluation Closed"
        message="This evaluation is no longer accepting responses. Thank you for your interest."
      />
    );
  }
  if (config.status === "draft") {
    return (
      <StatusScreen
        type="draft"
        title="Not Yet Open"
        message="This evaluation has not been published yet. Please check back later."
      />
    );
  }
  if (step === "done") {
    return (
      <StatusScreen
        type="done"
        title="Thank You!"
        message="Your response has been submitted successfully. Your feedback helps improve this project and future county initiatives."
      />
    );
  }

  // ── Shared outer layout ────────────────────────────────────────────────────

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link href={FONTS_URL} rel="stylesheet" />

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: #f7f3ee; }
        button { cursor: pointer; }
        textarea, input { font-family: inherit; }
      `}</style>

      <div
        ref={topRef}
        style={{
          minHeight: "100vh",
          background: "#f7f3ee",
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(29,74,46,0.04) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(120,53,15,0.04) 0%, transparent 50%)
          `,
        }}
      >
        {/* ── Top header bar ─────────────────────────────────────────────── */}
        <header
          style={{
            background: "#1d4a2e",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 50,
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "11px",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                margin: "0 0 2px",
              }}
            >
              Impact Evaluation
            </p>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "16px",
                color: "#fff",
                margin: 0,
                fontWeight: 700,
              }}
            >
              {config.title}
            </h1>
          </div>
          {step === "survey" && (
            <div
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "13px",
                color: "rgba(255,255,255,0.8)",
                background: "rgba(255,255,255,0.12)",
                padding: "6px 12px",
                borderRadius: "20px",
              }}
            >
              {totalAnswered} / {totalQuestions} answered
            </div>
          )}
        </header>

        {/* ── Step: choose respondent group ──────────────────────────────── */}
        {step === "group" && (
          <div
            style={{
              maxWidth: "560px",
              margin: "0 auto",
              padding: "40px 24px",
              animation: "fadeIn 0.4s ease",
            }}
          >
            {/* Hero */}
            <div style={{ marginBottom: "36px", textAlign: "center" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  background: "#1d4a2e",
                  borderRadius: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: "28px",
                }}
              >
                📋
              </div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "28px",
                  fontWeight: 900,
                  color: "#111827",
                  margin: "0 0 12px",
                  lineHeight: 1.2,
                }}
              >
                {config.title}
              </h2>
              {config.description && (
                <p
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "15px",
                    color: "#6b7280",
                    lineHeight: 1.7,
                    margin: "0 0 8px",
                  }}
                >
                  {config.description}
                </p>
              )}
              <p
                style={{
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: "13px",
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                {config.questions.length} questions · Approx. 10–15 minutes
              </p>
            </div>

            {/* Confidentiality note */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "28px",
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "16px", flexShrink: 0 }}>🔐</span>
              <p
                style={{
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: "13px",
                  color: "#166534",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Your responses are completely confidential and will only be used
                to improve this project. No personal identifying information is
                collected.
              </p>
            </div>

            {/* Group selection */}
            <p
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              I am a…
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginBottom: "28px",
              }}
            >
              {RESPONDENT_GROUPS.map((g) => {
                const selected = respondentGroup === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setRespondentGroup(g.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 18px",
                      border: selected
                        ? "2px solid #1d4a2e"
                        : "2px solid #e5e7eb",
                      borderRadius: "12px",
                      background: selected ? "#1d4a2e0d" : "#fff",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                      boxShadow: selected
                        ? "0 0 0 4px rgba(29,74,46,0.08)"
                        : "none",
                    }}
                  >
                    <span style={{ fontSize: "22px" }}>{g.icon}</span>
                    <span
                      style={{
                        fontFamily: "'Source Sans 3', sans-serif",
                        fontSize: "15px",
                        fontWeight: selected ? 600 : 400,
                        color: selected ? "#1d4a2e" : "#374151",
                      }}
                    >
                      {g.label}
                    </span>
                    {selected && (
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "#1d4a2e",
                          fontSize: "18px",
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep("survey")}
              disabled={!respondentGroup}
              style={{
                width: "100%",
                padding: "16px",
                background: respondentGroup ? "#1d4a2e" : "#d1d5db",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 700,
                fontFamily: "'Source Sans 3', sans-serif",
                cursor: respondentGroup ? "pointer" : "not-allowed",
                transition: "background 0.2s ease",
                letterSpacing: "0.02em",
              }}
            >
              Begin Evaluation →
            </button>
          </div>
        )}

        {/* ── Step: survey sections ──────────────────────────────────────── */}
        {step === "survey" && (
          <div
            style={{
              maxWidth: "680px",
              margin: "0 auto",
              padding: "28px 24px 60px",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {/* Progress */}
            <div style={{ marginBottom: "24px" }}>
              <SurveyProgress
                sections={sections}
                current={currentSection}
                answers={answers}
                questions={config.questions}
              />
            </div>

            {/* Section header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
                padding: "16px 20px",
                background: meta.color + "0d",
                borderRadius: "14px",
                border: `1px solid ${meta.color}22`,
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: meta.color,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {meta.number}
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: meta.color,
                    margin: "0 0 2px",
                  }}
                >
                  {meta.label}
                </p>
                <p
                  style={{
                    fontFamily: "'Source Sans 3', sans-serif",
                    fontSize: "13px",
                    color: meta.color + "bb",
                    margin: 0,
                  }}
                >
                  {currentQs.length} question{currentQs.length !== 1 ? "s" : ""}{" "}
                  · Section {currentSection + 1} of {sections.length}
                </p>
              </div>
            </div>

            {/* Questions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              {currentQs.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  textValue={textAnswers[q.id]}
                  onAnswer={(v) => handleAnswer(q.id, v)}
                  onTextAnswer={(v) => handleTextAnswer(q.id, v)}
                  sectionColor={meta.color}
                  index={i}
                />
              ))}
            </div>

            {/* Validation warning */}
            {!sectionValid && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: "13px",
                  color: "#dc2626",
                }}
              >
                <span>⚠️</span>
                Please answer all required questions before proceeding.
              </div>
            )}

            {/* Navigation */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={handleBack}
                style={{
                  padding: "13px 24px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  background: "#fff",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "'Source Sans 3', sans-serif",
                  transition: "all 0.15s ease",
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!sectionValid}
                style={{
                  flex: 1,
                  padding: "13px 24px",
                  background: sectionValid ? meta.color : "#d1d5db",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "15px",
                  fontWeight: 700,
                  fontFamily: "'Source Sans 3', sans-serif",
                  cursor: sectionValid ? "pointer" : "not-allowed",
                  transition: "background 0.15s ease",
                }}
              >
                {currentSection < sections.length - 1
                  ? `Next: ${CATEGORY_META[sections[currentSection + 1]]?.label} →`
                  : "Review Answers →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: review & submit ──────────────────────────────────────── */}
        {step === "review" && (
          <div
            style={{
              maxWidth: "680px",
              margin: "0 auto",
              padding: "28px 24px 60px",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "26px",
                fontWeight: 900,
                color: "#111827",
                margin: "0 0 6px",
              }}
            >
              Review Your Answers
            </h2>
            <p
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: "14px",
                color: "#6b7280",
                marginBottom: "28px",
              }}
            >
              {totalAnswered} of {totalQuestions} questions answered. Review
              below and submit when ready.
            </p>

            {/* Summary by section */}
            {sections.map((cat) => {
              const qs = questionsBySection[cat];
              const m = CATEGORY_META[cat];
              const answeredCount = qs.filter(
                (q) => answers[q.id] !== undefined,
              ).length;
              return (
                <div
                  key={cat}
                  style={{
                    marginBottom: "16px",
                    border: `1px solid ${m.color}33`,
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: m.color + "0d",
                      borderBottom: `1px solid ${m.color}22`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Source Sans 3', sans-serif",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: m.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {m.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'Source Sans 3', sans-serif",
                        fontSize: "12px",
                        color:
                          answeredCount === qs.length ? "#059669" : "#dc2626",
                        fontWeight: 600,
                      }}
                    >
                      {answeredCount}/{qs.length} answered
                    </span>
                  </div>
                  <div style={{ background: "#fff", padding: "12px 16px" }}>
                    {qs.slice(0, 2).map((q) => {
                      const val = answers[q.id];
                      const optLabel =
                        val !== undefined && q.options
                          ? q.options.find((o) => o.value === val)?.label
                          : undefined;
                      return (
                        <div
                          key={q.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "12px",
                            padding: "6px 0",
                            borderBottom: "1px solid #f3f4f6",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Source Sans 3', sans-serif",
                              fontSize: "12px",
                              color: "#6b7280",
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {q.text}
                          </span>
                          <span
                            style={{
                              fontFamily: "'Source Sans 3', sans-serif",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: val !== undefined ? m.color : "#d1d5db",
                              flexShrink: 0,
                            }}
                          >
                            {val !== undefined
                              ? (optLabel ??
                                (typeof val === "string" && val.length > 20
                                  ? val.slice(0, 20) + "…"
                                  : val))
                              : "—"}
                          </span>
                        </div>
                      );
                    })}
                    {qs.length > 2 && (
                      <p
                        style={{
                          fontFamily: "'Source Sans 3', sans-serif",
                          fontSize: "12px",
                          color: "#9ca3af",
                          margin: "8px 0 0",
                        }}
                      >
                        +{qs.length - 2} more questions
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  fontFamily: "'Source Sans 3', sans-serif",
                  fontSize: "14px",
                  color: "#dc2626",
                }}
              >
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button
                onClick={() => {
                  setStep("survey");
                  setCurrentSection(0);
                }}
                style={{
                  padding: "13px 24px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "10px",
                  background: "#fff",
                  color: "#374151",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                ← Edit Answers
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  background: submitting ? "#d1d5db" : "#1d4a2e",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "16px",
                  fontWeight: 700,
                  fontFamily: "'Source Sans 3', sans-serif",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "background 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {submitting ? (
                  <>
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Submitting…
                  </>
                ) : (
                  "Submit Evaluation ✓"
                )}
              </button>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Footer */}
        <footer
          style={{
            textAlign: "center",
            padding: "24px",
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          County Government M&amp;E System · Responses are confidential
        </footer>
      </div>
    </>
  );
}
