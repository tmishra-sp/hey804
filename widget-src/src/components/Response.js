import { h, esc, linkify, safeHref } from "../utils";
import { clockIcon, backIcon } from "../icons";
import { HELP_QUERIES } from "../config";
import { createSearchBar } from "./SearchBar";

/** Safe accessor for translated UI strings with fallbacks. */
function ui(data, key, fallback = "") {
  return data?.ui_messages?.[key] ?? fallback;
}

/**
 * Build the "You asked:" search bar (inline variant).
 */
function createYouAskedBar(data, userMessage, doSend, speechManager) {
  const label = ui(data, "you_asked", "You asked");
  const bar = createSearchBar({
    variant: "inline",
    placeholder: "",
    value: userMessage,
    label,
    speechSupported: speechManager?.supported ?? false,
    onSubmit: doSend,
    speechManager,
  });
  const input = bar.el.querySelector(".search-bar__input");
  const lbl = bar.el.querySelector(".search-bar__label");
  if (input && lbl) {
    const id = "hey804-ya-input-" + Math.random().toString(36).slice(2, 8);
    input.id = id;
    lbl.setAttribute("id", id + "-lbl");
    input.setAttribute("aria-labelledby", id + "-lbl");
  }
  return bar.el;
}

/**
 * Render the loading shimmer with status text.
 */
export function renderLoading() {
  return (
    '<div class="loading">' +
    '<div class="loading-text">Finding the right service\u2026</div>' +
    '<div class="shimmer-bar"></div>' +
    '<div class="shimmer-bar"></div>' +
    '<div class="shimmer-bar"></div>' +
    '</div>'
  );
}

/** Special intents that are simple text responses (no steps/sources). */
const SIMPLE_INTENTS = new Set(["_greeting", "_stop", "_language_switch", "_help"]);

/**
 * Render the full API response.
 */
