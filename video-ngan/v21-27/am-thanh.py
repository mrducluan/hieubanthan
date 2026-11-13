"""Nhạc nền tự tổng hợp cho video nháp (không dùng mẫu âm thanh có bản quyền).

python3 am-thanh.py ra.wav <giây> <mã video> <mốc chuyển cảnh, cách nhau dấu phẩy>
Nền: hợp âm đệm (pad) mềm, mỗi video một giọng; chuông nhẹ ở mỗi lần chuyển cảnh. Âm lượng thấp để lồng giọng đọc lên trên.
"""
import math, struct, sys, wave, zlib

ra, giay, ma, moc = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4]
SR = 22050
n = int(giay * SR)
goc = [220.0, 196.0, 233.08, 207.65, 185.0, 246.94, 174.61][zlib.crc32(ma.encode()) % 7]
hop_am = [goc * r for r in (1.0, 1.2, 1.5, 2.0, 2.4)]          # nền thứ: 1 · 6/5 · 3/2 · quãng tám
chuong = [float(m) for m in moc.split(",") if m]
mau = []
for i in range(n):
    t = i / SR
    v = 0.0
    for k, f in enumerate(hop_am):
        lfo = 0.55 + 0.45 * math.sin(2 * math.pi * (0.07 + 0.03 * k) * t + k)
        v += math.sin(2 * math.pi * f * t + 0.3 * math.sin(2 * math.pi * 0.2 * t)) * lfo * (0.11 if k < 3 else 0.05)
    for c in chuong:
        d = t - c
        if 0 <= d < 2.2:
            e = math.exp(-d * 3.2)
            v += 0.16 * e * (math.sin(2 * math.pi * goc * 4 * d) + 0.4 * math.sin(2 * math.pi * goc * 6.01 * d))
    vao = min(1.0, t / 1.2)
    ra_ = min(1.0, (giay - t) / 1.5)
    mau.append(max(-1.0, min(1.0, v * 0.55 * vao * ra_)))
with wave.open(ra, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(s * 32000)) for s in mau))
