# SMTP tối giản cho e2e-that: nhận thư GoTrue gửi (mã OTP), ghi ra $SB_THU_MAIL/<email>.eml (thư mới đè thư cũ).
import socketserver, re, os
D = os.environ.get("SB_THU_MAIL", "/tmp/sb-thu/mail")
class H(socketserver.StreamRequestHandler):
    def w(self, s): self.wfile.write((s + "\r\n").encode())
    def handle(self):
        self.w("220 sink"); rcpt = []; 
        while True:
            line = self.rfile.readline()
            if not line: return
            cmd = line.decode(errors="ignore").strip(); up = cmd.upper()
            if up.startswith(("EHLO", "HELO")): self.w("250-sink"); self.w("250 AUTH PLAIN LOGIN")
            elif up.startswith("AUTH"): self.w("235 ok")
            elif up.startswith("MAIL"): rcpt = []; self.w("250 ok")
            elif up.startswith("RCPT"): rcpt.append(re.search(r"<(.*)>", cmd).group(1)); self.w("250 ok")
            elif up == "DATA":
                self.w("354 go"); buf = []
                while True:
                    l = self.rfile.readline()
                    if l in (b".\r\n", b".\n", b""): break
                    buf.append(l.decode(errors="ignore"))
                for r in rcpt: open(os.path.join(D, r.lower() + ".eml"), "w").write("".join(buf))
                self.w("250 queued")
            elif up == "QUIT": self.w("221 bye"); return
            else: self.w("250 ok")
socketserver.ThreadingTCPServer.allow_reuse_address = True
socketserver.ThreadingTCPServer(("127.0.0.1", 2525), H).serve_forever()
