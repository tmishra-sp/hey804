/**
 * Hey804 — Card-based civic information web app
 * Vanilla JS, no framework. Hits the same POST /api/chat as SMS.
 */

// SVG icons (clean line-art, no emojis)
const ICONS = {
    money: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" stroke-width="1.5"/></svg>',
    food: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2a6 6 0 00-6 6c0 2.5 2 5 6 10 4-5 6-7.5 6-10a6 6 0 00-6-6z" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="8" r="2" stroke="currentColor" stroke-width="1.5"/></svg>',
    housing: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10l7-7 7 7M5 9v7a1 1 0 001 1h8a1 1 0 001-1V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    utilities: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12 2L8 10h4l-4 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    city: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="3" y="8" width="5" height="9" rx="0.5" stroke="currentColor" stroke-width="1.5"/><rect x="10" y="3" width="7" height="14" rx="0.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 11h1M5 13h1M12 6h3M12 9h3M12 12h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
    ask: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 14l1.5-4.5L14 2l4 4-7.5 9.5L6 17l-3-3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// Category → intent mapping
const CATEGORIES = [
    {
        id: "money-taxes",
        label: "Money & taxes",
        icon: ICONS.money,
        desc: "Bills, relief, payment plans",
        intents: [
            { id: 1, label: "I can't pay my tax bill", query: "I got a tax bill I can't pay" },
            { id: 2, label: "Senior / disabled tax relief", query: "I'm a senior can I get tax relief" },
            { id: 3, label: "My tax bill seems wrong", query: "My tax bill seems wrong" },
            { id: 4, label: "Car / personal property tax", query: "How do I pay my car tax" },
            { id: 18, label: "Pay a parking ticket", query: "How to pay a parking ticket" },
        ],
    },
    {
        id: "food-benefits",
        label: "Food & benefits",
        icon: ICONS.food,
        desc: "SNAP, Medicaid, childcare, seniors",
        intents: [
            { id: 8, label: "Apply for food stamps (SNAP)", query: "How do I get food stamps" },
            { id: 9, label: "Get health insurance (Medicaid)", query: "Need health insurance can't afford it" },
            { id: 11, label: "Check my benefits status", query: "Check my benefits status" },
            { id: 20, label: "Help paying for childcare", query: "Help paying for childcare" },
            { id: 28, label: "Senior services / Meals on Wheels", query: "meals on wheels for my grandma" },
        ],
    },
    {
        id: "housing-rent",
        label: "Housing & rent",
        icon: ICONS.housing,
        desc: "Rent help, eviction, legal aid",
        intents: [
            { id: 10, label: "Help paying rent / eviction", query: "I need help paying rent" },
            { id: 30, label: "Free legal aid / tenant rights", query: "I need free legal help for eviction" },
            { id: 12, label: "Where to go in person", query: "Where is the social services office" },
        ],
    },
    {
        id: "utilities",
        label: "Utilities",
        icon: ICONS.utilities,
        desc: "Water, gas, billing help",
        intents: [
            { id: 5, label: "Can't pay my utility bill", query: "Can't pay my water bill" },
            { id: 6, label: "Is the water safe?", query: "Is the water safe to drink" },
            { id: 7, label: "My utility bill seems wrong", query: "My water bill is way too high" },
        ],
    },
    {
        id: "city-services",
        label: "City services",
        icon: ICONS.city,
        desc: "311, trash, permits, courts, schools",
        intents: [
            { id: 13, label: "Heating / energy assistance", query: "Help with heating bill" },
            { id: 15, label: "Trash & recycling", query: "When is trash pickup" },
            { id: 16, label: "Business license", query: "How to get a business license" },
            { id: 17, label: "Free internet / computer", query: "Where can I use a computer for free" },
            { id: 19, label: "Emergency alerts", query: "How do I get emergency alerts" },
            { id: 21, label: "Animal control / stray animals", query: "There's a stray dog in my yard" },
            { id: 22, label: "Jury duty", query: "I got a jury duty summons" },
            { id: 23, label: "Marriage license", query: "How to get a marriage license" },
            { id: 24, label: "Building permits / zoning", query: "Do I need a building permit" },
            { id: 25, label: "Register to vote", query: "How do I register to vote" },
            { id: 26, label: "School enrollment (RPS)", query: "How to enroll my kid in school" },
            { id: 27, label: "Birth / death certificate", query: "How to get a birth certificate" },
            { id: 29, label: "Towed vehicle lookup", query: "My car got towed where is it" },
        ],
    },
    {
        id: "infrastructure",
        label: "Roads & neighborhood",
        icon: ICONS.city,
        desc: "Potholes, sidewalks, sewer, trees, code violations",
        intents: [
            { id: 14, label: "Report a pothole or streetlight", query: "How to report a pothole" },
            { id: 31, label: "Road or sidewalk repair", query: "The sidewalk on my street is broken" },
            { id: 32, label: "Traffic sign or signal problem", query: "A traffic light is out on my street" },
            { id: 33, label: "Streetlight out or need new one", query: "The streetlight on my block is out" },
            { id: 34, label: "Tree or vegetation issue", query: "I need a tree trimmed on my street" },
            { id: 35, label: "Park or trail problem", query: "Something is broken at my local park" },
            { id: 36, label: "Flooding or drainage issue", query: "Standing water won't drain on my street" },
            { id: 37, label: "Sewer problem", query: "There's a sewer smell on my street" },
            { id: 38, label: "Property code violation", query: "My neighbor's property is falling apart" },
            { id: 39, label: "Illegal dumping or graffiti", query: "Someone dumped trash in the alley" },
            { id: 40, label: "Rats, pests, dead animal", query: "There are rats in my neighborhood" },
            { id: 41, label: "Parking permits & violations", query: "How do I get a residential parking permit" },
            { id: 42, label: "Report speeding or safety concern", query: "Cars keep speeding on my street" },
        ],
    },
    {
        id: "ask",
        label: "Ask a question",
        icon: ICONS.ask,
        desc: "Type anything",
        isAsk: true,
    },
];

// Location configs for QR context
const LOCATIONS = {
    southside: {
        name: "Southside office",
        address: "4100 Hull Street",
        greeting: "You're near the Southside office at 4100 Hull St. Here's what you can get help with.",
        prioritize: ["food-benefits", "housing-rent"],
    },
    "downtown-library": {
        name: "Richmond Public Library",
        address: "101 E. Franklin St",
        greeting: "You're at the Richmond Public Library, 101 E. Franklin St. How can we help?",
        prioritize: ["city-services", "food-benefits"],
    },
    "city-hall": {
        name: "City Hall",
        address: "900 E. Broad St",
        greeting: "You're near City Hall at 900 E. Broad St. What do you need help with?",
        prioritize: ["money-taxes", "city-services"],
    },
};

// State
let currentCategory = null;
let currentPlanData = null;

// DOM refs
const screens = {
    categories: document.getElementById("screen-categories"),
    subtopics: document.getElementById("screen-subtopics"),
    plan: document.getElementById("screen-plan"),
    ask: document.getElementById("screen-ask"),
};

// Init
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const location = params.get("location");
    const topic = params.get("topic");
    const embed = params.get("embed");

    // Embed mode
    if (embed === "true") {
        document.body.classList.add("embed");
    }

    // Location greeting
    if (location && LOCATIONS[location]) {
        const loc = LOCATIONS[location];
        document.getElementById("location-greeting").classList.remove("hidden");
        document.getElementById("location-text").textContent = loc.greeting;
    }

    // Render category cards (reordered if location context)
    renderCategories(location);

    // If topic param, jump to that category
    if (topic) {
        const cat = CATEGORIES.find(c => c.id === topic || c.id.includes(topic));
        if (cat && !cat.isAsk) {
            showSubtopics(cat);
        }
    }

    // Back buttons
    document.getElementById("back-to-categories").addEventListener("click", () => showScreen("categories"));
    document.getElementById("back-to-subtopics").addEventListener("click", () => {
        if (currentCategory) showSubtopics(currentCategory);
        else showScreen("categories");
    });
    document.getElementById("back-from-ask").addEventListener("click", () => showScreen("categories"));

    // Ask form
    document.getElementById("ask-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = document.getElementById("ask-input");
        const query = input.value.trim();
        if (!query) return;
        await handleQuery(query, "screen-ask");
    });

    // Share button
    document.getElementById("share-btn").addEventListener("click", sharePlan);

    // Alert polling
    pollAlerts();
    setInterval(pollAlerts, 30000);
});

