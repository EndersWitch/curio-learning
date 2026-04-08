import hashlib
import hmac
import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler

PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET_KEY", "")
SUPABASE_URL = "https://inmrsgujgfktapjnekjs.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def supabase_patch(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        data=body, method="PATCH"
    )
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    try:
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        print(f"Supabase PATCH error: {e}")


def get_user_id_by_email(email):
    encoded = urllib.parse.quote(email)
    req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/admin/users?email={encoded}"
    )
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
            users = data.get("users", [])
            return users[0]["id"] if users else None
    except Exception as e:
        print(f"get_user_id error: {e}")
        return None


def get_founder_slots():
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/founder_slots?id=eq.1"
    )
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read())
            return data[0] if data else {"claimed": 0, "total": 200}
    except:
        return {"claimed": 0, "total": 200}


def increment_founder_slots():
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/founder_slots?id=eq.1",
        data=json.dumps({"claimed": get_founder_slots()["claimed"] + 1}).encode(),
        method="PATCH"
    )
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    try:
        urllib.request.urlopen(req, timeout=5)
    except Exception as e:
        print(f"increment_founder_slots error: {e}")


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self._respond(200, {"status": "webhook active"})

    def do_POST(self):
        import urllib.parse

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        # ── Verify Paystack signature ─────────────────────────────
        sig = self.headers.get("x-paystack-signature", "")
        expected = hmac.new(
            PAYSTACK_SECRET.encode("utf-8"),
            body,
            hashlib.sha512
        ).hexdigest()

        if not hmac.compare_digest(sig, expected):
            print(f"Signature mismatch. Got: {sig[:20]}... Expected: {expected[:20]}...")
            self._respond(401, {"error": "invalid signature"})
            return

        try:
            event = json.loads(body)
        except Exception:
            self._respond(400, {"error": "invalid json"})
            return

        event_type = event.get("event", "")
        data = event.get("data", {})
        print(f"Paystack event: {event_type}")

        customer = data.get("customer", {})
        email = customer.get("email", "")
        customer_code = customer.get("customer_code", "")

        # ── charge.success ────────────────────────────────────────
        if event_type == "charge.success":
            plan = data.get("plan", {}) or {}
            subscription_code = data.get("subscription_code") or plan.get("plan_code", "")

            user_id = get_user_id_by_email(email)
            if user_id:
                slots = get_founder_slots()
                is_founder = slots["claimed"] < slots["total"]

                supabase_patch(
                    f"profiles?id=eq.{user_id}",
                    {
                        "is_premium": True,
                        "paystack_customer_code": customer_code,
                        "paystack_subscription_code": subscription_code,
                        "subscription_status": "active",
                        "subscription_started_at": data.get("paid_at"),
                        "is_founder": is_founder,
                    }
                )
                if is_founder:
                    increment_founder_slots()
                print(f"Activated premium for {email}, founder={is_founder}")
            else:
                print(f"User not found for email: {email}")

        # ── subscription cancelled / disabled ─────────────────────
        elif event_type in ("subscription.disable", "subscription.not_renew"):
            user_id = get_user_id_by_email(email)
            if user_id:
                supabase_patch(
                    f"profiles?id=eq.{user_id}",
                    {"is_premium": False, "subscription_status": "cancelled"}
                )
                print(f"Cancelled premium for {email}")

        # ── payment failed ────────────────────────────────────────
        elif event_type == "invoice.payment_failed":
            user_id = get_user_id_by_email(email)
            if user_id:
                supabase_patch(
                    f"profiles?id=eq.{user_id}",
                    {"subscription_status": "payment_failed"}
                )
                print(f"Payment failed for {email}")

        self._respond(200, {"status": "ok"})

    def _respond(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        pass
