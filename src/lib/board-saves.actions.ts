"use server";

import { and, asc, eq, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { boardSaveChunks, boardSaveSlots } from "@/db/schema";
import { requireOwner } from "@/lib/auth.server";
import { boardSchema, slotSchema, type BoardState, type SaveSlot } from "@/lib/board-state";
import { CHUNK_CHARS } from "@/lib/board-saves.shared";


/** Next.js hides thrown messages in production, so actions hand their user-facing message back as data. */
export type Result<T> = { ok: true; value: T } | { ok: false; message: string };
async function attempt<T>(run: (userId: string) => Promise<T>): Promise<Result<T>> {
  try { return { ok: true, value: await run(await requireOwner()) }; }
  catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Could not access saves." }; }
}
const writeSchema = z.object({ slot: slotSchema, snapshot: boardSchema, overwrite: z.boolean() });
const saved = { slot: boardSaveSlots.slot, saved_at: sql<string>`to_char(${boardSaveSlots.savedAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"+00:00"')` };
const isDuplicate = (error: unknown) => [error, (error as { cause?: unknown } | null)?.cause].some(e => (e as { code?: unknown } | null | undefined)?.code === "23505");

export const listSaves = async () => attempt(async (userId): Promise<SaveSlot[]> => {
  try {
    return await db().select(saved).from(boardSaveSlots).where(eq(boardSaveSlots.userId, userId)).orderBy(asc(boardSaveSlots.slot));
  } catch { throw new Error("Could not read your saves. Please try again."); }
});

async function store(userId: string, input: unknown): Promise<SaveSlot> {
  const data = writeSchema.parse(input);
  const row = { userId, slot: data.slot, snapshot: data.snapshot, savedAt: new Date().toISOString() };
  try {
    const insert = db().insert(boardSaveSlots).values(row);
    const [result] = await (data.overwrite
      ? insert.onConflictDoUpdate({ target: [boardSaveSlots.userId, boardSaveSlots.slot], set: { snapshot: row.snapshot, savedAt: row.savedAt } })
      : insert).returning(saved);
    if (!result) throw new Error("No row saved");
    return result;
  } catch (error) {
    throw new Error(isDuplicate(error) ? "This slot is already saved. Choose overwrite." : "Could not save. Your edits are still here; please try again.");
  }
}

export const writeSave = async (input: { slot: number; snapshot: BoardState; overwrite: boolean }) => attempt(userId => store(userId, input));

/** Stages one piece of a snapshot that is too large for a single request. */
export const stageSaveChunk = async (input: { uploadId: string; index: number; body: string }) => attempt(async (userId): Promise<null> => {
  const data = z.object({ uploadId: z.string().uuid(), index: z.number().int().min(0).max(999), body: z.string().max(CHUNK_CHARS) }).parse(input);
  try {
    await db().delete(boardSaveChunks).where(lt(boardSaveChunks.createdAt, sql`now() - interval '1 day'`));
    await db().insert(boardSaveChunks).values({ userId, ...data }).onConflictDoUpdate({ target: [boardSaveChunks.userId, boardSaveChunks.uploadId, boardSaveChunks.index], set: { body: data.body } });
    return null;
  } catch { throw new Error("Could not save. Your edits are still here; please try again."); }
});

/** Assembles staged pieces into a slot, with the same validation as a direct write. */
export const commitStagedSave = async (input: { uploadId: string; slot: number; overwrite: boolean }) => attempt(async (userId): Promise<SaveSlot> => {
  const uploadId = z.string().uuid().parse(input.uploadId);
  const mine = and(eq(boardSaveChunks.userId, userId), eq(boardSaveChunks.uploadId, uploadId));
  let snapshot: unknown;
  try {
    const parts = await db().select({ body: boardSaveChunks.body }).from(boardSaveChunks).where(mine).orderBy(asc(boardSaveChunks.index));
    snapshot = JSON.parse(parts.map(part => part.body).join(""));
  } catch { throw new Error("Could not save. Your edits are still here; please try again."); }
  try { return await store(userId, { slot: input.slot, snapshot, overwrite: input.overwrite }); }
  finally { await db().delete(boardSaveChunks).where(mine).catch(() => {}); }
});

/** Reads a slice of a saved snapshot's JSON text; `total` tells the caller when it has everything. */
export const readSaveText = async (input: { slot: number; offset: number }) => attempt(async (userId): Promise<{ text: string; total: number }> => {
  const slot = slotSchema.parse(input.slot);
  const offset = z.number().int().min(0).parse(input.offset);
  let row: { text: string; total: number } | undefined;
  try {
    [row] = await db().select({
      text: sql<string>`substr(${boardSaveSlots.snapshot}::text, ${offset + 1}, ${CHUNK_CHARS})`,
      total: sql<number>`length(${boardSaveSlots.snapshot}::text)`,
    }).from(boardSaveSlots).where(and(eq(boardSaveSlots.userId, userId), eq(boardSaveSlots.slot, slot)));
  } catch { /* Reported below. */ }
  if (!row) throw new Error("Could not load this save. Please try again.");
  return row;
});
