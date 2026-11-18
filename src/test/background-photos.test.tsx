import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBackgroundPhotos } from "@/components/background-photos";

function Harness() {
  const editor = useBackgroundPhotos();
  return <><div className="background-photo" onClick={() => editor.select("photo-1")}>Photo</div>
    <div className="photo-options">Editing controls</div><div>Outside</div>
    <output aria-label="Selection">{editor.selected ?? "none"}</output></>;
}

describe("Photo editing selection", () => {
  it("dismisses selection when clicking elsewhere on the page", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Photo"));
    expect(screen.getByLabelText("Selection")).toHaveTextContent("photo-1");
    fireEvent.pointerDown(screen.getByText("Outside"));
    expect(screen.getByLabelText("Selection")).toHaveTextContent("none");
  });
  it("keeps selection while interacting with the photo or editing options", () => {
    render(<Harness />);
    fireEvent.click(screen.getByText("Photo"));
    fireEvent.pointerDown(screen.getByText("Editing controls"));
    expect(screen.getByLabelText("Selection")).toHaveTextContent("photo-1");
    fireEvent.pointerDown(screen.getByText("Photo"));
    expect(screen.getByLabelText("Selection")).toHaveTextContent("photo-1");
  });
});