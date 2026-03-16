// app/api/projects/[projectId]/checklist/change-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

import {
  getPendingChangeRequests,
  submitChangeRequest,
} from "@/lib/actions/checklistActions";
import { getUser } from "@/lib/actions/usersActions";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const checklistId = searchParams.get("checklistId");
    if (!checklistId) {
      return NextResponse.json(
        { error: "checklistId required" },
        { status: 400 },
      );
    }

    const requests = await getPendingChangeRequests(checklistId);
    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET change requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch change requests" },
      { status: 500 },
    );
  }
}

// app/api/projects/[projectId]/checklist/change-requests/route.ts (append to same file)

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUser(session.user.email);

  // Only ME officer can submit change requests
  if (user?.sector !== "ME") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { checklistId, changes } = body;

    if (!checklistId || !Array.isArray(changes)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await submitChangeRequest(checklistId, {
      changes,
      requestedBy: session.user.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST change request error:", error);
    return NextResponse.json(
      { error: "Failed to submit change request" },
      { status: 500 },
    );
  }
}
