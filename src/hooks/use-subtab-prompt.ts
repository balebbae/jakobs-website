import { useEffect, useRef, useState } from "react";

export function useSubtabPrompt(enabled: boolean) {
  const [open, setOpen] = useState(false);
  const prompt = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) { setOpen(false); return; }
    let timer: ReturnType<typeof setTimeout> | undefined;
    let start: { x: number; y: number; id: number } | undefined;
    let held = false;
    const cancel = () => { clearTimeout(timer); timer = undefined; start = undefined; };
    const down = (event: PointerEvent) => {
      cancel(); held = false;
      if (prompt.current?.contains(event.target as Node)) return;
      if ((event.target as Element | null)?.closest?.("[data-no-subtab-prompt]")) { setOpen(false); return; }
      setOpen(false);
      if (!(event.target instanceof Element) || !event.target.matches("[data-tab-background], .board-fixed")) return;
      if (event.button > 0 || event.isPrimary === false) return;
      start = { x: event.clientX, y: event.clientY, id: event.pointerId };
      timer = setTimeout(() => { held = true; setOpen(true); }, 1001);
    };
    const move = (event: PointerEvent) => {
      if (start && event.pointerId === start.id && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) cancel();
    };
    const click = (event: MouseEvent) => {
      if (held) { event.preventDefault(); event.stopPropagation(); held = false; }
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { cancel(); setOpen(false); } };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointermove", move, true);
    document.addEventListener("pointerup", cancel, true);
    document.addEventListener("pointercancel", cancel, true);
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key);
    window.addEventListener("blur", cancel);
    return () => {
      cancel();
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", cancel, true);
      document.removeEventListener("pointercancel", cancel, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key);
      window.removeEventListener("blur", cancel);
    };
  }, [enabled]);
  return { open, prompt, close: () => setOpen(false) };
}