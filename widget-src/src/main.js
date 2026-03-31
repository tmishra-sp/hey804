/**
 * Hey804 Widget — Your warm Richmond city navigator.
 * <script src="https://hey804.app/widget.js" data-partner="org-name"></script>
 *
 * Flow: Trigger card (input/mic/prompts) → Panel (results only) → Back → Trigger
 */
import css from "./widget.css?inline";
import { h, esc } from "./utils";
import { closeIcon } from "./icons";
import { pickPrompts } from "./config";
import { sendMessage } from "./api";
import { SpeechManager } from "./speech";
import { createSearchBar } from "./components/SearchBar";
import { createTriggerCard } from "./components/TriggerCard";
import { createPanel } from "./components/Panel";
import { renderLoading, renderResponse } from "./components/Response";

(function () {
  const script = document.currentScript;
  const partner = script?.getAttribute("data-partner") || "unknown";
  const baseUrl = script ? script.src.replace(/\/widget\.js(\?.*)?$/, "") : "";

  // ── Analytics — dispatch CustomEvents on the host element ──
  // Partners can listen: document.getElementById("hey804-root").addEventListener("hey804:query", ...)
  function emit(name, detail) {
    host.dispatchEvent(new CustomEvent(`hey804:${name}`, { detail, bubbles: true }));
  }

  // ── Shadow DOM ──
  const host = document.createElement("div");
  host.id = "hey804-root";
  const shadow = host.attachShadow({ mode: "open" });

  // Font — load via <link> in host document for better perf (non-blocking)
  if (!document.querySelector('link[href*="DM+Sans"]')) {
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap";
    document.head.appendChild(fontLink);
  }
  // Also inject @font-face into shadow DOM so it inherits
  const fontStyle = document.createElement("style");
  fontStyle.textContent =
    "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');";
  shadow.appendChild(fontStyle);

  const style = document.createElement("style");
  style.textContent = css;
  shadow.appendChild(style);

  // ── Speech ──
  const speech = new SpeechManager();

  // ── Trigger Card ──
  const trigger = createTriggerCard({ speechSupported: speech.supported });
  trigger.el.setAttribute("aria-expanded", "false");
  shadow.appendChild(trigger.el);

  // ── Close Button ──
  const closeBtn = h("button", "close hide");
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = closeIcon;
  shadow.appendChild(closeBtn);

  // ── Overlay ──
  const overlay = h("div", "widget-overlay");
  shadow.appendChild(overlay);

  // ── Panel ──
  const { el: panel, body } = createPanel();
  shadow.appendChild(panel);

  const resultArea = h("div", "");
  resultArea.setAttribute("aria-live", "polite");
  resultArea.setAttribute("tabindex", "-1");
  body.appendChild(resultArea);

  // ── Request tracking — cancel previous on new submit ──
  let currentRequestId = 0;

  // ── Focus trap ──
  function trapFocus(e) {
    if (e.key !== "Tab") return;
    const focusable = panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (shadow.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (shadow.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // ── Open / Close ──
  function openWidget() {
    if (speech.isRecording) speech.stop();
    panel.classList.add("open");
    overlay.classList.add("active");
    trigger.el.classList.add("hide");
    trigger.el.setAttribute("aria-expanded", "true");
    closeBtn.classList.remove("hide");
    panel.addEventListener("keydown", trapFocus);
  }

  function closeWidget() {
    panel.classList.remove("open");
    overlay.classList.remove("active");
    trigger.el.classList.remove("hide");
    trigger.el.setAttribute("aria-expanded", "false");
    closeBtn.classList.add("hide");
    panel.removeEventListener("keydown", trapFocus);
    resultArea.innerHTML = "";
    setTimeout(() => trigger.searchBar.input.focus(), 100);
  }

  closeBtn.onclick = closeWidget;
  overlay.onclick = closeWidget;
  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeWidget();
  });

  // ── Trigger card SearchBar ──
  const triggerBar = trigger.searchBar;

  const triggerSubmit = (msg) => {
    triggerBar.input.value = "";
    openWidget();
    doSend(msg);
  };

  triggerBar.input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopImmediatePropagation();
      const msg = triggerBar.input.value.trim();
      if (msg) triggerSubmit(msg);
    }
  });
  triggerBar.sendBtn.onclick = () => {
    const msg = triggerBar.input.value.trim();
    if (msg) triggerSubmit(msg);
  };

  // ── Trigger voice ──
  if (speech.supported) {
    triggerBar.micBtn.onclick = () => {
      if (speech.isRecording) { speech.stop(); return; }
      triggerBar.input.value = "";
      speech.start({
        onStart() {
          triggerBar.setRecording(true);
          triggerBar.micBtn.setAttribute("aria-label", "Stop recording");
        },
        onResult(transcript, isFinal) {
          triggerBar.input.value = transcript;
          if (isFinal && transcript.trim()) {
            triggerBar.setRecording(false);
            triggerBar.micBtn.setAttribute("aria-label", "Voice input");
            triggerSubmit(transcript.trim());
          }
        },
        onEnd() {
          triggerBar.setRecording(false);
          triggerBar.micBtn.setAttribute("aria-label", "Voice input");
        },
        onError(errType) {
          triggerBar.setRecording(false);
          triggerBar.micBtn.setAttribute("aria-label", "Voice input");
          if (errType === "not-allowed") showTriggerTooltip("Microphone access denied");
          else if (errType === "no-speech") showTriggerTooltip("No speech detected \u2014 try again");
        },
      });
    };
  } else {
    triggerBar.micBtn.onclick = () => showTriggerTooltip("Voice not available \u2014 try Chrome or Edge");
  }

  function showTriggerTooltip(msg) {
    const tip = h("div", "trigger-tooltip show");
    tip.textContent = msg;
    trigger.el.appendChild(tip);
    setTimeout(() => {
      tip.classList.remove("show");
      setTimeout(() => tip.parentNode?.removeChild(tip), 200);
    }, 2500);
  }

  // ── Send — with race condition protection ──
  function doSend(message) {
    message = message.trim();
    if (!message) return;

    // Increment request ID so stale responses are ignored
    const requestId = ++currentRequestId;

    resultArea.innerHTML = renderLoading();
    emit("query", { message, partner });

    sendMessage(baseUrl, message, partner)
      .then((data) => {
        if (requestId !== currentRequestId) return;
        emit("response", { message, intent: data.intent, confidence: data.confidence });
        renderResponse(resultArea, data, message, doSend, closeWidget, speech);
        setTimeout(() => resultArea.focus(), 50);
      })
      .catch((err) => {
        if (requestId !== currentRequestId) return;
        const isTimeout = err?.name === "AbortError";
        emit("error", { message, error: isTimeout ? "timeout" : "network" });
        resultArea.innerHTML =
          `<div class="err">${isTimeout ? "Request timed out." : "Something went wrong."} Try again or call <a href="tel:8046467000">804-646-7000</a>.</div>`;
        const back = h("button", "back");
        back.textContent = "Ask a new question";
        back.onclick = closeWidget;
        resultArea.appendChild(back);
      });
  }

  // ── Mount ──
  document.body.appendChild(host);
})();
