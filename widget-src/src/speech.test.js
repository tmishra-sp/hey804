import { describe, it, expect, vi, beforeEach } from "vitest";
import { SpeechManager } from "./speech";

// Mock the Web Speech API
class MockSpeechRecognition {
  constructor() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = "";
    this.maxAlternatives = 1;
    this.onstart = null;
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
  }
  start() {
    // Simulate async start
    setTimeout(() => this.onstart?.(), 0);
  }
  stop() {
    setTimeout(() => this.onend?.(), 0);
  }
}

beforeEach(() => {
  globalThis.window = globalThis;
  globalThis.SpeechRecognition = undefined;
  globalThis.webkitSpeechRecognition = undefined;
});

describe("SpeechManager", () => {
  it("reports not supported when API is missing", () => {
    const sm = new SpeechManager();
    expect(sm.supported).toBe(false);
    expect(sm.recognition).toBeNull();
  });

  it("reports supported when API exists", () => {
    globalThis.SpeechRecognition = MockSpeechRecognition;
    const sm = new SpeechManager();
    expect(sm.supported).toBe(true);
    expect(sm.recognition).toBeInstanceOf(MockSpeechRecognition);
  });

  it("supports webkit prefix", () => {
    globalThis.webkitSpeechRecognition = MockSpeechRecognition;
    const sm = new SpeechManager();
    expect(sm.supported).toBe(true);
  });

  it("sets isRecording on start", async () => {
    globalThis.SpeechRecognition = MockSpeechRecognition;
    const sm = new SpeechManager();
    const onStart = vi.fn();

    sm.start({ onStart });
    // Wait for async start
    await new Promise((r) => setTimeout(r, 10));

    expect(sm.isRecording).toBe(true);
    expect(onStart).toHaveBeenCalled();
  });

  it("clears isRecording on stop", async () => {
    globalThis.SpeechRecognition = MockSpeechRecognition;
    const sm = new SpeechManager();
    const onEnd = vi.fn();

    sm.start({ onStart: () => {}, onEnd });
    await new Promise((r) => setTimeout(r, 10));
    expect(sm.isRecording).toBe(true);

    sm.stop();
    await new Promise((r) => setTimeout(r, 10));
    expect(sm.isRecording).toBe(false);
    expect(onEnd).toHaveBeenCalled();
  });

  it("does not start when already recording", () => {
    globalThis.SpeechRecognition = MockSpeechRecognition;
    const sm = new SpeechManager();
    sm.isRecording = true;

    const startSpy = vi.spyOn(sm.recognition, "start");
    sm.start({ onStart: () => {} });
    expect(startSpy).not.toHaveBeenCalled();
  });

  it("handles start() throwing", () => {
    globalThis.SpeechRecognition = MockSpeechRecognition;
    const sm = new SpeechManager();
    sm.recognition.start = () => {
      throw new DOMException("denied", "NotAllowedError");
    };

    const onError = vi.fn();
    sm.start({ onError });

    expect(sm.isRecording).toBe(false);
    expect(onError).toHaveBeenCalledWith("NotAllowedError");
  });

  it("does nothing when not supported", () => {
    const sm = new SpeechManager();
    // Should not throw
    sm.start({ onStart: () => {} });
    sm.stop();
  });
});
