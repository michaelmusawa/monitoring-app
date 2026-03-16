// app/api/projects/[projectId]/tracker-capture/route.ts
// ME officer saves narrative context during tracker review

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import {
  getTrackerCapture,
  saveTrackerCapture,
} from "@/lib/actions/reportActions";

// GET /api/projects/[projectId]/tracker-capture?submissionId=xxx
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const submissionId = req.nextUrl.searchParams.get("submissionId");
    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId required" },
        { status: 400 },
      );
    }
    const capture = await getTrackerCapture(projectId, submissionId);
    return NextResponse.json(capture ?? null);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch capture" },
      { status: 500 },
    );
  }
}

// POST /api/projects/[projectId]/tracker-capture
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
  if (user?.sector !== "me") {
    return NextResponse.json(
      { error: "Only ME officers can capture review data" },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();

    const saved = await saveTrackerCapture({
      ...body,
      projectId: projectId,
      capturedBy: session.user.email,
    });
    return NextResponse.json(saved);
  } catch (error) {
    console.log("Error", error);
    return NextResponse.json(
      { error: "Failed to save capture" },
      { status: 500 },
    );
  }
}
