import { NextResponse } from "next/server";
import {
  getChecklist,
  saveChecklist,
  createChecklist,
} from "@/lib/actions/checklistActions";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import { TaskAnnotation } from "@/components/projects/ProjectChecklistClient";
import sql from "mssql";
import { safeQuery } from "@/lib/db";

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
    return NextResponse.json(
      { error: "Failed to fetch checklist" },
      { status: 500 },
    );
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await getChecklist(projectId);
    if (existing) {
      return NextResponse.json(
        { error: "Checklist already exists for this project" },
        { status: 409 },
      );
    }

    const checklist = await createChecklist({
      projectId: projectId,
      createdBy: session.user.email,
    });

    return NextResponse.json(checklist, { status: 201 });
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
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      checklistId,
      status,
      items,
      taskAnnotations,
    }: {
      checklistId: string;
      status: string;
      items: {
        parameterId: string;
        weight: number;
        label: string;
        category: string;
      }[];
      /** Per-task annotations from the ME officer. Only present on send-back. */
      taskAnnotations?: TaskAnnotation[];
    } = body;

    if (!checklistId || !status || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing required fields: checklistId, status, items" },
        { status: 400 },
      );
    }

    // Validate user has permission for this transition
    const user = await getUser(session.user.email);
    const userRole =
      user?.sector === "me"
        ? "me"
        : user?.sector === "IDE"
          ? "sector"
          : "viewer";

    const permissionError = validateTransition(status, userRole, checklistId);
    if (permissionError) {
      return NextResponse.json({ error: permissionError }, { status: 403 });
    }

    // Validate task annotations if present
    if (taskAnnotations && taskAnnotations.length > 0) {
      for (const annotation of taskAnnotations) {
        if (
          !annotation.parameterId ||
          typeof annotation.oldValue !== "number" ||
          typeof annotation.newValue !== "number" ||
          !annotation.reason?.trim()
        ) {
          return NextResponse.json(
            {
              error:
                "Each task annotation must have parameterId, oldValue, newValue, and reason",
            },
            { status: 400 },
          );
        }
      }
    }

    const updated = await saveChecklist(checklistId, {
      status,
      items,
      lastModifiedBy: session.user.email,
      taskAnnotations: taskAnnotations ?? [],
    });

    // Promote pending custom items → insert into Parameter/StandardParam table
    if (
      body.status === "WeightsAssignment" &&
      Array.isArray(body.customItems)
    ) {
      for (const item of body.customItems) {
        if (!item.isPending) continue;
        await safeQuery<any>(`
          INSERT INTO Parameter (id, label, category, projectScoped, projectId, createdAt)
          VALUES (${item.id}, ${item.label}, ${item.category}, 1, ${projectId}, GETDATE())
        `);
      }
    }

    // Persist pending custom items normally during Draft saves
    if (body.customItems) {
      await safeQuery<any>(
        `DELETE FROM ChecklistCustomItem WHERE checklistId = ${checklistId}`,
      );
      for (const item of body.customItems) {
        await safeQuery<any>(`
          INSERT INTO ChecklistCustomItem (id, checklistId, label, category, addedBy, addedAt)
          VALUES (${item.id}, ${checklistId}, ${item.label}, ${item.category}, ${item.addedBy}, ${item.addedAt})
        `);
      }
    }

    // Attach projectId (not stored on the returned object from the transaction)
    updated.projectId = projectId;

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT checklist error:", error);
    return NextResponse.json(
      { error: "Failed to save checklist" },
      { status: 500 },
    );
  }
}

function validateTransition(
  targetStatus: string,
  userRole: string,
  _checklistId: string,
): string | null {
  const SECTOR_ALLOWED_TARGETS = new Set([
    "Draft",
    "DraftReview",
    "WeightsAssignment",
    "WeightsReview",
  ]);
  const ME_ALLOWED_TARGETS = new Set([
    "Draft",
    "DraftReview",
    "WeightsAssignment",
    "WeightsReview",
    "Approved",
  ]);

  if (userRole === "sector" && !SECTOR_ALLOWED_TARGETS.has(targetStatus)) {
    return `Sector officers cannot set status to "${targetStatus}"`;
  }
  if (userRole === "me" && !ME_ALLOWED_TARGETS.has(targetStatus)) {
    return `ME officers cannot set status to "${targetStatus}"`;
  }
  if (userRole === "viewer") {
    return "Viewers cannot modify the checklist";
  }

  return null;
}
