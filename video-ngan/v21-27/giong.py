"""Tạo giọng đọc ElevenLabs cho từng cảnh trong kich-ban.json.

python3 giong.py <thư mục ra> [mã video…]
Giọng chốt từ lô trước: Hanh (pGapy9MNHCukzJtjavF0), mô hình eleven_v3, stability 0.5; lời có thẻ cảm xúc [warmly]…
Khoá đọc từ ELEVENLABS_API_KEY (trong phiên cloud, proxy tự gắn khoá: đặt ELEVENLABS_API_KEY=proxy-injected).
Có tệp rồi thì bỏ qua (theo mã băm lời đọc) → chạy lại không tốn ký tự.
"""
import hashlib, json, os, re, subprocess, sys, time, urllib.request

DIR = os.path.dirname(os.path.abspath(__file__))
ra = sys.argv[1]; chon = sys.argv[2:]
GIONG = os.environ.get("ELEVENLABS_VOICE_ID", "pGapy9MNHCukzJtjavF0")
KHOA = os.environ.get("ELEVENLABS_API_KEY", "proxy-injected")
os.makedirs(ra, exist_ok=True)
kb = json.load(open(os.path.join(DIR, "kich-ban.json"), encoding="utf-8"))
DS = os.path.join(ra, "giong.json")
bang = json.load(open(DS, encoding="utf-8")) if os.path.exists(DS) else {}   # gộp, không ghi đè video không chạy
CHO_PHEP = {"comment", "offer", "tarot", "com", "hieu", "ban", "hieuban", "thanso", "online", "tag", "nha", "than", "dich", "kinh", "thuy", "phong", "tuong", "nhan"}


def tao(tep, van):
    than = json.dumps({"text": van, "model_id": "eleven_v3", "language_code": "vi",
                       "voice_settings": {"stability": 0.5}}).encode()
    for lan in range(3):
        try:
            rq = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{GIONG}?output_format=mp3_44100_128",
                                        data=than, headers={"xi-api-key": KHOA, "Content-Type": "application/json"})
            with urllib.request.urlopen(rq, timeout=120) as r: open(tep, "wb").write(r.read())
            return
        except Exception as e:
            print("lỗi tạo giọng", e); time.sleep(3 * (lan + 1))
    sys.exit(1)


def kiem(tep, van):
    """Trả về các chữ Latin không dấu dài ≥ 4 có trong bản nghe lại nhưng không có trong lời (vd 'curious')."""
    out = subprocess.run(["curl", "-sS", "-m", "90", "-H", f"xi-api-key: {KHOA}", "-F", "model_id=scribe_v1", "-F", "language_code=vi",
                          "-F", f"file=@{tep}", "https://api.elevenlabs.io/v1/speech-to-text"], capture_output=True, text=True).stdout
    try: chu = json.loads(out).get("text") or ""
    except ValueError: return []
    ky = set(re.findall(r"\w+", re.sub(r"\[[^\]]*\]", " ", van).lower()))
    la = [w for w in re.findall(r"\w+", chu) if w.isascii() and w.isalpha() and len(w) >= 4
          and w.lower() not in ky and w.lower() not in CHO_PHEP]
    NGHE[tep] = chu
    return la


NGHE = {}
for v in kb["video"]:
    if chon and v["ma"] not in chon: continue
    for i, sc in enumerate(v["canh"], 1):
        bam = hashlib.sha1((GIONG + sc["vo"]).encode()).hexdigest()[:10]
        tep = os.path.join(ra, f"{v['ma']}-{i}-{bam}.mp3")
        cu = bang.get(f"{v['ma']}-{i}")
        if cu and cu["tep"].startswith(tep[:-4]) and os.path.exists(cu["tep"]):   # đã có (kể cả bản tốt nhất chon_tot chọn)
            print(v["ma"], i, cu["giay"], "(có sẵn)"); continue
        if not os.path.exists(tep): tao(tep, sc["vo"])
        # QC: nghe lại bằng nhận dạng giọng; chữ Latin lạ (thẻ cảm xúc bị đọc thành tiếng) → tạo lại
        loi = kiem(tep, sc["vo"])
        lan = 0
        while loi and lan < 3:
            print("  đọc lộ chữ lạ", loi, "→ tạo lại"); os.remove(tep); lan += 1
            van = sc["vo"] if lan < 2 else re.sub(r"^\s*\[[a-z ]+\]\s*", "", sc["vo"])
            tao(tep, van); loi = kiem(tep, sc["vo"])
        if loi: print("  VẪN LỖI", v["ma"], i, loi)
        dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", tep]).decode())
        bang[f"{v['ma']}-{i}"] = {"tep": tep, "giay": round(dur, 2), "nghe_lai": NGHE.get(tep, "")}
        print(v["ma"], i, round(dur, 2))
json.dump(bang, open(DS, "w"), ensure_ascii=False, indent=1)
