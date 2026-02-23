import { NextResponse } from "next/server";
import {
  getChecklist,
  saveChecklist,
  createChecklist,
} from "@/lib/actions/checklistActions";
import { auth } from "@/auth";

// GET existing checklist
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const checklist = await getChecklist(projectId);
    return NextResponse.json(checklist);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST to create a new draft checklist
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // You need to implement createChecklist in your actions
    const newChecklist = await createChecklist({
      projectId: projectId,
      createdBy: session.user.email,
    });
    return NextResponse.json(newChecklist);
  } catch (error) {
    console.error("POST checklist error:", error);
    return NextResponse.json(
      { error: "Failed to create checklist" },
      { status: 500 },
    );
  }
}

// PUT to update existing checklist
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { checklistId, status, items, editReason } = body;
    if (!checklistId) {
      return NextResponse.json(
        { error: "checklistId required" },
        { status: 400 },
      );
    }

    await saveChecklist(checklistId, {
      status,
      items,
      editReason,
      lastModifiedBy: session.user.email,
    });

    // Return updated checklist
    const updated = await getChecklist(projectId);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
