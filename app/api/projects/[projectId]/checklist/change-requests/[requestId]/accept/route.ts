// app/api/projects/[projectId]/checklist/change-requests/[requestId]/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
// import { acceptChangeRequest } from "@/lib/actions/checklistActions";
import { getUser } from "@/lib/actions/usersActions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUser(session.user.email);

  // Only sector officer can accept changes
  if (user?.sector !== "IDE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { newStatus } = body; // e.g., 'WeightsAssignment' or 'Approved'
    if (!newStatus) {
      return NextResponse.json(
        { error: "newStatus required" },
        { status: 400 },
      );
    }

    // await acceptChangeRequest(requestId, newStatus);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Accept change request error:", error);
    return NextResponse.json(
      { error: "Failed to accept changes" },
      { status: 500 },
    );
  }
}
