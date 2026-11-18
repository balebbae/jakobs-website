import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth.server";

/** Issues short-lived upload tokens so the browser can send videos directly to Vercel Blob. */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getSessionUser();
        // Owners may only write inside their own folder.
        if (!user || !pathname.startsWith(`${user.userId}/`)) throw new Error("Not allowed");
        return { allowedContentTypes: ["video/*"], addRandomSuffix: true, maximumSizeInBytes: 1024 * 1024 * 1024 };
      },
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not upload the video." }, { status: 400 });
  }
}
