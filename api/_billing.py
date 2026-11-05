"""
api/_billing.py
Curio Learning — shared billing helpers for the Paystack webhook and the
daily expiry job. Not a route (leading underscore).

Rules this module enforces:
  * A user is only ever found by an exact identifier — checkout metadata
    user_id, stored Paystack customer/subscription code, or exact email.
    Never "the first user in a list".
  * Premium is tied to a paid-through date (subscription_expires_at).
    Payments push it forward; nothing else does.
  * is_founder is founder PRICING, not access. Only is_premium grants access.
"""

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

SUPABASE_URL = "https://inmrsgujgfktapjnekjs.supabase.co"
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
PAYSTACK_SECRET = os.environ.get("PAYSTACK_SECRET_KEY", "")

# Plans that grant curio Premium. Comma-separated env override for when
# new plans (e.g. a bundle) are added.
PLAN_CODES = {
    c.strip() for c in os.environ.get("PAYSTACK_PLAN_CODES", "PLN_rgv78ij4cj0ky3d").split(",") if c.strip()
}
# Smallest charge (in cents) that counts as a Premium payment. Stops a
# tampered checkout (e.g. R1 instead of R49) from unlocking Premium.
MIN_AMOUNT_CENTS = int(os.environ.get("PREMIUM_MIN_AMOUNT_CENTS", "4900"))
CURRENCY = "ZAR"

# Days of access kept after a missed renewal, to cover webhook delays.
GRACE_DAYS = int(os.environ.get("PREMIUM_GRACE_DAYS", "3"))

# Paystack's edge blocks Python's default User-Agent.
USER_AGENT = "curio-learning-billing/2.0"

PROFILE_FIELDS = (
    "id,is_premium,is_founder,is_admin,subscription_status,"
    "subscription_started_at,subscription_expires_at,"
    "paystack_customer_code,paystack_subscription_code,paystack_email_token"
)

UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)


# ── dates ────────────────────────────────────────────────────────────

def now_utc():
    return datetime.now(timezone.utc)


def parse_dt(raw):
    if not raw or not isinstance(raw, str):
        return None
    s = raw.strip().replace("Z", "+00:00")
    if " " in s and "T" not in s:
        s = s.replace(" ", "T", 1)
    # Postgres can return "+00" offsets; fromisoformat wants "+00:00".
    if re.search(r"[+-]\d{2}$", s):
        s += ":00"
    try:
        dt = datetime.fromisoformat(s)
    except ValueError:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def iso(dt):
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def add_one_month(dt):
    year = dt.year + (1 if dt.month == 12 else 0)
    month = 1 if dt.month == 12 else dt.month + 1
    leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
    days = [31, 29 if leap else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]
    return dt.replace(year=year, month=month, day=min(dt.day, days))


# ── Supabase ─────────────────────────────────────────────────────────

def sb(method, path, body=None, prefer="return=minimal"):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/{path}",
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
    )
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)
    with urllib.request.urlopen(req, timeout=8) as r:
        raw = r.read()
        return json.loads(raw) if raw else None


def profile_where(column, value):
    q = urllib.parse.quote(str(value), safe="")
    rows = sb("GET", f"profiles?{column}=eq.{q}&select={PROFILE_FIELDS}&limit=2", prefer=None) or []
    # Two profiles sharing one Paystack code is ambiguous — refuse rather than guess.
    return rows[0] if len(rows) == 1 else None


def user_id_by_email(email):
    if not email:
        return None
    return sb("POST", "rpc/billing_user_id_by_email", {"p_email": email}, prefer=None)


def patch_profile(user_id, data):
    sb("PATCH", f"profiles?id=eq.{user_id}", data)


def claim_founder_slot(user_id):
    return bool(sb("POST", "rpc/billing_claim_founder_slot", {"p_user_id": user_id}, prefer=None))


def log_event(event_type, payload):
    try:
        sb("POST", "paystack_events", {"event": event_type, "payload": payload})
    except Exception as e:
        print(f"billing: could not log event {event_type}: {e}")


# ── Paystack ─────────────────────────────────────────────────────────

def paystack_get(path):
    req = urllib.request.Request(f"https://api.paystack.co/{path}")
    req.add_header("Authorization", f"Bearer {PAYSTACK_SECRET}")
    req.add_header("User-Agent", USER_AGENT)
    with urllib.request.urlopen(req, timeout=8) as r:
        body = json.loads(r.read())
    if not body.get("status"):
        raise RuntimeError(f"Paystack said no: {body.get('message')}")
    return body.get("data") or {}


def fetch_subscription(code):
    return paystack_get(f"subscription/{urllib.parse.quote(code, safe='')}")


def paystack_post(path, body):
    req = urllib.request.Request(f"https://api.paystack.co/{path}", data=json.dumps(body).encode(), method="POST")
    req.add_header("Authorization", f"Bearer {PAYSTACK_SECRET}")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", USER_AGENT)
    with urllib.request.urlopen(req, timeout=8) as r:
        body = json.loads(r.read())
    if not body.get("status"):
        raise RuntimeError(f"Paystack said no: {body.get('message')}")
    return body.get("data") or {}