function renderCategories(location) {
    const grid = document.getElementById("category-grid");
    grid.innerHTML = "";

    let cats = [...CATEGORIES];

    // Reorder if location context
    if (location && LOCATIONS[location]) {
        const priority = LOCATIONS[location].prioritize;
        cats.sort((a, b) => {
            const aIdx = priority.indexOf(a.id);
            const bIdx = priority.indexOf(b.id);
            if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
            if (aIdx >= 0) return -1;
            if (bIdx >= 0) return 1;
            return 0;
        });
    }

    cats.forEach(cat => {
        const card = document.createElement("div");
        card.className = "category-card";
        card.setAttribute("data-cat", cat.id);
        card.innerHTML = `
            <div class="card-icon">${cat.icon}</div>
            <div class="card-label">${cat.label}</div>
            <div class="card-desc">${cat.desc}</div>
        `;
        card.addEventListener("click", () => {
            if (cat.isAsk) {
                showScreen("ask");
                document.getElementById("ask-input").focus();
            } else {
                showSubtopics(cat);
            }
        });
        grid.appendChild(card);
    });
}

function showSubtopics(category) {
    currentCategory = category;
    document.getElementById("subtopic-heading").textContent = category.label;
    const list = document.getElementById("subtopic-list");
    list.innerHTML = "";

    category.intents.forEach(intent => {
        const card = document.createElement("div");
        card.className = "subtopic-card";
        card.innerHTML = `<span class="subtopic-label">${intent.label}</span><span class="subtopic-arrow">&rsaquo;</span>`;
        card.addEventListener("click", () => handleQuery(intent.query, "screen-plan"));
        list.appendChild(card);
    });

    showScreen("subtopics");
}

