import { compassIcon, skylineIcon } from "../icons";

/**
 * Build the panel header with avatar, greeting, and skyline.
 * @returns {HTMLElement}
 */
export function createHeader() {
  const hdr = document.createElement("div");
  hdr.className = "hdr";
  hdr.innerHTML =
    '<div class="hdr-inner">' +
      '<div class="hdr-avatar">' + compassIcon + '</div>' +
      '<div class="hdr-text">' +
        '<div class="greeting">Hey <b>neighbor!</b></div>' +
        '<div class="subtitle">Let me help you navigate Richmond</div>' +
      '</div>' +
    '</div>' +
    skylineIcon;
  return hdr;
}
