import { h } from "../utils";
import { createHeader } from "./Header";
import { FOOTER_TEXT } from "../config";

/**
 * Build the expandable panel (header + bridge + scrollable body + footer).
 * @returns {{ el, body }}
 */
export function createPanel() {
  const panel = h("div", "panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Hey804 Richmond Guide");

  panel.appendChild(createHeader());

  // Warm gradient bridge from dark header to cream body
  const bridge = h("div", "hdr-bridge");
  panel.appendChild(bridge);

  const body = h("div", "body");
  panel.appendChild(body);

  const ft = h("div", "ft");
  ft.textContent = FOOTER_TEXT;
  panel.appendChild(ft);

  return { el: panel, body };
}
