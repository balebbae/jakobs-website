"use client";

import { useEffect, useRef, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { Save, FolderOpen, Check, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBoardSaves, readBoardSave } from "@/lib/board-saves.functions";
import { useBoardPersistence } from "@/hooks/use-board-persistence";
import type { BoardState, SaveSlot } from "@/lib/board-state";

export function BoardSaveMenu({ snapshot, onRestore, opening = null }: { snapshot: BoardState; onRestore: (state: BoardState) => void; opening?: BoardState | null }) {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirm, setConfirm] = useState<{ slot: number; action: "overwrite" | "load" } | null>(null);
  const persistence = useBoardPersistence(snapshot, onRestore, opening);
  const lastSlot = persistence.slot;
  const [ask, setAsk] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const hover = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lock = useRef(false);
  const cancelHover = () => { if (hover.current) clearTimeout(hover.current); hover.current = null; };
  useEffect(() => {
    const dismiss = (event: PointerEvent) => { if (root.current && !root.current.contains(event.target as Node)) { cancelHover(); setOpen(false); setConfirm(null); setAsk(false); setMessage(""); } };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { cancelHover(); setOpen(false); setConfirm(null); } };
    document.addEventListener("pointerdown", dismiss); document.addEventListener("keydown", escape);
    return () => { cancelHover(); document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);
  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try { await action(); } catch (error) { setOpen(true); setMessage(error instanceof Error ? error.message : "Could not access saves."); }
    finally { lock.current = false; setBusy(false); }
  };
  const reveal = () => { setOpen(true); void run(async () => { setSlots(await listBoardSaves()); }); };
  const save = (slot: number, overwrite: boolean) => void run(async () => {
    await persistence.flush();
    const saved = await persistence.write({ slot, snapshot, overwrite });
    setSlots(previous => [...previous.filter(item => item.slot !== slot), saved].sort((a, b) => a.slot - b.slot));
    persistence.selectSlot(slot, snapshot); setConfirm(null); setAsk(false); setMessage(`Saved · Slot ${slot}`);
  });
  const quickSave = () => { cancelHover(); void run(async () => {
    const current = await listBoardSaves(); setSlots(current);
    const available = Array.from({ length: 10 }, (_, i) => i + 1).find(slot => !current.some(item => item.slot === slot));
    if (!available) { setOpen(true); setMessage("All slots saved. Choose one to overwrite."); return; }
    const saved = await persistence.write({ slot: available, snapshot, overwrite: false });
    setSlots([...current, saved]); persistence.selectSlot(available, snapshot); setMessage(`Saved · Slot ${available}`);
  }); };
  return <div ref={root} className="board-save" data-ready={hydrated}>
    <Button variant="outline" size="icon" className="glow-button h-6 w-7 p-1" aria-label="Save all tabs" title="Save all tabs" aria-expanded={open} aria-controls="save-slots" disabled={busy}
      onPointerEnter={() => { cancelHover(); hover.current = setTimeout(reveal, 1001); }} onPointerLeave={cancelHover}
      onClick={() => { if (lastSlot === null) quickSave(); else { cancelHover(); setMessage(""); setAsk(true); } }} onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); reveal(); } }}>
      {busy ? <LoaderCircle className="animate-spin" /> : <Save />}
    </Button>
    {ask && lastSlot !== null && !open && <div role="dialog" aria-label="Overwrite last slot" className="save-status glow-box flex items-center gap-1">
      <span>Overwrite slot {lastSlot}?</span>
      <Button variant="outline" className="glow-button h-6 px-1 text-[10px]" disabled={busy} onClick={() => save(lastSlot, true)}>Yes</Button>
      <Button variant="outline" className="glow-button h-6 px-1 text-[10px]" onClick={() => setAsk(false)}>No</Button>
    </div>}
    {!open && !ask && (message || persistence.error) && <div role="status" className="save-status glow-box">{persistence.error || message}</div>}
    {open && <section id="save-slots" aria-label="Saved slots" className="save-menu glow-box">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(slot => {
        const saved = slots.find(item => item.slot === slot);
        return <div key={slot} className="save-slot">
          <div className="min-w-0"><span>Slot {slot}</span><span className="save-time">{saved ? new Date(saved.saved_at).toLocaleString() : "Empty"}</span></div>
          {saved && <Button variant="outline" size="icon" className="glow-button h-6 w-6 p-1" disabled={busy} aria-label={`Load slot ${slot}`} title="Load" onClick={() => setConfirm({ slot, action: "load" })}><FolderOpen /></Button>}
          <Button variant="outline" size="icon" className="glow-button h-6 w-6 p-1" disabled={busy} aria-label={`${saved ? "Overwrite" : "Save to"} slot ${slot}`} title={saved ? "Overwrite" : "Save"} onClick={() => saved ? setConfirm({ slot, action: "overwrite" }) : save(slot, false)}><Save /></Button>
        </div>;
      })}
      {confirm && <div className="save-confirm"><span>{confirm.action === "load" ? "Replace current edits" : "Overwrite save"} · Slot {confirm.slot}?</span>
        <Button variant="outline" size="icon" className="glow-button h-6 w-6 p-1" aria-label="Confirm" disabled={busy} onClick={() => {
          if (confirm.action === "overwrite") save(confirm.slot, true);
          else void run(async () => { await persistence.flush(); const restored = await readBoardSave({ data: confirm.slot }); persistence.selectSlot(confirm.slot, restored); onRestore(restored); setConfirm(null); setOpen(false); setMessage(""); });
        }}><Check /></Button>
        <Button variant="outline" className="glow-button h-6 px-1 text-[10px]" onClick={() => setConfirm(null)}>Cancel</Button>
      </div>}
      {message && <p role="status" className="save-message">{message}</p>}
    </section>}
  </div>;
}