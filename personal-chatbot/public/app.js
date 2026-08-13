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
const contactLinksEl = document.getElementById("contact-links");

let profile = null;
let messages = [];
let loading = false;
let botInitials = "JA";
let photoUrl = null;
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

function applyPhoto(url) {
  photoUrl = url;
  if (!url) return;

  const setImg = (imgEl, wrapEl, initialsEl) => {
    if (!imgEl) return;
    imgEl.src = url;
    imgEl.hidden = false;
    imgEl.onload = () => {
      wrapEl?.classList.add("has-photo");
      if (initialsEl) initialsEl.style.display = "none";
    };
    imgEl.onerror = () => {
      imgEl.hidden = true;
      wrapEl?.classList.remove("has-photo");
    };
  };

  setImg(
    document.getElementById("avatar-img"),
    document.getElementById("avatar"),
    document.getElementById("avatar-initials")
  );
  setImg(
    document.getElementById("topbar-img"),
    document.getElementById("topbar-avatar"),
    document.getElementById("topbar-initials")
  );
}

function createBotAvatarEl() {
  const av = document.createElement("div");
  av.className = "bot-avatar";
  if (photoUrl) {
    av.classList.add("has-photo");
    const img = document.createElement("img");
    img.src = photoUrl;
    img.alt = profile?.name || "Jawad";
    av.appendChild(img);
  } else {
    const span = document.createElement("span");
    span.textContent = botInitials;
    av.appendChild(span);
  }
  return av;
}

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
    row.appendChild(createBotAvatarEl());
  }

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  row.appendChild(wrap);
  messagesEl.appendChild(row);
  scrollToBottom();
}

function createStreamingBotBubble() {
  const row = document.createElement("div");
  row.className = "bubble-row bot";

  const wrap = document.createElement("div");
  wrap.className = "bubble-wrap";

  const label = document.createElement("span");
  label.className = "bubble-label";
  label.textContent = profile?.name || "Jawad";

  const bubble = document.createElement("div");
  bubble.className = "bubble bot streaming";
  bubble.textContent = "";

  row.appendChild(createBotAvatarEl());
  wrap.appendChild(label);
  wrap.appendChild(bubble);
  row.appendChild(wrap);
  messagesEl.appendChild(row);
  scrollToBottom(true);

  return { row, bubble };
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

  row.appendChild(createBotAvatarEl());

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

function renderContactLinks(links) {
  if (!contactLinksEl || !links) return;
  contactLinksEl.innerHTML = "";

  const items = [
    links.email && { href: `mailto:${links.email}`, label: "Email" },
    links.linkedin && { href: links.linkedin, label: "LinkedIn", external: true },
    links.portfolio && { href: links.portfolio, label: "Portfolio", external: true },
    links.github && { href: links.github, label: "GitHub", external: true },
  ].filter(Boolean);

  items.forEach(({ href, label, external }) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    if (external) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
    contactLinksEl.appendChild(a);
  });
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

function friendlyFetchError(err) {
  const msg = err?.message || "";
  if (
    msg === "Failed to fetch" ||
    err?.name === "TypeError" ||
    err?.name === "AbortError"
  ) {
    return "Cannot reach the server. Run python run.py and open http://127.0.0.1:3000";
  }
  return msg || "Something went wrong. Please try again.";
}

async function fetchChatReply(message, history) {
  let res;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });
  } catch (err) {
    throw new Error(friendlyFetchError(err));
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  if (!data.reply?.trim()) throw new Error("Empty response from AI service.");
  return data.reply;
}

function parseSseChunk(part, handlers) {
  const line = part.trim();
  if (!line.startsWith("data: ")) return false;

  const data = JSON.parse(line.slice(6));
  if (data.error) throw new Error(data.error);
  if (data.done) {
    handlers.onDone?.();
    return true;
  }
  if (data.token) handlers.onToken?.(data.token);
  return false;
}

async function streamReply(message, history) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  let res;
  try {
    res = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const error = new Error(friendlyFetchError(err));
    error.partial = "";
    throw error;
  }

  if (!res.ok) {
    clearTimeout(timeoutId);
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.error || "Stream request failed.");
    error.partial = "";
    throw error;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    clearTimeout(timeoutId);
    const error = new Error("Streaming is not supported in this browser.");
    error.partial = "";
    throw error;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  showLoading(false);
  const { row, bubble } = createStreamingBotBubble();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      let streamDone = false;
      for (const part of parts) {
        try {
          const finished = parseSseChunk(part, {
            onToken: (token) => {
              fullText += token;
              bubble.textContent = fullText;
              scrollToBottom();
            },
            onDone: () => {
              streamDone = true;
            },
          });
          if (finished) streamDone = true;
        } catch (e) {
          if (e.message !== "Unexpected end of JSON input") throw e;
        }
      }

      if (streamDone) {
        await reader.cancel().catch(() => {});
        break;
      }
    }

    bubble.classList.remove("streaming");
    if (!fullText.trim()) throw new Error("Empty response from AI service.");
    return fullText;
  } catch (err) {
    bubble.classList.remove("streaming");
    if (!fullText.trim()) row.remove();
    const error = new Error(err.message || friendlyFetchError(err));
    error.partial = fullText;
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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
    let reply;
    try {
      reply = await streamReply(trimmed, history);
    } catch (streamErr) {
      if (streamErr.partial?.trim()) {
        reply = streamErr.partial.trim();
      } else {
        showLoading(true);
        reply = await fetchChatReply(trimmed, history);
        addBubble("bot", reply);
      }
    }

    if (reply) {
      messages.push({ role: "assistant", content: reply });
    }
  } catch (err) {
    setError(friendlyFetchError(err));
    showLoading(false);
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
    document.getElementById("avatar-initials").textContent = botInitials;
    document.getElementById("topbar-initials").textContent = botInitials;
    document.querySelector(".brand-mark").textContent = botInitials;

    if (profile.photo) applyPhoto(profile.photo);
    renderContactLinks(profile.links);

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
