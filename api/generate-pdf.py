from http.server import BaseHTTPRequestHandler
import json, sys, os, urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(__file__))
from _pdf_generator import generate_paper, generate_memo

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://inmrsgujgfktapjnekjs.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU")

def _is_admin(auth_header):
    """Verify the caller's bearer token belongs to a signed-in admin account.
    Stdlib-only (no supabase-py dependency), mirroring generate_paper_ai.py's
    Supabase REST helpers."""
    if not auth_header or not auth_header.startswith('Bearer '):
        return False
    token = auth_header[len('Bearer '):]
    headers = {'apikey': SUPABASE_ANON_KEY, 'Authorization': f'Bearer {token}'}
    try:
        req = urllib.request.Request(f'{SUPABASE_URL}/auth/v1/user', headers=headers)
        with urllib.request.urlopen(req, timeout=8) as resp:
            user = json.loads(resp.read())
        user_id = user.get('id')
        if not user_id:
            return False
        req2 = urllib.request.Request(
            f'{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=is_admin',
            headers=headers,
        )
        with urllib.request.urlopen(req2, timeout=8) as resp2:
            rows = json.loads(resp2.read())
        return bool(rows) and bool(rows[0].get('is_admin'))
    except Exception:
        return False

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for h,v in [
            ('Access-Control-Allow-Origin','*'),
            ('Access-Control-Allow-Methods','POST,OPTIONS'),
            ('Access-Control-Allow-Headers','Content-Type,Authorization'),
        ]: self.send_header(h,v)
        self.end_headers()

    def do_POST(self):
        try:
            if not _is_admin(self.headers.get('Authorization')):
                err = json.dumps({'error': 'Not authorized'}).encode()
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err)
                return

            length = int(self.headers.get('Content-Length', 0))
            raw    = self.rfile.read(length)
            data   = json.loads(raw)

            # Which PDF to generate — determined by ?type=paper or ?type=memo
            from urllib.parse import urlparse, parse_qs
            qs   = parse_qs(urlparse(self.path).query)
            kind = qs.get('type', ['paper'])[0]

            if kind == 'memo':
                pdf   = generate_memo(data)
                fname = 'curio-memo.pdf'
            else:
                pdf   = generate_paper(data)
                fname = 'curio-paper.pdf'

            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'attachment; filename="{fname}"')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', str(len(pdf)))
            self.end_headers()
            self.wfile.write(pdf)

        except Exception as e:
            err = json.dumps({'error': str(e)}).encode()
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(err)
