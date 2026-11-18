import { boardSchema, type BoardState, type SaveSlot } from "@/lib/board-state";
import { commitStagedSave, listSaves, readSaveText, stageSaveChunk, writeSave, type Result } from "@/lib/board-saves.actions";
import { CHUNK_CHARS } from "@/lib/board-saves.shared";

/** Browser-side API for the save slots. Large snapshots travel in pieces so photos never hit request limits. */
async function unwrap<T>(pending: Promise<Result<T>>): Promise<T> {
  const result = await pending;
  if (!result.ok) throw new Error(result.message);
  return result.value;
}

export const listBoardSaves = (): Promise<SaveSlot[]> => unwrap(listSaves());

export async function writeBoardSave({ data }: { data: { slot: number; snapshot: BoardState; overwrite: boolean } }): Promise<SaveSlot> {
  const json = JSON.stringify(data.snapshot);
  if (json.length <= CHUNK_CHARS) return unwrap(writeSave(data));
  const uploadId = crypto.randomUUID();
  for (let index = 0; index * CHUNK_CHARS < json.length; index++) {
    await unwrap(stageSaveChunk({ uploadId, index, body: json.slice(index * CHUNK_CHARS, (index + 1) * CHUNK_CHARS) }));
  }
  return unwrap(commitStagedSave({ uploadId, slot: data.slot, overwrite: data.overwrite }));
}

export async function readBoardSave({ data: slot }: { data: number }): Promise<BoardState> {
  let json = "";
  for (;;) {
    const { text, total } = await unwrap(readSaveText({ slot, offset: json.length }));
    json += text;
    if (json.length >= total || !text) break;
  }
  try { return boardSchema.parse(JSON.parse(json)); }
  catch { throw new Error("Could not load this save. Please try again."); }
}
