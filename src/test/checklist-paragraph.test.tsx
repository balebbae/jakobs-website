import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChecklistParagraph, checklistEnter, startChecklist } from "@/components/checklist-paragraph";

function Harness() {
  const [text, setText] = useState("First\nSecond");
  return <ChecklistParagraph value={text} onChange={setText} label="Note" className="" />;
}
describe("Paragraph checklists", () => {
  it("turns only the tapped line into a checkbox item", () => {
    expect(startChecklist("First\nSecond\nThird", 9)).toEqual({ text: "First\n☐ Second\nThird", caret: 11 });
  });
  it("adds a fresh unchecked box on Enter, including after a checked item", () => {
    expect(checklistEnter("☑ Task", 6, 6, false)).toEqual({ text: "☑ Task\n☐ ", caret: 9 });
  });
  it("ends checklist mode on the second consecutive Enter", () => {
    const first = checklistEnter("☐ Task", 6, 6, false);
    expect(first).toEqual({ text: "☐ Task\n☐ ", caret: 9 });
    expect(checklistEnter("☐ Task\n☐ ", 9, 9, true)).toEqual({ text: "☐ Task\n", caret: 7 });
    expect(checklistEnter("☐ Task\n", 7, 7, false)).toBeNull();
  });
  it("continues the checklist after entering text between Enters", () => {
    expect(checklistEnter("☐ Task\n☐ Next", 13, 13, false)).toEqual({ text: "☐ Task\n☐ Next\n☐ ", caret: 16 });
  });
  it("splits an item at the caret without losing the trailing text", () => {
    expect(checklistEnter("☐ One two", 5, 5, false)).toEqual({ text: "☐ One\n☐  two", caret: 8 });
  });
  it("handles triple taps and two Enters in the editor", () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Note" }) as HTMLTextAreaElement;
    input.setSelectionRange(12, 12);
    fireEvent.click(input); fireEvent.click(input); fireEvent.click(input);
    expect(input).toHaveValue("First\n☐ Second");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("First\n☐ Second\n☐ ");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveValue("First\n☐ Second\n");
  });
  it("toggles a checklist box when clicking its text position", () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Note" }) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: "☐ Task" } });
    input.setSelectionRange(0, 0);
    fireEvent.click(input);
    expect(input).toHaveValue("■ Task");
  });
});