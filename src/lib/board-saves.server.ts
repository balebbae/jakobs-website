import "server-only";
import { getSessionUser } from "@/lib/auth.server";
import { ownerSaves } from "@/lib/board-saves.store";
import { boardSchema, type BoardState } from "@/lib/board-state";

/** Largest slot-1 save embedded in the first page; bigger ones are downloaded by the browser. */
const INLINE_LIMIT = 2_000_000;

/** Slot 1 arrives with the first page so the app opens straight onto it. */
export async function readOpeningBoard(): Promise<BoardState | null> {
  try {
    const user = await getSessionUser();
    if (!user || !process.env["BLOB_READ_WRITE_TOKEN"]) return null;
    const save = (await ownerSaves(user.userId)).find(item => item.slot === 1);
    if (!save || save.size > INLINE_LIMIT) return null;
    return boardSchema.parse(await (await fetch(save.url)).json());
  } catch { return null; }
}