async function handleQuery(query, targetScreen) {
    if (targetScreen === "screen-plan") {
        showScreen("plan");
        document.getElementById("plan-loading").classList.remove("hidden");
        document.getElementById("plan-content").classList.add("hidden");
    }

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: query, channel: "web" }),
        });
        const data = await res.json();

        if (targetScreen === "screen-plan") {
            renderPlan(data);
        } else {
            // Ask anything screen
            renderPlanInContainer(data, document.getElementById("ask-result"));
        }
    } catch (err) {
        const fallback = {
            answer: "Something went wrong. Call RVA 311 at 804-646-7000 for help.",
            action_steps: [],
            sources: [],
            deadlines: null,
        };
        if (targetScreen === "screen-plan") {
            renderPlan(fallback);
        }
    }
}

function renderPlan(data) {
    currentPlanData = data;

    document.getElementById("plan-loading").classList.add("hidden");
    document.getElementById("plan-content").classList.remove("hidden");

    // Answer
    document.getElementById("plan-answer").textContent = data.answer || "";

    // Steps
    const stepsList = document.getElementById("steps-list");
    stepsList.innerHTML = "";
    (data.action_steps || []).forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        li.addEventListener("click", () => li.classList.toggle("completed"));
        stepsList.appendChild(li);
    });

    // Deadline
    const deadlineEl = document.getElementById("plan-deadline");
    if (data.deadlines) {
        deadlineEl.classList.remove("hidden");
        document.getElementById("deadline-text").textContent = data.deadlines;
    } else {
        deadlineEl.classList.add("hidden");
    }

    // Sources
    const sourcesList = document.getElementById("sources-list");
    sourcesList.innerHTML = "";
    (data.sources || []).forEach(src => {
        const a = document.createElement("a");
        a.href = src.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = src.title || src.url;
        sourcesList.appendChild(a);
    });
}

function renderPlanInContainer(data, container) {
    container.innerHTML = "";
    const card = document.createElement("div");
    card.className = "plan-card";
    card.style.marginTop = "16px";

    let html = `<div class="plan-answer">${escapeHtml(data.answer || "")}</div>`;

    if (data.action_steps && data.action_steps.length) {
        html += `<div class="plan-steps"><h3 class="steps-heading">Next Steps</h3><ol>`;
        data.action_steps.forEach(s => { html += `<li>${escapeHtml(s)}</li>`; });
        html += `</ol></div>`;
    }

    if (data.sources && data.sources.length) {
        html += `<div class="plan-sources"><div class="source-badge"><span class="verified-icon">&#x2713;</span> Verified from rva.gov</div>`;
        data.sources.forEach(s => {
            html += `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.title || s.url)}</a>`;
        });
        html += `</div>`;
    }

    html += `<div class="plan-actions"><a href="tel:8046467000" class="action-btn primary">Call 311</a></div>`;
    html += `<p class="plan-footer">Need more help? Call RVA 311 at <a href="tel:8046467000">804-646-7000</a></p>`;

    card.innerHTML = html;
    container.appendChild(card);
}

function sharePlan() {
    if (!currentPlanData) return;
    const d = currentPlanData;
    let text = d.answer + "\n\n";
    if (d.action_steps) {
        text += "NEXT STEPS:\n";
        d.action_steps.forEach((s, i) => { text += `${i + 1}. ${s}\n`; });
    }
    if (d.deadlines) text += `\nDeadline: ${d.deadlines}\n`;
    if (d.sources && d.sources.length) text += `\nSource: ${d.sources[0].url}\n`;
    text += "\n— Hey804 | Text (804) 808-1083 for help";

    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showToast());
    }
}

function showToast() {
    const toast = document.getElementById("share-toast");
    toast.classList.remove("hidden");
    toast.classList.add("visible");
    setTimeout(() => {
        toast.classList.remove("visible");
        setTimeout(() => toast.classList.add("hidden"), 300);
    }, 2000);
}

// Screen navigation
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove("active"));
    screens[name].classList.add("active");

    // Update URL
    if (name === "categories") {
        history.pushState(null, "", window.location.pathname + window.location.search);
    }
}

// Handle browser back button
window.addEventListener("popstate", () => showScreen("categories"));

// Alert polling
let alertDismissed = null;

async function pollAlerts() {
    try {
        const res = await fetch("/api/alerts/active");
        const data = await res.json();
        const banner = document.getElementById("alert-banner");

        if (data.alert && data.alert.id !== alertDismissed) {
            document.getElementById("alert-message").textContent = data.alert.message;
            banner.classList.remove("hidden");
            banner.classList.add("visible", "pulse");
            // Shift header down
            document.body.style.paddingTop = banner.offsetHeight + "px";

            document.getElementById("alert-dismiss").onclick = () => {
                alertDismissed = data.alert.id;
                banner.classList.remove("visible");
                banner.classList.add("hidden");
                document.body.style.paddingTop = "0";
            };
        } else if (!data.alert) {
            banner.classList.remove("visible");
            banner.classList.add("hidden");
            document.body.style.paddingTop = "0";
        }
    } catch (e) {
        // Silently fail — alerts are nice-to-have
    }
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}
