import json
import hmac
import hashlib
import os
from http.server import BaseHTTPRequestHandler

PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET_KEY", "")
SUPABASE_URL = "https://inmrsgujgfktapjnekjs.supabase.co"
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

def update_profile(user_id, data):
    import urllib.request
    url = f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, method="PATCH")
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    try:
        urllib.request.urlopen(req)
    except Exception as e:
        print(f"Supabase update error: {e}")

def get_user_by_email(email):
    import urllib.request
    url = f"{SUPABASE_URL}/rest/v1/profiles?select=id&email=eq.{email}"
    req = urllib.request.Request(url)
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    try:
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read())
            return data[0]["id"] if data else None
    except:
        return None

def get_user_id_from_auth(email):
    """Look up user ID from Supabase auth by email using admin API."""
    import urllib.request
    url = f"{SUPABASE_URL}/auth/v1/admin/users?email={email}"
    req = urllib.request.Request(url)
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    try:
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read())
            users = data.get("users", [])
            return users[0]["id"] if users else None
    except:
        return None

def increment_founder_slots():
    import urllib.request
    url = f"{SUPABASE_URL}/rest/v1/rpc/increment_founder_slots"
    req = urllib.request.Request(url, data=b"{}", method="POST")
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    try:
        urllib.request.urlopen(req)
    except:
        pass

def get_founder_slots():
    import urllib.request
    url = f"{SUPABASE_URL}/rest/v1/founder_slots?id=eq.1"
    req = urllib.request.Request(url)
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    try:
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read())
            return data[0] if data else {"claimed": 0, "total": 200}
    except:
        return {"claimed": 0, "total": 200}

class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        # Read body
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        # Verify Paystack signature
        signature = self.headers.get("x-paystack-signature", "")
        expected = hmac.new(
            PAYSTACK_SECRET.encode(),
            body,
            hashlib.sha512
        ).hexdigest()

        if not hmac.compare_digest(expected, signature):
            self.send_response(401)
            self.end_headers()
            return

        # Parse event
        try:
            event = json.loads(body)
        except:
            self.send_response(400)
            self.end_headers()
            return

        event_type = event.get("event", "")
        data = event.get("data", {})

        # ── charge.success ──────────────────────────────────────────
        if event_type == "charge.success":
            customer = data.get("customer", {})
            email = customer.get("email", "")
            customer_code = customer.get("customer_code", "")
            subscription_code = data.get("subscription_code") or data.get("plan", {}).get("plan_code", "")
            plan_code = data.get("plan", {}).get("plan_code", "") if data.get("plan") else ""

            user_id = get_user_id_from_auth(email)
            if user_id:
                slots = get_founder_slots()
                is_founder = slots["claimed"] < slots["total"]

                update_profile(user_id, {
                    "is_premium": True,
                    "paystack_customer_code": customer_code,
                    "paystack_subscription_code": subscription_code,
                    "subscription_status": "active",
                    "subscription_started_at": data.get("paid_at"),
                    "is_founder": is_founder
                })

                if is_founder:
                    increment_founder_slots()

        # ── subscription.disable (cancellation) ─────────────────────
        elif event_type in ("subscription.disable", "subscription.not_renew"):
            customer = data.get("customer", {})
            email = customer.get("email", "")
            user_id = get_user_id_from_auth(email)
            if user_id:
                update_profile(user_id, {
                    "is_premium": False,
                    "subscription_status": "cancelled"
                })

        # ── invoice.payment_failed ──────────────────────────────────
        elif event_type == "invoice.payment_failed":
            customer = data.get("customer", {})
            email = customer.get("email", "")
            user_id = get_user_id_from_auth(email)
            if user_id:
                update_profile(user_id, {
                    "subscription_status": "payment_failed"
                })

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')

    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"webhook active"}')

    def log_message(self, format, *args):
        pass
