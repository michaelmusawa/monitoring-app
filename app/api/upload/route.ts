// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate safe filename
    const ext = file.name
      .split(".")
      .pop()
      ?.replace(/[^a-zA-Z0-9]/g, "");
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${ext}`;

    // Optional: organize by user
    const key = `${session.user.email}/${uniqueName}`;

    // Upload to MinIO
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const url = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Upload failed: " + error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    // Parse the URL
    const parsed = new URL(url);
    const s3Endpoint = process.env.S3_ENDPOINT!;
    const bucket = process.env.S3_BUCKET!;

    // Check if the host and port match the S3 endpoint
    const endpointHost = new URL(s3Endpoint).host;
    if (parsed.host !== endpointHost) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    // Path should start with /bucket/
    const path = parsed.pathname.slice(1); // remove leading slash
    if (!path.startsWith(bucket + "/")) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    const key = path.slice(bucket.length + 1); // remove bucket and slash

    // Ensure file belongs to user
    if (!key.startsWith(session.user.email + "/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: "Delete failed: " + error.message },
      { status: 500 },
    );
  }
}
