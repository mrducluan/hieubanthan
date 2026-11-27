"""Thu giọng ElevenLabs cho từng cảnh của lô v28–31 (kich-ban.json, trường vo).

python3 giong.py [mã video…]
Giọng Hanh (pGapy9MNHCukzJtjavF0), eleven_v3, stability 0.5, tiếng Việt — giống các lô trước.
Khoá lấy từ biến môi trường ELEVENLABS_API_KEY (không ghi khoá vào file nào trong repo).
Kết quả: giong/<mã>-<cảnh>-<băm>.mp3 + giong/giong.json ({"v28-1": {"tep", "giay", "nghe_lai"}}).
Có tệp đúng mã băm lời đọc rồi thì bỏ qua, chạy lại không tốn ký tự.
Sau mỗi tệp: nghe lại bằng nhận dạng giọng (scribe_v1); nếu thẻ cảm xúc bị đọc thành tiếng Anh thì tạo lại tối đa 3 lần.
"""
import hashlib, json, os, re, subprocess, sys, time, urllib.request

DIR = os.path.dirname(os.path.abspath(__file__))
RA = os.path.join(DIR, "giong")
chon = sys.argv[1:]
GIONG = os.environ.get("ELEVENLABS_VOICE_ID", "pGapy9MNHCukzJtjavF0")
KHOA = os.environ.get("ELEVENLABS_API_KEY")
if not KHOA:
    sys.exit("Chưa có ELEVENLABS_API_KEY trong môi trường.")
os.makedirs(RA, exist_ok=True)
kb = json.load(open(os.path.join(DIR, "kich-ban.json"), encoding="utf-8"))
DS = os.path.join(RA, "giong.json")
bang = json.load(open(DS, encoding="utf-8")) if os.path.exists(DS) else {}
CHO_PHEP = {"hieu", "ban", "hieuban", "than", "nham", "dinh", "tham", "kinh", "doanh"}


def tao(tep, van):
    than = json.dumps({"text": van, "model_id": "eleven_v3", "language_code": "vi",
                       "voice_settings": {"stability": 0.5}}).encode()
    for lan in range(3):
        try:
            rq = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{GIONG}?output_format=mp3_44100_128",
                                        data=than, headers={"xi-api-key": KHOA, "Content-Type": "application/json"})
            with urllib.request.urlopen(rq, timeout=120) as r:
                open(tep, "wb").write(r.read())
            return
        except Exception as e:
            print("lỗi tạo giọng", e); time.sleep(3 * (lan + 1))
    sys.exit(1)


def nghe(tep):
    out = subprocess.run(["curl", "-sS", "-m", "90", "-H", f"xi-api-key: {KHOA}", "--form-string", "model_id=scribe_v1",
                          "--form-string", "language_code=vi", "-F", f"file=@{tep}", "https://api.elevenlabs.io/v1/speech-to-text"],
                         capture_output=True, text=True).stdout
    try:
        return json.loads(out).get("text") or ""
    except ValueError:
        return ""


def la(chu, van):
    ky = set(re.findall(r"\w+", re.sub(r"\[[^\]]*\]", " ", van).lower()))
    return [w for w in re.findall(r"\w+", chu) if w.isascii() and w.isalpha() and len(w) >= 4
            and w.lower() not in ky and w.lower() not in CHO_PHEP]


for v in kb["video"]:
    if chon and v["ma"] not in chon:
        continue
    for i, sc in enumerate(v["canh"], 1):
        bam = hashlib.sha1((GIONG + sc["vo"]).encode()).hexdigest()[:10]
        ten = f"{v['ma']}-{i}-{bam}.mp3"; tep = os.path.join(RA, ten)
        cu = bang.get(f"{v['ma']}-{i}")
        if cu and cu["tep"] == ten and os.path.exists(tep):
            print(v["ma"], i, cu["giay"], "(có sẵn)"); continue
        if not os.path.exists(tep):
            tao(tep, sc["vo"])
        chu = nghe(tep); loi = la(chu, sc["vo"]); lan = 0
        while loi and lan < 3:
            print("  đọc lộ chữ lạ", loi, "→ tạo lại"); os.remove(tep); lan += 1
            van = sc["vo"] if lan < 2 else re.sub(r"\[[a-z ]+\]\s*", "", sc["vo"])
            tao(tep, van); chu = nghe(tep); loi = la(chu, sc["vo"])
        if loi:
            print("  VẪN LỖI", v["ma"], i, loi)
        dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", tep]).decode())
        bang[f"{v['ma']}-{i}"] = {"tep": ten, "giay": round(dur, 2), "nghe_lai": chu}
        print(v["ma"], i, round(dur, 2))
        json.dump(bang, open(DS, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(bang, open(DS, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
