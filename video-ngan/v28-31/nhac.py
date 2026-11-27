"""Nhạc nền SÔI ĐỘNG tự tổng hợp (không mẫu âm thanh có bản quyền, chỉ thư viện chuẩn).

python3 nhac.py ra.wav <giây> <mã video> <mốc cảnh,…> [đoạn có giọng "a-b;a-b"]
Trống 4/4 118 nhịp/phút, vỗ tay phách 2–4, hi-hat, bass, giai điệu rải hợp âm, đệm; rít lên trước mỗi lần chuyển cảnh.
Khi có giọng đọc thì nhạc tự nhỏ xuống (ducking), nghỉ giọng thì dâng lên.
"""
import array, math, random, sys, wave, zlib

ra, giay, ma, moc = sys.argv[1], float(sys.argv[2]), sys.argv[3], sys.argv[4]
giong = [tuple(map(float, d.split("-"))) for d in sys.argv[5].split(";") if d] if len(sys.argv) > 5 else []
SR, BPM = 44100, 118
PHACH = 60 / BPM
N = int(giay * SR)
rnd = random.Random(zlib.crc32(ma.encode()))
trong = array.array("f", bytes(4 * N))     # trống, không bị ép khi chuyển cảnh
nhac = array.array("f", bytes(4 * N))      # bass, giai điệu, đệm
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def dat(dich, mau, t, g=1.0):
    i = int(t * SR)
    if i >= N or i < 0:
        return
    for j in range(min(len(mau), N - i)):
        dich[i + j] += mau[j] * g


def tao(dai, f):
    return [f(k / SR) for k in range(int(dai * SR))]


def kick():
    pha = 0.0
    ra_ = []
    for k in range(int(0.28 * SR)):
        t = k / SR
        pha += 2 * math.pi * (48 + 110 * math.exp(-t * 28)) / SR
        ra_.append(math.sin(pha) * math.exp(-t * 11))
    return ra_


def on(dai, tat, loc):          # tiếng ồn lọc thông cao đơn giản
    cu = 0.0
    ra_ = []
    for k in range(int(dai * SR)):
        x = rnd.uniform(-1, 1)
        ra_.append((x - loc * cu) * math.exp(-(k / SR) * tat))
        cu = x
    return ra_


KICK, CLAP, HAT, HAT_MO = kick(), on(0.16, 26, 0.55), on(0.05, 90, 0.97), on(0.14, 28, 0.97)
kho = {}


def not_(loai, m, dai):
    k = (loai, m, round(dai, 3))
    if k in kho:
        return kho[k]
    f = hz(m)
    w = 2 * math.pi * f
    if loai == "bass":
        s = tao(dai, lambda t: (math.sin(w * t) + 0.35 * math.sin(2 * w * t) + 0.12 * math.sin(3 * w * t)) * min(1, t * 200) * math.exp(-t * 6))
    elif loai == "pluck":
        s = tao(dai, lambda t: (math.sin(w * t) + 0.5 * math.sin(2 * w * t) * math.exp(-t * 12) + 0.25 * math.sin(4 * w * t) * math.exp(-t * 20)) * min(1, t * 400) * math.exp(-t * 9))
    else:                       # đệm
        s = tao(dai, lambda t: (math.sin(w * t) + math.sin(w * 1.004 * t) + 0.3 * math.sin(2 * w * t)) * min(1, t * 6) * min(1, (dai - t) * 6) / 2.3)
    kho[k] = s
    return s


# vòng hợp âm I – V – vi – IV, mỗi video một giọng
goc = [57, 55, 58, 60, 53][zlib.crc32(ma.encode()) % 5]
VONG = [(0, [0, 4, 7]), (7, [0, 4, 7]), (9, [0, 3, 7]), (5, [0, 4, 7])]
RAI = [0, 1, 2, 3, 2, 1, 2, 3]
O = 4 * PHACH
so_o = int(giay / O) + 1
for o in range(so_o):
    t0 = o * O
    lech, quang = VONG[o % 4]
    am = [goc + lech + q for q in quang]
    for q in am:
        dat(nhac, not_("dem", q, O), t0, 0.07)
    for p in range(4):
        t = t0 + p * PHACH
        dat(trong, KICK, t, 0.80)
        if p in (1, 3):
            dat(trong, CLAP, t, 0.34)
            dat(trong, CLAP, t + 0.012, 0.22)
        dat(trong, HAT, t, 0.10)
        dat(trong, HAT_MO, t + PHACH / 2, 0.15)
        dat(trong, HAT, t + PHACH * 0.75, 0.07)
        for nua in (0, 1):
            dat(nhac, not_("bass", goc + lech - 24 + (12 if nua else 0), PHACH / 2), t + nua * PHACH / 2, 0.30 if nua == 0 else 0.18)
    day = am + [am[0] + 12]
    cao = 12 if (o // 4) % 2 else 0                      # mỗi 4 ô lên một quãng tám cho đỡ lặp
    for s in range(16):
        if s % 8 in (3, 6) and o % 2 == 0:
            continue
        dat(nhac, not_("pluck", day[RAI[s % 8]] + 12 + cao, PHACH / 4 * 1.8), t0 + s * PHACH / 4, 0.16 if s % 4 == 0 else 0.10)

# chuyển cảnh: tiếng rít dâng lên rồi cú đập
for c in [float(x) for x in moc.split(",") if x][1:]:
    dai = 0.55
    cu = 0.0
    rit = []
    for k in range(int(dai * SR)):
        x = rnd.uniform(-1, 1)
        p = k / (dai * SR)
        rit.append((x - (0.2 + 0.75 * p) * cu) * p * p)
        cu = x
    dat(trong, rit, c - dai, 0.20)
    dat(trong, on(0.7, 5.5, 0.9), c, 0.18)

# trộn, nhỏ xuống khi có giọng
NEN, CAO = 0.50, 1.0
he = [CAO] * (int(giay * 100) + 2)
for a, b in giong:
    for i in range(max(0, int((a - 0.12) * 100)), min(len(he), int((b + 0.1) * 100))):
        he[i] = NEN
g = CAO
min_ = max_ = 0.0
tron = array.array("f", bytes(4 * N))
for i in range(N):
    dich = he[i * 100 // SR]
    g += (dich - g) * (0.0009 if dich < g else 0.00018)    # xuống nhanh, lên từ từ
    t = i / SR
    mo = min(1.0, t / 0.15) * min(1.0, max(0.0, (giay - t) / 1.6))
    tron[i] = math.tanh((trong[i] + nhac[i]) * 0.9) * g * mo
dinh = max(abs(x) for x in tron) or 1.0
with wave.open(ra, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(array.array("h", (int(x / dinh * 29000) for x in tron)).tobytes())
