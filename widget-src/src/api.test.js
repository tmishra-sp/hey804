import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendMessage } from "./api";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("sendMessage()", () => {
  it("sends POST with correct body", async () => {
    const mockResponse = { intent: "report_pothole", answer: "Report it." };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await sendMessage("https://api.test", "fix pothole", "test-org");

    expect(fetch).toHaveBeenCalledOnce();
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe("https://api.test/api/chat");
    expect(opts.method).toBe("POST");

    const body = JSON.parse(opts.body);
    expect(body.message).toBe("fix pothole");
    expect(body.channel).toBe("widget");
    expect(body.context.partner).toBe("test-org");

    expect(result).toEqual(mockResponse);
  });

  it("throws on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(sendMessage("https://api.test", "test", "p")).rejects.toThrow(
      "API error: 500",
    );
  });

  it("passes AbortController signal for timeout", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await sendMessage("https://api.test", "test", "p");

    const opts = fetch.mock.calls[0][1];
    expect(opts.signal).toBeInstanceOf(AbortSignal);
  });

  it("throws AbortError on timeout", async () => {
    globalThis.fetch = vi.fn().mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          const err = new DOMException("Aborted", "AbortError");
          reject(err);
        }, 10);
      });
    });

    await expect(sendMessage("https://api.test", "test", "p")).rejects.toThrow();
  });
});
