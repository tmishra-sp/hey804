/**
 * Hey804 Widget — Conversational civic help for Richmond, VA.
 * <script src="https://hey804.app/widget.js" data-partner="org-name"></script>
 */
(function () {
  var script = document.currentScript;
  var partner = (script && script.getAttribute("data-partner")) || "unknown";
  var baseUrl = script ? script.src.replace(/\/widget\.js(\?.*)?$/, "") : "";

  // Real questions people ask — these rotate as placeholders and tappable prompts
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

  // Shuffle and pick 4 to show
  function pickPrompts() {
    var shuffled = prompts.slice().sort(function () { return Math.random() - 0.5; });
    return shuffled.slice(0, 4);
  }

  var host = document.createElement("div");
  host.id = "hey804-root";
  var shadow = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = [
    ":host{all:initial;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}",
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}",

    // Trigger card
    ".trigger-card{position:fixed;bottom:24px;right:24px;z-index:99998;width:280px;background:#fff;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 8px 40px rgba(0,0,0,0.12),0 0 0 1px rgba(0,0,0,0.04);transition:opacity .3s,transform .3s cubic-bezier(.34,1.56,.64,1)}",
    ".trigger-input-row{display:flex;align-items:center;gap:8px}",
    ".trigger-input{flex:1;border:1.5px solid #e4e7ec;border-radius:14px;padding:11px 14px;font:400 13.5px/1.4 inherit;background:#f5f5f5;color:#1a1a1a;outline:none;transition:all .2s}",
    ".trigger-input:focus{border-color:#1a4a7a;background:#fff;box-shadow:0 0 0 3px rgba(26,74,122,0.08)}",
    ".trigger-input::placeholder{color:#9ca3af}",
    ".trigger-send{width:34px;height:34px;flex-shrink:0;border:none;border-radius:50%;background:linear-gradient(135deg,#0a2540,#1a4a7a);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0.8);transition:opacity .2s,transform .2s;pointer-events:none}",
    ".trigger-send.visible{opacity:1;transform:scale(1);pointer-events:auto}",
    ".trigger-send:hover{transform:scale(1.08)}",
    ".trigger-actions{display:flex;align-items:center;gap:10px;padding:0 2px}",
    ".trigger-mic{width:42px;height:42px;border-radius:50%;border:1.5px solid #e4e7ec;background:#f5f5f5;color:#667085;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}",
    ".trigger-mic:hover{border-color:#1a4a7a;color:#1a4a7a;background:#f0f5ff}",
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
    ".trigger-label{font-size:11px;color:#9ca3af;margin-left:auto;font-weight:500;transition:color .2s}",
    ".trigger-label.listening{color:#ef4444}",
    ".trigger-tooltip{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);background:#1a1a1a;color:#fff;font-size:11px;padding:6px 12px;border-radius:8px;white-space:nowrap;opacity:0;transition:opacity .2s;pointer-events:none}",
    ".trigger-tooltip.show{opacity:1}",
    ".hide{display:none!important}",

    // Close
    ".close{position:fixed;bottom:24px;right:24px;z-index:100001;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#0a2540,#1a4a7a);color:#fff;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(10,37,64,.35);transition:transform .3s}",
    ".close:hover{transform:rotate(90deg) scale(1.1)}",

    // Panel
    ".panel{position:fixed;bottom:92px;right:24px;z-index:100000;width:400px;max-height:580px;background:#fff;border-radius:20px;box-shadow:0 25px 60px rgba(0,0,0,.15),0 0 0 1px rgba(0,0,0,.04);display:flex;flex-direction:column;overflow:hidden;transform:translateY(16px) scale(.95);opacity:0;pointer-events:none;transition:transform .35s cubic-bezier(.34,1.56,.64,1),opacity .25s}",
    ".panel.open{transform:none;opacity:1;pointer-events:auto}",

    // Header — Richmond skyline at dusk
    ".hdr{background:linear-gradient(160deg,#071a2e 0%,#0d2d4f 40%,#163d65 100%);padding:28px 24px 20px;position:relative;overflow:hidden}",
    ".hdr::before{content:'';position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,rgba(197,165,114,.4),rgba(197,165,114,.6),rgba(197,165,114,.4),transparent);animation:shimmer 4s ease-in-out infinite}",
    "@keyframes shimmer{0%,100%{opacity:.3}50%{opacity:1}}",
    // Stars
    ".hdr::after{content:'';position:absolute;top:10px;right:20px;width:100px;height:30px;background-image:radial-gradient(1px 1px at 12px 8px,rgba(255,255,255,.35),transparent),radial-gradient(1px 1px at 45px 20px,rgba(255,255,255,.25),transparent),radial-gradient(1.5px 1.5px at 78px 6px,rgba(197,165,114,.5),transparent),radial-gradient(1px 1px at 92px 22px,rgba(255,255,255,.3),transparent);pointer-events:none}",
    // Skyline
    ".skyline{position:absolute;bottom:0;left:0;right:0;height:28px;opacity:.1}",
    ".hdr-inner{position:relative;z-index:1}",
    ".greeting{font:300 22px/1.2 inherit;color:#fff;margin-bottom:4px}",
    ".greeting b{font-weight:700}",
    ".subtitle{font-size:12px;color:rgba(197,165,114,.8);letter-spacing:.4px}",

    // Body
    ".body{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column}",
    ".body::-webkit-scrollbar{width:4px}",
    ".body::-webkit-scrollbar-thumb{background:#ddd;border-radius:4px}",

    // Conversation-style input
    ".input-area{display:flex;gap:8px;margin-bottom:20px}",
    ".input{flex:1;padding:12px 16px;border:1.5px solid #e4e7ec;border-radius:14px;font:400 14px/1.4 inherit;background:#f9fafb;color:#1a1a1a;outline:none;transition:all .2s}",
    ".input:focus{border-color:#1a4a7a;background:#fff;box-shadow:0 0 0 3px rgba(26,74,122,.08)}",
    ".input::placeholder{color:#9ca3af}",
    ".send{width:44px;height:44px;flex-shrink:0;border:none;border-radius:14px;background:linear-gradient(135deg,#0a2540,#1a4a7a);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s}",
    ".send:hover{transform:scale(1.05)}",
    ".send:disabled{opacity:.3;cursor:not-allowed;transform:none}",

    // Prompt suggestions — the key UX innovation
    ".prompts-label{font-size:11px;font-weight:600;color:#b0b8c1;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}",
    ".prompts{display:flex;flex-direction:column;gap:6px}",
    ".prompt{display:flex;align-items:center;gap:10px;padding:11px 16px;background:#fff;border:1.5px solid #f0f1f3;border-radius:12px;cursor:pointer;font:400 13.5px/1.4 inherit;color:#344054;transition:all .18s;text-align:left;width:100%}",
    ".prompt:hover{border-color:#1a4a7a;background:#f0f5ff;transform:translateX(4px)}",
    ".prompt:active{transform:scale(.98)}",
    ".prompt .arrow{margin-left:auto;color:#b0b8c1;font-size:16px;transition:color .15s}",
    ".prompt:hover .arrow{color:#1a4a7a}",
    ".prompt .q{color:#0a2540;font-weight:500}",

    // Powered by footer
    ".ft{padding:10px 20px;text-align:center;font-size:10.5px;color:#b0b8c1;border-top:1px solid #f0f1f3;flex-shrink:0;background:#fafbfc}",

    // Loading
    ".loading{padding:16px 0}",
    ".shimmer{height:13px;border-radius:8px;margin-bottom:12px;background:linear-gradient(90deg,#f0f1f3 25%,#e5e7eb 50%,#f0f1f3 75%);background-size:200% 100%;animation:shim 1.2s ease-in-out infinite}",
    ".shimmer:nth-child(1){width:100%}.shimmer:nth-child(2){width:80%}.shimmer:nth-child(3){width:55%}",
    "@keyframes shim{0%{background-position:200% 0}100%{background-position:-200% 0}}",

    // Response — conversational, not a form
    ".resp{animation:up .4s ease}",
    "@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}",

    // First action — the hero of the response
    ".first-action{background:linear-gradient(135deg,#0a2540,#163d65);color:#fff;border-radius:14px;padding:18px 20px;margin-bottom:14px}",
    ".first-action-label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:rgba(197,165,114,.8);margin-bottom:8px;font-weight:600}",
    ".first-action-text{font-size:15px;font-weight:600;line-height:1.45}",
    ".first-action a{color:#93c5fd;text-decoration:underline;text-underline-offset:2px}",

    // Answer text
    ".answer{font-size:13.5px;line-height:1.7;color:#344054;margin-bottom:14px}",

    // More steps — expandable
    ".more-toggle{display:flex;align-items:center;gap:6px;padding:0;background:none;border:none;font:500 13px/1 inherit;color:#1a4a7a;cursor:pointer;margin-bottom:10px;transition:color .15s}",
    ".more-toggle:hover{color:#0a2540}",
    ".more-toggle .chevron{transition:transform .2s;font-size:16px}",
    ".more-toggle.expanded .chevron{transform:rotate(90deg)}",
    ".more-steps{display:none;margin-bottom:14px}",
    ".more-steps.show{display:block}",
    ".steps{list-style:none;padding:0 0 0 14px;margin:0;border-left:3px solid #C5A572}",
    ".steps li{padding:5px 0 5px 4px;font-size:13px;line-height:1.55;color:#344054}",
    ".steps li::before{content:attr(data-n);display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;background:#0a2540;color:#fff;border-radius:50%;font-size:10px;font-weight:700;margin-right:8px;vertical-align:middle}",

    // Deadline
    ".deadline{display:flex;align-items:center;gap:7px;padding:8px 12px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:12px;color:#92400e;font-weight:500;margin-bottom:14px}",

    // Source
    ".source{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:7px;font-size:11px;font-weight:500;color:#065f46;text-decoration:none;margin-bottom:14px;transition:background .15s}",
    ".source:hover{background:#d1fae5}",

    // Back link
    ".back{display:inline-flex;align-items:center;gap:4px;margin-top:8px;font:500 13px/1 inherit;color:#1a4a7a;background:none;border:none;cursor:pointer;padding:0;transition:color .15s}",
    ".back:hover{color:#0a2540;text-decoration:underline}",

    // Error
    ".err{padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;font-size:13px;color:#991b1b;margin-bottom:12px}",

    // Responsive
    "@media(max-width:480px){.panel{left:8px;right:8px;bottom:8px;width:auto;max-height:85vh;border-radius:20px 20px 16px 16px}.close{bottom:calc(85vh + 14px)}.trigger-card{left:12px;right:12px;width:auto;bottom:12px}}",
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

  function h(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }
  function esc(t) { var d = document.createElement("span"); d.textContent = t; return d.innerHTML; }

  // --- Trigger Card ---
  var triggerCard = h("div", "trigger-card");
  triggerCard.setAttribute("role", "region");
  triggerCard.setAttribute("aria-label", "Hey804 quick ask");

  var triggerInputRow = h("div", "trigger-input-row");
  var triggerInput = h("input", "trigger-input");
  triggerInput.type = "text";
  triggerInput.placeholder = "Ask anything about RVA\u2026";
  triggerInput.setAttribute("aria-label", "Ask anything about Richmond city services");
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
  panel.setAttribute("aria-label", "Hey804");

  // Header
  var hdr = h("div", "hdr");
  hdr.innerHTML = '<div class="hdr-inner"><div class="greeting">Hey, <b>how can we help?</b></div><div class="subtitle">Richmond City Services</div></div>' + svgSkyline;
  panel.appendChild(hdr);

  // Body
  var body = h("div", "body");
  panel.appendChild(body);

  // Footer
  var ft = h("div", "ft");
  ft.textContent = "Powered by Hey804 \u00B7 Hack for RVA 2026";
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
    input.placeholder = "Describe what you need help with\u2026";
    input.setAttribute("aria-label", "Type your question");
    sendBtn = h("button", "send");
    sendBtn.setAttribute("aria-label", "Send");
    sendBtn.innerHTML = svgSend;
    inputArea.appendChild(input);
    inputArea.appendChild(sendBtn);
    body.appendChild(inputArea);

    // Prompt suggestions
    var label = h("div", "prompts-label");
    label.textContent = "People are asking";
    body.appendChild(label);

    promptsDiv = h("div", "prompts");
    var selected = pickPrompts();
    selected.forEach(function (text) {
      var btn = h("button", "prompt");
      btn.innerHTML = '<span class="q">"' + esc(text) + '"</span><span class="arrow">\u203A</span>';
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
      triggerLabel.textContent = "Listening\u2026";
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
    // Hide the "People are asking" label too
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

    // First action — the hero card with the #1 step
    if (steps.length > 0) {
      var firstStep = steps[0];
      var phoneMatch = firstStep.match(/(\d{3}[-.]?\d{3}[-.]?\d{4})/);
      var firstHtml = esc(firstStep);
      if (phoneMatch) {
        var digits = phoneMatch[1].replace(/\D/g, "");
        firstHtml = firstHtml.replace(phoneMatch[1], '<a href="tel:' + digits + '" style="color:#93c5fd;text-decoration:underline;font-size:16px">' + phoneMatch[1] + '</a>');
      }
      html += '<div class="first-action">';
      html += '<div class="first-action-label">Start here</div>';
      html += '<div class="first-action-text">' + firstHtml + '</div>';
      html += '</div>';
    }

    // Answer — truncated to first 2 sentences to avoid wall of text
    var sentences = answer.match(/[^.!?]+[.!?]+/g) || [answer];
    var shortAnswer = sentences.slice(0, 2).join(" ").trim();
    if (sentences.length > 2) shortAnswer += "..";
    html += '<div class="answer">' + esc(shortAnswer) + '</div>';

    // Deadline
    if (data.deadlines) {
      html += '<div class="deadline">' + svgClock + ' ' + esc(data.deadlines) + '</div>';
    }

    // All steps (expandable) — numbered from 1
    if (steps.length > 1) {
      html += '<button class="more-toggle" id="hey804-more-toggle"><span class="chevron">\u203A</span> See all ' + steps.length + ' steps</button>';
      html += '<div class="more-steps" id="hey804-more-steps"><ol class="steps">';
      for (var i = 0; i < steps.length; i++) {
        html += '<li data-n="' + (i + 1) + '">' + esc(steps[i]) + '</li>';
      }
      html += '</ol></div>';
    }

    // Sources — show all, with readable path
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

    // Scroll to top of response
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
    back.innerHTML = svgBack + " Ask something else";
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
