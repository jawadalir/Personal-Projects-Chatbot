"""
Local dev server — run with:  python run.py
Serves the chat UI and Python API without needing Vercel CLI.
"""
import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"

# Load .env.local or .env
for env_file in (ROOT / ".env.local", ROOT / ".env"):
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ.setdefault(key.strip(), val.strip())
        break

sys.path.insert(0, str(ROOT))

from lib.groq import chat_completion  # noqa: E402
from lib.prompt import get_public_profile  # noqa: E402

PORT = int(os.environ.get("PORT", 3000))


class DevHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def _send_json(self, status, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path, content_type):
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = urlparse(self.path).path

        if path == "/api/profile":
            return self._send_json(200, get_public_profile())

        if path in ("/", ""):
            path = "/index.html"

        file_path = PUBLIC / path.lstrip("/")
        if not file_path.exists() or not file_path.is_file():
            self.send_error(404)
            return

        types = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
        }
        return self._send_file(file_path, types.get(file_path.suffix, "application/octet-stream"))

    def do_POST(self):
        path = urlparse(self.path).path

        if path != "/api/chat":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"

        try:
            body = json.loads(raw.decode("utf-8"))
            message = (body.get("message") or "").strip()
            history = body.get("history") or []

            if not message:
                return self._send_json(400, {"error": "Message is required."})

            status, data = chat_completion(message, history)
            return self._send_json(status, data)
        except Exception as e:
            print(f"Error: {e}")
            return self._send_json(500, {"error": "An unexpected error occurred."})


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), DevHandler)
    print(f"Chatbot running at http://localhost:{PORT}", flush=True)
    print("Press Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
