import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { safeQuery } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const reason = formData.get("reason") as string;
    const files = formData.getAll("files") as File[];

    if (!reason?.trim()) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 },
      );
    }

    const fileUrls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name}`;

      const filePath = path.join(
        process.cwd(),
        "public/uploads/terminations",
        filename,
      );

      await writeFile(filePath, buffer);

      fileUrls.push(`/uploads/terminations/${filename}`);
    }

    await safeQuery(
      `INSERT INTO ProjectTermination
       (projectId, reason, documents, terminatedBy, terminatedAt)
       VALUES (@p1, @p2, @p3, @p4, GETDATE())`,
      [projectId, reason, JSON.stringify(fileUrls), session.user.email],
    );

    await safeQuery(
      `UPDATE Project
       SET status = 'TERMINATED',
           updatedAt = GETDATE()
       WHERE id = @p1`,
      [projectId],
    );

    revalidatePath(`/projects/${projectId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ error: "Termination failed" }, { status: 500 });
  }
}
