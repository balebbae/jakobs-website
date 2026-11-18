import { describe, expect, it } from "vitest";
import { dashboardSchema, newDashboard } from "@/lib/board-state";

describe("inserted boxes and page view", () => {
  it("loads older saves with no inserted boxes and default view", () => {
    const { bars, notes, view, ...old } = { ...newDashboard(), subTabs: [] };
    const parsed = dashboardSchema.parse(old);
    expect(parsed.bars).toEqual([]);
    expect(parsed.notes).toEqual([]);
    expect(parsed.view).toEqual({ zoom: 1, x: 0, y: 0 });
  });
});

describe("original bars and paragraphs as template", () => {
  it("new dashboards keep one permanent bar plus 6 movable bars and 7 movable paragraphs", () => {
    const d = newDashboard();
    expect(d.items).toHaveLength(1);
    expect(d.bars).toHaveLength(6);
    expect(d.notes).toHaveLength(7);
  });
  it("starts every template metric at zero and gives all notes equal dimensions without overlaps", () => {
    const d = newDashboard();
    expect([...d.items, ...d.bars].map(bar => bar.value)).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(d.notes.map(note => [note.width, note.height])).toEqual(Array.from({ length: 7 }, () => [160, 150]));
    for (const [i, note] of d.notes.entries()) {
      for (const other of d.notes.slice(i + 1)) {
        expect(note.x + note.width < other.x || other.x + other.width < note.x || note.y + note.height < other.y || other.y + other.height < note.y).toBe(true);
      }
    }
  });
  it("converts older saves with 4 + 3 fixed boxes into movable ones, keeping values and text", () => {
    const item = (label: string, value: number, text: string) => ({ label, value, text });
    const old = { title: "", photos: [], subTabs: [], items: [item("A", 10, "a"), item("B", 20, "b"), item("C", 0, ""), item("D", 0, "")], mini: [item("M", 30, "m"), item("N", 0, ""), item("O", 0, "")] };
    const parsed = dashboardSchema.parse(old);
    expect(parsed.items).toEqual([item("A", 10, "a")]);
    expect(parsed.bars.map(b => b.value)).toEqual([20, 0, 0, 30, 0, 0]);
    expect(parsed.notes.map(n => n.text)).toEqual(["a", "b", "", "", "m", "", ""]);
  });
});
