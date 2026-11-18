"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { BarGraphState } from "@/lib/board-state";

export function newBarGraph(): BarGraphState {
  const width = 260;
  const x = typeof window === "undefined" ? 40 : Math.max(0, (window.innerWidth - width) / 2);
  return { id: crypto.randomUUID(), xTitle: "", yTitle: "", values: [0, 0], x, y: 260, width, height: 240, mode: "percent", denominator: 1 };
}

export function graphPercentage(y: number, top: number, height: number) {
  if (height <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - (y - top) / height) * 100)));
}

export function clampDenominator(n: number) {
  return Math.max(1, Math.min(25, Math.round(Number.isFinite(n) ? n : 1)));
}

export function addBar(graph: BarGraphState): BarGraphState {
  return { ...graph, values: [...graph.values, 0] };
}
export function removeLastBar(graph: BarGraphState): BarGraphState {
  return graph.values.length <= 1 ? graph : { ...graph, values: graph.values.slice(0, -1) };
}

export function InsertGraph({ onInsert }: { onInsert: () => void }) {
  return <Button variant="outline" aria-label="Insert bar graph" title="Insert bar graph" onClick={onInsert}
    className="glow-button graph-insert aspect-square h-auto w-[68.2667px] max-w-[10.1333vw] self-end p-1">
    <span className="graph-symbol" aria-hidden="true"><span /><span /></span>
  </Button>;
}

export function BarGraphs({ graphs, onChange, scale = 1 }: { graphs: BarGraphState[]; onChange: (graphs: BarGraphState[]) => void; scale?: number }) {
  const latest = useRef(graphs);
  latest.current = graphs;
  return <section className="bar-graphs" aria-label="Bar graphs">
    {graphs.map((graph, i) => <Graph key={graph.id} graph={graph} number={i + 1} scale={scale}
      onRemove={() => onChange(latest.current.filter(item => item.id !== graph.id))}
      onChange={changes => onChange(latest.current.map(item => item.id === graph.id ? { ...item, ...changes } : item))} />)}
  </section>;
}

/** Counts taps; resolves after a short pause so double and triple taps don't both fire. */
function useTapCounter(onResolve: (count: number) => void, delay = 300) {
  const state = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null });
  const cb = useRef(onResolve); cb.current = onResolve;
  return () => {
    const s = state.current;
    s.count += 1;
    if (s.timer) clearTimeout(s.timer);
    s.timer = setTimeout(() => { const c = s.count; s.count = 0; s.timer = null; cb.current(c); }, delay);
  };
}

