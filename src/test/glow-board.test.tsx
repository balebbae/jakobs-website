import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlowBoard } from "@/components/glow-board";

describe("Dashboard tabs", () => {
  it("provides ten independent dashboards and retains edits after returning home", () => {
    render(<GlowBoard />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(10);
    const firstTab = tabs[0];
    const secondTab = tabs[1];
    if (!firstTab || !secondTab) throw new Error("Dashboard tabs missing");
    fireEvent.click(firstTab);
    const first = screen.getByRole("tabpanel");
    fireEvent.change(within(first).getByPlaceholderText("Title"), { target: { value: "My goal" } });
    const percentages = within(first).getAllByRole("spinbutton");
    const percentage = percentages[0];
    if (!percentage) throw new Error("Progress percentage missing");
    expect(percentages).toHaveLength(7);
    expect(percentages.every(input => (input as HTMLInputElement).value === "0")).toBe(true);
    fireEvent.change(percentage, { target: { value: "42" } });
    fireEvent.change(within(first).getByLabelText("note 1 paragraph"), { target: { value: "First board note" } });
    fireEvent.click(secondTab);
    expect(within(screen.getByRole("tabpanel")).getByPlaceholderText("Title")).toHaveValue("");
    expect(within(screen.getByRole("tabpanel")).getAllByRole("spinbutton")[0]).toHaveValue(0);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.queryByRole("tabpanel")).toBeNull();
    fireEvent.click(firstTab);
    expect(within(screen.getByRole("tabpanel")).getByPlaceholderText("Title")).toHaveValue("My goal");
    expect(within(screen.getByRole("tabpanel")).getAllByRole("spinbutton")[0]).toHaveValue(42);
    expect(within(screen.getByRole("tabpanel")).getByLabelText("note 1 paragraph")).toHaveValue("First board note");
  });
});