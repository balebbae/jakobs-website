import { describe, expect, it } from "vitest";
import { boardSchema, initialBoard, newDashboard, reorderParent, reorderSubtab } from "@/lib/board-state";

describe("Tab reordering", () => {
  it("moves parents left and right with all content and the active child", () => {
    const board = initialBoard();
    board.active = 0; board.activeSubtab = 0;
    const parent = board.dashboards[0];
    if (!parent) throw new Error("Missing parent");
    parent.title = "First"; parent.subTabs = [{ ...newDashboard(), title: "Child" }];
    parent.items[0] = { label: "Goal", value: 42, text: "Keep my note" };
    const right = reorderParent(board, 0, 3);
    expect(right.active).toBe(3);
    expect(right.activeSubtab).toBe(0);
    expect(right.dashboards[3]).toBe(parent);
    const left = reorderParent(right, 3, 0);
    expect(left.active).toBe(0);
    expect(boardSchema.parse(left).dashboards[0]?.items[0]?.value).toBe(42);
    expect(left.dashboards[0]?.subTabs[0]?.title).toBe("Child");
  });
  it("moves subtabs up and down only within their parent, retaining the open content", () => {
    const board = initialBoard(); board.active = 0; board.activeSubtab = 0;
    const parent = board.dashboards[0];
    if (!parent) throw new Error("Missing parent");
    parent.subTabs = ["One", "Two", "Three"].map(title => ({ ...newDashboard(), title }));
    const down = reorderSubtab(board, 0, 0, 2);
    expect(down.dashboards[0]?.subTabs.map(child => child.title)).toEqual(["Two", "Three", "One"]);
    expect(down.activeSubtab).toBe(2);
    expect(down.dashboards[1]).toBe(board.dashboards[1]);
    const up = reorderSubtab(down, 0, 2, 0);
    expect(up.activeSubtab).toBe(0);
    expect(boardSchema.parse(up).dashboards[0]?.subTabs.map(child => child.title)).toEqual(["One", "Two", "Three"]);
  });
  it("keeps an open tab selected when a neighboring tab passes it", () => {
    const board = { ...initialBoard(), active: 2 };
    expect(reorderParent(board, 0, 3).active).toBe(1);
    expect(reorderParent(board, 4, 0).active).toBe(3);
  });
});
import { addParent as addParentTab, initialBoard as freshBoard } from "@/lib/board-state";
import { test as t2, expect as e2 } from "vitest";
t2("parent tabs cap at 30", () => {
  let b = freshBoard();
  for (let i = 0; i < 40; i++) b = addParentTab(b);
  e2(b.dashboards.length).toBe(30);
});
