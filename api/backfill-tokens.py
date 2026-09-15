"""
api/backfill-tokens.py
Curio Learning — ONE-TIME backfill.

Fills in paystack_email_token for subscribers who subscribed before that
field existed, by pulling each subscription's email_token from Paystack's
GET /subscription/:code. Without this, those users can't self-cancel via
the API and fall back to the manual-email path.

Gated behind the same ADMIN_PASSWORD already used by api/admin-auth.py —
no new secret is introduced. It's also idempotent (guarded by a
site_config marker, so it only ever does real work once) and the
response reveals nothing but counts. This file is meant to be deleted
right after it's run once.
"""

import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler

SUPABASE_URL = "https://inmrsgujgfktapjnekjs.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET_KEY", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
MARKER_KEY = "backfill_email_tokens_done"


def sb_get(path):
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())


def sb_patch(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", data=body, method="PATCH")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    urllib.request.urlopen(req, timeout=10)


def sb_upsert(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", data=body, method="POST")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates,return=minimal")
    urllib.request.urlopen(req, timeout=10)


def paystack_get_subscription(code):
    req = urllib.request.Request(f"https://api.paystack.co/subscription/{code}")
    req.add_header("Authorization", f"Bearer {PAYSTACK_SECRET}")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        auth = self.headers.get("Authorization", "")
        supplied = auth[7:] if auth.lower().startswith("bearer ") else ""
        if not ADMIN_PASSWORD or supplied != ADMIN_PASSWORD:
            return self._json(401, {"error": "unauthorized"})

        try:
            marker = sb_get(f"site_config?key=eq.{MARKER_KEY}&select=value")
        except Exception as e:
            return self._json(500, {"error": f"marker check failed: {e}"})

        if marker:
            return self._json(200, {"already_ran": True})

        try:
            rows = sb_get(
                "profiles?paystack_subscription_code=not.is.null"
                "&paystack_email_token=is.null"
                "&select=id,paystack_subscription_code"
            )
        except Exception as e:
            return self._json(500, {"error": f"lookup failed: {e}"})

        filled, skipped, failed = 0, 0, 0
        for row in rows:
            code = row["paystack_subscription_code"]
            try:
                resp = paystack_get_subscription(code)
                token = (resp.get("data") or {}).get("email_token", "")
                if token:
                    sb_patch(f"profiles?id=eq.{row['id']}", {"paystack_email_token": token})
                    filled += 1
                else:
                    skipped += 1
            except Exception:
                failed += 1

        try:
            sb_upsert("site_config", {"key": MARKER_KEY, "value": f"filled={filled},skipped={skipped},failed={failed}"})
        except Exception:
            pass

        self._json(200, {"candidates": len(rows), "filled": filled, "skipped": skipped, "failed": failed})

    def _json(self, status, obj):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def log_message(self, *a):
        pass
