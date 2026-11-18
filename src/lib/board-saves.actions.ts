"use server";

import { put } from "@vercel/blob";
import { z } from "zod";
import { requireOwner } from "@/lib/auth.server";
import { ownerSaves, slotFolder } from "@/lib/board-saves.store";
import { boardSchema, slotSchema, type BoardState, type SaveSlot } from "@/lib/board-state";

/** Next.js hides thrown messages in production, so actions hand their user-facing message back as data. */
export type Result<T> = { ok: true; value: T } | { ok: false; message: string };
async function attempt<T>(run: (userId: string) => Promise<T>): Promise<Result<T>> {
  try { return { ok: true, value: await run(await requireOwner()) }; }
  catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Could not access saves." }; }
}
const writeSchema = z.object({ slot: slotSchema, snapshot: boardSchema, overwrite: z.boolean() });
const TAKEN = "This slot is already saved. Choose overwrite.";

export const listSaves = async () => attempt(async (userId): Promise<SaveSlot[]> => {
  try { return (await ownerSaves(userId)).map(({ slot, saved_at }) => ({ slot, saved_at })); }
  catch { throw new Error("Could not read your saves. Please try again."); }
});

export const writeSave = async (input: { slot: number; snapshot: BoardState; overwrite: boolean }) => attempt(async (userId): Promise<SaveSlot> => {
  let taken = false;
  try {
    const data = writeSchema.parse(input);
    taken = !data.overwrite && (await ownerSaves(userId)).some(save => save.slot === data.slot);
    if (!taken) {
      const blob = await put(`${slotFolder(userId, data.slot)}board.json`, JSON.stringify(data.snapshot), { access: "public", addRandomSuffix: true, contentType: "application/json" });
      return { slot: data.slot, saved_at: (blob as { uploadedAt?: Date }).uploadedAt?.toISOString() ?? new Date().toISOString() };
    }
  } catch { throw new Error("Could not save. Your edits are still here; please try again."); }
  throw new Error(TAKEN);
});

/** Where the browser can download a slot's snapshot; the file itself never passes through a function. */
export const saveLocation = async (input: { slot: number }) => attempt(async (userId): Promise<{ url: string; saved_at: string }> => {
  let save: { url: string; saved_at: string } | undefined;
  try {
    const slot = slotSchema.parse(input.slot);
    save = (await ownerSaves(userId)).find(item => item.slot === slot);
  } catch { /* Reported below. */ }
  if (!save) throw new Error("Could not load this save. Please try again.");
  return { url: save.url, saved_at: save.saved_at };
});
