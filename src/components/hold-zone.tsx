"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

/** Invisible click zone: one step per click, accelerating repeat after a 1s hold. */
export function HoldZone({ label, onStep, className }: { label: string; onStep: () => void; className: string }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const stop = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; };
  const start = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation(); stop(); onStep();
    let delay = 150;
    const tick = () => { onStep(); delay = Math.max(15, delay * 0.88); timer.current = setTimeout(tick, delay); };
    timer.current = setTimeout(tick, 1000);
  };
  return <Button variant="ghost" type="button" aria-label={label} onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
    onContextMenu={e => e.preventDefault()} className={`${className} h-auto rounded-none border-0 bg-transparent p-0 touch-none select-none hover:bg-transparent`} />;
}
