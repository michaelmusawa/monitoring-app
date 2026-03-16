// app/api/projects/[projectId]/evaluation/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import { getProject } from "@/lib/actions/projectActions";
import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { v4 as uuid } from "uuid";

export const maxDuration = 60;

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
  aiGenerated: true;
  order: number;
}

// ─── Option templates ─────────────────────────────────────────────────────────

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
const YESNO_OPTIONS: QuestionOption[] = [
  { id: "yes", label: "Yes", value: 1 },
  { id: "no", label: "No", value: 0 },
];

function resolveOptions(type: QuestionType): QuestionOption[] | undefined {
  if (type === "likert5") return LIKERT5_OPTIONS;
  if (type === "likert5b") return LIKERT5B_OPTIONS;
  if (type === "yesno") return YESNO_OPTIONS;
  return undefined;
}

// ─── Valid value sets for normalisation ───────────────────────────────────────

const VALID_CATEGORIES = new Set<EvalCategory>([
  "Background",
  "Relevance",
  "Coherence",
  "Effectiveness",
  "Efficiency",
  "Impact",
  "Sustainability",
]);
const VALID_TYPES = new Set<QuestionType>([
  "likert5",
  "likert5b",
  "yesno",
  "multiple",
  "text",
  "rating5",
]);

// ─── Normalise one raw question from the LLM ─────────────────────────────────
// Handles the model using "section"/"question" instead of "category"/"text",
// and customOptions as string[] instead of {label, value}[].

function normaliseQuestion(raw: any, index: number): EvalQuestion | null {
  try {
    const category: EvalCategory = raw.category ?? raw.section ?? "Background";
    const text: string = raw.text ?? raw.question ?? "";
    const type: QuestionType = raw.type ?? "text";

    if (!text || text.length < 5) return null;
    if (!VALID_CATEGORIES.has(category)) return null;
    if (!VALID_TYPES.has(type)) return null;

    // customOptions may be string[] or {label,value}[]
    let options: QuestionOption[] | undefined;
    if (
      type === "multiple" &&
      Array.isArray(raw.customOptions) &&
      raw.customOptions.length > 0
    ) {
      options = raw.customOptions.map((opt: any, i: number) =>
        typeof opt === "string"
          ? { id: String(i), label: opt, value: i }
          : {
              id: String(i),
              label: opt.label ?? String(opt),
              value: opt.value ?? i,
            },
      );
    } else {
      options = resolveOptions(type);
    }

    return {
      id: `q_ai_${uuid()}`,
      category,
      text,
      type,
      options,
      required: raw.required !== false,
      followUp: raw.followUp ?? raw.follow_up ?? undefined,
      aiGenerated: true,
      order: index + 1,
    };
  } catch {
    return null;
  }
}

// ─── Parse LLM text → raw question array ─────────────────────────────────────

function parseModelOutput(text: string): any[] {
  // Strip markdown code fences the model sometimes adds despite instructions
  const cleaned = text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  // Try parsing the whole thing
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.questions)) return parsed.questions;
  } catch {
    /* fall through */
  }

  // Pull out just the questions array value
  const arrayMatch = cleaned.match(/"questions"\s*:\s*(\[[\s\S]*\])/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[1]);
    } catch {
      /* fall through */
    }
  }

  // Bare JSON array
  const bareArray = cleaned.match(/^\s*(\[[\s\S]*\])\s*$/);
  if (bareArray) {
    try {
      return JSON.parse(bareArray[1]);
    } catch {
      /* fall through */
    }
  }

  return [];
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(projectName: string, sector: string): string {
  return `You are an expert evaluation specialist for a Kenyan County Government M&E department.

Generate a 35-question impact evaluation questionnaire for the "${projectName}" project (sector: ${sector}), following OECD DAC criteria.

SECTION DISTRIBUTION (must total 35):
- Background: 3 questions
- Relevance: 6 questions
- Coherence: 5 questions
- Effectiveness: 5 questions
- Efficiency: 5 questions
- Impact: 5 questions
- Sustainability: 6 questions

QUESTION TYPES — use exactly these string values:
- "likert5"  → agreement scale (Strongly Agree to Strongly Disagree)
- "likert5b" → extent scale (Very great extent to No extent)
- "yesno"    → Yes/No — ALWAYS include a "followUp" string
- "multiple" → categorical — include "customOptions": [{"label":"...", "value": 0}, ...]
- "text"     → open-ended (max 2 per section)
- "rating5"  → 1-5 rating (max 1 per section)

REQUIRED OUTPUT — return ONLY this JSON, no markdown fences, no extra text:
{
  "questions": [
    {
      "category": "Background",
      "text": "What is your role in relation to this project?",
      "type": "multiple",
      "required": true,
      "customOptions": [
        {"label": "Community Member", "value": 0},
        {"label": "County Official", "value": 1},
        {"label": "Project Staff", "value": 2},
        {"label": "Direct Beneficiary", "value": 3}
      ]
    },
    {
      "category": "Relevance",
      "text": "How relevant is the project to community needs?",
      "type": "likert5",
      "required": true,
      "followUp": "Please explain your rating."
    }
  ]
}

Tailor all questions to the ${sector} sector and Kenyan county context.`;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;

  const user = await getUser(session.user.email);
  const userRole =
    user?.sector === "me" ? "me" : user?.sector === "IDE" ? "sector" : "viewer";

  if (userRole !== "me") {
    return NextResponse.json(
      { error: "Only ME officers can generate evaluations" },
      { status: 403 },
    );
  }

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const projectName = project.name;
  const sector = project.sector ?? "General Development";

  try {
    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: buildSystemPrompt(projectName, sector),
      prompt: `Generate the 35-question evaluation questionnaire for the "${projectName}" project. Return only the JSON object.`,
    });

    const rawList = parseModelOutput(result.text);

    const questions: EvalQuestion[] = rawList
      .map((raw, i) => normaliseQuestion(raw, i))
      .filter((q): q is EvalQuestion => q !== null);

    if (questions.length === 0) {
      console.error("Parse failed. Raw model output:\n", result.text);
      return NextResponse.json(
        { error: "Model did not return valid questions. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      questions,
      meta: {
        total: questions.length,
        byCategory: questions.reduce(
          (acc, q) => {
            acc[q.category] = (acc[q.category] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
        ragContextUsed: false,
        model: "llama-3.3-70b-versatile",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Question generation error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to generate questions.",
      },
      { status: 500 },
    );
  }
}
