"""
api/paystack-webhook.py
Curio Learning — Paystack webhook.

Every signed event is stored in paystack_events first, then applied.
Users are matched by exact identifiers only (see _billing.find_profile).
Premium is granted only for a successful charge of at least the plan
price, and only up to the end of the period that charge paid for.
Revoking access when a period runs out is done by the daily job
(api/expire-subscriptions.py), which double-checks with Paystack.
"""

import hashlib
import hmac
import json
import os
import sys
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))
import _billing as b  # noqa: E402


def handle_event(event_type, data):
    """Apply one verified event. Returns a short description for the logs."""

    if event_type == "charge.success":
        problem = b.premium_charge_problem(data)
        if problem:
            return f"ignored charge: {problem}"

        profile = b.find_profile(data)
        if not profile:
            return "charge: no matching user"

        paid_through = b.paid_through_from_charge(data)
        current = b.parse_dt(profile.get("subscription_expires_at"))
        if current and current > paid_through:
            paid_through = current  # duplicate/out-of-order event: never shorten

        patch = {
            "is_premium": True,
            "subscription_status": "active",
            "subscription_expires_at": b.iso(paid_through),
        }
        customer_code = (data.get("customer") or {}).get("customer_code")
        if customer_code:
            patch["paystack_customer_code"] = customer_code
        sub_code = b.subscription_code_of(data)
        if sub_code:
            patch["paystack_subscription_code"] = sub_code
        if not profile.get("subscription_started_at"):
            patch["subscription_started_at"] = data.get("paid_at") or b.iso(b.now_utc())

        b.patch_profile(profile["id"], patch)
        founder = profile.get("is_founder") or b.claim_founder_slot(profile["id"])
        return f"premium until {patch['subscription_expires_at']} for {profile['id']} (founder={bool(founder)})"

    if event_type == "subscription.create":
        profile = b.find_profile(data)
        if not profile:
            return "subscription.create: no matching user"
        # Paying again creates a new subscription — stop the old one first
        # so nobody is charged twice. Raises (-> 500 -> Paystack retries)
        # if the old one can't be stopped yet.
        note = b.stop_old_subscription(profile, data.get("subscription_code"))
        patch = {}
        customer_code = (data.get("customer") or {}).get("customer_code")
        if customer_code:
            patch["paystack_customer_code"] = customer_code
        if data.get("subscription_code"):
            patch["paystack_subscription_code"] = data["subscription_code"]
        if data.get("email_token"):
            patch["paystack_email_token"] = data["email_token"]
        # Note: this does NOT grant Premium — only a successful charge does.
        if patch:
            b.patch_profile(profile["id"], patch)
        return f"stored subscription details for {profile['id']} ({note})"

    if event_type == "invoice.payment_failed":
        profile = b.find_profile(data)
        if not profile:
            return "payment_failed: no matching user"
        if not b.is_current_subscription(profile, data):
            return "payment_failed: ignored, about an older subscription"
        # The period they paid for ends now. The daily job removes Premium
        # once the grace period passes, unless Paystack shows a payment.
        now = b.now_utc()
        current = b.parse_dt(profile.get("subscription_expires_at"))
        end = current if current and current < now else now
        b.patch_profile(profile["id"], {
            "subscription_status": "payment_failed",
            "subscription_expires_at": b.iso(end),
        })
        return f"payment failed for {profile['id']}, paid period ended {b.iso(end)}"

    if event_type in ("subscription.not_renew", "subscription.disable"):
        profile = b.find_profile(data)
        if not profile:
            return f"{event_type}: no matching user"
        if not b.is_current_subscription(profile, data):
            return f"{event_type}: ignored, about an older subscription"
        # Access continues until the paid period ends; the daily job revokes it.
        if profile.get("subscription_status") in ("active", "payment_failed", None):
            b.patch_profile(profile["id"], {"subscription_status": "cancelled"})
        return f"marked cancelled for {profile['id']}"

    return "no action"


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self._respond(200, {"status": "webhook active"})

    def do_POST(self):
        if not b.PAYSTACK_SECRET or not b.SUPABASE_KEY:
            # Without the secret, anyone could forge a "payment". Refuse everything.
            print("paystack-webhook: PAYSTACK_SECRET_KEY or SUPABASE_SERVICE_KEY missing")
            return self._respond(500, {"error": "not configured"})

        length = int(self.headers.get("Content-Length", 0) or 0)
        body = self.rfile.read(length)

        sig = self.headers.get("x-paystack-signature", "")
        expected = hmac.new(b.PAYSTACK_SECRET.encode("utf-8"), body, hashlib.sha512).hexdigest()
        if not sig or not hmac.compare_digest(sig, expected):
            print("paystack-webhook: signature mismatch")
            return self._respond(401, {"error": "invalid signature"})

        try:
            event = json.loads(body)
        except ValueError:
            return self._respond(400, {"error": "invalid json"})

        event_type = event.get("event", "")
        data = event.get("data") or {}
        b.log_event(event_type, event)

        try:
            result = handle_event(event_type, data)
        except Exception as e:
            # 500 makes Paystack retry later; handlers are safe to repeat.
            print(f"paystack-webhook: {event_type} failed: {e}")
            return self._respond(500, {"error": "processing failed"})

        print(f"paystack-webhook: {event_type}: {result}")
        self._respond(200, {"status": "ok"})

    def _respond(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def log_message(self, format, *args):
        pass
