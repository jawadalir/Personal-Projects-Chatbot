import json
from http.server import BaseHTTPRequestHandler

from lib.groq import stream_chat_tokens


def _sse_event(data):
    return f"data: {json.dumps(data)}\n\n".encode("utf-8")


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"

        try:
            body = json.loads(raw.decode("utf-8"))
            message = (body.get("message") or "").strip()
            history = body.get("history") or []

            if not message:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Message is required."}).encode())
                return

            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-cache, no-transform")
            self.send_header("Connection", "close")
            self.send_header("X-Accel-Buffering", "no")
            self.end_headers()

            try:
                for token in stream_chat_tokens(message, history):
                    self.wfile.write(_sse_event({"token": token}))
                    self.wfile.flush()
                self.wfile.write(_sse_event({"done": True}))
                self.wfile.flush()
            except (ValueError, OSError, BrokenPipeError) as e:
                print(f"Stream chat error: {e}")
                try:
                    self.wfile.write(_sse_event({"error": str(e)}))
                    self.wfile.flush()
                except Exception:
                    pass

        except Exception as e:
            print(f"Stream setup error: {e}")
            try:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "An unexpected error occurred."}).encode())
            except Exception:
                pass
