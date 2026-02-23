import { NextResponse } from "next/server";
import {
  getTrackerSubmissions,
  createTrackerSubmission,
  updateTrackerSubmission,
} from "@/lib/actions/trackerActions";
import { auth } from "@/auth";

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
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { projectId } = await params;
    const body = await request.json();
    const newSub = await createTrackerSubmission(projectId, {
      title: body.title,
      submittedBy: session.user.email,
    });
    return NextResponse.json(newSub);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { projectId } = await params;
    const body = await request.json();
    await updateTrackerSubmission(body.submissionId, {
      title: body.title,
      items: body.items,
      lastModifiedBy: session.user.email,
    });
    // Return updated submission (re‑fetch)
    const submissions = await getTrackerSubmissions(projectId);
    const updated = submissions.find((s) => s.id === body.submissionId);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
