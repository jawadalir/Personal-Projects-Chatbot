const messagesEl = document.getElementById("messages");
const startersEl = document.getElementById("starters");
const startersWrap = document.getElementById("starters-wrap");
const scrollEl = document.getElementById("messages-scroll");
const scrollBtn = document.getElementById("scroll-bottom-btn");
const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const errorEl = document.getElementById("error");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const menuBtn = document.getElementById("menu-btn");

let profile = null;
let messages = [];
let loading = false;
let botInitials = "JA";
let autoScroll = true;

const SCROLL_THRESHOLD = 100;

function initials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

function isNearBottom() {
  if (!scrollEl) return true;
  return (
    scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight <
    SCROLL_THRESHOLD
  );
}

function updateScrollButton() {
  if (!scrollBtn) return;
  const nearBottom = isNearBottom();
  autoScroll = nearBottom;
  scrollBtn.hidden = false;
  scrollBtn.classList.toggle("visible", !nearBottom);
}

function scrollToBottom(force = false) {
  if (!scrollEl) return;
  if (!force && !autoScroll) return;
  requestAnimationFrame(() => {
    scrollEl.scrollTop = scrollEl.scrollHeight;
    updateScrollButton();
  });
}

if (scrollEl) {
  scrollEl.addEventListener("scroll", updateScrollButton, { passive: true });
}

if (scrollBtn) {
  scrollBtn.addEventListener("click", () => {
    autoScroll = true;
    scrollToBottom(true);
  });
}

function openSidebar() {
  sidebar?.classList.add("open");
  sidebarOverlay?.removeAttribute("hidden");
  sidebarOverlay?.classList.add("visible");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  sidebar?.classList.remove("open");
  sidebarOverlay?.classList.remove("visible");
  setTimeout(() => sidebarOverlay?.setAttribute("hidden", ""), 280);
  document.body.style.overflow = "";
}

menuBtn?.addEventListener("click", openSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);

function addBubble(role, content) {
  const row = document.createElement("div");
  row.className = `bubble-row ${role}`;

  const wrap = document.createElement("div");
  wrap.className = "bubble-wrap";

  const label = document.createElement("span");
  label.className = "bubble-label";
  label.textContent = role === "user" ? "You" : profile?.name || "Jawad";

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role === "user" ? "user" : "bot"}`;
  bubble.textContent = content;

  if (role === "bot") {
    const av = document.createElement("div");
    av.className = "bot-avatar";
    av.textContent = botInitials;
    row.appendChild(av);
  }

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  row.appendChild(wrap);
  messagesEl.appendChild(row);
  scrollToBottom();
}

function showLoading(show) {
  const existing = document.getElementById("loading");
  if (!show) {
    existing?.remove();
    return;
  }
  if (existing) return;

  const row = document.createElement("div");
  row.className = "bubble-row bot";
  row.id = "loading";

  const av = document.createElement("div");
  av.className = "bot-avatar";
  av.textContent = botInitials;
  row.appendChild(av);

  const wrap = document.createElement("div");
  wrap.className = "bubble-wrap";
  const loadingEl = document.createElement("div");
  loadingEl.className = "loading";
  loadingEl.innerHTML =
    '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  wrap.appendChild(loadingEl);
  row.appendChild(wrap);

  messagesEl.appendChild(row);
  scrollToBottom(true);
}

function renderStarters() {
  startersEl.innerHTML = "";
  const show = profile && messages.length === 1;
  startersWrap.classList.toggle("hidden", !show);
  if (!show) return;

  profile.starterQuestions.forEach((q) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "starter-btn";
    btn.textContent = q;
    btn.disabled = loading;
    btn.onclick = () => {
      closeSidebar();
      sendMessage(q);
    };
    startersEl.appendChild(btn);
  });
}

function setError(msg) {
  if (!msg) {
    errorEl.hidden = true;
    errorEl.textContent = "";
    return;
  }
  errorEl.hidden = false;
  errorEl.textContent = msg;
}

async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed || loading) return;

  setError("");
  loading = true;
  input.disabled = true;
  sendBtn.disabled = true;
  renderStarters();

  autoScroll = true;

  const history = messages.filter((m) => m.role !== "system");
  messages.push({ role: "user", content: trimmed });
  addBubble("user", trimmed);
  input.value = "";
  showLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: trimmed, history }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed.");

    messages.push({ role: "assistant", content: data.reply });
    addBubble("bot", data.reply);
  } catch (err) {
    setError(err.message);
  } finally {
    loading = false;
    input.disabled = false;
    sendBtn.disabled = false;
    showLoading(false);
    renderStarters();
    input.focus();
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(input.value);
});

async function init() {
  try {
    const res = await fetch("/api/profile");
    profile = await res.json();
    botInitials = initials(profile.name);

    document.title = `${profile.name} — ${profile.title} | Chat`;
    document.getElementById("page-title").textContent = profile.name;
    document.getElementById("topbar-sub").textContent =
      `${profile.title} · ${profile.location}`;
    document.getElementById("page-subtitle").textContent = profile.location;
    document.getElementById("chat-name").textContent = profile.name;
    document.getElementById("chat-title").textContent = profile.title;
    document.getElementById("avatar").textContent = botInitials;
    document.getElementById("topbar-avatar").textContent = botInitials;
    document.querySelector(".brand-mark").textContent = botInitials;

    const welcome = `Hi! I'm ${profile.name}, ${profile.title}. Ask me anything about my skills, experience, projects, or background — I'm here to represent myself.`;
    messages.push({ role: "assistant", content: welcome });
    addBubble("bot", welcome);
    renderStarters();
    scrollToBottom(true);
  } catch {
    setError("Could not load profile. Check that the server is running.");
  }
}

init();
