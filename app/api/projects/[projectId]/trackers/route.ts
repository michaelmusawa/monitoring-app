import { NextRequest, NextResponse } from "next/server";
import {
  getTrackerSubmissions,
  createTrackerSubmission,
  updateTrackerSubmission,
} from "@/lib/actions/trackerActions";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const submissions = await getTrackerSubmissions(projectId);
    return NextResponse.json(submissions);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser(session.user.email);
    // Only sector officers can create trackers
    if (!user || user.sector === "me") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, items } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const submission = await createTrackerSubmission(projectId, {
      title,
      submittedBy: session.user.email,
      items: items ?? [], // client-provided pre-built items
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("POST tracker error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create tracker";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { submissionId, title, items } = body;

    if (!submissionId || !title || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "submissionId, title and items are required" },
        { status: 400 },
      );
    }

    await updateTrackerSubmission(submissionId, {
      title,
      items,
      lastModifiedBy: session.user.email,
    });

    // Return updated submission for the client to replace in state
    const submissions = await getTrackerSubmissions(projectId);
    const updated = submissions.find((s) => s.id === submissionId);
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT tracker error:", error);
    return NextResponse.json(
      { error: "Failed to update tracker" },
      { status: 500 },
    );
  }
}
