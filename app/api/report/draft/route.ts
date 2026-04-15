// app/api/report/draft/route.ts
// POST /api/report/draft        → generate all 5 AI sections for the summary report
// POST /api/report/draft/section → regenerate a single named section

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

export const maxDuration = 60;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });

// ─── Types (mirror ReportGenerator.tsx) ──────────────────────────────────────

interface WorkforceSummary {
  male: number;
  female: number;
  pwd: number;
  total: number;
}

interface ProjectSummary {
  name: string;
  sector: string | null;
  location: string | null;
  progress: number | null;
  variance: number | null;
  stalledCount: number;
  trackerCount: number;
  bestPractice: string | null;
  challenge: string | null;
  workforce: WorkforceSummary | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Robust JSON parser ───────────────────────────────────────────────────────
// Strategy 1: direct parse after stripping code fences
// Strategy 2: auto-repair truncated last field (missing closing quote before `}`)
// Strategy 3: regex extraction field-by-field from raw text

const REPORT_KEYS = [
  "executiveSummary",
  "overallObservations",
  "bestPractices",
  "challenges",
  "recommendationsAndConclusion",
] as const;

type ReportFields = Record<(typeof REPORT_KEYS)[number], string>;

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
}

// Repair common LLM truncation: last string value has no closing `"` before `}`
function repairTruncatedJson(text: string): string {
  // If the text ends with content that looks like an unclosed string value,
  // close it and add the closing brace.
  // Pattern: ..."someKey": "... <EOF without closing "}
  return (
    text
      // Remove trailing whitespace / partial escape sequences
      .replace(/\\?$/, "")
      // If the final `"` before end-of-string is inside a value (not closing a key),
      // check whether the JSON can be repaired by appending `"}`
      .replace(/([^"\\])\s*$/, (_, last) => {
        // If we're inside an unclosed string, close it
        return last + '"}\n';
      })
  );
}

function extractViaRegex(text: string): Partial<ReportFields> {
  const result: Partial<ReportFields> = {};
  for (const key of REPORT_KEYS) {
    // Match: "key": "value" — value may span multiple lines, allow escaped quotes
    const pattern = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`, "s");
    const match = text.match(pattern);
    if (match?.[1]) {
      // Unescape JSON escape sequences
      result[key] = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .trim();
    }
  }
  return result;
}

function parseReportDraft(raw: string): ReportFields | null {
  const clean = stripFences(raw);

  // Strategy 1: clean parse
  try {
    const parsed = JSON.parse(clean);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const allPresent = REPORT_KEYS.every(
        (k) => typeof parsed[k] === "string" && parsed[k].length > 0,
      );
      if (allPresent) return parsed as ReportFields;
    }
  } catch {
    /* fall through */
  }

  // Strategy 2: repair truncated last field
  try {
    const repaired = repairTruncatedJson(clean);
    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const allPresent = REPORT_KEYS.every(
        (k) => typeof parsed[k] === "string" && parsed[k].length > 0,
      );
      if (allPresent) return parsed as ReportFields;
    }
  } catch {
    /* fall through */
  }

  // Strategy 3: regex field extraction — works even on severely malformed JSON
  const extracted = extractViaRegex(clean);
  const anyExtracted = REPORT_KEYS.some(
    (k) => extracted[k] && extracted[k]!.length > 10,
  );
  if (anyExtracted) {
    // Fill any missing fields with a placeholder so the ME officer knows to fill them in
    return REPORT_KEYS.reduce((acc, k) => {
      acc[k] =
        extracted[k] ??
        "Content could not be extracted — please edit this section manually.";
      return acc;
    }, {} as ReportFields);
  }

  return null;
}

function avgProgress(projects: ProjectSummary[]): number {
  const withData = projects.filter((p) => p.progress != null);
  if (withData.length === 0) return 0;
  return withData.reduce((s, p) => s + p.progress!, 0) / withData.length;
}

function workforceLine(projects: ProjectSummary[]): string {
  const totals = projects.reduce(
    (acc, p) => ({
      male: acc.male + (p.workforce?.male ?? 0),
      female: acc.female + (p.workforce?.female ?? 0),
      pwd: acc.pwd + (p.workforce?.pwd ?? 0),
      total: acc.total + (p.workforce?.total ?? 0),
    }),
    { male: 0, female: 0, pwd: 0, total: 0 },
  );
  if (totals.total === 0) return "No workforce data available.";
  return `Total: ${totals.total} (Male: ${totals.male}, Female: ${totals.female}, PWDs: ${totals.pwd}) across ${projects.filter((p) => p.workforce).length} sites.`;
}

function projectLines(projects: ProjectSummary[]): string {
  return projects
    .map((p) => {
      const prog = p.progress != null ? `${p.progress.toFixed(1)}%` : "N/A";
      const variance =
        p.variance != null
          ? ` (Δ ${p.variance >= 0 ? "+" : ""}${p.variance.toFixed(1)}%)`
          : "";
      const stalled = p.stalledCount > 0 ? ` [${p.stalledCount} stalled]` : "";
      const bp = p.bestPractice ? ` BP: ${p.bestPractice.slice(0, 80)}` : "";
      const ch = p.challenge ? ` CH: ${p.challenge.slice(0, 80)}` : "";
      return `  - ${p.name} (${p.sector ?? "unknown sector"}, ${p.location ?? "unknown location"}): ${prog}${variance}${stalled}${bp}${ch}`;
    })
    .join("\n");
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a senior M&E report writer for the Nairobi City County Efficiency Monitoring and Evaluation Department.
Your task is to write sections of the Dishi na County Initiative Kitchens Construction Progress Report.
Write in formal, professional English suitable for official county government documents.
Do NOT use markdown, asterisks, hashes, or bullet symbols. Write in plain prose paragraphs only.
Be specific — reference site names, percentages, and observations from the data provided.
Respond ONLY with a valid JSON object. No preamble, no code fences, no trailing text.`;
}

// ─── Full draft prompt ────────────────────────────────────────────────────────

function buildFullDraftPrompt(
  projects: ProjectSummary[],
  reportDate: string,
): string {
  const avg = avgProgress(projects).toFixed(1);
  return `Generate a Dishi na County Kitchens Construction Progress Report dated ${reportDate}.

PORTFOLIO OVERVIEW:
- Total projects: ${projects.length}
- Average progress: ${avg}%
- Total workforce: ${workforceLine(projects)}

PROJECT-BY-PROJECT DATA:
${projectLines(projects)}

Return ONLY this JSON object. Each value must be 2-3 plain prose sentences maximum — keep it concise to avoid truncation:
{
  "executiveSummary": "2-3 sentence overview of portfolio status, top performers, and critical concerns.",
  "overallObservations": "2-3 sentences on cross-cutting patterns and weekly variance trends across sites.",
  "bestPractices": "2-3 sentences on best practices observed, referencing specific site names.",
  "challenges": "2-3 sentences on key challenges, referencing specific sites and stalled items.",
  "recommendationsAndConclusion": "2-3 concrete, actionable recommendations for the next reporting period."
}

IMPORTANT: Ensure every string value is properly closed with a double-quote before the closing brace. The JSON must be complete and valid.`;
}

// ─── Single section prompts ───────────────────────────────────────────────────

const SECTION_INSTRUCTIONS: Record<string, string> = {
  executive:
    "Write a 3-4 sentence executive summary covering the overall portfolio status, highest and lowest performing sites, and any critical concerns.",
  observations:
    "Write 3-4 sentences on cross-cutting observations: pace of work, weekly variance patterns, and any systemic issues visible across multiple sites.",
  best_practices:
    "Write 3-5 sentences describing the best practices observed across the sites, referencing specific project names and what made the practices noteworthy.",
  challenges:
    "Write 3-5 sentences describing the key challenges facing the sites, referencing specific projects and their stalled items where applicable.",
  recommendations:
    "Write 3-5 concrete, actionable recommendations for the next reporting period, grounded in the data observed.",
};

function buildSectionPrompt(
  sectionId: string,
  projects: ProjectSummary[],
  reportDate: string,
): string {
  const instruction = SECTION_INSTRUCTIONS[sectionId];
  if (!instruction) throw new Error(`Unknown section: ${sectionId}`);

  return `${instruction}

Report date: ${reportDate}
Portfolio: ${projects.length} projects, average progress ${avgProgress(projects).toFixed(1)}%

Project data:
${projectLines(projects)}

Return ONLY the plain text paragraph(s). No JSON, no labels, no markdown.`;
}

// ─── POST: full draft ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(session.user.email);
  if (user?.sector !== "me")
    return NextResponse.json({ error: "ME officers only" }, { status: 403 });

  try {
    const body = await req.json();
    const { projects, reportDate } = body as {
      projects: ProjectSummary[];
      reportDate: string;
    };

    if (!Array.isArray(projects) || projects.length === 0)
      return NextResponse.json(
        { error: "No projects provided" },
        { status: 400 },
      );

    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),

      system: buildSystemPrompt(),
      prompt: buildFullDraftPrompt(projects, reportDate),
    });

    const parsed = parseReportDraft(result.text);
    if (!parsed) {
      console.error("Report draft parse failed. Raw:\n", result.text);
      return NextResponse.json(
        { error: "Model returned unparseable output. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      executiveSummary: parsed.executiveSummary ?? "",
      overallObservations: parsed.overallObservations ?? "",
      bestPractices: parsed.bestPractices ?? "",
      challenges: parsed.challenges ?? "",
      recommendationsAndConclusion: parsed.recommendationsAndConclusion ?? "",
    });
  } catch (err) {
    console.error("Report draft generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 },
    );
  }
}
