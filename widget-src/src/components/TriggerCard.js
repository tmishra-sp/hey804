import { h } from "../utils";
import { compassIcon } from "../icons";
import { FOOTER_TEXT } from "../config";
import { createSearchBar } from "./SearchBar";

/**
 * Build the compact floating trigger card.
 * Uses the shared SearchBar component (compact variant).
 *
 * @param {object} opts
 * @param {boolean} opts.speechSupported
 * @returns {{ el, searchBar }}
 */
export function createTriggerCard({ speechSupported }) {
  const card = h("div", "trigger-card");
  card.setAttribute("role", "region");
  card.setAttribute("aria-label", "Hey804 city guide");

  // Avatar + greeting
  const hdr = h("div", "trigger-header");
  const avatar = h("div", "trigger-avatar");
  avatar.innerHTML = compassIcon;
  const greet = h("div", "trigger-greeting");
  greet.innerHTML = "Your RVA Guide<br><span>Find the right city service, fast</span>";
  hdr.appendChild(avatar);
  hdr.appendChild(greet);
  card.appendChild(hdr);

  // Search bar (compact variant)
  const searchBar = createSearchBar({
    variant: "compact",
    placeholder: "Pothole, water bill, food stamps...",
    speechSupported,
  });
  card.appendChild(searchBar.el);

  // Mic + wave below search row (compact layout)
  const actions = h("div", "trigger-actions");
  actions.appendChild(searchBar.micBtn);
  if (searchBar.waveDiv) actions.appendChild(searchBar.waveDiv);
  card.appendChild(actions);

  // Footer
  const ft = h("div", "ft ft--borderless");
  ft.textContent = FOOTER_TEXT;
  card.appendChild(ft);

  return { el: card, searchBar };
}