# Paystack states in which a subscription can still charge the card.
CHARGEABLE_STATES = ("active", "attention", "non-renewing")


def stop_old_subscription(profile, new_code):
    """
    A member who pays again (e.g. after a failed renewal) gets a brand-new
    Paystack subscription. Stop the one stored on their profile so they're
    never billed twice. Returns a short note; raises if Paystack refuses,
    so the webhook returns 500 and Paystack retries the event.
    """
    old_code = profile.get("paystack_subscription_code")
    if not old_code or old_code == new_code:
        return "no previous subscription"
    old = fetch_subscription(old_code)
    if old.get("status") not in CHARGEABLE_STATES:
        return f"previous subscription already {old.get('status')}"
    token = old.get("email_token") or profile.get("paystack_email_token")
    if not token:
        raise RuntimeError(f"no email token to stop {old_code}")
    paystack_post("subscription/disable", {"code": old_code, "token": token})
    return f"stopped previous subscription {old_code}"


def is_current_subscription(profile, data):
    """False when an event is about an older subscription than the one on the profile."""
    event_code = subscription_code_of(data)
    current = profile.get("paystack_subscription_code")
    return not event_code or not current or event_code == current


# ── identifying the user behind an event ─────────────────────────────

def _metadata(data):
    md = data.get("metadata")
    if isinstance(md, str):
        try:
            md = json.loads(md)
        except ValueError:
            md = {}
    return md if isinstance(md, dict) else {}


def subscription_code_of(data):
    return data.get("subscription_code") or (data.get("subscription") or {}).get("subscription_code") or ""


def find_profile(data):
    """Exact identifiers only, most specific first. Returns a profile row or None."""
    uid = str(_metadata(data).get("user_id") or "")
    if UUID_RE.match(uid):
        row = profile_where("id", uid)
        if row:
            return row

    customer = data.get("customer") or {}
    code = customer.get("customer_code")
    if code:
        row = profile_where("paystack_customer_code", code)
        if row:
            return row

    sub_code = subscription_code_of(data)
    if sub_code:
        row = profile_where("paystack_subscription_code", sub_code)
        if row:
            return row

    uid = user_id_by_email(customer.get("email", ""))
    if uid:
        return profile_where("id", uid)
    return None


# ── payment rules ────────────────────────────────────────────────────

def premium_charge_problem(data):
    """None if this charge.success should grant Premium, else the reason it shouldn't."""
    if data.get("status") != "success":
        return f"status {data.get('status')!r}"
    if (data.get("currency") or "").upper() != CURRENCY:
        return f"currency {data.get('currency')!r}"
    try:
        amount = int(data.get("amount") or 0)
    except (TypeError, ValueError):
        amount = 0
    if amount < MIN_AMOUNT_CENTS:
        return f"amount {amount} below {MIN_AMOUNT_CENTS}"
    plan_code = (data.get("plan") or {}).get("plan_code") if isinstance(data.get("plan"), dict) else None
    if plan_code and plan_code not in PLAN_CODES:
        return f"plan {plan_code} is not a curio Premium plan"
    return None


def paid_through_from_charge(data):
    """When the period this charge paid for ends."""
    paid_at = parse_dt(data.get("paid_at") or data.get("paidAt")) or now_utc()
    npd = parse_dt(data.get("next_payment_date") or (data.get("subscription") or {}).get("next_payment_date"))
    return npd if npd and npd > paid_at else add_one_month(paid_at)


def decide_expiry(profile, sub, now, paystack_error=False):
    """
    Daily-check decision for one Premium profile. Pure function (tested).

    sub: Paystack subscription object, or None if there is no code / lookup failed.
    Returns (action, detail): action is "keep" (detail = new paid-through
    datetime), "revoke" (detail = reason) or "skip" (detail = reason).
    """
    if profile.get("is_admin"):
        return "skip", "admin"

    expires = parse_dt(profile.get("subscription_expires_at"))
    if expires and expires > now:
        return "skip", "paid period not over"

    status = profile.get("subscription_status")
    grace = timedelta(days=0 if status == "cancelled" else GRACE_DAYS)

    if not profile.get("paystack_subscription_code"):
        if expires is None:
            return "skip", "manual grant with no end date"
        return ("revoke", "manual grant ended") if now > expires + grace else ("skip", "in grace period")

    if paystack_error:
        # Don't punish a payer for Paystack being down, but don't let an
        # outage keep someone on Premium forever either.
        if expires and now > expires + timedelta(days=7):
            return "revoke", "paid period ended over 7 days ago (Paystack unreachable)"
        return "skip", "Paystack unreachable"

    sub = sub or {}
    ps_status = sub.get("status")
    npd = parse_dt(sub.get("next_payment_date"))
    recent = sub.get("most_recent_invoice") or {}
    last_failed = isinstance(recent, dict) and recent.get("status") == "failed"

    if ps_status in ("active", "non-renewing") and npd and npd > now and not last_failed:
        return "keep", npd

    if expires is None or now > expires + grace:
        return "revoke", f"no paid period on Paystack (status {ps_status!r})"
    return "skip", "in grace period"
