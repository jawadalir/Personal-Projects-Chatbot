export async function fetchProfile() {
  const response = await fetch("/api/profile");
  if (!response.ok) {
    throw new Error("Failed to load profile.");
  }
  return response.json();
}

export async function sendChatMessage(message, history = []) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get a response.");
  }

  return data.reply;
}
