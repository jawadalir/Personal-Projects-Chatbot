import json
import os
import socket
import urllib.error
import urllib.request

from lib.prompt import build_system_prompt, load_profile

GROQ_HOST = "api.groq.com"
GROQ_PATH = "/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"
REQUEST_TIMEOUT = 90

GROQ_HEADERS = {
    "User-Agent": "PersonalChatbot/1.0",
    "Accept": "application/json",
    "Content-Type": "application/json",
}


def _get_api_key(api_key=None):
    key = api_key or os.environ.get("GROQ_API_KEY", "")
    if not key or key == "your_groq_api_key_here":
        return None
    return key


def _build_messages(message, history=None):
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
    return messages


def _groq_request(payload, api_key):
    headers = {**GROQ_HEADERS, "Authorization": f"Bearer {api_key}"}
    body = json.dumps(payload).encode("utf-8")
    return urllib.request.Request(
        f"https://{GROQ_HOST}{GROQ_PATH}",
        data=body,
        headers=headers,
        method="POST",
    )


def _parse_stream_line(line):
    text = line.decode("utf-8").strip()
    if not text or not text.startswith("data: "):
        return None
    data = text[6:]
    if data == "[DONE]":
        return "[DONE]"
    try:
        chunk = json.loads(data)
    except json.JSONDecodeError:
        return None
    return (chunk.get("choices") or [{}])[0].get("delta", {}).get("content", "")


def chat_completion(message, history=None, api_key=None):
    """Non-streaming chat. Returns (status_code, response_dict)."""
    api_key = _get_api_key(api_key)
    if not api_key:
        return 500, {"error": "GROQ_API_KEY is not configured in .env.local."}

    messages = _build_messages(message, history)
    req = _groq_request(
        {
            "model": MODEL,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 1024,
        },
        api_key,
    )

    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
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
    except (urllib.error.URLError, socket.timeout, TimeoutError) as e:
        print(f"Groq network error: {e}")
        return 502, {"error": "Could not reach Groq API. Check your internet connection."}


def stream_chat_tokens(message, history=None, api_key=None):
    """
    Yield token strings from Groq streaming API.
    Raises ValueError with error message on failure.
    """
    api_key = _get_api_key(api_key)
    if not api_key:
        raise ValueError("GROQ_API_KEY is not configured in .env.local.")

    messages = _build_messages(message, history)
    req = _groq_request(
        {
            "model": MODEL,
            "messages": messages,
            "temperature": 0.4,
            "max_tokens": 1024,
            "stream": True,
        },
        api_key,
    )

    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
            for raw_line in resp:
                parsed = _parse_stream_line(raw_line)
                if parsed == "[DONE]":
                    break
                if parsed:
                    yield parsed
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", errors="replace")
        print(f"Groq stream error: {e.code} {err[:300]}")
        if e.code == 401:
            raise ValueError("Invalid Groq API key.") from e
        if "1010" in err:
            raise ValueError("Request blocked by Cloudflare. Please try again.") from e
        raise ValueError("Failed to get a response from the AI service.") from e
    except (urllib.error.URLError, socket.timeout, TimeoutError) as e:
        print(f"Groq stream network error: {e}")
        raise ValueError("Could not reach Groq API. Check your internet connection.") from e
