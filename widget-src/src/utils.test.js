import { describe, it, expect } from "vitest";
import { h, esc, linkify, safeHref } from "./utils";

describe("safeHref()", () => {
  it("allows https URLs", () => {
    expect(safeHref("https://rva.gov/finance")).toBe("https://rva.gov/finance");
  });

  it("allows http URLs", () => {
    expect(safeHref("http://example.com")).toBe("http://example.com");
  });

  it("allows tel: links", () => {
    expect(safeHref("tel:804-646-7000")).toBe("tel:804-646-7000");
  });

  it("blocks javascript: URLs", () => {
    expect(safeHref("javascript:alert(1)")).toBe("#");
  });

  it("blocks JavaScript: (case-insensitive)", () => {
    expect(safeHref("JaVaScRiPt:alert(1)")).toBe("#");
  });

  it("blocks data: URLs", () => {
    expect(safeHref("data:text/html,<script>alert(1)</script>")).toBe("#");
  });

  it("blocks vbscript: URLs", () => {
    expect(safeHref("vbscript:msgbox(1)")).toBe("#");
  });

  it("returns # for empty/null", () => {
    expect(safeHref("")).toBe("#");
    expect(safeHref(null)).toBe("#");
    expect(safeHref(undefined)).toBe("#");
  });
});

describe("h()", () => {
  it("creates element with tag", () => {
    const el = h("div");
    expect(el.tagName).toBe("DIV");
  });

  it("sets className", () => {
    const el = h("button", "send primary");
    expect(el.className).toBe("send primary");
  });

  it("works without className", () => {
    const el = h("span");
    expect(el.className).toBe("");
  });
});

describe("esc()", () => {
  it("escapes HTML special chars", () => {
    expect(esc("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(esc("A & B")).toBe("A &amp; B");
  });

  it("escapes quotes in attributes context", () => {
    expect(esc('"hello"')).toBe("&quot;hello&quot;");
  });

  it("passes through plain text", () => {
    expect(esc("pothole on my street")).toBe("pothole on my street");
  });

  it("handles empty string", () => {
    expect(esc("")).toBe("");
  });
});

describe("linkify()", () => {
  // URLs
  it("converts full URLs to links", () => {
    const result = linkify("Visit https://www.rva.gov/finance for info");
    expect(result).toContain('href="https://www.rva.gov/finance"');
    expect(result).toContain("target=\"_blank\"");
  });

  it("converts bare rva.gov domains", () => {
    const result = linkify("Check rva.gov/public-utilities");
    expect(result).toContain('href="https://rva.gov/public-utilities"');
  });

  it("converts bare rva311.com to service directory", () => {
    const result = linkify("Submit at rva311.com");
    expect(result).toContain('href="https://www.rva311.com/rvaone"');
  });

  it("converts rva311.com with path to direct link", () => {
    const result = linkify("Go to rva311.com/rvaone#/request/new/abc");
    expect(result).toContain('href="https://rva311.com/rvaone#/request/new/abc"');
  });

  // Phone numbers
  it("converts 10-digit phone numbers", () => {
    const result = linkify("Call 804-646-7000");
    expect(result).toContain('href="tel:804-646-7000"');
  });

  it("converts phone numbers with dots", () => {
    const result = linkify("Call 804.646.7000");
    expect(result).toContain('href="tel:804.646.7000"');
  });

  // Short codes
  it("converts 911 to tel link", () => {
    const result = linkify("Call 911 immediately");
    expect(result).toContain('href="tel:911"');
  });

  it("converts 311 to tel link", () => {
    const result = linkify("Call 311 for help");
    expect(result).toContain('href="tel:311"');
  });

  it("converts 211 to tel link", () => {
    const result = linkify("Dial 211 for referrals");
    expect(result).toContain('href="tel:211"');
  });

  // XSS safety
  it("escapes HTML before linkifying", () => {
    const result = linkify('<img src=x onerror="alert(1)">');
    expect(result).not.toContain("<img");
    expect(result).toContain("&lt;img");
  });

  it("escapes script tags", () => {
    const result = linkify('<script>alert("xss")</script>');
    expect(result).not.toContain("<script");
  });

  // Nested anchor prevention
  it("does not nest phone links inside URL links", () => {
    const result = linkify("https://example.com/8046467000");
    // Should have exactly one <a> wrapping the URL, not a nested phone link
    const anchors = result.match(/<a /g) || [];
    expect(anchors.length).toBe(1);
  });

  it("handles URL followed by separate phone number", () => {
    const result = linkify("Visit https://rva.gov or call 804-646-7000");
    expect(result).toContain('href="https://rva.gov"');
    expect(result).toContain('href="tel:804-646-7000"');
  });

  // Edge cases
  it("handles empty string", () => {
    expect(linkify("")).toBe("");
  });

  it("handles text with no linkable content", () => {
    const result = linkify("Just a regular sentence");
    expect(result).toBe("Just a regular sentence");
  });
});
