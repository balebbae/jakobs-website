import { useEffect, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { $getIdentityToken, $getSessionUser } from "@/lib/session";

const BUCKET = "board-videos";
let client: SupabaseClient | null = null;
let token: string | null = null;
let exp = 0;
function videoClient() {
  if (!client) {
    const url = import.meta.env["VITE_SUPABASE_URL"];
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Video storage is unavailable.");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, accessToken: async () => {
      const now = Date.now() / 1000;
      if (!token || now >= exp - 30) {
        token = await $getIdentityToken();
        try { exp = JSON.parse(atob((token ?? "").split(".")[1] ?? "")).exp ?? 0; } catch { exp = 0; }
      }
      if (!token) throw new Error("Not signed in");
      return token;
    } });
  }
  return client;
}

/** Uploads a video file and returns its storage path (stored in the board instead of the file). */
export async function uploadVideo(file: File) {
  const user = await $getSessionUser();
  if (!user) throw new Error("Sign in to add videos.");
  const ext = file.name.split(".").pop() || "mp4";
  const path = `${user.userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await videoClient().storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error("Could not upload the video.");
  return path;
}

const cache = new Map<string, Promise<string | null>>();
export function useVideoUrl(path: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    if (!cache.has(path)) cache.set(path, videoClient().storage.from(BUCKET).createSignedUrl(path, 86400).then(r => r.data?.signedUrl ?? null).catch(() => null));
    void cache.get(path)?.then(u => { if (live) setUrl(u); });
    return () => { live = false; };
  }, [path]);
  return url;
}
