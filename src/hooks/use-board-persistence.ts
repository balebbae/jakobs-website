import { useEffect, useRef, useState } from "react";
import { $getSessionUser } from "@/lib/session";
import { boardSchema, type BoardState } from "@/lib/board-state";
import { readBoardSave, writeBoardSave } from "@/lib/board-saves.functions";

export function useBoardPersistence(snapshot: BoardState, onRestore: (board: BoardState) => void, opening: BoardState | null = null) {
  const [slotReady] = [opening ? 1 : null];
  const [slot, setSlot] = useState<number | null>(slotReady);
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const activeSlot = useRef<number | null>(null);
  const saved = useRef("");
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const restore = useRef(onRestore);
  restore.current = onRestore;
  const scroll = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void $getSessionUser().then(user => {
      if (cancelled || !user) return;
      const key = `glow-board-resume:${user.userId}`;
      // Opening the app always opens slot 1; its save wins over any browser draft.
      if (opening) { saved.current = JSON.stringify(opening); activeSlot.current = 1; setSlot(1); setOwnerKey(key); return; }
      readBoardSave({ data: 1 }).then(board => {
        if (cancelled) return;
        latest.current = board; restore.current(board);
        saved.current = JSON.stringify(board);
      }, () => {
        if (cancelled) return;
        try {
          const raw = localStorage.getItem(key);
          if (raw) { const board = boardSchema.parse(JSON.parse(raw).board); latest.current = board; restore.current(board); saved.current = ""; return; }
        } catch { /* Ignore invalid or unavailable browser storage. */ }
        saved.current = JSON.stringify(latest.current);
      }).finally(() => { if (!cancelled) { activeSlot.current = 1; setSlot(1); setOwnerKey(key); } });
    }).catch(() => { /* Cloud saves still retain their verified identity checks. */ });
    return () => { cancelled = true; };
  }, []);

  const remember = () => {
    if (!ownerKey) return;
    try { localStorage.setItem(ownerKey, JSON.stringify({ board: latest.current, slot: activeSlot.current, scroll: scroll.current })); }
    catch { /* Cloud autosave remains available if browser storage is full. */ }
  };
  useEffect(() => { remember(); }, [snapshot, slot, ownerKey]);
  useEffect(() => {
    const onScroll = () => { scroll.current = window.scrollY; remember(); };
    const onHide = () => { remember(); };
    window.addEventListener("scroll", onScroll);
    window.addEventListener("pagehide", onHide);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("pagehide", onHide); };
  }, [ownerKey]);

  const write = (data: { slot: number; snapshot: BoardState; overwrite: boolean }) => {
    const task = queue.current.catch(() => {}).then(() => writeBoardSave({ data }));
    queue.current = task;
    return task;
  };
  // Every change autosaves (debounced) to the active slot.
  useEffect(() => {
    if (slot === null || !ownerKey) return;
    const timer = setTimeout(() => {
      const json = JSON.stringify(latest.current);
      if (json === saved.current || activeSlot.current === null) return;
      const target = activeSlot.current;
      write({ slot: target, snapshot: latest.current, overwrite: true })
        .then(() => { if (activeSlot.current === target) saved.current = json; setError(""); })
        .catch(() => setError("Autosave failed. Your edits are still here."));
    }, 800);
    return () => clearTimeout(timer);
  }, [snapshot, slot, ownerKey]);
  const flush = async () => { await queue.current.catch(() => {}); };
  const selectSlot = (target: number, board: BoardState) => {
    activeSlot.current = target;
    saved.current = JSON.stringify(board);
    setSlot(target);
    setError("");
  };
  return { slot, selectSlot, write, flush, error };
}