function Graph({ graph, number, onChange, onRemove, scale }: { graph: BarGraphState; number: number; scale: number; onChange: (changes: Partial<BarGraphState>) => void; onRemove: () => void }) {
  const dragging = useRef<number | null>(null);
  const gesture = useRef<{ corner: { x: number; y: number } | null; x: number; y: number; start: BarGraphState; moved: boolean } | null>(null);
  const taps = useRef<number[]>([]);
  const [editingDenominator, setEditingDenominator] = useState(false);
  const fraction = graph.mode === "fraction";
  const d = graph.denominator;
  const tapY = useTapCounter(count => { if (count === 2) onChange({ mode: fraction ? "percent" : "fraction" }); });
  const tapX = useTapCounter(count => { if (count === 2) onChange(addBar(graph)); else if (count >= 3) onChange(removeLastBar(graph)); });

  const setValue = (index: number, value: number) => {
    let v = Math.max(0, Math.min(100, value));
    if (fraction) v = Math.round(Math.round((v / 100) * d) / d * 100);
    onChange({ values: graph.values.map((x, i) => i === index ? v : x) });
  };
  const fromPointer = (event: React.PointerEvent<HTMLElement>, index: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setValue(index, graphPercentage(event.clientY, rect.top, rect.height));
  };
  const label = (v: number) => fraction ? `${Math.round((v / 100) * d)}/${d}` : `${v}%`;

  return <div className="bar-graph glow-box" role="group" aria-label={`Bar graph ${number}`}
    style={{ left: graph.x, top: graph.y, width: graph.width, height: graph.height }}
    onPointerDown={event => {
      if (event.button !== 0 || event.target !== event.currentTarget) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const rect = event.currentTarget.getBoundingClientRect();
      const edge = Math.min(16, rect.width / 4, rect.height / 4);
      const h = event.clientX - rect.left <= edge ? -1 : rect.right - event.clientX <= edge ? 1 : 0;
      const v = event.clientY - rect.top <= edge ? -1 : rect.bottom - event.clientY <= edge ? 1 : 0;
      gesture.current = { corner: h && v ? { x: h, y: v } : null, x: event.clientX, y: event.clientY, start: graph, moved: false };
    }}
    onPointerMove={event => {
      const g = gesture.current;
      if (!g) {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const edge = Math.min(16, rect.width / 4, rect.height / 4);
        const l = event.clientX - rect.left <= edge, r = rect.right - event.clientX <= edge;
        const t = event.clientY - rect.top <= edge, b = rect.bottom - event.clientY <= edge;
        event.currentTarget.style.cursor = (l || r) && (t || b) ? ((l && t) || (r && b) ? "nwse-resize" : "nesw-resize") : "move";
        return;
      }
      const dx = (event.clientX - g.x) / scale, dy = (event.clientY - g.y) / scale;
      if (Math.hypot(dx, dy) > 4) g.moved = true;
      if (!g.moved) return;
      taps.current = [];
      if (!g.corner) { onChange({ x: g.start.x + dx, y: g.start.y + dy }); return; }
      const width = Math.max(160, Math.min(3000, g.start.width + g.corner.x * dx));
      const height = Math.max(140, Math.min(3000, g.start.height + g.corner.y * dy));
      onChange({ width, height, x: g.start.x + (g.corner.x < 0 ? g.start.width - width : 0), y: g.start.y + (g.corner.y < 0 ? g.start.height - height : 0) });
    }}
    onPointerUp={event => {
      const g = gesture.current;
      gesture.current = null;
      if (!g || g.moved) return;
      const now = event.timeStamp;
      const recent = taps.current.filter(t => now - t < 2000);
      recent.push(now);
      if (recent.length >= 4) { taps.current = []; onRemove(); } else taps.current = recent;
    }}
    onPointerCancel={() => { gesture.current = null; taps.current = []; }}>
    <div className="graph-y-title"><input aria-label={`Graph ${number} Y axis title`} placeholder="Y axis title" value={graph.yTitle}
      onChange={event => onChange({ yTitle: event.target.value })} /></div>
    <div className="graph-scale" role="button" tabIndex={-1} aria-label={`Graph ${number} Y axis`} title="Double tap to switch fractions / percentages"
      onPointerUp={tapY}>
      {fraction ? <>
        {Array.from({ length: d + 1 }, (_, k) => d - k).map(k => <span key={k} className="graph-tick" style={{ top: `${(1 - k / d) * 100}%` }}>
          {k === d ? editingDenominator
            ? <input autoFocus type="number" min={1} max={25} aria-label={`Graph ${number} fraction amount`} className="glow-number graph-denominator" defaultValue={d}
                onPointerUp={e => e.stopPropagation()}
                onBlur={e => { onChange({ denominator: clampDenominator(+e.target.value) }); setEditingDenominator(false); }}
                onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }} />
            : <button type="button" className="graph-top-label" aria-label={`Change fraction amount, currently ${d}/${d}`}
                onPointerUp={e => e.stopPropagation()} onClick={() => setEditingDenominator(true)}>{d}/{d}</button>
            : d <= 10 || k === 0 ? `${k}/${d}` : ""}
        </span>)}
      </> : <>
        <span className="graph-tick" style={{ top: "0%" }}>100%</span>
        <span className="graph-tick" style={{ top: "50%" }}>50%</span>
        <span className="graph-tick" style={{ top: "100%" }}>0%</span>
      </>}
    </div>
    <div className="graph-plot">
      {fraction && Array.from({ length: d - 1 }, (_, k) => <span key={k} className="graph-gridline" style={{ top: `${((k + 1) / d) * 100}%` }} aria-hidden="true" />)}
      {graph.values.map((value, index) => <Button key={index} variant="ghost" role="slider" aria-label={`Graph ${number} bar ${index + 1}`}
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-valuetext={label(value)} aria-orientation="vertical"
        title={`Bar ${index + 1}: ${label(value)}`} className="graph-bar h-full p-0 bg-transparent text-foreground hover:bg-transparent hover:text-foreground"
        style={{ width: `${Math.min(34, 70 / graph.values.length)}%` }} onPointerDown={event => {
          if (event.button !== 0) return;
          event.preventDefault(); dragging.current = index; event.currentTarget.setPointerCapture?.(event.pointerId); fromPointer(event, index);
        }} onPointerMove={event => { if (dragging.current === index) fromPointer(event, index); }}
        onPointerUp={() => { dragging.current = null; }} onPointerCancel={() => { dragging.current = null; }}
        onLostPointerCapture={() => { dragging.current = null; }} onKeyDown={event => {
          const step = fraction ? 100 / d : 1;
          const next = event.key === "ArrowUp" || event.key === "ArrowRight" ? value + step : event.key === "ArrowDown" || event.key === "ArrowLeft" ? value - step : event.key === "Home" ? 0 : event.key === "End" ? 100 : null;
          if (next !== null) { event.preventDefault(); setValue(index, next); }
        }}>
        <span className="graph-bar-fill" style={{ height: `${value}%` }} />
        <span className="graph-value">{label(value)}</span>
      </Button>)}
    </div>
    <div className="graph-x-axis" role="button" tabIndex={-1} aria-label={`Graph ${number} X axis`} title="Double tap: add bar · Triple tap: remove last bar" onPointerUp={tapX} />
    <input className="graph-x-title" aria-label={`Graph ${number} X axis title`} placeholder="X axis title" value={graph.xTitle}
      onChange={event => onChange({ xTitle: event.target.value })} />
  </div>;
}
