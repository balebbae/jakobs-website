import "server-only";
import { del, list } from "@vercel/blob";
import type { SaveSlot } from "@/lib/board-state";

export type StoredSave = SaveSlot & { url: string; size: number };

/** Every write is a new file under the owner's slot folder; the newest file in a folder is the save. */
export const slotFolder = (userId: string, slot: number) => `saves/${userId}/slot-${slot}/`;

/** Lists the owner's current saves and removes files that a newer write replaced. */
export async function ownerSaves(userId: string): Promise<StoredSave[]> {
  const newest = new Map<number, StoredSave>();
  const replaced: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: `saves/${userId}/`, ...(cursor ? { cursor } : {}) });
    for (const blob of page.blobs) {
      const slot = Number(/\/slot-(\d+)\//.exec(blob.pathname)?.[1]);
      if (!(slot >= 1 && slot <= 10)) continue;
      const save = { slot, saved_at: blob.uploadedAt.toISOString(), url: blob.url, size: blob.size };
      const current = newest.get(slot);
      if (!current || current.saved_at < save.saved_at) { if (current) replaced.push(current.url); newest.set(slot, save); }
      else replaced.push(save.url);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  if (replaced.length) await del(replaced).catch(() => {});
  return [...newest.values()].sort((a, b) => a.slot - b.slot);
}
