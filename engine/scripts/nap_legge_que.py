# -*- coding: utf-8 -*-
"""TK-2 việc 4 — cắt lời kinh 64 quẻ (quái từ + 6 hào, Dụng Cửu / Dụng Lục) từ bản dịch Anh của James Legge.

Vào : `fixtures/nguon/kinhdich_legge_1899.json` (lớp chữ nhận dạng tự động, chưa hiệu đính; chương «TEXT» nằm lẫn chú
      thích cuối trang, đầu trang chạy, tên phiên âm bị đọc sai).
Ra  : `fixtures/nguon/kinhdich_legge_que.json` — mỗi quẻ {so, ten_legge, que_tu, hao[6], dung?, vach, can_soat, ly_do, vi_tri}
      `app/kb/data/kinhdich_legge.json`       — CHỈ các quẻ không gắn `can_soat` (bản hiển thị cho /en).

Dùng:  python scripts/nap_legge_que.py          (ghi hai tệp, in thống kê)

Nguyên tắc: KHÔNG viết lại chữ của Legge, không gõ bù chữ thiếu. Chỉ: bỏ số thứ tự đầu đoạn ("1.", "2,"…), nối đoạn bị
ngắt qua trang (gạch nối cuối trang nối liền), gom khoảng trắng, bỏ khoảng trắng trước dấu ; : ? ! , . và hai câu dẫn
«Explanation of the entire figure / separate lines …» (Legge chỉ in ở quẻ 1). Quẻ được nhận theo THỨ TỰ King Wen
(dãy hào 1→6 thứ n trong sách), không theo tên phiên âm.

Cách nhận (đoạn = một phần tử của `doan`):
- hào k  : đoạn mở bằng số thứ tự, trong ~70 ký tự đầu có từ chỉ vị trí (first … sixth / topmost) rồi "divided" / "undivided";
- đầu trang chạy (HDR) và tiêu đề quẻ (HEAD, kết thúc bằng «…GRAM»);
- quái từ: đoạn đầu tiên sau tiêu đề quẻ, trước hào 1;
- nối trang: chữ chính của một trang luôn đứng TRƯỚC chú thích của trang đó → đoạn nằm giữa đầu trang chạy và một hào /
  tiêu đề quẻ là chữ chính nối tiếp; riêng hào trên cùng: lấy tới chỗ chú thích bắt đầu (đoạn mở bằng số La Mã).

Gắn `can_soat` (loại khỏi bản hiển thị) khi: thiếu hào; chữ "divided / undivided" của hào không khớp vạch âm dương của
quẻ trong bảng King Wen của engine (hoặc bị đọc hỏng); lời không kết thúc bằng dấu hết câu; có từ bị đọc hỏng (chữ lẫn số,
ký hiệu lạ, chữ hoa giữa từ, từ chỉ xuất hiện đúng một lần trong cả cuốn sách); độ dài lệch hẳn so với nguyên văn Hán;
tên quẻ ở đầu quái từ không dựng lại được từ đầu trang chạy.
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(GOC))
NGUON = GOC / "fixtures" / "nguon"
VAO = NGUON / "kinhdich_legge_1899.json"
RA = NGUON / "kinhdich_legge_que.json"
RA_KB = GOC / "app" / "kb" / "data" / "kinhdich_legge.json"
NGUOI_DICH = "James Legge (1882)"

_ORD = r"(first|second|secend|third|fourth|fifth|sixth|topmost|lowest|last|highest)"
_RX_HAO = re.compile(r"^(\S{1,2})[.,:;]?\s+.{0,40}?\b" + _ORD + r"\b.{0,30}?\b(\w*divided)\b")
_VI_TRI = {"first": 1, "lowest": 1, "second": 2, "secend": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6,
           "topmost": 6, "last": 6, "highest": 6}
_KHONG_LA_SO = re.compile(r"^(The|In|To|Of|On|At|If|It|We|He|As|By|No|So)$")
_RX_DUNG = re.compile(r"^7\. \(The lines of this hexagram are all")
_RX_LA_MA = re.compile(r"^[IVXLl1]{1,8}[.,] +[A-Z‘“(]")
_HET_CAU = re.compile(r"[.!?][’”'\")]*$")
_DAN = re.compile(r"Explanation of the (entire figure|separate lines) by [^.]*\.\s*")
_DONG_TU = (r"indicates|intimates|suggests|shows|represents|denotes|implies|signifies|has|means|there|will|"
            r"\(|,|;|—|is\b|should|\(or")


def chuan(s: str) -> str:
    """Chuẩn hoá để so chuỗi con với nguồn: bỏ mọi khoảng trắng."""
    return re.sub(r"\s+", "", s)


def loai(p: str) -> str:
    m = _RX_HAO.match(p)
    if m and not _KHONG_LA_SO.match(m.group(1)):
        return f"L{_VI_TRI[m.group(2)]}"
    if _RX_DUNG.match(p):
        return "L7"
    if len(p) < 48 and re.search(r"KING\W+TEXT|^\w{1,4} +THE +Y\S{0,2} +KING", p):
        return "HDR"
    if len(p) < 64 and re.match(r"^S\w{2,5}\W", p) and re.search(r"HEXAGRAM\W* *\S{0,12}( .{0,8})?$", p):
        return "HDR"
    if len(p) < 52 and re.match(r"^\S{1,10}[.,]? ", p) and re.search(r"(h\s?e\s?x\w*|[gc]ra\w*)\W*\w?\W*$", p, re.I):
        return "HEAD"
    if len(re.findall(r"[a-z]{3,}", p)) < 2:
        return "RAC"
    return "P"


def _sach(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return re.sub(r" +([;:?!,.])", r"\1", s)


def _noi(a: str, b: str) -> str:
    return a[:-1] + b if a.endswith("-") and not a.endswith(" -") else a + " " + b


def _ket_cau(s: str) -> bool:
    return bool(_HET_CAU.search(s.rstrip(" ,;")))


def _noi_tiep(P: list[str], T: list[str], i: int, van: str, tren_cung: bool) -> tuple[str, list[int], list[str]]:
    """Nối phần tiếp của đoạn `i` (đã bỏ số thứ tự thành `van`). Trả (lời, chỉ số đoạn đã dùng, cờ nghi ngờ).

    - Đoạn chưa hết câu mà đoạn kế (cùng trang) mở bằng chữ thường → nối (chữ nhận dạng ngắt dòng); nhưng nếu trang
      trước kết thúc bằng một chú thích dở câu thì đoạn chữ thường ấy có thể là phần tiếp của chú thích → cờ nghi ngờ.
    - Còn dở câu → sang đầu trang sau (sau đầu trang chạy) lấy đoạn đầu tiên.
    - Đã trọn câu nhưng ngay sau là đầu trang chạy → đoạn đầu trang sau là chữ chính nếu sau nó là hào / tiêu đề quẻ, hoặc
      (hào trên cùng) chú thích bắt đầu ngay sau nó."""
    dung, nghi = [i], []
    xong = _ket_cau(van)

    def ke(k: int) -> int:
        while k < len(P) and T[k] == "RAC":
            k += 1
        return k

    for _ in range(4):
        k = ke(dung[-1] + 1)
        if k >= len(P):
            break
        if not xong and T[k] == "P" and (P[k][:1].islower() or P[k][:1] in "(‘"):
            # Chữ chính của trang đứng trước chú thích; nếu trang trước kết thúc bằng một chú thích dở câu thì chú thích
            # của trang này mở bằng phần tiếp của nó (chữ thường) → đoạn chữ thường ngay sau chữ chính là chú thích,
            # phần tiếp của chữ chính ở đầu trang sau. Ngược lại → đây là chữ chính bị ngắt dòng, nối ngay.
            h = max((j for j in range(dung[0]) if T[j] == "HDR"), default=None)
            cn_do = False
            if h is not None:
                t = h - 1
                while t > 0 and T[t] == "RAC":
                    t -= 1
                cn_do = T[t] == "P" and not _ket_cau(P[t])
            if not cn_do:
                van, xong = _noi(van, P[k]), _ket_cau(P[k])
                dung.append(k)
                continue
            # trang sau mở bằng chữ hoa → không chắc đoạn nào là phần tiếp → cờ
            j = k
            while j < len(P) and T[j] not in ("HDR", "HEAD") and T[j][0] != "L":
                j += 1
            b = ke(j + 1) if j < len(P) and T[j] == "HDR" else None
            if b is None or b >= len(P) or not (P[b][:1].islower() or P[b][:1] in "(‘"):
                nghi.append("noi_dong_mo_ho")
        # tìm đầu trang chạy kế (không vượt hào / tiêu đề quẻ)
        j = k
        while j < len(P) and T[j] != "HDR":
            if T[j][0] == "L" or T[j] == "HEAD":
                return van, dung, nghi
            j += 1
        if j >= len(P):
            break
        if xong and j != k:
            break                   # trọn câu, sau nó còn chữ cùng trang → hết
        k = ke(j + 1)
        if k >= len(P) or T[k] != "P":
            break
        k2 = ke(k + 1)
        sau = T[k2] if k2 < len(P) else "het"
        if not xong:
            van, xong = _noi(van, P[k]), _ket_cau(P[k])
            dung.append(k)
            continue
        if P[k][:1].islower():
            break
        if sau[0] == "L" or sau == "HEAD" or (tren_cung and _RX_LA_MA.match(P[k2] if k2 < len(P) else "")):
            van = _noi(van, P[k])
            dung.append(k)
            xong = _ket_cau(P[k])
            continue
        break
    return van, dung, nghi


def _bo_so(p: str) -> str:
    return re.sub(r"^\S{1,2}[.,:;]?\s+", "", p, count=1)


def cat(chuong: list[dict]) -> list[dict]:
    """Cắt 64 quẻ từ chương «Chapter III» (phần TEXT). Mỗi quẻ: lời nguyên dạng + vị trí đoạn nguồn."""
    ci = next(i for i, c in enumerate(chuong) if any(_RX_DUNG.match(p) for p in c["doan"]))
    P = chuong[ci]["doan"]
    T = [loai(p) for p in P]
    dau = next(i for i, t in enumerate(T) if t == "L1")
    dau = max(i for i in range(dau) if T[i] == "HEAD")
    nhom, cur = [], []
    for i in range(dau, len(P)):
        if T[i][0] != "L":
            continue
        if T[i] == "L1" and cur:
            nhom.append(cur)
            cur = []
        cur.append(i)
    nhom.append(cur)
    ra, cuoi = [], dau - 1
    for n, ds in enumerate(nhom, 1):
        q: dict = {"so": n, "hao": [], "vach": [], "vi_tri": {"chuong": ci, "hao": []}, "_loi": []}
        # ---- tiêu đề + quái từ
        l1 = ds[0]
        heads = [i for i in range(cuoi + 1, l1) if T[i] == "HEAD"]
        q["_tieu_de"] = P[heads[-1]] if heads else ""
        if heads:
            k = heads[-1] + 1
            while k < l1 and T[k] in ("RAC", "HDR"):
                k += 1
            if k < l1:
                van = _DAN.sub("", P[k])
                van, dung, nghi = _noi_tiep(P, T, k, van, False)
                van = _DAN.sub("", van)
                q["que_tu"], q["vi_tri"]["que_tu"] = _sach(van), dung
                q["_loi"] += [f"que_tu:{x}" for x in nghi]
        if "que_tu" not in q:
            q["que_tu"] = ""
            q["_loi"].append("khong_thay_quai_tu")
        # ---- hào
        for i in ds:
            m = _RX_HAO.match(P[i])
            if T[i] == "L7":
                van, dung, nghi = _noi_tiep(P, T, i, _bo_so(P[i]), True)
                q["dung"], q["vi_tri"]["dung"] = _sach(van), dung
                q["_loi"] += [f"dung:{x}" for x in nghi]
                cuoi = max(dung)
                continue
            van, dung, nghi = _noi_tiep(P, T, i, _bo_so(P[i]), _VI_TRI[m.group(2)] == 6)
            q["_loi"] += [f"hao_{len(q['hao']) + 1}:{x}" for x in nghi]
            q["hao"].append(_sach(van))
            q["vach"].append({"divided": 0, "undivided": 1}.get(m.group(3)))
            q["_thu_tu"] = q.get("_thu_tu", []) + [_VI_TRI[m.group(2)]]
            q["vi_tri"]["hao"].append(dung)
            cuoi = max(dung)
        # ---- tên theo đầu trang chạy (sạch hơn tiêu đề quẻ): các trang từ tiêu đề quẻ tới hào cuối
        ten = Counter()
        for i in range((heads[-1] - 3) if heads else l1 - 6, cuoi + 1):
            m = re.search(r"THE +(.+?) +HEXAGRAM", P[i]) if T[i] == "HDR" else None
            if m and re.fullmatch(r"[A-Z]+( [A-Z]+)?", m.group(1)):
                ten[m.group(1).title()] += 1
        q["_ten_ung"] = ten
        ra.append(q)
    return ra


def vach_king_wen() -> dict[int, list[int]]:
    """Vạch âm (0) dương (1) từ hào 1 lên hào 6 của 64 quẻ — bảng King Wen của engine."""
    from app.calc import kinhdich_vendor as v
    return {so: list(v.TRI_BITS[ha]) + list(v.TRI_BITS[thuong]) for ha, hang in v.KW.items() for thuong, so in hang.items()}


def _bien_hinh(w: str) -> set[str]:
    goc = set()
    for duoi in ("s", "es", "ed", "d", "ing", "ly", "er", "est", "ness", "ful", "less", "ment", "ion", "ions", "ings", "ers", "'s"):
        if w.endswith(duoi) and len(w) - len(duoi) >= 3:
            g = w[: -len(duoi)]
            goc |= {g, g + "e"}
            if len(g) > 3 and g[-1] == g[-2]:
                goc.add(g[:-1])
            if g.endswith("i"):
                goc.add(g[:-1] + "y")
    return goc


def _biet(w: str, dem: Counter) -> bool:
    return dem[w] >= 1 or any(dem[g] >= 1 for g in _bien_hinh(w)) or any(dem[w + d] >= 1 for d in ("s", "d", "ed", "ing", "ly", "es", "r", "rs"))


def _tu_la(van: str, dem: Counter, ocr: Counter | None = None) -> list[str]:
    """Từ có vẻ bị đọc hỏng. `dem` = kho từ SẠCH (bản Anh của KB do ban biên tập viết + Waite 1910 bản Gutenberg đã
    soát) — lỗi nhận dạng lặp đều trong cùng cuốn sách (vd «toa», «Tt») không được tính là từ biết. `ocr` = đếm từ
    trên các sách cũ (lớp chữ nhận dạng): từ ≥ 4 chữ gặp ≥ 3 lần, có nguyên âm, không phải hai từ sạch dính nhau
    («toa» = to + a); hoặc tên riêng viết hoa (Ho, Shang, Kau…) gặp ≥ 3 lần.
    Bị coi là hỏng: ký hiệu lạ, chữ lẫn số, chữ hoa giữa từ / cả từ viết hoa; từ thường không có trong kho sạch."""
    ocr = ocr or Counter()
    la = re.findall(r"[^\sA-Za-z0-9.,;:?!()‘’“”'\"—\-]+", van)
    for w in re.findall(r"[A-Za-z0-9]+", re.sub(r"[’'](s|t|d|ll|ve|re)\b", "", van)):
        if re.search(r"\d", w):
            la.append(w)
            continue
        if re.search(r"[a-z][A-Z]", w) or (re.fullmatch(r"[A-Z]{2,}", w) and w not in ("I",)):
            la.append(w)
            continue
        t = w.lower()
        if t in TU_DA_SOAT:
            continue
        if not re.search(r"[aeiouy]", t):
            la.append(w)                # không nguyên âm («tt», «rn»)
            continue
        def tu_that(x: str) -> bool:
            return x in _TU_NGAN or (bool(re.search(r"[aeiouy]", x)) and dem[x] >= 50)
        dinh = any((t[:i] in _TU_NGAN and tu_that(t[i:])) or (t[i:] in _TU_NGAN and tu_that(t[:i]))
                   for i in (1, 2, 3, len(t) - 3, len(t) - 2, len(t) - 1) if 0 < i < len(t))
        if dinh and len(t) <= 5 and dem[t] < 20 and ocr[t] < 50:
            la.append(w)                # hai từ dính nhau do mất khoảng trắng («toa» = to a, «Ifhe» = If he)
            continue
        if _biet(t, dem):
            continue
        if ocr[t] >= 3 and len(t) >= 3:
            continue                    # từ gặp lại ≥ 3 lần trong các sách cũ
        if w[:1].isupper() and ocr[t] >= 3:
            continue                    # tên riêng (Ho, Shang…)
        la.append(w)
    return la


def _chuoi(x) -> list[str]:
    if isinstance(x, str):
        return [x]
    if isinstance(x, dict):
        return [s for v in x.values() for s in _chuoi(v)]
    if isinstance(x, list):
        return [s for v in x for s in _chuoi(v)]
    return []


def tu_vung() -> tuple[Counter, Counter]:
    """(kho từ sạch, kho từ nhận dạng). Sạch: bản Anh của KB (ban biên tập viết) + Waite 1910 (Gutenberg, đã soát).
    Nhận dạng: mọi sách tiếng Anh in trước 1929 trong kho nguồn (chỉ dùng cho tên riêng)."""
    sach, ocr = Counter(), Counter()
    for f in sorted((GOC / "app" / "kb" / "data" / "en").rglob("*.json")):
        if f.name == RA_KB.name:
            continue
        for s in _chuoi(json.loads(f.read_text("utf-8"))):
            sach.update(w.lower() for w in re.findall(r"[A-Za-z]+", s))
    for s in _chuoi(json.loads((NGUON / "tarot_waite_1910.json").read_text("utf-8"))):
        sach.update(w.lower() for w in re.findall(r"[A-Za-z]+", s))
    for f in sorted(NGUON.glob("*.json")):
        if f.name == RA.name or not f.name.startswith(("tarot_", "thanso_", "chi_tay_", "kinhdich_legge_1899")):
            continue
        for s in _chuoi(json.loads(f.read_text("utf-8"))):
            ocr.update(w.lower() for w in re.findall(r"[A-Za-z]+", s))
    return sach, ocr


# Từ tiếng Anh có thật nhưng chỉ gặp một lần trong cả kho nguồn tiếng Anh — đã soát bằng mắt trong ngữ cảnh câu
# (không phải chữ thêm vào lời Legge; chỉ để bộ soát từ lạ không loại oan).
TU_DA_SOAT = {
    "perchance", "headship", "bloodshed", "blamable", "hog", "assailant", "overspreading", "aprons", "jawbones",
    "assailed", "dispelling", "shackles", "inefficient", "unintermitting", "bravo", "boat", "fluttering", "comporting",
    "comport", "reciprocated", "darkened", "clung", "befits", "peeping", "bedewed", "matrimonial", "overthrowing",
    "overthrowers", "accused", "revenues", "aliment", "efficacious", "unwavering", "impels", "torrents", "punitive",
    "binders", "tranquillity", "derisively", "enriching", "bye", "unbends", "suspending", "purslain", "uprooted",
    "medlar", "stump", "anon", "creepers", "muddy", "shrimps", "limpid", "blush", "shame", "suppressed", "tramp",
    "protracting", "slaughtering", "noon", "exorcists", "prescribes", "chanticleer", "subduing", "invading", "dismay",
    "mei",
}
_TU_NGAN = {"a", "i", "to", "of", "in", "on", "at", "he", "if", "it", "is", "be", "as", "by", "or", "an", "we", "me",
            "my", "no", "so", "up", "do", "go", "us", "the", "and", "his", "her"}
_KHONG_PHAI_TEN = {"in", "under", "for", "when", "the", "it", "if", "there", "of", "looking", "at", "what", "takes", "place"}


def _kc(a: str, b: str) -> int:
    """Khoảng cách sửa chữ (Levenshtein)."""
    d = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        prev, d[0] = d[0], i
        for j, y in enumerate(b, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (x != y))
    return d[-1]


def _sua_yogh(s: str) -> tuple[str, int]:
    """Legge viết âm ts / dz bằng chữ «Ȝ» (vd Ȝin, Ȝhui); lớp chữ nhận dạng đọc thành chữ số 3 → trả lại «Ȝ» khi «3» đứng
    đầu một từ viết hoa kiểu tên (3 + chữ thường)."""
    return re.subn(r"(?<![\w])3(?=[a-z])", "Ȝ", s)


_LA_MA = {"I": 1, "V": 5, "X": 10, "L": 50}


def so_la_ma(s: str) -> int | None:
    m = re.match(r"^([IVXLl1]+)[.,]", s.strip())
    if not m:
        return None
    t = m.group(1).replace("l", "I").replace("1", "I")
    tong = 0
    for i, c in enumerate(t):
        v = _LA_MA[c]
        tong += -v if i + 1 < len(t) and _LA_MA[t[i + 1]] > v else v
    return tong


def dat_ten(que_tu: str, ten: str | None, tieu_de: str = "", so: int | None = None) -> tuple[str, str | None, str | None]:
    """Tìm tên quẻ (1–3 từ trong 8 từ đầu) trong quái từ và thay bằng tên in ở đầu trang chạy của sách. Trả
    (quái từ đã thay, chữ gốc bị thay, lỗi). Không có tên đầu trang → giữ nguyên, chỉ chấp nhận tên sạch ≥ 3 chữ, hoặc
    tên ngắn có mặt trong tiêu đề quẻ mà số La Mã của tiêu đề đúng thứ tự quẻ (hai bằng chứng độc lập trên trang sách)."""
    tu = [(m.start(), m.end(), m.group()) for m in re.finditer(r"[^\s(),;:.‘’]+", que_tu)][:8]
    if not ten:
        for st, en, w in tu:
            if w.lower() in _KHONG_PHAI_TEN or not w[:1].isupper():
                continue
            if re.fullmatch(r"[A-ZȜ][a-z]{2,}", w):
                return que_tu, None, None
            if (re.fullmatch(r"[A-Z][a-z]{0,2}", w) and so is not None and so_la_ma(tieu_de) == so
                    and re.search(r"\b%s\b" % re.escape(w), tieu_de)):
                return que_tu, None, None
            return que_tu, None, f"ten_que_chua_doi_chieu({w})"
        return que_tu, None, None
    dich = re.sub(r"[^a-z]", "", ten.lower())
    tot = None
    for i in range(len(tu)):
        if tu[i][2].lower() in _KHONG_PHAI_TEN or tu[i][2][:1].islower():
            continue
        for j in range(i, min(i + 3, len(tu))):
            chu = que_tu[tu[i][0]:tu[j][1]]
            l = re.sub(r"[^a-z]", "", chu.lower())
            if not l:
                continue
            d = _kc(l, dich)
            ok = (d == 0 or (d <= 2 and (l[0] == dich[0] or not chu[0].isalpha()))
                  or (d <= 1 and len(dich) >= 3))
            if ok and (tot is None or d < tot[0] or (d == tot[0] and tu[j][1] > tot[2] and tu[i][0] == tot[1])):
                tot = (d, tu[i][0], tu[j][1], chu)
        if tot is not None:
            break
    if tot is None:
        return que_tu, None, None
    return que_tu[:tot[1]] + ten + que_tu[tot[2]:], tot[3], None


def kiem(ds: list[dict], chuong: list[dict], han: dict | None = None, kho: tuple[Counter, Counter] | None = None) -> list[dict]:
    """Gắn `ten_legge`, `hien_thi`, `can_soat`, `ly_do` cho từng quẻ (xem đầu tệp)."""
    dem, ocr = kho if kho is not None else tu_vung()
    dem = Counter(dem)
    for w in TU_DA_SOAT:
        dem[w] += 2
    kw = vach_king_wen()
    for q in ds:
        ly = list(q.pop("_loi"))
        thu_tu = q.pop("_thu_tu", [])
        ung = q.pop("_ten_ung")
        q["ten_legge"] = ung.most_common(1)[0][0] if ung else None
        if thu_tu != [1, 2, 3, 4, 5, 6]:
            ly.append("thieu_hao")
        if q["vach"] != kw[q["so"]]:
            ly.append("vach_khong_khop" if None not in q["vach"] else "chu_divided_hong")
        if q["so"] in (1, 2) and not q.get("dung"):
            ly.append("thieu_dung")
        sua = 0
        qt, n_y = _sua_yogh(q["que_tu"])
        sua += n_y
        qt, goc_ten, loi_ten = dat_ten(qt, q["ten_legge"], q.pop("_tieu_de", ""), q["so"])
        if loi_ten:
            ly.append(loi_ten)
        hao = []
        for h in q["hao"]:
            h2, n_y = _sua_yogh(h)
            sua += n_y
            hao.append(h2)
        hien = {"que_tu": qt, "hao": hao}
        if q.get("dung"):
            hien["dung"] = q["dung"]
        q["hien_thi"] = hien
        q["sua_ocr"] = {"ten_thay": goc_ten, "so_chu_yogh": sua}
        cac = [("que_tu", qt)] + [(f"hao_{i + 1}", h) for i, h in enumerate(hao)] + ([("dung", q["dung"])] if q.get("dung") else [])
        for ten, van in cac:
            if not van or not _HET_CAU.search(van):
                ly.append(f"{ten}:khong_het_cau")
            sach = re.sub(r"Ȝ\w*", " ", re.sub(r"\(=", "(", van))
            if q["ten_legge"]:
                sach = sach.replace(q["ten_legge"], " ")
            if (la := _tu_la(sach, dem, ocr)):
                ly.append(f"{ten}:tu_la({' '.join(la[:4])})")
            if van.count("(") != van.count(")"):
                ly.append(f"{ten}:lech_ngoac")
            if van.count("‘") > len(re.findall(r"’(?![a-z])", van)) or van.count("“") != van.count("”"):
                ly.append(f"{ten}:lech_nhay")
            if (".." in van or " ," in van or ".," in van or re.search(r"\. [a-z]", van)
                    or re.search(r", (There|It|He|The|If|But|Let|In|With) ", van)
                    or any(w not in ("Heaven", "Mean") and dem[w.lower()] >= 50
                           for w in re.findall(r"(?<=[a-z,] )([A-Z][a-z]+)", van))):
                ly.append(f"{ten}:dau_cau_la")
            if re.search(r"\b(Appendix|Appendixes|trigrams?|paragraphs?|Thwan|Regis|Khang|commentar\w*|the writer|Hsi says)\b"
                         r"|\b[Ll]ines? \d", van):
                ly.append(f"{ten}:lan_chu_thich")
        if han:
            hq = han[str(q["so"])]
            for ten, van, h in [("que_tu", qt, hq["que_tu"]["han"])] + [(f"hao_{i + 1}", v_, hq["hao"][i]["han"]) for i, v_ in enumerate(hao[:6])]:
                n = len(re.sub(r"[^一-鿿]", "", h)) or 1
                if not 4.0 <= len(van) / n <= 60:
                    ly.append(f"{ten}:do_dai_lech({len(van) / n:.0f})")
        q["can_soat"], q["ly_do"] = bool(ly), ly
    return ds


def main() -> None:
    d = json.loads(VAO.read_text("utf-8"))
    han = json.loads((GOC / "app/kb/data/kinhdich_hao.json").read_text("utf-8"))["que"]
    ds = kiem(cat(d["chuong"]), d["chuong"], han)
    ra = {"_nguon": d["_nguon"], "ban": "Cắt tự động (scripts/nap_legge_que.py) từ kho `kinhdich_legge_1899.json` — lớp chữ nhận dạng "
          "tự động, chưa hiệu đính. Quẻ gắn `can_soat` chưa được dùng để hiển thị.",
          "ngon_ngu": "en", "mang": "kinhdich", "source_id": "kinhdich_legge_1899", "can_doi_chieu": True,
          "so_que": len(ds), "so_que_can_soat": sum(q["can_soat"] for q in ds), "que": ds}
    RA.write_text(json.dumps(ra, ensure_ascii=False, indent=1) + "\n", "utf-8")
    kb = {"_nguon": "James Legge (dịch), The Yî King (Sacred Books of the East, vol. XVI), 1882 — bản dịch Anh thuộc phạm vi công cộng. "
          "Chỉ gồm các quẻ đã qua bộ kiểm cấu trúc (vạch âm dương từng hào khớp bảng King Wen, đủ 6 hào, không từ hỏng); "
          "tên quẻ ở đầu quái từ lấy theo tên in đầu trang của sách (không dấu phụ). Chỉ dùng cho bản tiếng Anh.",
          "source_id": "kinhdich_legge_1899", "school_id": "nghia_ly", "ngon_ngu": "en", "can_doi_chieu": True,
          "nguoi_dich": NGUOI_DICH, "que": {str(q["so"]): q["hien_thi"] for q in ds if not q["can_soat"]}}
    RA_KB.write_text(json.dumps(kb, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(f"{len(ds)} quẻ; cần soát {ra['so_que_can_soat']}; hiển thị {len(kb['que'])}")
    for q in ds:
        if q["can_soat"]:
            print(f"  quẻ {q['so']:2d} ({q['ten_legge']}): {'; '.join(q['ly_do'])}")


if __name__ == "__main__":
    main()
