// app/api/report/draft/section/route.ts
// POST → regenerate a single named section of the summary report

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";

export const maxDuration = 30;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });

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
  workforce: {
    male: number;
    female: number;
    pwd: number;
    total: number;
  } | null;
}

function avgProgress(projects: ProjectSummary[]): number {
  const withData = projects.filter((p) => p.progress != null);
  if (withData.length === 0) return 0;
  return withData.reduce((s, p) => s + p.progress!, 0) / withData.length;
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
      return `  - ${p.name} (${p.sector ?? "unknown"}, ${p.location ?? "unknown"}): ${prog}${variance}${stalled}${bp}${ch}`;
    })
    .join("\n");
}

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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(session.user.email);
  if (user?.sector !== "me")
    return NextResponse.json({ error: "ME officers only" }, { status: 403 });

  try {
    const body = await req.json();
    const { sectionId, projects, reportDate } = body as {
      sectionId: string;
      projects: ProjectSummary[];
      reportDate: string;
    };

    const instruction = SECTION_INSTRUCTIONS[sectionId];
    if (!instruction)
      return NextResponse.json(
        { error: `Unknown section: ${sectionId}` },
        { status: 400 },
      );

    if (!Array.isArray(projects) || projects.length === 0)
      return NextResponse.json(
        { error: "No projects provided" },
        { status: 400 },
      );

    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are a senior M&E report writer for the Nairobi City County Efficiency Monitoring and Evaluation Department.
Write in formal, professional English suitable for official county government documents.
Do NOT use markdown, asterisks, hashes, or bullet symbols. Write in plain prose paragraphs only.
Be specific — reference site names and percentages from the data. Return ONLY the plain text, nothing else.`,
      prompt: `${instruction}

Report date: ${reportDate}
Portfolio: ${projects.length} projects, average progress ${avgProgress(projects).toFixed(1)}%

Project data:
${projectLines(projects)}

Return ONLY the plain text paragraph(s). No labels, no JSON, no markdown.`,
    });

    const text = result.text.trim();
    if (!text)
      return NextResponse.json(
        { error: "Model returned empty response" },
        { status: 502 },
      );

    return NextResponse.json({ content: text });
  } catch (err) {
    console.error("Section regeneration error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 },
    );
  }
}
