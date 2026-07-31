import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const fileUrl = searchParams.get("url");
    if (!fileUrl) {
      return NextResponse.json(
        { error: "Missing 'url' parameter" },
        { status: 400 },
      );
    }

    const endpoint = process.env.S3_ENDPOINT!;
    const bucket = process.env.S3_BUCKET!;

    // Parse the stored full URL to extract the key
    const parsed = new URL(fileUrl);
    const endpointHost = new URL(endpoint).host;
    if (parsed.host !== endpointHost) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    const path = parsed.pathname.slice(1); // remove leading slash
    if (!path.startsWith(bucket + "/")) {
      return NextResponse.json({ error: "Invalid file URL" }, { status: 400 });
    }

    const key = path.slice(bucket.length + 1); // remove bucket and slash

    // Security: ensure file belongs to the user
    if (!key.startsWith(session.user.email + "/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate presigned URL (valid for 1 hour)
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const presignedUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({ url: presignedUrl });
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 },
    );
  }
}
