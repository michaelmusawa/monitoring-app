// app/api/projects/[projectId]/reports/status-report/route.ts
// GET  → fetch existing draft
// POST → generate new AI draft from tracker data + project header + site capture
// PUT  → save manual edits to draft

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import { getProject } from "@/lib/actions/projectActions";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import {
  getStatusReportDraft,
  saveStatusReportDraft,
  getLatestTrackerCapture,
  type ReportContent,
} from "@/lib/actions/reportActions";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });

export const maxDuration = 60;

// ─── GET: fetch existing draft ────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const draft = await getStatusReportDraft(projectId);
    return NextResponse.json(draft ?? null);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 },
    );
  }
}

// ─── PUT: save manual edits ───────────────────────────────────────────────────

// ─── PUT: save manual edits ───────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await getUser(session.user.email);
  if (user?.sector !== "Monitoring And Evaluation")
    return NextResponse.json({ error: "ME officers only" }, { status: 403 });

  try {
    const body = await req.json();

    // Normalize status: 'final' or 'Finalized' etc → 'finalized'
    const rawStatus = (body.status || "").toLowerCase().trim();
    const status =
      rawStatus === "finalized" || rawStatus === "final"
        ? "finalized"
        : "draft";

    const saved = await saveStatusReportDraft({
      projectId,
      generatedBy: session.user.email,
      reportTitle: body.reportTitle,
      reportContent: body.reportContent,
      status,
    });
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json(
      { error: "Failed to save report" },
      { status: 500 },
    );
  }
}
// ─── POST: generate AI draft ──────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await getUser(session.user.email);
  if (user?.sector !== "Monitoring And Evaluation")
    return NextResponse.json({ error: "ME officers only" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      projectName,
      projectSector,
      location,
      trackerData, // { overallPercent, categories }
      checklistItems, // { label, category, percent }[]
      trackerItems, // full TrackerSubmissionItem[] — has challenges, recommendations, status
    } = body;

    // ── Pull project header fields from DB (set during initialization) ────────
    const project = (await getProject(projectId)) as any;

    // ── Pull the site-visit capture (workforce + practices + lessons) ─────────
    const capture = await getLatestTrackerCapture(projectId);

    // ── Derive findings/challenges/recommendations from tracker items ──────────
    // Key findings = items with notable status or progress worth calling out
    const stalledItems = (trackerItems ?? []).filter(
      (it: any) => it.status === "STALLED",
    );
    const completedItems = (trackerItems ?? []).filter(
      (it: any) => it.status === "COMPLETED",
    );
    const ongoingItems = (trackerItems ?? []).filter(
      (it: any) => it.status === "ONGOING",
    );

    const derivedChallenges = stalledItems
      .map((it: any) => it.challenges)
      .filter(Boolean)
      .join("\n");
    const derivedRecommendations = stalledItems
      .map((it: any) => it.recommendations)
      .filter(Boolean)
      .join("\n");
    const allChallenges = (trackerItems ?? [])
      .map((it: any) => it.challenges)
      .filter(Boolean)
      .join("\n");
    const allRecommendations = (trackerItems ?? [])
      .map((it: any) => it.recommendations)
      .filter(Boolean)
      .join("\n");

    console.log(derivedChallenges, derivedRecommendations);

    // Group scope by category
    const scopeLines = (checklistItems ?? [])
      .map((i: any) => `  - [${i.category}] ${i.label}: ${i.percent ?? "?"}%`)
      .join("\n");

    const categoryProgress = (trackerData?.categories ?? [])
      .map((c: any) => `  ${c.name}: ${c.latestPercent?.toFixed(1)}%`)
      .join("\n");

    // Derive ongoing and pending from tracker items
    const ongoingList = ongoingItems
      .map((it: any) => `${it.label} (${it.percentComplete}%)`)
      .join(", ");
    const pendingItems = (trackerItems ?? []).filter(
      (it: any) => it.percentComplete === 0,
    );
    const pendingList = pendingItems.map((it: any) => it.label).join(", ");

    // ── Build AI prompt ───────────────────────────────────────────────────────

    const today = new Date().toISOString().slice(0, 10);

    const prompt = `
You are writing an official Kenyan county government project monitoring status report.
Write in formal, professional English suitable for official government documents.
Be comprehensive and detailed — expand all bullet points into full professional sentences.

PROJECT HEADER (from project record — use exactly as provided):
- Project Name: ${projectName}
- Location: ${location ?? project?.ward ?? "Kenya"}
- Date of Tracking: ${today}
- Sector: ${projectSector}
- Funding Source: ${project?.fundingSource ?? "County Government"}
- Employer: ${project?.employer ?? "County Government"}
- Employer's Representative: ${project?.employerRep ?? ""}
- Project Manager: ${project?.projectManager ?? ""}
- Fiscal Year: ${project?.fiscalYear ?? ""}
- Contract Sum: ${project?.contractSum ?? ""}
- Commencement Date: ${project?.commencementDate ?? ""}
- Planned Completion: ${project?.plannedCompletion ?? ""}
- Contract Duration: ${project?.contractDuration ?? ""}
- Cost to Completion: ${project?.costToCompletion ?? ""}
- Overall Completion: ${trackerData?.overallPercent?.toFixed(2) ?? "?"}%
- Workforce on Site: ${capture?.workforceCount ?? ""} personnel${capture?.workforceNote ? ` — ${capture.workforceNote}` : ""}

PROGRESS BY CATEGORY:
${categoryProgress || "  (no category data)"}

PROJECT SCOPE (all items with current % completion):
${scopeLines || "  (no scope data)"}

WORK STATUS SUMMARY:
- Completed items (100%): ${completedItems.length}
- Ongoing items: ${ongoingItems.length}
- Stalled items: ${stalledItems.length}
- Currently ongoing: ${ongoingList || "none"}
- Not yet started (0%): ${pendingList || "none"}

CHALLENGES / RISKS from tracker (per-item notes):
${allChallenges || "(none recorded in tracker)"}

RECOMMENDATIONS from tracker (per-item notes):
${allRecommendations || "(none recorded in tracker)"}

BEST PRACTICES (from ME officer site visit):
${(capture?.bestPractices ?? []).join("\n") || "(none recorded)"}

LESSONS LEARNT (from ME officer site visit):
${(capture?.lessonsLearnt ?? []).join("\n") || "(none recorded)"}

TASK:
Generate a complete monitoring status report as a JSON object. Follow this exact structure.
- Write projectOverview as 3-5 flowing paragraphs.
- Expand challenges and recommendations from the tracker notes into full professional sentences.
- keyFindings should highlight the most significant positives and concerns from the scope data.
- summaryOfCompleted should list the major work packages that reached 100%.
- ongoingWorks and pendingWorks should be concise narrative paragraphs.
- bestPractices and lessonsLearnt: expand the ME officer's bullet points into 2-3 full sentences each.

Return ONLY valid JSON, no markdown fences:
{
  "projectTitle": "string",
  "location": "string",
  "trackingDate": "string",
  "fundingSource": "string",
  "employer": "string",
  "employerRep": "string",
  "projectManager": "string",
  "fiscalYear": "string",
  "contractSum": "string",
  "overallPercent": number,
  "workforceCount": number,
  "workforceNote": "string",
  "commencementDate": "string",
  "plannedCompletion": "string",
  "contractDuration": "string",
  "costToCompletion": "string",
  "projectOverview": "3-5 paragraph narrative",
  "projectScope": [
    { "category": "string", "items": [{ "label": "string", "percent": number }] }
  ],
  "summaryOfCompleted": ["sentence...", ...],
  "ongoingWorks": "narrative paragraph",
  "pendingWorks": "narrative paragraph",
  "keyFindings": ["full sentence finding...", ...],
  "challenges": ["full sentence challenge...", ...],
  "recommendations": ["full sentence recommendation...", ...],
  "bestPractices": ["full sentence best practice...", ...],
  "lessonsLearnt": ["full sentence lesson...", ...]
}
`;

    const result = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      system:
        "You are an expert government project monitoring report writer for Kenyan county governments. Write formal, detailed, professional reports. Return ONLY valid JSON with no markdown fences.",
      prompt,
    });

    // Parse response
    let reportContent: ReportContent;
    try {
      const cleaned = result.text
        .replace(/^```(?:json)?\s*/im, "")
        .replace(/\s*```\s*$/m, "")
        .trim();
      reportContent = JSON.parse(cleaned);
    } catch {
      const match = result.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Model did not return valid JSON");
      reportContent = JSON.parse(match[0]);
    }

    // Ensure overallPercent is correct
    reportContent.overallPercent =
      trackerData?.overallPercent ?? reportContent.overallPercent ?? 0;

    // Fallback scope from checklist items if model didn't populate it well
    if (
      !reportContent.projectScope ||
      reportContent.projectScope.length === 0
    ) {
      const grouped: Record<string, { label: string; percent: number }[]> = {};
      (checklistItems ?? []).forEach((item: any) => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push({
          label: item.label,
          percent: item.percent ?? 0,
        });
      });
      reportContent.projectScope = Object.entries(grouped).map(
        ([category, items]) => ({ category, items }),
      );
    }

    const reportTitle = `${projectName} — Project Monitoring Status Report`;

    const saved = await saveStatusReportDraft({
      projectId: projectId,
      generatedBy: session.user.email,
      reportTitle,
      reportContent,
      captureSnapshot: capture,
      status: "draft",
    });

    return NextResponse.json(saved);
  } catch (err) {
    console.error("Report generation error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Report generation failed",
      },
      { status: 500 },
    );
  }
}
