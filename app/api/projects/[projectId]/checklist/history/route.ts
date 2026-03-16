// app/api/projects/[projectId]/checklist/history/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getChecklist,
  getChecklistHistory,
} from "@/lib/actions/checklistActions";

// ─── GET /api/projects/[projectId]/checklist/history ─────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const checklist = await getChecklist(projectId);
    if (!checklist) {
      return NextResponse.json([], { status: 200 });
    }

    const history = await getChecklistHistory(checklist.id);
    return NextResponse.json(history);
  } catch (error) {
    console.error("GET checklist history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 },
    );
  }
}
