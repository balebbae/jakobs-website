import { upload } from "@vercel/blob/client";
import { $getSessionUser } from "@/lib/session";

/** Uploads a video file straight to Vercel Blob and returns its URL (stored in the board instead of the file). */
export async function uploadVideo(file: File) {
  const user = await $getSessionUser();
  if (!user) throw new Error("Sign in to add videos.");
  const ext = file.name.split(".").pop() || "mp4";
  const path = `${user.userId}/${crypto.randomUUID()}.${ext}`;
  try {
    const blob = await upload(path, file, { access: "public", handleUploadUrl: "/api/blob/upload", contentType: file.type, multipart: file.size > 50 * 1024 * 1024 });
    return blob.url;
  } catch { throw new Error("Could not upload the video."); }
}

/** Resolves a stored video reference to a playable URL. */
export function useVideoUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : null;
}
