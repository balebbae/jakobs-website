import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth.server";

/** Issues short-lived upload tokens so the browser can send videos and large saves directly to Vercel Blob. */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getSessionUser();
        if (!user) throw new Error("Not allowed");
        // Owners may only write inside their own folders.
        if (new RegExp(`^saves/${user.userId}/slot-([1-9]|10)/board\\.json$`).test(pathname)) return { allowedContentTypes: ["application/json"], addRandomSuffix: true, maximumSizeInBytes: 200 * 1024 * 1024 };
        if (!pathname.startsWith(`${user.userId}/`)) throw new Error("Not allowed");
        return { allowedContentTypes: ["video/*"], addRandomSuffix: true, maximumSizeInBytes: 1024 * 1024 * 1024 };
      },
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not upload." }, { status: 400 });
  }
}
