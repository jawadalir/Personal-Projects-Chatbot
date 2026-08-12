import json
from http.server import BaseHTTPRequestHandler

from lib.groq import chat_completion


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

            status, data = chat_completion(message, history)
            return _json_response(self, status, data)

        except Exception as e:
            print(f"Chat error: {e}")
            return _json_response(self, 500, {"error": "An unexpected error occurred."})
