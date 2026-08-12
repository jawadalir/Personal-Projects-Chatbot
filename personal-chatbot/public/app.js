const messagesEl = document.getElementById("messages");
const startersEl = document.getElementById("starters");
const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const errorEl = document.getElementById("error");

let profile = null;
let messages = [];
let loading = false;

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("");
}

function addBubble(role, content) {
  const row = document.createElement("div");
  row.className = `bubble-row ${role}`;

  const bubble = document.createElement("div");
  bubble.className = `bubble ${role === "user" ? "user" : "bot"}`;
  bubble.textContent = content;

  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
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
  row.innerHTML = `<div class="loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderStarters() {
  startersEl.innerHTML = "";
  if (!profile || messages.length > 1) return;

  profile.starterQuestions.forEach((q) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "starter-btn";
    btn.textContent = q;
    btn.disabled = loading;
    btn.onclick = () => sendMessage(q);
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

    document.getElementById("page-title").textContent = `Chat with ${profile.name}`;
    document.getElementById("page-subtitle").textContent = `${profile.title} · ${profile.location}`;
    document.getElementById("chat-name").textContent = profile.name;
    document.getElementById("chat-title").textContent = profile.title;
    document.getElementById("avatar").textContent = initials(profile.name);

    const welcome = `Hi! I'm ${profile.name}, ${profile.title}. Ask me anything about my skills, experience, projects, or background — I'm here to represent myself.`;
    messages.push({ role: "assistant", content: welcome });
    addBubble("bot", welcome);
    renderStarters();
  } catch {
    setError("Could not load profile. Check that the server is running.");
  }
}

init();
