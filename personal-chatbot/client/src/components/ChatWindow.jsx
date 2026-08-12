import { useEffect, useRef, useState } from "react";
import { sendChatMessage } from "../lib/chatApi";
import MessageBubble from "./MessageBubble";
import StarterQuestions from "./StarterQuestions";

export default function ChatWindow({ profile, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! I'm ${profile.name}, ${profile.title}. Ask me anything about my skills, experience, projects, or background — I'm here to represent myself.`,
        },
      ]);
    }
  }, [profile]);

  const showStarters =
    profile &&
    messages.length === 1 &&
    messages[0].role === "assistant";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(text) {
    const trimmed = text.trim();
    if (!trimmed || loading || !profile) return;

    setError(null);
    setInput("");

    const userMessage = { role: "user", content: trimmed };
    const history = messages.filter((m) => m.role !== "system");
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const reply = await sendChatMessage(trimmed, history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSend(input);
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        Loading chat...
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden bg-white ${
        compact
          ? "h-full"
          : "h-[calc(100vh-8rem)] max-h-[720px] rounded-2xl border border-zinc-200 shadow-lg"
      }`}
    >
      <div className="border-b border-zinc-100 bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
            {profile.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{profile.name}</h2>
            <p className="text-xs text-indigo-200">{profile.title}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}

        {showStarters && (
          <StarterQuestions
            questions={profile.starterQuestions}
            onSelect={handleSend}
            disabled={loading}
          />
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-zinc-100 bg-zinc-50 px-4 py-3"
      >
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
