// app/api/projects/[projectId]/evaluation/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { submitEvalResponse } from "@/lib/actions/evaluationActions";
import { getEvaluation } from "@/lib/actions/evaluationActions";

// ─── POST /api/projects/[projectId]/evaluation/submit ─────────────────────────
// Public endpoint — no auth required (respondents may not be logged in).

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const body = await req.json();
    const { respondentGroup, channel, responses } = body;

    if (
      !respondentGroup ||
      !Array.isArray(responses) ||
      responses.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing respondentGroup or responses" },
        { status: 400 },
      );
    }

    // Verify the evaluation exists and is active
    const config = await getEvaluation(projectId);
    if (!config) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 },
      );
    }
    if (config.status !== "active") {
      return NextResponse.json(
        { error: "This evaluation is not currently accepting responses" },
        { status: 403 },
      );
    }

    const submissionId = await submitEvalResponse({
      evaluationId: config.id,
      projectId: projectId,
      respondentGroup,
      channel: channel ?? "link",
      responses,
    });

    return NextResponse.json({
      submissionId,
      message: "Response submitted successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 },
    );
  }
}
