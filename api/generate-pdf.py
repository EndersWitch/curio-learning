from http.server import BaseHTTPRequestHandler
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from _pdf_generator import generate

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
            pdf = generate(data)
            self.send_response(200)
            self.send_header('Content-Type','application/pdf')
            self.send_header('Content-Disposition','attachment; filename="curio-material.pdf"')
            self.send_header('Access-Control-Allow-Origin','*')
            self.send_header('Content-Length',str(len(pdf)))
            self.end_headers()
            self.wfile.write(pdf)
        except Exception as e:
            err = json.dumps({'error':str(e)}).encode()
            self.send_response(500)
            self.send_header('Content-Type','application/json')
            self.send_header('Access-Control-Allow-Origin','*')
            self.end_headers()
            self.wfile.write(err)
