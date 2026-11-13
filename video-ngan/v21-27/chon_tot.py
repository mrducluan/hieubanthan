"""Chọn bản giọng nghe rõ nhất cho từng cảnh.

python3 chon_tot.py <thư mục giọng> [ngưỡng=0.93]
Đọc giong.json (do giong.py ghi), chấm mỗi cảnh = độ khớp âm tiết giữa lời kịch bản và bản nghe lại (nhận dạng giọng).
Cảnh dưới ngưỡng: tạo thêm tối đa 2 bản, giữ bản khớp cao nhất, ghi lại giong.json.
"""
import difflib, json, os, re, subprocess, sys, unicodedata, urllib.request

DIR = os.path.dirname(os.path.abspath(__file__))
thu_muc = sys.argv[1]; NGUONG = float(sys.argv[2]) if len(sys.argv) > 2 else 0.93
GIONG = os.environ.get("ELEVENLABS_VOICE_ID", "pGapy9MNHCukzJtjavF0")
KHOA = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")
kb = json.load(open(os.path.join(DIR, "kich-ban.json"), encoding="utf-8"))
bang = json.load(open(os.path.join(thu_muc, "giong.json"), encoding="utf-8"))


def am_tiet(s):
    s = re.sub(r"\[[^\]]*\]", " ", s)
    s = unicodedata.normalize("NFC", s.lower()).replace("hóa", "hoá").replace("thủy", "thuỷ")
    return [w for w in re.findall(r"\w+", s) if not any(c.isdigit() for c in w)]


def diem(van, nghe):
    a, b = am_tiet(van), am_tiet(nghe)
    return difflib.SequenceMatcher(None, a, b).ratio() if a and b else 0.0


def nghe_lai(tep):
    out = subprocess.run(["curl", "-sS", "-m", "90", "-H", f"xi-api-key: {KHOA}", "-F", "model_id=scribe_v1", "-F", "language_code=vi",
                          "-F", f"file=@{tep}", "https://api.elevenlabs.io/v1/speech-to-text"], capture_output=True, text=True).stdout
    return (json.loads(out).get("text") or "") if out.strip().startswith("{") else ""


def tao(tep, van):
    than = json.dumps({"text": van, "model_id": "eleven_v3", "language_code": "vi", "voice_settings": {"stability": 0.5}}).encode()
    rq = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{GIONG}?output_format=mp3_44100_128",
                                data=than, headers={"xi-api-key": KHOA, "Content-Type": "application/json"})
    with urllib.request.urlopen(rq, timeout=120) as r: open(tep, "wb").write(r.read())


for v in kb["video"]:
    for i, sc in enumerate(v["canh"], 1):
        k = f"{v['ma']}-{i}"; g = bang[k]
        tot = (diem(sc["vo"], g["nghe_lai"]), g["tep"], g["nghe_lai"])
        if g.get("khop", 0) >= NGUONG: print(k, g["khop"], "(đạt)"); continue
        if tot[0] < NGUONG:
            for lan in (1, 2):
                tep = re.sub(r"(-b\d)?\.mp3$", f"-b{lan}.mp3", g["tep"])
                if tep == tot[1]: continue
                if not os.path.exists(tep): tao(tep, sc["vo"])
                n = nghe_lai(tep)
                d = diem(sc["vo"], n)
                if d > tot[0]: tot = (d, tep, n)
                if d >= 0.98: break
            dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", tot[1]]).decode())
            bang[k] = {"tep": tot[1], "giay": round(dur, 2), "nghe_lai": tot[2]}
        bang[k]["khop"] = round(tot[0], 3)
        print(k, bang[k]["khop"], "|", bang[k]["nghe_lai"][:110])
json.dump(bang, open(os.path.join(thu_muc, "giong.json"), "w"), ensure_ascii=False, indent=1)
