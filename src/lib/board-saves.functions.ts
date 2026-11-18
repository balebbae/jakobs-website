import { upload } from "@vercel/blob/client";
import { boardSchema, type BoardState, type SaveSlot } from "@/lib/board-state";
import { listSaves, saveLocation, writeSave, type Result } from "@/lib/board-saves.actions";
import { $getSessionUser } from "@/lib/session";

/** Largest snapshot sent through a server action; bigger ones upload straight to Vercel Blob to stay under request limits. */
const DIRECT_LIMIT = 1_000_000;

async function unwrap<T>(pending: Promise<Result<T>>): Promise<T> {
  const result = await pending;
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

export const listBoardSaves = (): Promise<SaveSlot[]> => unwrap(listSaves());

export async function writeBoardSave({ data }: { data: { slot: number; snapshot: BoardState; overwrite: boolean } }): Promise<SaveSlot> {
  const json = JSON.stringify(data.snapshot);
  if (json.length <= DIRECT_LIMIT) return unwrap(writeSave(data));
  if (!data.overwrite && (await listBoardSaves()).some(save => save.slot === data.slot)) throw new Error("This slot is already saved. Choose overwrite.");
  try {
    const user = await $getSessionUser();
    if (!user) throw new Error("No owner");
    await upload(`saves/${user.userId}/slot-${data.slot}/board.json`, new Blob([json], { type: "application/json" }), { access: "public", handleUploadUrl: "/api/blob/upload", contentType: "application/json", multipart: json.length > 50 * 1024 * 1024 });
    return { slot: data.slot, saved_at: new Date().toISOString() };
  } catch { throw new Error("Could not save. Your edits are still here; please try again."); }
}

export async function readBoardSave({ data: slot }: { data: number }): Promise<BoardState> {
  const { url } = await unwrap(saveLocation({ slot }));
  try { return boardSchema.parse(await (await fetch(url)).json()); }
  catch { throw new Error("Could not load this save. Please try again."); }
}
