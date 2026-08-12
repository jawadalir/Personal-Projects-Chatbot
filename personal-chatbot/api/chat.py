import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler

from lib.prompt import build_system_prompt, load_profile

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "llama-3.3-70b-versatile"


def _json_response(handler, status, data):
    body = json.dumps(data).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(length) if length else b"{}"
            body = json.loads(raw.decode("utf-8"))

            message = (body.get("message") or "").strip()
            history = body.get("history") or []

            if not message:
                return _json_response(self, 400, {"error": "Message is required."})

            api_key = os.environ.get("GROQ_API_KEY", "")
            if not api_key or api_key == "your_groq_api_key_here":
                return _json_response(
                    self,
                    500,
                    {"error": "GROQ_API_KEY is not configured in Vercel environment variables."},
                )

            profile = load_profile()
            system_prompt = build_system_prompt(profile)

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

            req = urllib.request.Request(
                GROQ_API_URL,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                method="POST",
            )

            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            reply = (data.get("choices") or [{}])[0].get("message", {}).get("content", "").strip()
            if not reply:
                return _json_response(self, 502, {"error": "Empty response from AI service."})

            return _json_response(self, 200, {"reply": reply})

        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            print(f"Groq API error: {e.code} {err}")
            return _json_response(self, 502, {"error": "Failed to get a response from the AI service."})
        except Exception as e:
            print(f"Chat error: {e}")
            return _json_response(self, 500, {"error": "An unexpected error occurred."})
