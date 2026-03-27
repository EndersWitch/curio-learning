from http.server import BaseHTTPRequestHandler
import json, sys, os, base64
sys.path.insert(0, os.path.dirname(__file__))
from _pdf_generator import generate_paper, generate_memo

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Methods','POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers','Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length',0))
            data = json.loads(self.rfile.read(length))

            paper_pdf = generate_paper(data)
            memo_pdf  = generate_memo(data)

            # Return both as JSON with base64-encoded PDFs
            response = {
                'paper': base64.b64encode(paper_pdf).decode('utf-8'),
                'memo':  base64.b64encode(memo_pdf).decode('utf-8') if memo_pdf else None,
            }
            body = json.dumps(response).encode()

            self.send_response(200)
            self.send_header('Content-Type','application/json')
            self.send_header('Access-Control-Allow-Origin','*')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            err = json.dumps({'error': str(e)}).encode()
            self.send_response(500)
            self.send_header('Content-Type','application/json')
            self.send_header('Access-Control-Allow-Origin','*')
            self.end_headers()
            self.wfile.write(err)
