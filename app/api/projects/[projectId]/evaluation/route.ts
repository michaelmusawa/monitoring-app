// app/api/projects/[projectId]/evaluation/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getEvaluation,
  saveEvaluation,
  updateEvaluationStatus,
  type EvalConfig,
} from "@/lib/actions/evaluationActions";
import { getUser } from "@/lib/actions/usersActions";

// ─── GET /api/projects/[projectId]/evaluation ─────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const config = await getEvaluation(projectId);
    return NextResponse.json(config ?? null);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch evaluation" },
      { status: 500 },
    );
  }
}

// ─── POST /api/projects/[projectId]/evaluation ────────────────────────────────
// Create or replace the evaluation config (questions, channels, metadata).

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUser(session.user.email);
  const userRole =
    user?.sector === "me" ? "me" : user?.sector === "IDE" ? "sector" : "viewer";
  if (userRole !== "me") {
    return NextResponse.json(
      { error: "Only ME officers can create evaluations" },
      { status: 403 },
    );
  }

  try {
    const body: EvalConfig = await req.json();
    body.projectId = projectId;
    const saved = await saveEvaluation(body);
    return NextResponse.json(saved, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save evaluation" },
      { status: 500 },
    );
  }
}

// ─── PUT /api/projects/[projectId]/evaluation ─────────────────────────────────
// Update questions, metadata, or status.

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUser(session.user.email);
  const userRole =
    user?.sector === "me" ? "me" : user?.sector === "IDE" ? "sector" : "viewer";
  if (userRole !== "me") {
    return NextResponse.json(
      { error: "Only ME officers can edit evaluations" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();

    // Status-only update (publish / close)
    if (body.statusOnly && body.status) {
      await updateEvaluationStatus(projectId, body.status);
      return NextResponse.json({ status: body.status });
    }

    // Full config update
    const config: EvalConfig = body;
    config.projectId = projectId;
    const saved = await saveEvaluation(config);
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json(
      { error: "Failed to update evaluation" },
      { status: 500 },
    );
  }
}
