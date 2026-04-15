// app/api/projects/[projectId]/checklist/change-requests/[requestId]/reject/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
// import { rejectChangeRequest } from "@/lib/actions/checklistActions";
import { getUser } from "@/lib/actions/usersActions";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;

  console.log(requestId);

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
    // await rejectChangeRequest(requestId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject change request error:", error);
    return NextResponse.json(
      { error: "Failed to reject changes" },
      { status: 500 },
    );
  }
}
