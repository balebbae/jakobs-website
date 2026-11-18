import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeDragon } from "@/components/home-dragon";
import sleeping from "@/assets/menu-dragon-sleeping.mp4.asset.json";

describe("Home dragon playback", () => {
  it("keeps only the sleeping clip while toggling playback", () => {
    const { container } = render(<HomeDragon />);
    expect(screen.getByLabelText("Sleeping dragon animation")).toHaveAttribute("src", sleeping.url);
    fireEvent.click(screen.getByRole("button", { name: "Pause dragon animation" }));
    expect(screen.getByRole("button", { name: "Play dragon animation" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Play dragon animation" }));
    expect(container.querySelectorAll("video")).toHaveLength(1);
    expect(screen.getByLabelText("Sleeping dragon animation")).toHaveAttribute("src", sleeping.url);
  });
});