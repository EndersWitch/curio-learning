"""
api/cancel-subscription.py
Curio Learning — Self-service subscription cancellation.

Lets a logged-in user cancel their own Paystack subscription without an
admin having to do it by hand. Verifies the caller's Supabase session,
tells Paystack to stop future billing, and marks the subscription
cancelled — access continues until the period already paid for ends
(see api/expire-subscriptions.py).
"""

import json
import os
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler

SUPABASE_URL = "https://inmrsgujgfktapjnekjs.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU"
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET_KEY", "")


def get_authenticated_user(bearer_token):
    """Ask Supabase who this access token belongs to — never trust a client-supplied user id."""
    req = urllib.request.Request(f"{SUPABASE_URL}/auth/v1/user")
    req.add_header("apikey", SUPABASE_ANON_KEY)
    req.add_header("Authorization", f"Bearer {bearer_token}")
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read())
    except Exception:
        return None


def sb_get_profile(user_id):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/profiles"
        f"?id=eq.{user_id}&select=paystack_subscription_code,paystack_email_token,subscription_status,subscription_expires_at"
    )
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    with urllib.request.urlopen(req, timeout=10) as r:
        rows = json.loads(r.read())
        return rows[0] if rows else None


def sb_patch_profile(user_id, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
        data=body, method="PATCH"
    )
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    urllib.request.urlopen(req, timeout=10)


def paystack_disable_subscription(code, token):
    body = json.dumps({"code": code, "token": token}).encode()
    req = urllib.request.Request(
        "https://api.paystack.co/subscription/disable",
        data=body, method="POST"
    )
    req.add_header("Authorization", f"Bearer {PAYSTACK_SECRET}")
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_POST(self):
        auth_header = self.headers.get("Authorization", "")
        bearer = auth_header[7:] if auth_header.lower().startswith("bearer ") else ""
        if not bearer:
            return self._json(401, {"error": "Not signed in."})

        supa_user = get_authenticated_user(bearer)
        if not supa_user or not supa_user.get("id"):
            return self._json(401, {"error": "Session expired. Please sign in again."})

        user_id = supa_user["id"]

        try:
            profile = sb_get_profile(user_id)
        except Exception as e:
            print(f"cancel-subscription: profile lookup failed: {e}")
            return self._json(500, {"error": "Something went wrong. Please try again."})

        if not profile or not profile.get("paystack_subscription_code"):
            return self._json(400, {"error": "No active Paystack subscription found on your account."})

        if profile.get("subscription_status") == "cancelled":
            return self._json(200, {
                "success": True,
                "already_cancelled": True,
                "access_until": profile.get("subscription_expires_at"),
            })

        code = profile["paystack_subscription_code"]
        token = profile.get("paystack_email_token") or ""
        if not token:
            # We don't have the email token yet (e.g. subscribed before this
            # feature shipped) — Paystack can't disable via API without it.
            return self._json(409, {
                "error": "We can't auto-cancel this subscription yet. "
                         "Please email hello@curiolearning.co.za and we'll cancel it for you."
            })

        try:
            result = paystack_disable_subscription(code, token)
        except urllib.error.HTTPError as e:
            print(f"cancel-subscription: Paystack error {e.code}: {e.read().decode(errors='ignore')}")
            return self._json(502, {"error": "Paystack couldn't process the cancellation. Please try again shortly."})
        except Exception as e:
            print(f"cancel-subscription: Paystack request failed: {e}")
            return self._json(502, {"error": "Paystack couldn't process the cancellation. Please try again shortly."})

        if not result.get("status"):
            print(f"cancel-subscription: Paystack declined: {result}")
            return self._json(502, {"error": "Paystack couldn't process the cancellation. Please try again shortly."})

        try:
            sb_patch_profile(user_id, {"subscription_status": "cancelled"})
        except Exception as e:
            print(f"cancel-subscription: profile patch failed: {e}")

        return self._json(200, {
            "success": True,
            "access_until": profile.get("subscription_expires_at"),
        })

    def _json(self, status, obj):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def log_message(self, *a):
        pass
