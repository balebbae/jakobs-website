import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardSaveSlots } from "@/db/schema";
import { getSessionUser } from "@/lib/auth.server";
import { boardSchema, type BoardState } from "@/lib/board-state";

/** Largest slot-1 save embedded in the first page; bigger ones are fetched by the browser in pieces. */
const INLINE_LIMIT = 2_000_000;

/** Slot 1 arrives with the first page so the app opens straight onto it. */
export async function readOpeningBoard(): Promise<BoardState | null> {
  try {
    const user = await getSessionUser();
    if (!user) return null;
    const [row] = await db().select({ snapshot: sql<unknown>`case when length(${boardSaveSlots.snapshot}::text) <= ${INLINE_LIMIT} then ${boardSaveSlots.snapshot} end` })
      .from(boardSaveSlots).where(and(eq(boardSaveSlots.userId, user.userId), eq(boardSaveSlots.slot, 1)));
    return row?.snapshot ? boardSchema.parse(row.snapshot) : null;
  } catch { return null; }
}
