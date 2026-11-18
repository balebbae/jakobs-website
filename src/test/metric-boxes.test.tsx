import { useState } from "react";
import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MetricEditor, type MetricState } from "@/components/metric-editor";
import { boardSchema, initialBoard } from "@/lib/board-state";

function Metric() {
  const [metric, setMetric] = useState<MetricState>({ label: "metric 1", value: 0 });
  return <MetricEditor metric={metric} label="Metric" onChange={change => setMetric(previous => ({ ...previous, ...change }))} />;
}
function pointer(element: HTMLElement, type: string) {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, { button: { value: 0 }, clientX: { value: 0 }, clientY: { value: 0 } });
  fireEvent(element, event);
}
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("Metric completion boxes", () => {
  it("switches after four seconds, not earlier, and starts with one empty box", () => {
    vi.useFakeTimers(); render(<Metric />);
    pointer(screen.getByRole("button", { name: "Increase metric 1" }), "pointerdown");
    act(() => vi.advanceTimersByTime(3999));
    expect(screen.queryByRole("checkbox")).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByLabelText("Metric total boxes")).toHaveValue(1);
  });
  it("changes the total and fills each box independently", () => {
    vi.useFakeTimers(); render(<Metric />);
    pointer(screen.getByRole("button", { name: "Increase metric 1" }), "pointerdown");
    act(() => vi.advanceTimersByTime(4000));
    fireEvent.change(screen.getByLabelText("Metric total boxes"), { target: { value: "7" } });
    expect(screen.getAllByRole("checkbox")).toHaveLength(7);
    // Release the long hold: the resulting click must not fill a square.
    fireEvent.click(screen.getByRole("checkbox", { name: "Metric box 1" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Metric box 2" }));
    expect(screen.getByRole("checkbox", { name: "Metric box 2" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("checkbox", { name: "Metric box 1" })).toHaveAttribute("aria-checked", "false");
  });
  it("cancels conversion when a hold is released early", () => {
    vi.useFakeTimers(); render(<Metric />);
    const zone = screen.getByRole("button", { name: "Increase metric 1" });
    pointer(zone, "pointerdown"); act(() => vi.advanceTimersByTime(3000));
    pointer(zone, "pointerup"); act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByRole("checkbox")).toBeNull();
  });
  it("retains mode, total and filled squares for anchor and floating metrics in snapshots", () => {
    const board = initialBoard();
    const dashboard = board.dashboards[0];
    if (!dashboard) throw new Error("Missing dashboard");
    Object.assign(dashboard.items[0] ?? {}, { boxMode: true, boxTotal: 7, boxFilled: [false, true] });
    Object.assign(dashboard.bars[0] ?? {}, { boxMode: true, boxTotal: 1, boxFilled: [true], height: 41 });
    const restored = boardSchema.parse(JSON.parse(JSON.stringify(board)));
    expect(restored.dashboards[0]?.items[0]?.boxTotal).toBe(7);
    expect(restored.dashboards[0]?.items[0]?.boxFilled).toEqual([false, true]);
    expect(restored.dashboards[0]?.bars[0]?.boxMode).toBe(true);
    expect(restored.dashboards[0]?.bars[0]?.boxFilled).toEqual([true]);
    expect(restored.dashboards[0]?.bars[0]?.height).toBe(41);
  });
});