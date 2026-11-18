import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { boardSchema, slotSchema } from "@/lib/board-state";
import type { Json } from "@/integrations/supabase/types";

export const listBoardSaves = createServerFn({ method: "GET" }).handler(async () => {
  const { saveClient } = await import("./board-saves.server");
  const { client, userId } = await saveClient();
  const { data, error } = await client.from("board_save_slots").select("slot,saved_at").eq("user_id", userId).order("slot");
  if (error) throw new Error("Could not read your saves. Please try again.");
  return data;
});
export const writeBoardSave = createServerFn({ method: "POST" }).inputValidator(z.object({ slot: slotSchema, snapshot: boardSchema, overwrite: z.boolean() })).handler(async ({ data }) => {
  const { saveClient } = await import("./board-saves.server");
  const { client, userId } = await saveClient();
  const row = { user_id: userId, slot: data.slot, snapshot: data.snapshot as Json, saved_at: new Date().toISOString() };
  const query = data.overwrite ? client.from("board_save_slots").upsert(row, { onConflict: "user_id,slot" }) : client.from("board_save_slots").insert(row);
  const { data: saved, error } = await query.select("slot,saved_at").single();
  if (error) throw new Error(error.code === "23505" ? "This slot is already saved. Choose overwrite." : "Could not save. Your edits are still here; please try again.");
  return saved;
});
export const readBoardSave = createServerFn({ method: "GET" }).inputValidator(slotSchema).handler(async ({ data }) => {
  const { saveClient } = await import("./board-saves.server");
  const { client, userId } = await saveClient();
  const { data: saved, error } = await client.from("board_save_slots").select("snapshot").eq("user_id", userId).eq("slot", data).single();
  if (error) throw new Error("Could not load this save. Please try again.");
  return boardSchema.parse(saved.snapshot);
});export const readOpeningBoard = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { saveClient } = await import("./board-saves.server");
    const { client, userId } = await saveClient();
    const { data } = await client.from("board_save_slots").select("snapshot").eq("user_id", userId).eq("slot", 1).maybeSingle();
    return data ? boardSchema.parse(data.snapshot) : null;
  } catch { return null; }
});
