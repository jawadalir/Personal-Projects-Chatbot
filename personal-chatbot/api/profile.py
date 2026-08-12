import json
from http.server import BaseHTTPRequestHandler

from lib.prompt import get_public_profile


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        profile = get_public_profile()
        body = json.dumps(profile).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
