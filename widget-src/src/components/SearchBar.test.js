import { describe, it, expect, vi } from "vitest";
import { createSearchBar } from "./SearchBar";

describe("createSearchBar()", () => {
  describe("default variant", () => {
    it("renders input, mic, and send", () => {
      const bar = createSearchBar({ variant: "default", speechSupported: true });
      expect(bar.input).toBeTruthy();
      expect(bar.sendBtn).toBeTruthy();
      expect(bar.micBtn).toBeTruthy();
      // Input, mic, send should all be in the container
      expect(bar.el.contains(bar.input)).toBe(true);
      expect(bar.el.contains(bar.micBtn)).toBe(true);
      expect(bar.el.contains(bar.sendBtn)).toBe(true);
    });

    it("has correct CSS classes", () => {
      const bar = createSearchBar({ variant: "default" });
      expect(bar.el.classList.contains("search-bar")).toBe(true);
      expect(bar.el.classList.contains("search-bar--default")).toBe(true);
    });

    it("sets placeholder", () => {
      const bar = createSearchBar({ placeholder: "Ask something..." });
      expect(bar.input.placeholder).toBe("Ask something...");
    });

    it("does not create wave div", () => {
      const bar = createSearchBar({ variant: "default" });
      expect(bar.waveDiv).toBeNull();
    });
  });

  describe("compact variant", () => {
    it("only puts input and send in the row (mic separate)", () => {
      const bar = createSearchBar({ variant: "compact", speechSupported: true });
      // Mic is created but NOT in the row container
      expect(bar.el.contains(bar.input)).toBe(true);
      expect(bar.el.contains(bar.sendBtn)).toBe(true);
      expect(bar.el.contains(bar.micBtn)).toBe(false);
    });

    it("creates wave div", () => {
      const bar = createSearchBar({ variant: "compact" });
      expect(bar.waveDiv).toBeTruthy();
      expect(bar.waveDiv.children.length).toBe(4);
    });
  });

  describe("inline variant", () => {
    it("renders label when provided", () => {
      const bar = createSearchBar({ variant: "inline", label: "You asked" });
      const lbl = bar.el.querySelector(".search-bar__label");
      expect(lbl).toBeTruthy();
      expect(lbl.textContent).toBe("You asked:");
    });

    it("pre-fills value", () => {
      const bar = createSearchBar({ variant: "inline", value: "pothole" });
      expect(bar.input.value).toBe("pothole");
    });

    it("does not clear input on submit", () => {
      const onSubmit = vi.fn();
      const bar = createSearchBar({ variant: "inline", value: "test", onSubmit });
      bar.sendBtn.click();
      expect(bar.input.value).toBe("test"); // inline keeps value
      expect(onSubmit).toHaveBeenCalledWith("test");
    });
  });

  describe("submit behavior", () => {
    it("calls onSubmit with trimmed value", () => {
      const onSubmit = vi.fn();
      const bar = createSearchBar({ onSubmit });
      bar.input.value = "  pothole  ";
      bar.sendBtn.click();
      expect(onSubmit).toHaveBeenCalledWith("pothole");
    });

    it("does not submit empty input", () => {
      const onSubmit = vi.fn();
      const bar = createSearchBar({ onSubmit });
      bar.input.value = "   ";
      bar.sendBtn.click();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("clears input after submit (non-inline)", () => {
      const bar = createSearchBar({ variant: "default", onSubmit: () => {} });
      bar.input.value = "test";
      bar.sendBtn.click();
      expect(bar.input.value).toBe("");
    });
  });

  describe("mic disabled state", () => {
    it("adds disabled class when speech not supported", () => {
      const bar = createSearchBar({ speechSupported: false });
      expect(bar.micBtn.classList.contains("search-bar__mic--disabled")).toBe(true);
    });

    it("no disabled class when speech supported", () => {
      const bar = createSearchBar({ speechSupported: true });
      expect(bar.micBtn.classList.contains("search-bar__mic--disabled")).toBe(false);
    });
  });

  describe("setRecording()", () => {
    it("toggles recording class on mic", () => {
      const bar = createSearchBar({ variant: "compact" });
      bar.setRecording(true);
      expect(bar.micBtn.classList.contains("search-bar__mic--recording")).toBe(true);
      bar.setRecording(false);
      expect(bar.micBtn.classList.contains("search-bar__mic--recording")).toBe(false);
    });

    it("toggles wave animation", () => {
      const bar = createSearchBar({ variant: "compact" });
      bar.setRecording(true);
      expect(bar.waveDiv.classList.contains("active")).toBe(true);
      bar.setRecording(false);
      expect(bar.waveDiv.classList.contains("active")).toBe(false);
    });
  });
});
