import { createClient } from "@supabase/supabase-js";
import { getRequest } from "@tanstack/react-start/server";
import { getSessionUser } from "@/lib/auth.server";
import type { Database } from "@/integrations/supabase/types";

export async function saveClient() {
  const user = await getSessionUser();
  const token = getRequest().headers.get("x-lovable-identity-token");
  if (!user || !token) throw new Error("Your Lovable session is needed to access saves.");
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Save service is unavailable.");
  const client = createClient<Database>(url, key, { accessToken: async () => token, auth: { persistSession: false, autoRefreshToken: false } });
  return { client, userId: user.userId };
}