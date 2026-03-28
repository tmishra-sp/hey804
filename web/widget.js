/**
 * Hey804 Widget — Your warm Richmond city navigator.
 * <script src="https://hey804.app/widget.js" data-partner="org-name"></script>
 */
(function () {
  var script = document.currentScript;
  var partner = (script && script.getAttribute("data-partner")) || "unknown";
  var baseUrl = script ? script.src.replace(/\/widget\.js(\?.*)?$/, "") : "";

  // Real questions people ask — these rotate as tappable prompts
  var prompts = [
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

  function pickPrompts() {
    var shuffled = prompts.slice().sort(function () {
      return Math.random() - 0.5;
    });
    return shuffled.slice(0, 4);
  }

  var host = document.createElement("div");
  host.id = "hey804-root";
  var shadow = host.attachShadow({ mode: "open" });

  /* ── Fonts ── */
  var fontLink = document.createElement("style");
  fontLink.textContent =
    "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');";
  shadow.appendChild(fontLink);

  var style = document.createElement("style");
  style.textContent = [
    ":host{all:initial;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}",
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}",

    /* ── Trigger card ── warm floating guide card */
    ".trigger-card{position:fixed;bottom:24px;right:24px;z-index:99998;width:300px;background:#FFFCF8;border-radius:22px;padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 12px 48px rgba(45,31,20,0.2),0 4px 12px rgba(45,31,20,0.1),0 0 0 1.5px rgba(194,99,58,0.15);transition:opacity .3s,transform .3s cubic-bezier(.34,1.56,.64,1)}",

    /* Avatar row at top of trigger */
    ".trigger-header{display:flex;align-items:center;gap:10px;padding:0 2px 2px}",
    ".trigger-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(140deg,#C2633A,#D4884A);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(194,99,58,0.3)}",
    ".trigger-greeting{font-size:13.5px;color:#3D2B1F;font-weight:500;line-height:1.3}",
    ".trigger-greeting span{color:#9A7B6B;font-weight:400;font-size:12.5px}",

    ".trigger-input-row{display:flex;align-items:center;gap:8px}",
    ".trigger-input{flex:1;border:1.5px solid #E8DFD4;border-radius:14px;padding:11px 14px;font:400 13.5px/1.4 inherit;background:#FAF7F2;color:#2D1F14;outline:none;transition:all .2s}",
    ".trigger-input:focus{border-color:#C2633A;background:#fff;box-shadow:0 0 0 3px rgba(194,99,58,0.1)}",
    ".trigger-input::placeholder{color:#B0A194}",
    ".trigger-send{width:34px;height:34px;flex-shrink:0;border:none;border-radius:50%;background:linear-gradient(135deg,#B85C38,#C2633A);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s}",
    ".trigger-send.visible{opacity:1;transform:scale(1);pointer-events:auto}",
    ".trigger-send:hover{transform:scale(1.08)}",
    ".trigger-actions{display:flex;align-items:center;gap:10px;padding:0 2px}",
    ".trigger-mic{width:40px;height:40px;border-radius:50%;border:1.5px solid #E8DFD4;background:#FAF7F2;color:#9A7B6B;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}",
    ".trigger-mic:hover{border-color:#C2633A;color:#C2633A;background:#FFF5EE}",
    ".trigger-mic.recording{background:#fef2f2;border-color:#ef4444;color:#ef4444;animation:pulse-mic 1.5s ease-in-out infinite}",
    ".trigger-mic.unsupported{opacity:0.4;cursor:not-allowed}",
    "@keyframes pulse-mic{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.3)}50%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}",
    ".trigger-wave{display:none;align-items:center;gap:3px;height:24px}",
    ".trigger-wave.active{display:flex}",
    ".trigger-wave span{display:block;width:3px;border-radius:2px;background:#ef4444;animation:wave-bar .8s ease-in-out infinite}",
    ".trigger-wave span:nth-child(1){height:8px;animation-delay:0s}",
    ".trigger-wave span:nth-child(2){height:16px;animation-delay:.15s}",
    ".trigger-wave span:nth-child(3){height:12px;animation-delay:.3s}",
    ".trigger-wave span:nth-child(4){height:8px;animation-delay:.45s}",
    "@keyframes wave-bar{0%,100%{transform:scaleY(0.5)}50%{transform:scaleY(1.2)}}",
    ".trigger-label{font-size:11px;color:#B0A194;margin-left:auto;font-weight:500;letter-spacing:.3px;transition:color .2s}",
    ".trigger-label.listening{color:#ef4444}",
    ".trigger-tooltip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#2D1F14;color:#fff;font-size:11px;padding:6px 12px;border-radius:8px;white-space:nowrap;opacity:0;transition:opacity .2s;pointer-events:none}",
    ".trigger-tooltip.show{opacity:1}",
    ".hide{display:none!important}",

    /* ── Close ── */
    ".close{position:fixed;bottom:24px;right:24px;z-index:100001;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#8B4228,#C2633A);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(139,66,40,.35);transition:transform .3s}",
    ".close:hover{transform:rotate(90deg) scale(1.1)}",

    /* ── Panel ── */
    ".panel{position:fixed;bottom:92px;right:24px;z-index:100000;width:400px;max-height:600px;background:#FFFCF8;border-radius:22px;box-shadow:0 25px 60px rgba(45,31,20,.14),0 8px 24px rgba(45,31,20,.06),0 0 0 1px rgba(45,31,20,.04);display:flex;flex-direction:column;overflow:hidden;transform:translateY(16px) scale(.95);opacity:0;pointer-events:none;transition:transform .35s cubic-bezier(.34,1.56,.64,1),opacity .25s}",
    ".panel.open{transform:none;opacity:1;pointer-events:auto}",
    ".widget-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99997;opacity:1;pointer-events:auto}",

    /* ── Header — Richmond sunset warmth ── */
    ".hdr{background:linear-gradient(160deg,#1E1209 0%,#3D2014 30%,#6B3A25 70%,#8B4A2E 100%);padding:30px 24px 22px;position:relative;overflow:hidden}",
    /* Gold shimmer line */
    ".hdr::before{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,rgba(212,168,85,.5),rgba(212,168,85,.7),rgba(212,168,85,.5),transparent);animation:shimmer 4s ease-in-out infinite}",
    "@keyframes shimmer{0%,100%{opacity:.3}50%{opacity:1}}",
    /* Warm stars */
    ".hdr::after{content:'';position:absolute;top:10px;right:20px;width:100px;height:30px;background-image:radial-gradient(1px 1px at 12px 8px,rgba(212,168,85,.4),transparent),radial-gradient(1px 1px at 45px 20px,rgba(255,245,220,.3),transparent),radial-gradient(1.5px 1.5px at 78px 6px,rgba(212,168,85,.5),transparent),radial-gradient(1px 1px at 92px 22px,rgba(255,245,220,.35),transparent);pointer-events:none}",
    /* Skyline */
    ".skyline{position:absolute;bottom:0;left:0;right:0;height:28px;opacity:.08}",
    ".hdr-inner{position:relative;z-index:1;display:flex;align-items:flex-start;gap:14px}",
    ".hdr-avatar{width:44px;height:44px;border-radius:50%;background:linear-gradient(140deg,#C2633A,#D4A855);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 12px rgba(212,168,85,0.3)}",
    ".hdr-text{flex:1}",
    ".greeting{font:500 22px/1.2 inherit;color:#fff;margin-bottom:4px}",
    ".greeting b{font-weight:700}",
    ".subtitle{font-size:12.5px;color:rgba(212,168,85,.85);letter-spacing:.3px;font-weight:400}",

    /* ── Body ── */
    ".body{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;background:#FFFCF8}",
    ".body::-webkit-scrollbar{width:4px}",
    ".body::-webkit-scrollbar-thumb{background:#E8DFD4;border-radius:4px}",

    /* ── Input area ── */
    ".input-area{display:flex;gap:8px;margin-bottom:20px}",
    ".input{flex:1;padding:12px 16px;border:1.5px solid #E8DFD4;border-radius:14px;font:400 14px/1.4 inherit;background:#FAF7F2;color:#2D1F14;outline:none;transition:all .2s}",
    ".input:focus{border-color:#C2633A;background:#fff;box-shadow:0 0 0 3px rgba(194,99,58,.08)}",
    ".input::placeholder{color:#B0A194}",
    ".send{width:44px;height:44px;flex-shrink:0;border:none;border-radius:14px;background:linear-gradient(135deg,#8B4228,#C2633A);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s}",
    ".send:hover{transform:scale(1.05)}",
    ".send:disabled{opacity:.3;cursor:not-allowed;transform:none}",

    /* ── Prompt suggestions ── */
    ".prompts-label{font-size:11px;font-weight:600;color:#B0A194;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}",
    ".prompts{display:flex;flex-direction:column;gap:6px}",
    ".prompt{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#fff;border:1.5px solid #F0EBE4;border-radius:14px;cursor:pointer;font:400 13.5px/1.4 inherit;color:#4A3A2E;transition:all .18s;text-align:left;width:100%;border-left:3px solid transparent}",
    ".prompt:hover{border-color:#E8DFD4;border-left-color:#C2633A;background:#FFF8F0;transform:translateX(4px)}",
    ".prompt:active{transform:scale(.98)}",
    ".prompt .arrow{margin-left:auto;color:#C5A572;font-size:16px;transition:color .15s}",
    ".prompt:hover .arrow{color:#C2633A}",
    ".prompt .q{color:#2D1F14;font-weight:500}",

    /* ── Footer ── */
    ".ft{padding:10px 20px;text-align:center;font-size:10.5px;color:#B0A194;border-top:1px solid #F0EBE4;flex-shrink:0;background:#FAF7F2}",

    /* ── Loading ── */
    ".loading{padding:16px 0}",
    ".shimmer{height:13px;border-radius:8px;margin-bottom:12px;background:linear-gradient(90deg,#F0EBE4 25%,#E8DFD4 50%,#F0EBE4 75%);background-size:200% 100%;animation:shim 1.2s ease-in-out infinite}",
    ".shimmer:nth-child(1){width:100%}.shimmer:nth-child(2){width:80%}.shimmer:nth-child(3){width:55%}",
    "@keyframes shim{0%{background-position:200% 0}100%{background-position:-200% 0}}",

    /* ── Response ── */
    ".resp{animation:up .4s ease}",
    "@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}",

    /* First action — warm hero card */
    ".first-action{background:linear-gradient(135deg,#2D1F14,#5C3524,#6B3A25);color:#fff;border-radius:16px;padding:18px 20px;margin-bottom:14px;position:relative;overflow:hidden}",
    ".first-action::after{content:'';position:absolute;top:0;right:0;width:60px;height:60px;background:radial-gradient(circle at top right,rgba(212,168,85,.15),transparent);pointer-events:none}",
    ".first-action-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(212,168,85,.85);margin-bottom:8px;font-weight:600}",
    ".first-action-text{font-size:15px;font-weight:600;line-height:1.45}",
    ".first-action a{color:#F5D89A;text-decoration:underline;text-underline-offset:2px}",

    /* Answer text */
    ".answer{font-size:13.5px;line-height:1.7;color:#4A3A2E;margin-bottom:14px}",

    /* More steps — expandable */
    ".steps{list-style:none;padding:0;margin:0}",
    ".steps li{padding:5px 0 5px 4px;font-size:13px;line-height:1.55;color:#4A3A2E}",
    ".steps li::before{content:attr(data-n);display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#2D1F14;color:#fff;border-radius:50%;font-size:10px;font-weight:700;margin-right:8px;vertical-align:middle}",

    /* Deadline */
    ".deadline{display:flex;align-items:center;gap:7px;padding:8px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:12px;color:#92400e;font-weight:500;margin-bottom:14px}",

    /* Source */
    ".sources-label{font-size:10px;font-weight:600;color:#9A7B6B;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}",
    ".primary-source{display:block;text-align:center;padding:12px 16px;background:#2D6B42;color:#fff;border-radius:10px;font-size:13.5px;font-weight:600;text-decoration:none;margin:14px 0 8px;transition:background .15s;cursor:pointer}",
    ".primary-source:hover{background:#245A36}",
    ".sources-footnote{font-size:11px;color:#7A6A5E;margin-bottom:14px;line-height:1.6}",
    ".sources-footnote .sources-label{font-weight:600;text-transform:uppercase;letter-spacing:0.5px;font-size:9.5px}",
    ".source{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;background:#F0F7F2;border:1px solid #B5DABE;border-radius:7px;font-size:11.5px;font-weight:500;color:#2D6B42;text-decoration:underline;text-underline-offset:2px;margin-bottom:14px;transition:background .15s;cursor:pointer}",
    ".source:hover{background:#DFF0E3;border-color:#7BC48A}",
    ".source:hover{background:#E0F0E4}",

    /* Related topics (partial match) */
    ".related-section{margin-top:14px}",
    ".related-label{font-size:11px;font-weight:600;color:#B0A194;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}",
    ".related-link{display:flex;align-items:center;gap:10px;padding:12px 16px;background:#fff;border:1.5px solid #F0EBE4;border-radius:14px;cursor:pointer;font:400 13.5px/1.4 inherit;color:#4A3A2E;transition:all .18s;text-align:left;width:100%;border-left:3px solid transparent;text-decoration:none;margin-bottom:6px}",
    ".related-link:hover{border-color:#E8DFD4;border-left-color:#C2633A;background:#FFF8F0;transform:translateX(4px)}",
    ".related-title{color:#2D1F14;font-weight:500}",
    ".related-link .arrow{margin-left:auto;color:#C5A572;font-size:16px}",

    /* Back link */
    ".back{display:inline-flex;align-items:center;gap:4px;margin-top:8px;font:500 13px/1 inherit;color:#C2633A;background:none;border:none;cursor:pointer;padding:0;transition:color .15s}",
    ".back:hover{color:#8B4228;text-decoration:underline}",

    /* Error */
    ".err{padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;font-size:13px;color:#991b1b;margin-bottom:12px}",

    /* Responsive */
    "@media(max-width:480px){.panel{left:8px;right:8px;bottom:8px;width:auto;max-height:85vh;border-radius:22px 22px 16px 16px}.close{bottom:calc(85vh + 14px)}.trigger-card{left:12px;right:12px;width:auto;bottom:12px}}",
  ].join("\n");
  shadow.appendChild(style);

  // SVGs
  var svgSend =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  var svgX =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var svgCheck =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var svgClock =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  var svgBack =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  var svgSkyline =
    '<svg class="skyline" viewBox="0 0 400 28" preserveAspectRatio="none" fill="white"><path d="M0 28V20h8v-5h3v5h6V14h3v6h8V10h3v10h10V15h3v5h10v-6h3v6h6V8h3V5h2v3h3v12h10V16h3v4h6v-5h3v5h10V12h3v8h6V14h2v6h8v-5h3v5h10v-6h3v6h6V10h3v10h10V14h2v6h8v-5h3v5h10V12h3v8h6V14h2v6h10V10h3v10h10V16h2v4h10v8H0z"/></svg>';
  // Compass icon for avatar
  var svgCompass =
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="rgba(255,255,255,0.3)" stroke="white"/></svg>';

  function h(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }
  function esc(t) {
    var d = document.createElement("span");
    d.textContent = t;
    return d.innerHTML;
  }
  function linkify(t) {
    // Escape first for safety, then convert URLs and phone numbers to clickable links
    var safe = esc(t);
    // URLs
    safe = safe.replace(
      /(https?:\/\/[^\s<,)]+)/g,
      '<a href="$1" target="_blank" rel="noopener" style="color:#C2633A;text-decoration:underline;word-break:break-all">$1</a>',
    );
    // Bare domains (rva311.com, rva.gov, commonhelp.virginia.gov, etc.)
    safe = safe.replace(
      /(?<![\/\w])((?:rva\.gov|commonhelp\.virginia\.gov|coverva\.dmas\.virginia\.gov|valegalaid\.org|elections\.virginia\.gov|apps\.richmondgov\.com|rvalibrary\.org|enrollrps\.schoolmint\.com|dmv\.virginia\.gov|dominionenergy\.com)[^\s<,)]*)/g,
      '<a href="https://$1" target="_blank" rel="noopener" style="color:#C2633A;text-decoration:underline;word-break:break-all">$1</a>',
    );
    // rva311.com — bare domain links to service directory, paths link directly
    safe = safe.replace(
      /(?<![\/\w])(rva311\.com)(\/[^\s<,)]+)?/g,
      function(match, domain, path) {
        if (path) return '<a href="https://' + domain + path + '" target="_blank" rel="noopener" style="color:#C2633A;text-decoration:underline;word-break:break-all">' + domain + path + '</a>';
        return '<a href="https://www.rva311.com/rvaone" target="_blank" rel="noopener" style="color:#C2633A;text-decoration:underline;word-break:break-all">' + domain + '</a>';
      },
    );
    // Phone numbers (804-646-7000 format) — inline, no word-break
    safe = safe.replace(
      /(\d{3}[-.]?\d{3}[-.]?\d{4})/g,
      '<a href="tel:$1" style="color:#C2633A;text-decoration:underline;white-space:nowrap">$1</a>',
    );
    // Short codes (311, 211, 911, 988) — tappable to call, inline (no word-break)
    safe = safe.replace(
      /\b(911|988|311|211)\b/g,
      '<a href="tel:$1" style="color:#C2633A;text-decoration:underline">$1</a>',
    );
    return safe;
  }

  // --- Trigger Card ---
  var triggerCard = h("div", "trigger-card");
  triggerCard.setAttribute("role", "region");
  triggerCard.setAttribute("aria-label", "Hey804 city guide");

  // Avatar + greeting row
  var triggerHdr = h("div", "trigger-header");
  var triggerAvatar = h("div", "trigger-avatar");
  triggerAvatar.innerHTML = svgCompass;
  var triggerGreetEl = h("div", "trigger-greeting");
  triggerGreetEl.innerHTML =
    "Your RVA Guide<br><span>Find the right city service, fast</span>";
  triggerHdr.appendChild(triggerAvatar);
  triggerHdr.appendChild(triggerGreetEl);
  triggerCard.appendChild(triggerHdr);

  var triggerInputRow = h("div", "trigger-input-row");
  var triggerInput = h("input", "trigger-input");
  triggerInput.type = "text";
  triggerInput.placeholder = "Pothole, water bill, food stamps...";
  triggerInput.setAttribute("aria-label", "Ask about Richmond city services");
  var triggerSendBtn = h("button", "trigger-send");
  triggerSendBtn.setAttribute("aria-label", "Send");
  triggerSendBtn.innerHTML =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  triggerInputRow.appendChild(triggerInput);
  triggerInputRow.appendChild(triggerSendBtn);
  triggerCard.appendChild(triggerInputRow);

  var triggerActions = h("div", "trigger-actions");
  var speechSupported = !!(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
  var micBtn = h(
    "button",
    speechSupported ? "trigger-mic" : "trigger-mic unsupported",
  );
  micBtn.setAttribute("aria-label", "Voice input");
  micBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="1" width="6" height="11" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
  triggerActions.appendChild(micBtn);

  var waveDiv = h("div", "trigger-wave");
  for (var wi = 0; wi < 4; wi++) {
    waveDiv.appendChild(h("span", ""));
  }
  triggerActions.appendChild(waveDiv);

  // Removed Hey804 label — shown in panel footer instead

  triggerCard.appendChild(triggerActions);
  shadow.appendChild(triggerCard);

  // --- Close ---
  var closeBtn = h("button", "close hide");
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = svgX;
  shadow.appendChild(closeBtn);

  // --- Overlay (dims background when widget is open) ---
  var overlay = h("div", "widget-overlay");
  shadow.appendChild(overlay);

  // --- Panel ---
  var panel = h("div", "panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Hey804 Richmond Guide");

  // Header
  var hdr = h("div", "hdr");
  hdr.innerHTML =
    '<div class="hdr-inner"><div class="hdr-avatar">' +
    svgCompass +
    '</div><div class="hdr-text"><div class="greeting">Hey <b>neighbor!</b></div><div class="subtitle">Let me help you navigate Richmond</div></div></div>' +
    svgSkyline;
  panel.appendChild(hdr);

  // Body
  var body = h("div", "body");
  panel.appendChild(body);

  // Footer
  var ft = h("div", "ft");
  ft.textContent = "Your Richmond Navigator \u00B7 Hey804";
  panel.appendChild(ft);

  shadow.appendChild(panel);

  // --- State ---
  var promptsDiv, resultArea;
  var recognition = null;
  var isRecording = false;

  function buildHome() {
    body.innerHTML = "";

    // Input field (only on home screen — gets hidden when response loads)
    var panelInputRow = h("div", "input-area");
    panelInputRow.id = "hey804-home-input";
    var panelInput = h("input", "input");
    panelInput.type = "text";
    panelInput.placeholder = "Tell me what\u2019s going on\u2026";
    panelInput.setAttribute("aria-label", "Ask about Richmond city services");
    var panelSendBtn = h("button", "send");
    panelSendBtn.innerHTML =
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
    panelSendBtn.onclick = function () {
      var msg = panelInput.value.trim();
      if (msg) {
        panelInput.value = "";
        doSend(msg);
      }
    };
    panelInput.onkeydown = function (e) {
      if (e.key === "Enter") {
        var msg = panelInput.value.trim();
        if (msg) {
          panelInput.value = "";
          doSend(msg);
        }
      }
    };
    panelInputRow.appendChild(panelInput);
    panelInputRow.appendChild(panelSendBtn);
    body.appendChild(panelInputRow);

    // Prompt suggestions
    var label = h("div", "prompts-label");
    label.textContent = "Neighbors often ask";
    body.appendChild(label);

    promptsDiv = h("div", "prompts");
    var selected = pickPrompts();
    selected.forEach(function (text) {
      var btn = h("button", "prompt");
      btn.innerHTML =
        '<span class="q">\u201C' +
        esc(text) +
        '\u201D</span><span class="arrow">\u203A</span>';
      btn.onclick = function () {
        doSend(text);
      };
      promptsDiv.appendChild(btn);
    });
    body.appendChild(promptsDiv);

    // Result area
    resultArea = h("div", "");
    resultArea.setAttribute("aria-live", "polite");
    body.appendChild(resultArea);
  }

  buildHome();

  // --- Open/Close ---
  function openWidget() {
    if (isRecording && recognition) recognition.stop();
    panel.classList.add("open");
    triggerCard.classList.add("hide");
    closeBtn.classList.remove("hide");
    try {
      sessionStorage.setItem("hey804_open", "1");
    } catch (e) {}
  }
  function closeWidget() {
    panel.classList.remove("open");
    triggerCard.classList.remove("hide");
    closeBtn.classList.add("hide");
    try {
      sessionStorage.setItem("hey804_open", "0");
    } catch (e) {}
  }
  closeBtn.onclick = closeWidget;
  panel.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeWidget();
  });

  // --- Trigger card events ---
  triggerInput.oninput = function () {
    if (triggerInput.value.trim()) {
      triggerSendBtn.classList.add("visible");
    } else {
      triggerSendBtn.classList.remove("visible");
    }
  };
  triggerInput.onkeydown = function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      var msg = triggerInput.value.trim();
      if (msg) {
        triggerInput.value = "";
        triggerSendBtn.classList.remove("visible");
        openWidget();
        doSend(msg);
      }
    }
  };
  triggerSendBtn.onclick = function () {
    var msg = triggerInput.value.trim();
    if (msg) {
      triggerInput.value = "";
      triggerSendBtn.classList.remove("visible");
      openWidget();
      doSend(msg);
    }
  };

  // --- Voice input ---
  function stopRecordingUI() {
    isRecording = false;
    micBtn.classList.remove("recording");
    micBtn.setAttribute("aria-label", "Voice input");
    waveDiv.classList.remove("active");
    triggerLabel.textContent = "Hey804";
    triggerLabel.classList.remove("listening");
  }

  if (speechSupported) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      isRecording = true;
      micBtn.classList.add("recording");
      micBtn.setAttribute("aria-label", "Stop recording");
      waveDiv.classList.add("active");
      triggerLabel.textContent = "I\u2019m listening\u2026";
      triggerLabel.classList.add("listening");
    };

    recognition.onresult = function (e) {
      var transcript = e.results[0][0].transcript;
      triggerInput.value = transcript;
      triggerSendBtn.classList.add("visible");
      if (e.results[0].isFinal && transcript.trim()) {
        stopRecordingUI();
        triggerInput.value = "";
        triggerSendBtn.classList.remove("visible");
        openWidget();
        doSend(transcript.trim());
      }
    };

    recognition.onend = function () {
      stopRecordingUI();
    };

    recognition.onerror = function (e) {
      stopRecordingUI();
      if (e.error === "not-allowed") {
        showTriggerTooltip("Microphone access denied");
      } else if (e.error === "no-speech") {
        showTriggerTooltip("No speech detected \u2014 try again");
      }
    };

    micBtn.onclick = function () {
      if (isRecording) {
        recognition.stop();
      } else {
        triggerInput.value = "";
        triggerSendBtn.classList.remove("visible");
        recognition.start();
      }
    };
  } else {
    micBtn.onclick = function () {
      showTriggerTooltip("Voice not available \u2014 try Chrome or Edge");
    };
  }

  function showTriggerTooltip(msg) {
    var tip = h("div", "trigger-tooltip show");
    tip.textContent = msg;
    triggerCard.style.position = triggerCard.style.position || "fixed";
    triggerCard.appendChild(tip);
    setTimeout(function () {
      tip.classList.remove("show");
      setTimeout(function () {
        if (tip.parentNode) tip.parentNode.removeChild(tip);
      }, 200);
    }, 2500);
  }

  // --- Send ---
  function doSend(message) {
    message = message.trim();
    if (!message) return;
    promptsDiv.style.display = "none";
    var lbl = body.querySelector(".prompts-label");
    if (lbl) lbl.style.display = "none";
    var homeInput = shadow.getElementById("hey804-home-input");
    if (homeInput) homeInput.style.display = "none";

    resultArea.innerHTML =
      '<div class="loading"><div class="shimmer"></div><div class="shimmer"></div><div class="shimmer"></div></div>';

    fetch(baseUrl + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message,
        channel: "widget",
        context: { partner: partner },
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(function (d) {
        renderResponse(d, message);
      })
      .catch(function () {
        resultArea.innerHTML =
          '<div class="err">Something went wrong. Try again or call <a href="tel:8046467000" style="color:#991b1b">804-646-7000</a>.</div>';
        addBackButton();
      });
  }

  var svgPencil =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';

  function buildYouAskedHtml(data, userMessage) {
    var label = data.ui_messages ? data.ui_messages.you_asked : "You asked";
    return (
      '<div class="you-asked-row" style="background:#F5EDE3;border-radius:12px;padding:8px 10px 8px 14px;margin-bottom:12px;display:flex;align-items:center;gap:6px;">' +
      '<b style="font-size:13px;color:#7A6A5E;white-space:nowrap;">' +
      esc(label) +
      ":</b>" +
      '<input type="text" class="you-asked-input" value="' +
      esc(userMessage).replace(/"/g, "&quot;") +
      '" style="flex:1;border:1.5px solid #D9CFC3;border-radius:8px;background:#fff;padding:5px 8px;font:inherit;font-size:13px;color:#4A3A2E;outline:none;min-width:0;" />' +
      '<button class="you-asked-mic" style="width:28px;height:28px;border-radius:50%;border:1.5px solid #E8DFD4;background:#FAF7F2;color:#9A7B6B;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;' + (speechSupported ? '' : 'opacity:0.4;cursor:not-allowed;') + '">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="1" width="6" height="11" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>' +
      "</button>" +
      '<button class="you-asked-send" style="width:28px;height:28px;border-radius:50%;border:none;background:#C2633A;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
      svgSend +
      "</button>" +
      "</div>"
    );
  }

  function wireYouAsked(container) {
    var input = container.querySelector(".you-asked-input");
    var btn = container.querySelector(".you-asked-send");
    var mic = container.querySelector(".you-asked-mic");
    if (!input || !btn) return;
    function submit() {
      var v = input.value.trim();
      if (v) doSend(v);
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
    });
    btn.onclick = submit;
    if (mic && speechSupported && recognition) {
      mic.onclick = function () {
        // Reuse the same recognition instance from the trigger card
        // Temporarily redirect its handlers to this input
        var origOnResult = recognition.onresult;
        var origOnEnd = recognition.onend;
        var origOnError = recognition.onerror;

        mic.style.borderColor = "#ef4444";
        mic.style.color = "#ef4444";

        recognition.onresult = function (e) {
          var transcript = e.results[0][0].transcript;
          input.value = transcript;
          if (e.results[0].isFinal) {
            mic.style.borderColor = "#E8DFD4";
            mic.style.color = "#9A7B6B";
            recognition.onresult = origOnResult;
            recognition.onend = origOnEnd;
            recognition.onerror = origOnError;
            input.focus();
          }
        };
        recognition.onend = function () {
          mic.style.borderColor = "#E8DFD4";
          mic.style.color = "#9A7B6B";
          recognition.onresult = origOnResult;
          recognition.onend = origOnEnd;
          recognition.onerror = origOnError;
        };
        recognition.onerror = recognition.onend;
        recognition.start();
      };
    }
  }

  function renderResponse(data, userMessage) {
    var html = '<div class="resp">';

    var steps = data.action_steps || [];
    var answer = data.answer || "";
    var sources = data.sources || [];
    var dept = data.department;
    var isEmergency = data.intent === "_emergency";
    var isCrisis = data.intent === "_crisis";
    var isRedirect = data.intent === "_redirect";
    var isSpecial = isEmergency || isCrisis || isRedirect;
    var isFallback =
      !data.intent ||
      data.intent === "_partial_match" ||
      data.intent === "_help";

    // --- EMERGENCY: red alert, nothing else ---
    if (isEmergency) {
      html +=
        '<div style="background:#DC2626;color:#fff;border-radius:12px;padding:20px;margin-bottom:14px;text-align:center;">';
      html +=
        '<div style="font-size:22px;font-weight:700;margin-bottom:10px;">\u26A0\uFE0F ' +
        esc(data.ui_messages.emergency) +
        "</div>";
      html += "</div>";
      var elines = answer.split("\n").filter(function (l) {
        return l.trim();
      });
      for (var ei = 0; ei < elines.length; ei++) {
        html +=
          '<div style="margin:4px 0;font-size:13.5px;">' +
          linkify(elines[ei].trim()) +
          "</div>";
      }
      html += "</div>";
      resultArea.innerHTML = html;
      body.scrollTop = 0;
      addBackButton(data.ui_messages.back_button);
      return;
    }

    // --- CRISIS: purple card with hotlines ---
    if (isCrisis) {
      html +=
        '<div style="background:#7C3AED;color:#fff;border-radius:12px;padding:18px;margin-bottom:14px;">';
      html +=
        '<div style="font-size:13px;font-weight:600;opacity:0.85;margin-bottom:8px;">' +
        esc(data.ui_messages.crisis) +
        "</div>";
      var clines = answer.split("\n").filter(function (l) {
        return l.trim();
      });
      for (var ci = 0; ci < clines.length; ci++) {
        html +=
          '<div style="margin:4px 0;font-size:14px;">' +
          linkify(clines[ci].trim()).replace(
            /color:#C2633A/g,
            "color:#E9D5FF",
          ) +
          "</div>";
      }
      html += "</div>";
      html += "</div>";
      resultArea.innerHTML = html;
      body.scrollTop = 0;
      addBackButton(data.ui_messages.back_button);
      return;
    }

    // --- REDIRECT: honest "not us, here's who" ---
    if (isRedirect) {
      var rlines = answer.split("\n").filter(function (l) {
        return l.trim();
      });
      for (var ri = 0; ri < rlines.length; ri++) {
        html +=
          '<div style="margin:5px 0;font-size:14px;">' +
          linkify(rlines[ri].trim()) +
          "</div>";
      }
      html += "</div>";
      resultArea.innerHTML = html;
      body.scrollTop = 0;
      addBackButton(data.ui_messages.back_button);
      return;
    }

    // --- FALLBACK / HELP ---
    if (isFallback) {
      if (userMessage) {
        html += buildYouAskedHtml(data, userMessage);
      }
      if (data.intent === "_help") {
        // Help menu — tappable category buttons
        var helpQueries = {
          "Tax bills & payment plans": "I can't pay my tax bill",
          "SNAP, Medicaid, benefits": "How do I get food stamps",
          "Utility bills & assistance": "Can't pay my water bill",
          "Rent help & housing": "I need help paying rent",
          "City services (311, trash, permits)": "When is trash pickup",
          "Roads, sidewalks, sewer, trees, parks": "How to report a pothole",
          "Code violations, dumping, pests, parking":
            "My neighbor's yard is full of junk",
        };
        html +=
          '<div style="margin-bottom:12px;font-size:14px;color:#4A3A2E;">' +
          esc(data.ui_messages.fallback) +
          ":</div>";
        var flines = answer.split("\n").filter(function (l) {
          return l.trim();
        });
        for (var fi = 0; fi < flines.length; fi++) {
          var fl = flines[fi].trim();
          if (fl.match(/^- /)) {
            var label = fl.replace(/^- /, "");
            var query = helpQueries[label];
            if (query) {
              html +=
                '<button class="prompt help-cat" data-query="' +
                esc(query) +
                '" style="width:100%;text-align:left;margin-bottom:4px;">';
              html +=
                '<span class="q">' +
                esc(label) +
                '</span><span class="arrow">\u203A</span></button>';
            } else {
              html +=
                '<div style="padding-left:12px;margin:3px 0;font-size:13.5px;">' +
                linkify(fl) +
                "</div>";
            }
          } else if (!fl.match(/You can ask/)) {
            html +=
              '<div style="margin:5px 0;font-size:14px;">' +
              linkify(fl) +
              "</div>";
          }
        }
        // Wire up tappable categories
        setTimeout(function () {
          var cats = resultArea.querySelectorAll(".help-cat");
          cats.forEach(function (btn) {
            btn.onclick = function () {
              doSend(btn.getAttribute("data-query"));
            };
          });
        }, 0);
      } else if (data.related && data.related.length > 0) {
        // Vague but city-related — nudge with contextual options
        html +=
          '<div style="margin-bottom:14px;font-size:14px;color:#4A3A2E;">' +
          esc(data.ui_messages.make_sure) +
          ":</div>";
        data.related.forEach(function (r) {
          html +=
            '<button class="prompt" style="width:100%;text-align:left;margin-bottom:6px;" onclick="(function(){})()"><span class="q">' +
            esc(r.title) +
            '</span><span class="arrow">\u203A</span></button>';
        });
        // Wire up the buttons to send as queries
        setTimeout(function () {
          var btns = resultArea.querySelectorAll(".prompt");
          var relatedData = data.related;
          btns.forEach(function (btn, idx) {
            if (relatedData[idx]) {
              btn.onclick = function () {
                doSend(relatedData[idx].title);
              };
            }
          });
        }, 0);
      } else {
        // Totally off-topic — no related matches at all
        html +=
          '<div style="margin-bottom:14px;font-size:14px;color:#4A3A2E;">';
        html += esc(data.ui_messages.too_vague_1);
        html += "</div>";
        html +=
          '<div style="font-size:13px;color:#7A6A5E;">' +
          esc(data.ui_messages.too_vague_2) +
          "</div>";
      }
      // Always show 311 handoff on fallback
      if (data.handoff_message) {
        html +=
          '<div style="margin-top:14px;padding-top:12px;border-top:1px solid #E8DFD4;font-size:13px;color:#4A3A2E;">' +
          linkify(data.handoff_message) +
          "</div>";
      }
      html += "</div>";
      resultArea.innerHTML = html;
      body.scrollTop = 0;
      wireYouAsked(resultArea);
      addBackButton(data.ui_messages.back_button);
      return;
    }

    // --- MATCHED INTENT: clean 3-part layout ---

    // What you asked — editable so user can tweak and resubmit
    if (userMessage) {
      html += buildYouAskedHtml(data, userMessage);
    }

    // 1. Action button + secondary sources
    if (sources.length > 0) {
      var primary = sources[0];
      html +=
        '<a class="primary-source" href="' +
        esc(primary.url) +
        '" target="_blank" rel="noopener">' +
        esc(primary.title) +
        " \u2197</a>";
      if (sources.length > 1) {
        var alsoSeeLabel = data.ui_messages
          ? data.ui_messages.also_see
          : "Also see";
        html +=
          '<div style="font-size:11px;color:#9A8E82;margin-top:6px;margin-bottom:14px;">' +
          esc(alsoSeeLabel) +
          ": ";
        for (var si = 1; si < sources.length; si++) {
          if (si > 1) html += " \u00B7 ";
          html +=
            '<a href="' +
            esc(sources[si].url) +
            '" target="_blank" rel="noopener" style="color:#7A6A5E;text-decoration:underline">' +
            esc(sources[si].title) +
            "</a>";
        }
        html += "</div>";
      }
    }

    // 2. Steps (always visible, no toggle)
    if (steps.length > 0) {
      var primaryUrl = sources.length > 0 ? sources[0].url : "";
      html += '<div style="font-size:12px;font-weight:600;color:#7A6A5E;margin-bottom:8px;">Next steps</div>';
      html += '<ol class="steps">';
      for (var i = 0; i < steps.length; i++) {
        var stepHtml = linkify(steps[i]);
        // Step 1 links to same form as the source button
        if (i === 0 && primaryUrl && stepHtml.indexOf("rva311.com/rvaone") > -1) {
          stepHtml = stepHtml.replace(/href="https:\/\/www\.rva311\.com\/rvaone"/, 'href="' + esc(primaryUrl) + '"');
        }
        html += '<li data-n="' + (i + 1) + '">' + stepHtml + "</li>";
      }
      html += "</ol>";
    }

    // 3. Deadline
    if (data.deadlines) {
      html +=
        '<div class="deadline">' +
        svgClock +
        " " +
        linkify(data.deadlines) +
        "</div>";
    }

    html += "</div>";

    resultArea.innerHTML = html;
    body.scrollTop = 0;
    wireYouAsked(resultArea);
  }

  function addBackButton(msg) {
    var back = h("button", "back");
    back.innerHTML = svgBack + " " + esc(msg || "Ask me something else");
    back.onclick = function () {
      closeWidget();
      buildHome();
    };
    resultArea.appendChild(back);
  }

  // --- Mount ---
  document.body.appendChild(host);
  try {
    if (sessionStorage.getItem("hey804_open") === "1") openWidget();
  } catch (e) {}
})();
