import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.stubGlobal("IntersectionObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});
vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
