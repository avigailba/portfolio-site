import sys, http.server, functools
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control','no-store'); super().end_headers()
port=int(sys.argv[1]); d=sys.argv[2]
http.server.ThreadingHTTPServer(('',port),functools.partial(H,directory=d)).serve_forever()
