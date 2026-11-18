import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ blobs: [] as { pathname: string; url: string; size: number; uploadedAt: Date; body: string }[], clock: 0 }));
vi.mock("@vercel/blob", () => ({
  list: async ({ prefix }: { prefix: string }) => ({ blobs: store.blobs.filter(blob => blob.pathname.startsWith(prefix)), hasMore: false }),
  del: async (urls: string[]) => { store.blobs = store.blobs.filter(blob => !urls.includes(blob.url)); },
  put: async (pathname: string, body: string) => {
    const name = pathname.replace(".json", `-${store.blobs.length}${store.clock}.json`);
    const blob = { pathname: name, url: `https://blob.test/${name}`, size: body.length, uploadedAt: new Date(++store.clock * 1000), body };
    store.blobs.push(blob);
    return blob;
  },
}));
const owner = vi.hoisted(() => ({ id: "11111111-1111-4111-8111-111111111111" }));
vi.mock("@/lib/auth.server", () => ({ requireOwner: async () => owner.id }));

import { listSaves, saveLocation, writeSave } from "@/lib/board-saves.actions";
import { initialBoard } from "@/lib/board-state";

describe("blob save slots", () => {
  beforeEach(() => { store.blobs = []; store.clock = 0; owner.id = "11111111-1111-4111-8111-111111111111"; });

  it("keeps only the newest file per slot and refuses an unconfirmed overwrite", async () => {
    const snapshot = initialBoard();
    expect((await writeSave({ slot: 2, snapshot, overwrite: false })).ok).toBe(true);
    expect(await writeSave({ slot: 2, snapshot, overwrite: false })).toEqual({ ok: false, message: "This slot is already saved. Choose overwrite." });
    expect((await writeSave({ slot: 2, snapshot: { ...snapshot, active: 3 }, overwrite: true })).ok).toBe(true);
    expect(store.blobs).toHaveLength(2);
    const saves = await listSaves();
    expect(saves).toEqual({ ok: true, value: [{ slot: 2, saved_at: new Date(2000).toISOString() }] });
    expect(store.blobs).toHaveLength(1);
    const location = await saveLocation({ slot: 2 });
    expect(location.ok && JSON.parse(store.blobs.find(blob => blob.url === location.value.url)!.body).active).toBe(3);
  });

  it("hides one owner's saves from another and rejects invalid slots", async () => {
    await writeSave({ slot: 1, snapshot: initialBoard(), overwrite: false });
    expect((await writeSave({ slot: 11, snapshot: initialBoard(), overwrite: false })).ok).toBe(false);
    owner.id = "22222222-2222-4222-8222-222222222222";
    expect(await listSaves()).toEqual({ ok: true, value: [] });
    expect((await saveLocation({ slot: 1 })).ok).toBe(false);
  });
});
