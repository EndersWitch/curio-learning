from http.server import BaseHTTPRequestHandler
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _pdf_generator import generate_paper, generate_memo

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for h,v in [
            ('Access-Control-Allow-Origin','*'),
            ('Access-Control-Allow-Methods','POST,OPTIONS'),
            ('Access-Control-Allow-Headers','Content-Type'),
        ]: self.send_header(h,v)
        self.end_headers()

    def do_POST(self):
        try:
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
