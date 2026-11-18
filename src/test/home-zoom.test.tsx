import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePhotoScene } from "@/components/home-photo-scene";
import { useBackgroundPhotos } from "@/components/background-photos";

function Scene({ selected = false }: { selected?: boolean }) {
  const editor = useBackgroundPhotos();
  return <HomePhotoScene editor={{ ...editor, selected: selected ? "photo" : null }} />;
}

describe("Home zoom", () => {
  it("drags the whole home frame by the background movement even when zoomed", () => {
    render(<Scene />);
    const scene = screen.getByLabelText("Home scene");
    scene.setPointerCapture = () => {};
    const pointer = (type: string, x: number, y: number) => {
      const event = new Event(type, { bubbles: true });
      Object.defineProperties(event, { button: { value: 0 }, pointerId: { value: 1 }, clientX: { value: x }, clientY: { value: y } });
      fireEvent(scene, event);
    };
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    pointer("pointerdown", 100, 100);
    pointer("pointermove", 170, 140);
    expect(screen.getByLabelText("Home frame")).toHaveStyle({ transform: "translate(70px, 40px) scale(1.1)" });
    pointer("pointerup", 170, 140);
    pointer("pointermove", 200, 200);
    expect(screen.getByLabelText("Home frame")).toHaveStyle({ transform: "translate(70px, 40px) scale(1.1)" });
    pointer("pointerdown", 200, 200);
    pointer("pointermove", 180, 190);
    expect(screen.getByLabelText("Home frame")).toHaveStyle({ transform: "translate(50px, 30px) scale(1.1)" });
    pointer("pointercancel", 180, 190);
  });
  it("zooms the home scene and resets its scale", () => {
    render(<Scene />);
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(screen.getByLabelText("Zoom level")).toHaveTextContent("110%");
    fireEvent.wheel(screen.getByLabelText("Home scene"), { deltaY: -100 });
    expect(screen.getByLabelText("Zoom level")).toHaveTextContent("120%");
    fireEvent.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(screen.getByLabelText("Zoom level")).toHaveTextContent("100%");
  });
  it("does not zoom while a photo is selected", () => {
    const view = render(<Scene selected />);
    expect(screen.queryByRole("group", { name: "Home zoom" })).toBeNull();
    fireEvent.wheel(screen.getByLabelText("Home scene"), { deltaY: -100 });
    view.rerender(<Scene />);
    expect(screen.getByLabelText("Zoom level")).toHaveTextContent("100%");
  });
});