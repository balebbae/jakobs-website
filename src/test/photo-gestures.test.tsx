import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BackgroundPhotos, type Photo } from "@/components/background-photos";

const photo: Photo = { id: "p", src: "photo.png", x: 100, y: 100, width: 200, ratio: 2, rotation: 0, flipped: false };
function setup() {
  const update = vi.fn();
  const remove = vi.fn();
  render(<BackgroundPhotos editor={{ photos: [photo], selected: "p", select: vi.fn(), update, remove, add: vi.fn(), addVideo: vi.fn(), collapseGroup: vi.fn(), openGroup: vi.fn(), updateGroup: vi.fn(), snap: vi.fn() }} />);
  const element = screen.getByAltText("Uploaded background photo").closest<HTMLElement>(".background-photo");
  if (!element) throw new Error("Photo missing");
  element.setPointerCapture = vi.fn();
  element.getBoundingClientRect = () => ({ left: 100, top: 100, right: 300, bottom: 200, width: 200, height: 100, x: 100, y: 100, toJSON: () => ({}) });
  function pointer(type: string, x: number, y: number, time = 0) {
    const event = new Event(type, { bubbles: true });
    Object.defineProperties(event, { button: { value: 0 }, pointerId: { value: 1 }, clientX: { value: x }, clientY: { value: y }, timeStamp: { value: time } });
    fireEvent(element as HTMLElement, event);
  }
  return { update, remove, pointer };
}
describe("Photo gestures", () => {
  it.each([[-1, -1], [1, -1], [-1, 1], [1, 1]])("resizes corner %s,%s while anchoring the opposite corner", (x, y) => {
    const { pointer, update } = setup();
    const startX = x < 0 ? 101 : 299;
    const startY = y < 0 ? 101 : 199;
    pointer("pointerdown", startX, startY);
    pointer("pointermove", startX + x * 40, startY + y * 20);
    expect(update).toHaveBeenLastCalledWith("p", { width: 240, x: x < 0 ? 60 : 100, y: y < 0 ? 80 : 100 });
  });
  it("moves a photo by dragging its middle", () => {
    const { pointer, update } = setup();
    pointer("pointerdown", 180, 150);
    pointer("pointermove", 210, 170);
    expect(update).toHaveBeenCalledWith("p", { x: 130, y: 120 });
  });
  it("deletes after three taps in less than two seconds", () => {
    const { pointer, remove } = setup();
    for (const time of [100, 600, 2099]) { pointer("pointerdown", 180, 150, time); pointer("pointerup", 180, 150, time); }
    expect(remove).toHaveBeenCalledExactlyOnceWith("p");
  });
  it("does not delete when three taps take two seconds", () => {
    const { pointer, remove } = setup();
    for (const time of [100, 600, 2100]) { pointer("pointerdown", 180, 150, time); pointer("pointerup", 180, 150, time); }
    expect(remove).not.toHaveBeenCalled();
  });
  it("does not count a drag as a deletion tap", () => {
    const { pointer, remove } = setup();
    for (const time of [0, 100]) { pointer("pointerdown", 180, 150, time); pointer("pointerup", 180, 150, time); }
    pointer("pointerdown", 180, 150, 200);
    pointer("pointermove", 210, 170, 210);
    pointer("pointerup", 210, 170, 220);
    expect(remove).not.toHaveBeenCalled();
  });
});