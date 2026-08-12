import json
import os
import urllib.error
import urllib.request

from lib.prompt import build_system_prompt, load_profile

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"

# Cloudflare blocks Python-urllib's default User-Agent (403 error 1010)
GROQ_HEADERS = {
    "User-Agent": "PersonalChatbot/1.0",
    "Accept": "application/json",
    "Content-Type": "application/json",
}


def chat_completion(message, history=None, api_key=None):
    """Call Groq chat completions. Returns (status_code, response_dict)."""
    api_key = api_key or os.environ.get("GROQ_API_KEY", "")
    if not api_key or api_key == "your_groq_api_key_here":
        return 500, {"error": "GROQ_API_KEY is not configured in .env.local."}

    profile = load_profile()
    system_prompt = build_system_prompt(profile)
    history = history or []

    messages = [{"role": "system", "content": system_prompt}]
    history_msgs = [
        {"role": m["role"], "content": m["content"]}
        for m in history
        if m.get("role") in ("user", "assistant")
    ][-10:]
    messages.extend(history_msgs)
    messages.append({"role": "user", "content": message})

    payload = json.dumps(
        {
            "model": MODEL,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 1024,
        }
    ).encode("utf-8")

    headers = {**GROQ_HEADERS, "Authorization": f"Bearer {api_key}"}
    req = urllib.request.Request(GROQ_API_URL, data=payload, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        reply = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
        if not reply:
            return 502, {"error": "Empty response from AI service."}
        return 200, {"reply": reply}
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        print(f"Groq API error: {e.code} {err[:300]}")
        if e.code == 401:
            return 502, {"error": "Invalid Groq API key. Check GROQ_API_KEY in .env.local."}
        if "1010" in err:
            return 502, {"error": "Request blocked by Cloudflare. Please try again."}
        return 502, {"error": "Failed to get a response from the AI service."}
    except urllib.error.URLError as e:
        print(f"Groq network error: {e}")
        return 502, {"error": "Could not reach Groq API. Check your internet connection."}
