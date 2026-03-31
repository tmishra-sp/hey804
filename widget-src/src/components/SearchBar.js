import { h } from "../utils";
import { sendIcon, micIcon, micIconSm } from "../icons";

/**
 * Reusable search bar — input + send + mic.
 * Used on trigger card, panel home, and "you asked" row.
 *
 * @param {object} opts
 * @param {"default"|"compact"|"inline"} opts.variant
 * @param {string}   opts.placeholder
 * @param {string}   [opts.value]          - Pre-filled value (inline variant)
 * @param {string}   [opts.label]          - Label text (inline variant)
 * @param {boolean}  opts.speechSupported
 * @param {function} opts.onSubmit         - Called with (text)
 * @param {object}   [opts.speechManager]  - SpeechManager instance
 * @returns {{ el, input, sendBtn, micBtn, waveDiv, setRecording }}
 */
export function createSearchBar(opts) {
  const {
    variant = "default",
    placeholder = "",
    value = "",
    label = "",
    speechSupported = false,
    onSubmit,
    speechManager,
  } = opts;

  const isInline = variant === "inline";
  const isCompact = variant === "compact";

  // Container
  const row = h("div", `search-bar search-bar--${variant}`);

  // Label (inline only)
  if (isInline && label) {
    const lbl = h("b", "search-bar__label");
    lbl.textContent = `${label}:`;
    row.appendChild(lbl);
  }

  // Input
  const input = h("input", "search-bar__input");
  input.type = "text";
  input.placeholder = placeholder;
  input.setAttribute("aria-label", "Ask about Richmond city services");
  if (value) input.value = value;

  // Send button
  const sendBtn = h("button", "search-bar__send");
  sendBtn.setAttribute("aria-label", "Send");
  sendBtn.innerHTML = sendIcon;

  // Mic button
  const micBtn = h("button", `search-bar__mic${speechSupported ? "" : " search-bar__mic--disabled"}`);
  micBtn.setAttribute("aria-label", "Voice input");
  micBtn.innerHTML = isInline ? micIconSm : micIcon;

  // Wave animation (compact only)
  let waveDiv = null;
  if (isCompact) {
    waveDiv = h("div", "search-bar__wave");
    for (let i = 0; i < 4; i++) waveDiv.appendChild(h("span", ""));
  }

  // Assemble — compact: input+send only (mic goes in trigger-actions row)
  row.appendChild(input);
  if (isCompact) {
    row.appendChild(sendBtn);
  } else {
    row.appendChild(micBtn);
    row.appendChild(sendBtn);
  }

  // Submit handler
  const submit = () => {
    const v = input.value.trim();
    if (v) {
      if (!isInline) input.value = "";
      onSubmit?.(v);
    }
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  });
  sendBtn.onclick = submit;

  // Mic handler — wired for all variants when speechManager is provided.
  // Compact variant: main.js overrides micBtn.onclick for open-panel behavior.
  if (speechSupported && speechManager) {
    micBtn.onclick = () => {
      if (speechManager.isRecording) {
        speechManager.stop();
        return;
      }
      micBtn.classList.add("search-bar__mic--recording");
      speechManager.start({
        onResult(transcript, isFinal) {
          input.value = transcript;
          if (isFinal) {
            micBtn.classList.remove("search-bar__mic--recording");
            input.focus();
          }
        },
        onEnd() { micBtn.classList.remove("search-bar__mic--recording"); },
        onError() { micBtn.classList.remove("search-bar__mic--recording"); },
      });
    };
  }

  // Recording UI helper (for trigger card wave animation)
  function setRecording(active) {
    micBtn.classList.toggle("search-bar__mic--recording", active);
    if (waveDiv) waveDiv.classList.toggle("active", active);
  }

  return { el: row, input, sendBtn, micBtn, waveDiv, setRecording };
}
