import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { initialBoard } from "@/lib/board-state";
import { useBoardPersistence } from "@/hooks/use-board-persistence";

const api = vi.hoisted(() => ({ user: vi.fn(), write: vi.fn(), read: vi.fn() }));
vi.mock("@/lib/session", () => ({ $getSessionUser: api.user }));
vi.mock("@/lib/board-saves.functions", () => ({ writeBoardSave: api.write, readBoardSave: api.read }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); localStorage.clear(); });

describe("Opened-slot autosave", () => {
  it("autosaves edits to the opened slot, defaulting to slot 1", async () => {
    vi.useFakeTimers(); api.user.mockResolvedValue({ userId: "owner" }); api.read.mockRejectedValue(new Error("empty"));
    api.write.mockResolvedValue({ slot: 4, saved_at: "2026-11-09" });
    const board = initialBoard();
    const { result, rerender } = renderHook(({ snapshot }) => useBoardPersistence(snapshot, vi.fn()), { initialProps: { snapshot: board } });
    await act(async () => {});
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(api.write).not.toHaveBeenCalled();
    expect(result.current.slot).toBe(1);
    act(() => result.current.selectSlot(4, board));
    const changed = { ...board, active: 3, homeView: { zoom: 1.4, x: 50, y: 20 } };
    rerender({ snapshot: changed });
    await act(async () => { vi.advanceTimersByTime(5000); await result.current.flush(); });
    expect(api.write).toHaveBeenCalledTimes(1);
    expect(api.write.mock.calls[0]?.[0].data.slot).toBe(4);
  });
  it("restores the same user's draft into slot 1 when slot 1 is empty", async () => {
    vi.useFakeTimers(); api.user.mockResolvedValue({ userId: "owner" }); api.read.mockRejectedValue(new Error("empty")); api.write.mockResolvedValue({ slot: 1 });
    const stored = { ...initialBoard(), active: 2, activeSubtab: 0, homeView: { zoom: 1.8, x: -30, y: 12 } };
    localStorage.setItem("glow-board-resume:owner", JSON.stringify({ slot: 7, board: stored, scroll: 0 }));
    const restore = vi.fn();
    const { result } = renderHook(() => useBoardPersistence(initialBoard(), restore));
    await act(async () => {});
    expect(restore).toHaveBeenCalledWith(stored);
    expect(result.current.slot).toBe(1);
  });
  it("opens slot 1's save on start, ignoring a draft from another slot", async () => {
    api.user.mockResolvedValue({ userId: "owner" });
    const slotOne = { ...initialBoard(), active: 5 };
    api.read.mockResolvedValue(slotOne);
    localStorage.setItem("glow-board-resume:owner", JSON.stringify({ slot: 7, board: initialBoard() }));
    const restore = vi.fn();
    const { result } = renderHook(() => useBoardPersistence(initialBoard(), restore));
    await act(async () => {});
    expect(api.read).toHaveBeenCalledWith({ data: 1 });
    expect(restore).toHaveBeenCalledWith(slotOne);
    expect(result.current.slot).toBe(1);
  });
  it("never restores another user's draft", async () => {
    api.user.mockResolvedValue({ userId: "other" }); api.read.mockRejectedValue(new Error("empty"));
    localStorage.setItem("glow-board-resume:owner", JSON.stringify({ slot: 7, board: initialBoard() }));
    const restore = vi.fn();
    renderHook(() => useBoardPersistence(initialBoard(), restore));
    await act(async () => {});
    expect(restore).not.toHaveBeenCalled();
  });
  it("queues writes so an older change cannot finish after a newer one", async () => {
    api.user.mockResolvedValue(null);
    let complete: ((value: { slot: number; saved_at: string }) => void) | undefined;
    api.write.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; })).mockResolvedValueOnce({ slot: 2 });
    const board = initialBoard();
    const { result } = renderHook(() => useBoardPersistence(board, vi.fn()));
    await act(async () => {});
    const first = result.current.write({ slot: 2, snapshot: board, overwrite: true });
    const second = result.current.write({ slot: 2, snapshot: { ...board, active: 9 }, overwrite: true });
    await act(async () => {});
    expect(api.write).toHaveBeenCalledTimes(1);
    await act(async () => { complete?.({ slot: 2, saved_at: "now" }); await first; await second; });
    expect(api.write).toHaveBeenCalledTimes(2);
    expect(api.write.mock.calls[1]?.[0].data.snapshot.active).toBe(9);
  });
});