export function renderResponse(resultArea, data, userMessage, doSend, onBack, speechManager) {
  const body = resultArea.closest(".body");

  const steps = data.action_steps || [];
  const answer = data.answer || "";
  const sources = data.sources || [];
  const intent = data.intent;
  const isEmergency = intent === "_emergency";
  const isCrisis = intent === "_crisis";
  const isRedirect = intent === "_redirect";
  const isSimple = SIMPLE_INTENTS.has(intent);
  const isFallback = !intent || intent === "_partial_match";

  resultArea.innerHTML = "";

  // Sticky back button at top
  const backRow = h("div", "back-row");
  const back = h("button", "back");
  back.innerHTML = `${backIcon} ${esc(ui(data, "back_button", "Ask a new question"))}`;
  back.onclick = onBack;
  backRow.appendChild(back);
  resultArea.appendChild(backRow);

  const resp = h("div", "resp");

  // ── Emergency ──
  if (isEmergency) {
    const card = h("div", "emergency-card");
    const title = h("div", "emergency-card__title");
    title.textContent = `\u26A0\uFE0F ${ui(data, "emergency", "Call 911")}`;
    card.appendChild(title);
    resp.appendChild(card);
    renderLines(resp, answer, "resp-line");
    resultArea.appendChild(resp);
    if (body) body.scrollTop = 0;
    return;
  }

  // ── Crisis ──
  if (isCrisis) {
    const card = h("div", "crisis-card");
    const title = h("div", "crisis-card__title");
    title.textContent = ui(data, "crisis", "Help is available right now");
    card.appendChild(title);
    answer.split("\n").filter(l => l.trim()).forEach(line => {
      const div = h("div", "resp-line");
      div.innerHTML = linkify(line.trim());
      card.appendChild(div);
    });
    resp.appendChild(card);
    resultArea.appendChild(resp);
    if (body) body.scrollTop = 0;
    return;
  }

  // ── Redirect ──
  if (isRedirect) {
    renderLines(resp, answer, "resp-line--lg");
    resultArea.appendChild(resp);
    if (body) body.scrollTop = 0;
    return;
  }

  // ── Simple intents (greeting, stop, language switch, help menu) ──
  if (isSimple) {
    if (intent === "_help") {
      const intro = h("div", "intro-text");
      intro.textContent = `${ui(data, "fallback", "I can help with")}:`;
      resp.appendChild(intro);

      answer.split("\n").filter(l => l.trim()).forEach(line => {
        const fl = line.trim();
        if (fl.match(/^- /)) {
          const label = fl.replace(/^- /, "");
          const query = HELP_QUERIES[label];
          if (query) {
            const btn = h("button", "prompt prompt--full");
            btn.innerHTML = `<span class="q">${esc(label)}</span><span class="arrow">\u203A</span>`;
            btn.onclick = () => doSend(query);
            resp.appendChild(btn);
          }
        } else if (!fl.match(/You can ask/)) {
          const div = h("div", "resp-line--lg");
          div.innerHTML = linkify(fl);
          resp.appendChild(div);
        }
      });
    } else {
      // Greeting, stop, language switch — just show the text
      renderLines(resp, answer, "resp-line--lg");
    }

    if (data.handoff_message) {
      const handoff = h("div", "handoff");
      handoff.innerHTML = linkify(data.handoff_message);
      resp.appendChild(handoff);
    }
    resultArea.appendChild(resp);
    if (body) body.scrollTop = 0;
    return;
  }

  // ── Fallback / partial match ──
  if (isFallback) {
    if (userMessage) {
      resp.appendChild(createYouAskedBar(data, userMessage, doSend, speechManager));
    }

    if (data.related?.length > 0) {
      const intro = h("div", "intro-text");
      intro.textContent = `${ui(data, "make_sure", "Did you mean")}:`;
      resp.appendChild(intro);

      data.related.forEach(r => {
        const btn = h("button", "prompt prompt--full-spaced");
        btn.innerHTML = `<span class="q">${esc(r.title)}</span><span class="arrow">\u203A</span>`;
        btn.onclick = () => doSend(r.title);
        resp.appendChild(btn);
      });
    } else {
      const vague1 = h("div", "intro-text");
      vague1.textContent = ui(data, "too_vague_1", "That's not something I can help with.");
      resp.appendChild(vague1);
      const vague2 = h("div", "muted-text");
      vague2.textContent = ui(data, "too_vague_2", "Try asking about a specific city service.");
      resp.appendChild(vague2);
    }

    if (data.handoff_message) {
      const handoff = h("div", "handoff");
      handoff.innerHTML = linkify(data.handoff_message);
      resp.appendChild(handoff);
    }
    resultArea.appendChild(resp);
    if (body) body.scrollTop = 0;
    return;
  }

  // ── Matched intent ──
  if (userMessage) {
    resp.appendChild(createYouAskedBar(data, userMessage, doSend, speechManager));
  }

  if (sources.length > 0) {
    const primary = h("a", "primary-source");
    primary.href = safeHref(sources[0].url);
    primary.target = "_blank";
    primary.rel = "noopener";
    primary.textContent = `${sources[0].title} \u2197`;
    resp.appendChild(primary);

    if (sources.length > 1) {
      const alsoSee = ui(data, "also_see", "Also see");
      const secondary = h("div", "secondary-sources");
      let links = `${esc(alsoSee)}: `;
      for (let i = 1; i < sources.length; i++) {
        if (i > 1) links += " \u00B7 ";
        links += `<a href="${esc(safeHref(sources[i].url))}" target="_blank" rel="noopener">${esc(sources[i].title)}</a>`;
      }
      secondary.innerHTML = links;
      resp.appendChild(secondary);
    }
  }

  if (steps.length > 0) {
    const primaryUrl = sources.length > 0 ? safeHref(sources[0].url) : "";
    const stepsLabel = h("div", "steps-label");
    stepsLabel.textContent = ui(data, "see_steps", "Next steps");
    resp.appendChild(stepsLabel);

    const ol = h("ol", "steps");
    for (let i = 0; i < steps.length; i++) {
      let stepHtml = linkify(steps[i]);
      if (i === 0 && primaryUrl && stepHtml.indexOf("rva311.com/rvaone") > -1) {
        stepHtml = stepHtml.replace(/href="https:\/\/www\.rva311\.com\/rvaone"/, `href="${esc(primaryUrl)}"`);
      }
      const li = h("li", "");
      li.setAttribute("data-n", String(i + 1));
      li.innerHTML = stepHtml;
      ol.appendChild(li);
    }
    resp.appendChild(ol);
  }

  if (data.deadlines) {
    const dl = h("div", "deadline");
    dl.innerHTML = `${clockIcon} ${linkify(data.deadlines)}`;
    resp.appendChild(dl);
  }

  resultArea.appendChild(resp);
  if (body) body.scrollTop = 0;
}

// ── Helpers ──

function renderLines(container, text, cls) {
  text.split("\n").filter(l => l.trim()).forEach(line => {
    const div = h("div", cls);
    div.innerHTML = linkify(line.trim());
    container.appendChild(div);
  });
}
