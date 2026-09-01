from http.server import BaseHTTPRequestHandler
import json, os, re, urllib.request, urllib.error

TO_EMAIL = 'hello@curiolearning.co.za'
FROM_EMAIL = 'Curio Learning <hello@curiolearning.co.za>'  # domain must be verified in Resend
EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def _escape(s):
    return (s or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        try:
            body = json.loads(self.rfile.read(length) or b'{}')
        except json.JSONDecodeError:
            return self._json(400, {'ok': False, 'error': 'Invalid request.'})

        name = (body.get('name') or '').strip()
        email = (body.get('email') or '').strip()
        phone = (body.get('phone') or '').strip()
        message = (body.get('message') or '').strip()

        if not name or not email or not message or not EMAIL_RE.match(email):
            return self._json(400, {'ok': False, 'error': 'Please fill in your name, a valid email, and a message.'})

        api_key = os.environ.get('RESEND_API_KEY', '')
        if not api_key:
            print('contact.py: RESEND_API_KEY is not set')
            return self._json(500, {'ok': False, 'error': "Email sending isn't configured yet — please email hello@curiolearning.co.za directly."})

        html = (
            f"<p><strong>Name:</strong> {_escape(name)}</p>"
            f"<p><strong>Email:</strong> {_escape(email)}</p>"
            f"<p><strong>Phone:</strong> {_escape(phone) or '&mdash;'}</p>"
            f"<p><strong>Message:</strong></p><p>{_escape(message).replace(chr(10), '<br>')}</p>"
        )
        payload = json.dumps({
            'from': FROM_EMAIL,
            'to': [TO_EMAIL],
            'reply_to': email,
            'subject': f'New contact form message from {name}',
            'html': html,
        }).encode()

        req = urllib.request.Request(
            'https://api.resend.com/emails',
            data=payload,
            method='POST',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
        )
        try:
            urllib.request.urlopen(req, timeout=10)
        except urllib.error.HTTPError as e:
            print('contact.py: Resend error', e.code, e.read().decode(errors='ignore'))
            return self._json(502, {'ok': False, 'error': 'Could not send your message right now. Please try again shortly.'})
        except Exception as e:
            print('contact.py: send failed', repr(e))
            return self._json(502, {'ok': False, 'error': 'Could not send your message right now. Please try again shortly.'})

        return self._json(200, {'ok': True})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def _json(self, status, obj):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def log_message(self, *a): pass
