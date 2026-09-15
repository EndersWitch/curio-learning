"""
api/backfill-tokens.py
Curio Learning — ONE-TIME backfill.

Fills in paystack_email_token for subscribers who subscribed before that
field existed, so those users can self-cancel via the API instead of
falling back to the manual-email path.

Looks subscriptions up via GET /customer/:code rather than trusting the
existing paystack_subscription_code column: a webhook bug that predates
this feature could store a PLAN code (PLN_...) there instead of a real
SUBSCRIPTION code (SUB_...) when Paystack's charge.success event didn't
include one. This also corrects that column along the way.

Gated behind the same ADMIN_PASSWORD already used by api/admin-auth.py —
no new secret is introduced. Naturally safe to re-run: it only ever
looks at profiles still missing a token, so a retry after a partial
failure just picks up where the last run left off. The response
reveals nothing but counts. This file is meant to be deleted right
after it's run successfully.
"""

import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler

SUPABASE_URL = "https://inmrsgujgfktapjnekjs.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET_KEY", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")


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


def paystack_get_customer(customer_code):
    req = urllib.request.Request(f"https://api.paystack.co/customer/{customer_code}")
    req.add_header("Authorization", f"Bearer {PAYSTACK_SECRET}")
    # Paystack's edge (Cloudflare) blocks Python's default "Python-urllib/x.x"
    # User-Agent as a bot — same issue the Resend contact-form call hit.
    req.add_header("User-Agent", "curio-learning-backfill/1.0")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        auth = self.headers.get("Authorization", "")
        supplied = auth[7:] if auth.lower().startswith("bearer ") else ""
        if not ADMIN_PASSWORD or supplied != ADMIN_PASSWORD:
            return self._json(401, {"error": "unauthorized"})

        try:
            rows = sb_get(
                "profiles?paystack_customer_code=not.is.null"
                "&paystack_email_token=is.null"
                "&select=id,paystack_customer_code"
            )
        except Exception as e:
            return self._json(500, {"error": f"lookup failed: {e}"})

        filled, skipped, failed = 0, 0, 0
        errors = []
        for row in rows:
            customer_code = row["paystack_customer_code"]
            try:
                resp = paystack_get_customer(customer_code)
                subs = (resp.get("data") or {}).get("subscriptions") or []
                active = next((s for s in subs if s.get("status") == "active"), None) or (subs[0] if subs else None)
                token = (active or {}).get("email_token", "")
                real_code = (active or {}).get("subscription_code", "")
                if token and real_code:
                    sb_patch(f"profiles?id=eq.{row['id']}", {
                        "paystack_email_token": token,
                        "paystack_subscription_code": real_code,
                    })
                    filled += 1
                else:
                    skipped += 1
            except Exception as e:
                failed += 1
                print(f"backfill-tokens: failed for customer {customer_code}: {e}")
                errors.append(str(e))

        self._json(200, {
            "candidates": len(rows), "filled": filled, "skipped": skipped, "failed": failed,
            "errors": errors[:3],
        })

    def _json(self, status, obj):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def log_message(self, *a):
        pass
