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
  ];

  function pickPrompts() {
    var shuffled = prompts.slice().sort(function () { return Math.random() - 0.5; });
    return shuffled.slice(0, 4);
  }

  var host = document.createElement("div");
  host.id = "hey804-root";
  var shadow = host.attachShadow({ mode: "open" });

  /* ── Fonts ── */
  var fontLink = document.createElement("style");
  fontLink.textContent = "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');";
  shadow.appendChild(fontLink);

  var style = document.createElement("style");
  style.textContent = [
    ":host{all:initial;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}",
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}",

    /* ── Trigger card ── warm floating guide card */
    ".trigger-card{position:fixed;bottom:24px;right:24px;z-index:99998;width:300px;background:#FFFCF8;border-radius:22px;padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 8px 40px rgba(45,31,20,0.12),0 2px 8px rgba(45,31,20,0.06),0 0 0 1px rgba(45,31,20,0.04);transition:opacity .3s,transform .3s cubic-bezier(.34,1.56,.64,1)}",

    /* Avatar row at top of trigger */
    ".trigger-header{display:flex;align-items:center;gap:10px;padding:0 2px 2px}",
    ".trigger-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(140deg,#C2633A,#D4884A);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(194,99,58,0.3)}",
    ".trigger-greeting{font-size:13.5px;color:#3D2B1F;font-weight:500;line-height:1.3}",
    ".trigger-greeting span{color:#9A7B6B;font-weight:400;font-size:12.5px}",

    ".trigger-input-row{display:flex;align-items:center;gap:8px}",
    ".trigger-input{flex:1;border:1.5px solid #E8DFD4;border-radius:14px;padding:11px 14px;font:400 13.5px/1.4 inherit;background:#FAF7F2;color:#2D1F14;outline:none;transition:all .2s}",
    ".trigger-input:focus{border-color:#C2633A;background:#fff;box-shadow:0 0 0 3px rgba(194,99,58,0.1)}",
    ".trigger-input::placeholder{color:#B0A194}",
    ".trigger-send{width:34px;height:34px;flex-shrink:0;border:none;border-radius:50%;background:linear-gradient(135deg,#B85C38,#C2633A);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0.8);transition:opacity .2s,transform .2s;pointer-events:none}",
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
    ".more-toggle{display:flex;align-items:center;gap:6px;padding:0;background:none;border:none;font:500 13px/1 inherit;color:#C2633A;cursor:pointer;margin-bottom:10px;transition:color .15s}",
    ".more-toggle:hover{color:#8B4228}",
    ".more-toggle .chevron{transition:transform .2s;font-size:16px}",
    ".more-toggle.expanded .chevron{transform:rotate(90deg)}",
    ".more-steps{display:none;margin-bottom:14px}",
    ".more-steps.show{display:block}",
    ".steps{list-style:none;padding:0 0 0 14px;margin:0;border-left:3px solid #D4A855}",
    ".steps li{padding:5px 0 5px 4px;font-size:13px;line-height:1.55;color:#4A3A2E}",
    ".steps li::before{content:attr(data-n);display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#2D1F14;color:#fff;border-radius:50%;font-size:10px;font-weight:700;margin-right:8px;vertical-align:middle}",

    /* Deadline */
    ".deadline{display:flex;align-items:center;gap:7px;padding:8px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:12px;color:#92400e;font-weight:500;margin-bottom:14px}",

    /* Source */
    ".source{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:#F0F7F2;border:1px solid #B5DABE;border-radius:7px;font-size:11px;font-weight:500;color:#2D6B42;text-decoration:none;margin-bottom:14px;transition:background .15s}",
    ".source:hover{background:#E0F0E4}",

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
  var svgSend = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  var svgX = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var svgCheck = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var svgClock = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  var svgBack = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
  var svgMic = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="1" width="6" height="11" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
  var svgSkyline = '<svg class="skyline" viewBox="0 0 400 28" preserveAspectRatio="none" fill="white"><path d="M0 28V20h8v-5h3v5h6V14h3v6h8V10h3v10h10V15h3v5h10v-6h3v6h6V8h3V5h2v3h3v12h10V16h3v4h6v-5h3v5h10V12h3v8h6V14h2v6h8v-5h3v5h10v-6h3v6h6V10h3v10h10V14h2v6h8v-5h3v5h10V12h3v8h6V14h2v6h10V10h3v10h10V16h2v4h10v8H0z"/></svg>';
  // Compass icon for avatar
  var svgCompass = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="rgba(255,255,255,0.3)" stroke="white"/></svg>';

  function h(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }
  function esc(t) { var d = document.createElement("span"); d.textContent = t; return d.innerHTML; }

  // --- Trigger Card ---
  var triggerCard = h("div", "trigger-card");
  triggerCard.setAttribute("role", "region");
  triggerCard.setAttribute("aria-label", "Hey804 city guide");

  // Avatar + greeting row
  var triggerHdr = h("div", "trigger-header");
  var triggerAvatar = h("div", "trigger-avatar");
  triggerAvatar.innerHTML = svgCompass;
  var triggerGreetEl = h("div", "trigger-greeting");
  triggerGreetEl.innerHTML = "Your RVA Guide<br><span>I know my way around Richmond</span>";
  triggerHdr.appendChild(triggerAvatar);
  triggerHdr.appendChild(triggerGreetEl);
  triggerCard.appendChild(triggerHdr);

  var triggerInputRow = h("div", "trigger-input-row");
  var triggerInput = h("input", "trigger-input");
  triggerInput.type = "text";
  triggerInput.placeholder = "What do you need help with?";
  triggerInput.setAttribute("aria-label", "Ask about Richmond city services");
  var triggerSendBtn = h("button", "trigger-send");
  triggerSendBtn.setAttribute("aria-label", "Send");
  triggerSendBtn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  triggerInputRow.appendChild(triggerInput);
  triggerInputRow.appendChild(triggerSendBtn);
  triggerCard.appendChild(triggerInputRow);

  var triggerActions = h("div", "trigger-actions");
  var speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  var micBtn = h("button", speechSupported ? "trigger-mic" : "trigger-mic unsupported");
  micBtn.setAttribute("aria-label", "Voice input");
  micBtn.innerHTML = svgMic;
  triggerActions.appendChild(micBtn);

  var waveDiv = h("div", "trigger-wave");
  for (var wi = 0; wi < 4; wi++) { waveDiv.appendChild(h("span", "")); }
  triggerActions.appendChild(waveDiv);

  var triggerLabel = h("span", "trigger-label");
  triggerLabel.textContent = "Hey804";
  triggerActions.appendChild(triggerLabel);

  triggerCard.appendChild(triggerActions);
  shadow.appendChild(triggerCard);

  // --- Close ---
  var closeBtn = h("button", "close hide");
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.innerHTML = svgX;
  shadow.appendChild(closeBtn);

  // --- Panel ---
  var panel = h("div", "panel");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Hey804 Richmond Guide");

  // Header
  var hdr = h("div", "hdr");
  hdr.innerHTML = '<div class="hdr-inner"><div class="hdr-avatar">' + svgCompass + '</div><div class="hdr-text"><div class="greeting">Hey <b>neighbor!</b></div><div class="subtitle">Let me help you navigate Richmond</div></div></div>' + svgSkyline;
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
  var input, sendBtn, promptsDiv, resultArea;
  var recognition = null;
  var isRecording = false;

  function buildHome() {
    body.innerHTML = "";

    // Input area
    var inputArea = h("div", "input-area");
    input = h("input", "input");
    input.type = "text";
    input.placeholder = "Tell me what's going on\u2026";
    input.setAttribute("aria-label", "Type your question");
    sendBtn = h("button", "send");
    sendBtn.setAttribute("aria-label", "Send");
    sendBtn.innerHTML = svgSend;
    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);
    body.appendChild(inputArea);

    // Prompt suggestions
    var label = h("div", "prompts-label");
    label.textContent = "Neighbors often ask";
    body.appendChild(label);

    promptsDiv = h("div", "prompts");
    var selected = pickPrompts();
    selected.forEach(function (text) {
      var btn = h("button", "prompt");
      btn.innerHTML = '<span class="q">\u201C' + esc(text) + '\u201D</span><span class="arrow">\u203A</span>';
      btn.onclick = function () { doSend(text); };
      promptsDiv.appendChild(btn);
    });
    body.appendChild(promptsDiv);

    // Result area
    resultArea = h("div", "");
    resultArea.setAttribute("aria-live", "polite");
    body.appendChild(resultArea);

    // Events
    sendBtn.onclick = function () { if (input.value.trim()) doSend(input.value); };
    input.onkeydown = function (e) {
      if (e.key === "Enter") { e.preventDefault(); if (input.value.trim()) doSend(input.value); }
    };
  }

  buildHome();

  // --- Open/Close ---
  function openWidget() {
    if (isRecording && recognition) recognition.stop();
    panel.classList.add("open");
    triggerCard.classList.add("hide");
    closeBtn.classList.remove("hide");
    try { sessionStorage.setItem("hey804_open", "1"); } catch (e) {}
    setTimeout(function () { input && input.focus(); }, 350);
  }
  function closeWidget() {
    panel.classList.remove("open");
    triggerCard.classList.remove("hide");
    closeBtn.classList.add("hide");
    try { sessionStorage.setItem("hey804_open", "0"); } catch (e) {}
  }
  closeBtn.onclick = closeWidget;
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") closeWidget(); });

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
      setTimeout(function () { if (tip.parentNode) tip.parentNode.removeChild(tip); }, 200);
    }, 2500);
  }

  // --- Send ---
  function doSend(message) {
    message = message.trim();
    if (!message) return;
    input.value = "";
    sendBtn.disabled = true;
    promptsDiv.style.display = "none";
    var lbl = body.querySelector(".prompts-label");
    if (lbl) lbl.style.display = "none";

    resultArea.innerHTML = '<div class="loading"><div class="shimmer"></div><div class="shimmer"></div><div class="shimmer"></div></div>';

    fetch(baseUrl + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, channel: "widget", context: { partner: partner } }),
    })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (d) { renderResponse(d, message); })
      .catch(function () {
        resultArea.innerHTML = '<div class="err">Something went wrong. Try again or call <a href="tel:8046467000" style="color:#991b1b">804-646-7000</a>.</div>';
        addBackButton();
      })
      .finally(function () { sendBtn.disabled = false; });
  }

  function renderResponse(data, userMessage) {
    var html = '<div class="resp">';

    var steps = data.action_steps || [];
    var answer = data.answer || "";

    // First action — the hero card
    if (steps.length > 0) {
      var firstStep = steps[0];
      var phoneMatch = firstStep.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
      var firstHtml = esc(firstStep);
      if (phoneMatch) {
        var digits = phoneMatch[1].replace(/\D/g, "");
        firstHtml = firstHtml.replace(phoneMatch[1], '<a href="tel:' + digits + '" style="color:#F5D89A;text-decoration:underline;font-size:16px">' + phoneMatch[1] + '</a>');
      }
      html += '<div class="first-action">';
      html += '<div class="first-action-label">Here\u2019s your first step</div>';
      html += '<div class="first-action-text">' + firstHtml + '</div>';
      html += '</div>';
    }

    // Answer
    var sentences = answer.match(/[^.!?]+[.!?]+/g) || [answer];
    var shortAnswer = sentences.slice(0, 2).join(" ").trim();
    if (sentences.length > 2) shortAnswer += "..";
    html += '<div class="answer">' + esc(shortAnswer) + '</div>';

    // Deadline
    if (data.deadlines) {
      html += '<div class="deadline">' + svgClock + ' ' + esc(data.deadlines) + '</div>';
    }

    // All steps (expandable)
    if (steps.length > 1) {
      html += '<button class="more-toggle" id="hey804-more-toggle"><span class="chevron">\u203A</span> See all ' + steps.length + ' steps</button>';
      html += '<div class="more-steps" id="hey804-more-steps"><ol class="steps">';
      for (var i = 0; i < steps.length; i++) {
        html += '<li data-n="' + (i + 1) + '">' + esc(steps[i]) + '</li>';
      }
      html += '</ol></div>';
    }

    // Sources
    if (data.sources && data.sources.length) {
      data.sources.forEach(function (s) {
        var label = "";
        try {
          var u = new URL(s.url);
          var path = u.pathname.replace(/\/$/, "").split("/").pop() || u.hostname;
          label = u.hostname.replace("www.", "") + "/" + path;
        } catch (e) { label = s.title || s.url; }
        html += '<a class="source" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + svgCheck + ' ' + esc(s.title || label) + '</a> ';
      });
    }

    html += '</div>';

    resultArea.innerHTML = html;
    body.scrollTop = 0;

    // Wire up the "more steps" toggle
    var toggle = shadow.getElementById("hey804-more-toggle");
    var moreDiv = shadow.getElementById("hey804-more-steps");
    if (toggle && moreDiv) {
      toggle.onclick = function () {
        var showing = moreDiv.classList.contains("show");
        if (showing) {
          moreDiv.classList.remove("show");
          toggle.classList.remove("expanded");
        } else {
          moreDiv.classList.add("show");
          toggle.classList.add("expanded");
        }
      };
    }

    addBackButton();
  }

  function addBackButton() {
    var back = h("button", "back");
    back.innerHTML = svgBack + " Ask me something else";
    back.onclick = function () {
      buildHome();
      input.focus();
    };
    resultArea.appendChild(back);
  }

  // --- Mount ---
  document.body.appendChild(host);
  try { if (sessionStorage.getItem("hey804_open") === "1") openWidget(); } catch (e) {}
})();
