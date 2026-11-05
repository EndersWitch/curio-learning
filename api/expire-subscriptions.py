"""
api/expire-subscriptions.py
Curio Learning — daily Premium check (cron, see vercel.json).

Looks at every Premium account whose paid-through date has passed (or was
never recorded) and asks Paystack whether the subscription is actually
paid up:
  * paid up        -> extend subscription_expires_at to Paystack's next date
  * not paid       -> remove Premium once the grace period has passed
  * no Paystack sub -> manual grants with no end date are left alone
Admins are never touched.

GET /api/expire-subscriptions            (Authorization: Bearer CRON_SECRET)
GET /api/expire-subscriptions?dry_run=1  shows what would happen, changes nothing
"""

import json
import os
import sys
import urllib.parse
from http.server import BaseHTTPRequestHandler

sys.path.insert(0, os.path.dirname(__file__))
import _billing as b  # noqa: E402

CRON_SECRET = os.environ.get("CRON_SECRET", "")


def premium_accounts_due(now):
    cutoff = urllib.parse.quote(b.iso(now), safe="")
    return b.sb(
        "GET",
        "profiles?is_premium=eq.true"
        f"&or=(subscription_expires_at.is.null,subscription_expires_at.lt.{cutoff})"
        f"&select={b.PROFILE_FIELDS}",
        prefer=None,
    ) or []


def run(dry_run=False):
    now = b.now_utc()
    results = []

    for profile in premium_accounts_due(now):
        sub, err = None, False
        code = profile.get("paystack_subscription_code")
        if code and not profile.get("is_admin"):
            try:
                sub = b.fetch_subscription(code)
            except Exception as e:
                print(f"expire-subscriptions: Paystack lookup failed for {profile['id']}: {e}")
                err = True

        action, detail = b.decide_expiry(profile, sub, now, paystack_error=err)
        entry = {"id": profile["id"], "action": action}

        if action == "keep":
            entry["paid_through"] = b.iso(detail)
            if not dry_run:
                b.patch_profile(profile["id"], {
                    "subscription_expires_at": b.iso(detail),
                    "subscription_status": "cancelled" if (sub or {}).get("status") == "non-renewing" else "active",
                })
        elif action == "revoke":
            entry["reason"] = detail
            if not dry_run:
                b.patch_profile(profile["id"], {"is_premium": False, "subscription_status": "expired"})
        else:
            entry["reason"] = detail

        results.append(entry)

    return results


class handler(BaseHTTPRequestHandler):

    def do_GET(self):
        authorized = bool(CRON_SECRET) and self.headers.get("Authorization", "") == f"Bearer {CRON_SECRET}"
        if CRON_SECRET and not authorized:
            return self._json(401, {"error": "unauthorized"})
        if not CRON_SECRET:
            # Vercel sends "Bearer $CRON_SECRET" automatically once it is set.
            print("expire-subscriptions: CRON_SECRET not set — running without auth, details hidden")
        if not b.SUPABASE_KEY or not b.PAYSTACK_SECRET:
            return self._json(500, {"error": "not configured"})

        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        dry_run = authorized and query.get("dry_run", ["0"])[0] in ("1", "true", "yes")

        try:
            results = run(dry_run=dry_run)
        except Exception as e:
            print(f"expire-subscriptions: failed: {e}")
            return self._json(500, {"error": "check failed"})

        revoked = sum(1 for r in results if r["action"] == "revoke")
        kept = sum(1 for r in results if r["action"] == "keep")
        print(f"expire-subscriptions{' (dry run)' if dry_run else ''}: "
              f"checked {len(results)}, revoked {revoked}, extended {kept}")
        out = {"dry_run": dry_run, "checked": len(results), "revoked": revoked, "extended": kept}
        if authorized:
            out["results"] = results
        self._json(200, out)

    def _json(self, status, obj):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def log_message(self, *a):
        pass
