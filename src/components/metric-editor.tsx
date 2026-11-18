"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProgressTitle } from "@/components/progress-title";
import { HoldZone } from "@/components/hold-zone";

export type MetricState = { label: string; value: number; boxMode?: boolean | undefined; boxTotal?: number | undefined; boxFilled?: boolean[] | undefined };

/** Shared by the fixed anchor and movable metric boxes. */
export function MetricEditor({ metric, label, onChange }: { metric: MetricState; label: string; onChange: (change: Partial<MetricState>) => void }) {
  const latest = useRef(metric); latest.current = metric;
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number; value: number } | null>(null);
  const consumed = useRef(false);
  const cancel = () => { if (hold.current) clearTimeout(hold.current); hold.current = null; origin.current = null; };
  useEffect(() => () => { if (hold.current) clearTimeout(hold.current); }, []);
  const total = metric.boxTotal ?? 1;
  const step = (delta: number) => onChange({ value: Math.max(0, Math.min(100, latest.current.value + delta)) });
  return <div data-no-subtab-prompt className="space-y-1" onContextMenu={event => event.preventDefault()}
    onPointerDownCapture={event => {
      if (event.button !== 0 || (event.target instanceof Element && event.target.closest("input, textarea"))) return;
      cancel(); consumed.current = false;
      origin.current = { x: event.clientX, y: event.clientY, value: metric.value };
      hold.current = setTimeout(() => {
        const value = origin.current?.value ?? latest.current.value;
        consumed.current = true;
        onChange({ boxMode: !latest.current.boxMode, boxTotal: latest.current.boxTotal ?? 1, boxFilled: latest.current.boxFilled ?? [], value });
        cancel();
      }, 4000);
    }} onPointerMoveCapture={event => {
      if (origin.current && Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 4) cancel();
    }} onPointerUpCapture={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
    onClickCapture={event => { if (consumed.current) { consumed.current = false; event.preventDefault(); event.stopPropagation(); } }}>
    <div data-metric-heading className={`flex items-center text-xs ${metric.boxMode ? "gap-1" : "gap-2"}`}>
      <ProgressTitle value={metric.label} label={`${label} title`} rigid={metric.boxMode === true} onChange={label => onChange({ label })} />
      {metric.boxMode ? <input type="number" min={1} step={1} value={total} aria-label={`${label} total boxes`}
        className="glow-number ml-auto shrink-0 bg-transparent text-right outline-none"
        style={{ width: `calc(${String(total).length}ch + 4px)` }}
        onChange={event => {
          const next = Math.max(1, Math.min(10000, Math.trunc(Number(event.target.value) || 1)));
          onChange({ boxTotal: next, boxFilled: (latest.current.boxFilled ?? []).slice(0, next) });
        }} /> : <>
        <input type="number" min={0} max={100} value={metric.value} aria-label={`${label} percent`}
          onChange={event => onChange({ value: Math.max(0, Math.min(100, Number(event.target.value))) })}
          className="glow-number w-8 shrink-0 bg-transparent text-right outline-none" />
        <span>%</span>
      </>}
    </div>
    {metric.boxMode ? <div role="group" aria-label={`${label} completion boxes`} className="flex flex-wrap justify-center gap-1 py-0.5">
      {Array.from({ length: total }, (_, index) => <Button key={index} variant="outline" role="checkbox"
        aria-label={`${label} box ${index + 1}`} aria-checked={metric.boxFilled?.[index] ?? false}
        className="h-3 w-3 shrink-0 rounded-none border-foreground bg-background p-0 text-foreground shadow-none hover:bg-background aria-checked:bg-foreground aria-checked:hover:bg-foreground"
        onClick={() => {
          const filled = Array.from({ length: total }, (_, i) => latest.current.boxFilled?.[i] ?? false);
          filled[index] = !filled[index]; onChange({ boxFilled: filled });
        }} />)}
    </div> : <div className="relative">
      <div className="glow-track h-2 p-0"><div className="glow-fill h-full transition-all" style={{ width: `${metric.value}%` }} /></div>
      <HoldZone label={`Decrease ${metric.label}`} onStep={() => step(-1)} className="absolute -bottom-1.5 -top-1.5 left-0 w-1/2 cursor-w-resize" />
      <HoldZone label={`Increase ${metric.label}`} onStep={() => step(1)} className="absolute -bottom-1.5 -top-1.5 right-0 w-1/2 cursor-e-resize" />
    </div>}
  </div>;
}