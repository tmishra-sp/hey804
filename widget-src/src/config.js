/**
 * Prompt suggestions — real questions residents ask.
 * Shown as tappable cards on the widget home screen.
 */
export const PROMPTS = [
  "I can't pay my tax bill",
  "How do I get food stamps?",
  "My water bill is way too high",
  "I'm about to be evicted",
  "Where's the social services office?",
  "My car got towed",
  "I need a birth certificate",
  "Help with heating bill",
  "Is the water safe to drink?",
  "How do I register to vote?",
  "Stray dog on my street",
  "I got jury duty",
  "The sidewalk near me is broken",
  "There's a sewer backup on my street",
  "Someone dumped trash in the alley",
  "How do I get a residential parking permit",
];

/**
 * Help menu categories — map display label to a representative query.
 */
export const HELP_QUERIES = {
  "Tax bills & payment plans": "I can't pay my tax bill",
  "SNAP, Medicaid, benefits": "How do I get food stamps",
  "Utility bills & assistance": "Can't pay my water bill",
  "Rent help & housing": "I need help paying rent",
  "City services (311, trash, permits)": "When is trash pickup",
  "Roads, sidewalks, sewer, trees, parks": "How to report a pothole",
  "Code violations, dumping, pests, parking":
    "My neighbor's yard is full of junk",
};

/**
 * Pick N random prompts from the list.
 */
export function pickPrompts(n = 4) {
  const shuffled = PROMPTS.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * Footer text shown on trigger card and panel.
 */
export const FOOTER_TEXT = "Your Richmond Navigator \u00B7 Hey804";
