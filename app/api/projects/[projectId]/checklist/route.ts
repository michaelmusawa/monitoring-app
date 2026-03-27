// app/api/projects/[projectId]/checklist/route.ts
import { NextResponse } from "next/server";
import {
  getChecklist,
  saveChecklist,
  createChecklist,
} from "@/lib/actions/checklistActions";
import { auth } from "@/auth";
import { getUser } from "@/lib/actions/usersActions";
import { TaskAnnotation } from "@/components/projects/ProjectChecklistClient";
import { safeQuery } from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const checklist = await getChecklist(projectId);
    return NextResponse.json(checklist);
  } catch (error) {
    console.error("GET checklist error:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklist" },
      { status: 500 },
    );
  }
}

// ─── POST — create new draft ──────────────────────────────────────────────────

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await getChecklist(projectId);
    if (existing) {
      return NextResponse.json(
        { error: "Checklist already exists for this project" },
        { status: 409 },
      );
    }

    const checklist = await createChecklist({
      projectId,
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

// ─── PUT — update checklist ───────────────────────────────────────────────────

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
    const {
      checklistId,
      status,
      items,
      taskAnnotations,
      customItems,
    }: {
      checklistId: string;
      status: string;
      items: {
        parameterId: string;
        weight: number;
        label: string;
        category: string;
      }[];
      taskAnnotations?: TaskAnnotation[];
      customItems?: {
        id: string;
        label: string;
        category: string;
        isPending: boolean;
        addedBy: string;
        addedAt: string;
      }[];
    } = body;

    if (!checklistId || !status || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Missing required fields: checklistId, status, items" },
        { status: 400 },
      );
    }

    // ── Permission check ───────────────────────────────────────────────────
    const user = await getUser(session.user.email);
    const userRole = user?.sector === "me" ? "me" : "sector";
    const permissionError = validateTransition(status, userRole);
    if (permissionError) {
      return NextResponse.json({ error: permissionError }, { status: 403 });
    }

    // ── Validate task annotations ──────────────────────────────────────────
    if (taskAnnotations && taskAnnotations.length > 0) {
      for (const a of taskAnnotations) {
        if (
          !a.parameterId ||
          typeof a.oldValue !== "number" ||
          typeof a.newValue !== "number" ||
          !a.reason?.trim()
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

    // ── Persist custom items (full replace) ────────────────────────────────
    // Done BEFORE saveChecklist so the in-transaction fetch picks them up
    // and returns them to the client in a single round-trip.
    if (customItems !== undefined) {
      await safeQuery(
        `DELETE FROM ChecklistCustomItem WHERE checklistId = @p1`,
        [checklistId],
      );

      for (const item of customItems) {
        await safeQuery(
          `INSERT INTO ChecklistCustomItem
             (id, checklistId, label, category, addedBy, addedAt)
           VALUES (@p1, @p2, @p3, @p4, @p5, @p6)`,
          [
            item.id,
            checklistId,
            item.label,
            item.category,
            item.addedBy || session.user.email,
            item.addedAt || new Date().toISOString(),
          ],
        );
      }
    }

    // ── Save checklist ─────────────────────────────────────────────────────
    // For the Approved transition we need the project's sector so custom items
    // can be promoted to the correct Template. Fetch it lazily only when needed.
    let projectSector: string | undefined;
    if (status === "Approved") {
      const { rows: projRows } = await safeQuery<any>(
        "SELECT sector FROM Project WHERE id = @p1",
        [projectId],
      );
      projectSector = projRows[0]?.sector ?? undefined;
    }

    const updated = await saveChecklist(checklistId, {
      status,
      items,
      lastModifiedBy: session.user.email,
      taskAnnotations: taskAnnotations ?? [],
      customItemsToPromote: customItems,
      sector: projectSector,
    });

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateTransition(
  targetStatus: string,
  userRole: string,
): string | null {
  const SECTOR_ALLOWED = new Set([
    "Draft",
    "DraftReview",
    "WeightsAssignment",
    "WeightsReview",
  ]);
  const ME_ALLOWED = new Set([
    "Draft",
    "DraftReview",
    "WeightsAssignment",
    "WeightsReview",
    "Approved",
  ]);

  if (userRole === "sector" && !SECTOR_ALLOWED.has(targetStatus)) {
    return `Sector officers cannot set status to "${targetStatus}"`;
  }
  if (userRole === "me" && !ME_ALLOWED.has(targetStatus)) {
    return `ME officers cannot set status to "${targetStatus}"`;
  }
  if (userRole === "viewer") {
    return "Viewers cannot modify the checklist";
  }
  return null;
}
