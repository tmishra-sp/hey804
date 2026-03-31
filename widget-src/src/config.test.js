import { describe, it, expect } from "vitest";
import { PROMPTS, HELP_QUERIES, pickPrompts, FOOTER_TEXT } from "./config";

describe("PROMPTS", () => {
  it("has at least 10 prompts", () => {
    expect(PROMPTS.length).toBeGreaterThanOrEqual(10);
  });

  it("all prompts are non-empty strings", () => {
    PROMPTS.forEach((p) => {
      expect(typeof p).toBe("string");
      expect(p.trim().length).toBeGreaterThan(0);
    });
  });
});

describe("HELP_QUERIES", () => {
  it("maps labels to query strings", () => {
    Object.entries(HELP_QUERIES).forEach(([label, query]) => {
      expect(typeof label).toBe("string");
      expect(typeof query).toBe("string");
      expect(query.length).toBeGreaterThan(0);
    });
  });
});

describe("pickPrompts()", () => {
  it("returns requested number of prompts", () => {
    expect(pickPrompts(4)).toHaveLength(4);
    expect(pickPrompts(2)).toHaveLength(2);
  });

  it("returns different results on successive calls (probabilistic)", () => {
    // Run 10 times — at least one pair should differ
    const results = Array.from({ length: 10 }, () => pickPrompts(4).join(","));
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("never returns more than available prompts", () => {
    expect(pickPrompts(100)).toHaveLength(PROMPTS.length);
  });

  it("returns items from the PROMPTS list", () => {
    pickPrompts(4).forEach((p) => {
      expect(PROMPTS).toContain(p);
    });
  });
});

describe("FOOTER_TEXT", () => {
  it("contains Hey804", () => {
    expect(FOOTER_TEXT).toContain("Hey804");
  });
});
