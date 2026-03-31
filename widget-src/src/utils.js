/**
 * Validate URL protocol — only allow http(s) and tel.
 * Blocks javascript:, data:, vbscript: etc.
 */
export function safeHref(url) {
  if (!url) return "#";
  const lower = url.trim().toLowerCase();
  if (lower.startsWith("https://") || lower.startsWith("http://") || lower.startsWith("tel:")) {
    return url;
  }
  return "#";
}

/**
 * DOM helper — create element with class.
 */
export function h(tag, cls) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  return el;
}

/**
 * Escape text for safe HTML insertion — handles <, >, &, ", '.
 */
export function esc(t) {
  return t
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Known bare domains that should auto-link with https://.
 */
const KNOWN_DOMAINS = [
  "rva\\.gov",
  "commonhelp\\.virginia\\.gov",
  "coverva\\.dmas\\.virginia\\.gov",
  "valegalaid\\.org",
  "elections\\.virginia\\.gov",
  "apps\\.richmondgov\\.com",
  "rvalibrary\\.org",
  "enrollrps\\.schoolmint\\.com",
  "dmv\\.virginia\\.gov",
  "dominionenergy\\.com",
  "rva311\\.com",
].join("|");

/**
 * Convert URLs, bare domains, phone numbers, and short codes to clickable links.
 * Escapes input first for XSS safety. All link regexes skip content already
 * inside <a> tags to prevent nested anchors.
 */
export function linkify(t) {
  let safe = esc(t);

  // Step 1: Full URLs — match first, wrap in anchors
  safe = safe.replace(
    /(https?:\/\/[^\s<,)]+)/g,
    '<a href="$1" target="_blank" rel="noopener" class="link link--url">$1</a>',
  );

  // Step 2: Bare domains — skip anything already inside an <a> tag
  const domainRe = new RegExp(
    `(<a[^>]*>.*?</a>)|(?<![/\\w])((?:${KNOWN_DOMAINS})(?:/[^\\s<,)]*)?)`,
    "g",
  );
  safe = safe.replace(domainRe, (match, anchor, domain) => {
    if (anchor) return anchor;
    // rva311.com bare → service directory; rva311.com/path → direct link
    if (domain.startsWith("rva311.com")) {
      const path = domain.slice("rva311.com".length);
      if (path) return `<a href="https://${domain}" target="_blank" rel="noopener" class="link link--url">${domain}</a>`;
      return `<a href="https://www.rva311.com/rvaone" target="_blank" rel="noopener" class="link link--url">${domain}</a>`;
    }
    return `<a href="https://${domain}" target="_blank" rel="noopener" class="link link--url">${domain}</a>`;
  });

  // Step 3: Phone numbers — skip inside <a> tags
  safe = safe.replace(
    /(<a[^>]*>.*?<\/a>)|(\d{3}[-.]?\d{3}[-.]?\d{4})/g,
    (match, anchor, phone) => {
      if (anchor) return anchor;
      return `<a href="tel:${phone}" class="link link--phone">${phone}</a>`;
    },
  );

  // Step 4: Short codes — skip inside <a> tags
  safe = safe.replace(
    /(<a[^>]*>.*?<\/a>)|\b(911|988|311|211)\b/g,
    (match, anchor, code) => {
      if (anchor) return anchor;
      return `<a href="tel:${code}" class="link link--phone">${code}</a>`;
    },
  );

  return safe;
}
