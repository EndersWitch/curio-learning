"""
api/expire-subscriptions.py
Curio Learning — Daily cron (see vercel.json).

Cancelling a subscription only stops future billing — the user keeps
Premium until the period they already paid for ends. This job runs
daily and flips is_premium off for anyone whose cancelled subscription
has passed subscription_expires_at.
"""

import json
import os
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

SUPABASE_URL = "https://inmrsgujgfktapjnekjs.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
CRON_SECRET = os.environ.get("CRON_SECRET", "")


def expire_lapsed_subscriptions():
    now = datetime.now(timezone.utc).isoformat()
    body = json.dumps({"is_premium": False}).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/profiles"
        f"?is_premium=eq.true&subscription_status=eq.cancelled&subscription_expires_at=lt.{now}",
        data=body, method="PATCH"
    )
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        if CRON_SECRET:
            got = self.headers.get("Authorization", "")
            if got != f"Bearer {CRON_SECRET}":
                return self._json(401, {"error": "unauthorized"})

        try:
            expired = expire_lapsed_subscriptions()
        except Exception as e:
            print(f"expire-subscriptions: failed: {e}")
            return self._json(500, {"error": "expire failed"})

        print(f"expire-subscriptions: revoked premium for {len(expired)} account(s)")
        self._json(200, {"revoked": len(expired)})

    def _json(self, status, obj):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def log_message(self, *a):
        pass
