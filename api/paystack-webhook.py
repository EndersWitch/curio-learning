import hashlib
import hmac
import json
import os
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET_KEY", "")
SUPABASE_URL = "https://inmrsgujgfktapjnekjs.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")


def add_one_month(dt):
    year = dt.year + (1 if dt.month == 12 else 0)
    month = 1 if dt.month == 12 else dt.month + 1
    # Clamp the day so e.g. Jan 31 + 1 month lands on Feb 28/29, not an error.
    day = min(dt.day, [31, 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
                       31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1])
    return dt.replace(year=year, month=month, day=day)


def next_payment_date(data):
    """Best-effort 'paid through' date for a monthly plan charge/subscription."""
    raw = data.get("next_payment_date") or (data.get("subscription") or {}).get("next_payment_date")
    if raw:
        try:
            return datetime.fromisoformat(raw.replace("Z", "+00:00")).isoformat()
        except Exception:
            pass
    paid_at = data.get("paid_at") or data.get("createdAt")
    try:
        base = datetime.fromisoformat(paid_at.replace("Z", "+00:00")) if paid_at else datetime.now(timezone.utc)
    except Exception:
        base = datetime.now(timezone.utc)
    return add_one_month(base).isoformat()


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

                patch = {
                    "is_premium": True,
                    "paystack_customer_code": customer_code,
                    "subscription_status": "active",
                    "subscription_started_at": data.get("paid_at"),
                    "subscription_expires_at": next_payment_date(data),
                    "is_founder": is_founder,
                }
                if subscription_code:
                    patch["paystack_subscription_code"] = subscription_code

                supabase_patch(f"profiles?id=eq.{user_id}", patch)
                if is_founder:
                    increment_founder_slots()
                print(f"Activated premium for {email}, founder={is_founder}")
            else:
                print(f"User not found for email: {email}")

        # ── subscription created (captures the code + token needed ─
        # ── to cancel via API later) ───────────────────────────────
        elif event_type == "subscription.create":
            subscription_code = data.get("subscription_code", "")
            email_token = data.get("email_token", "")
            user_id = get_user_id_by_email(email)
            if user_id:
                supabase_patch(
                    f"profiles?id=eq.{user_id}",
                    {
                        "paystack_customer_code": customer_code,
                        "paystack_subscription_code": subscription_code,
                        "paystack_email_token": email_token,
                        "subscription_expires_at": next_payment_date(data),
                    }
                )
                print(f"Stored subscription code/token for {email}")

        # ── subscription cancelled / set to not renew ──────────────
        # Access is NOT revoked here — the user already paid for the
        # current period. A daily cron (api/expire-subscriptions.py)
        # flips is_premium off once subscription_expires_at passes.
        elif event_type in ("subscription.disable", "subscription.not_renew"):
            user_id = get_user_id_by_email(email)
            if user_id:
                supabase_patch(
                    f"profiles?id=eq.{user_id}",
                    {"subscription_status": "cancelled"}
                )
                print(f"Marked subscription cancelled (access continues until period end) for {email}")

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
