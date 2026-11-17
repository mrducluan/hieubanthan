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
    if len(p) < 48 and re.search(r"[gc]ram\W*$", p, re.I):
        return "HEAD"
    if len(re.findall(r"[a-z]{3,}", p)) < 2:
        return "RAC"
    return "P"


def _sach(s: str) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return re.sub(r" +([;:?!,.])", r"\1", s)


def _noi(a: str, b: str) -> str:
    return a[:-1] + b if a.endswith("-") and not a.endswith(" -") else a + " " + b


def _noi_tiep(P: list[str], T: list[str], i: int, van: str, tren_cung: bool) -> tuple[str, list[int]]:
    """Tìm phần nối sang trang sau của đoạn `i` (đã bỏ số thứ tự thành `van`). Trả (lời, các chỉ số đoạn đã dùng)."""
    dung = [i]
    j = i + 1
    while j < len(P) and T[j] == "RAC":
        j += 1
    xong = bool(_HET_CAU.search(van))
    if xong and not (j < len(P) and T[j] == "HDR"):
        return van, dung            # trọn câu, sau nó còn chữ cùng trang → không nối
    # tới đầu trang chạy kế tiếp (không vượt qua hào / tiêu đề quẻ khác)
    while j < len(P) and T[j] != "HDR":
        if T[j][0] == "L" or T[j] == "HEAD":
            return van, dung
        j += 1
    ung = []
    k = j + 1
    ket = "het"
    while k < len(P):
        if T[k] == "RAC":
            k += 1
            continue
        if T[k] == "HDR":
            ket = "hdr"
            break
        if T[k][0] == "L" or T[k] == "HEAD":
            ket = "moc"
            break
        if _RX_LA_MA.match(P[k]):
            ket = "chu_thich"
            break
        ung.append(k)
        k += 1
    for n, k in enumerate(ung):
        dau_thuong = P[k][:1].islower()
        if not xong:
            if n == 0 or dau_thuong or ket == "moc":
                van, xong = _noi(van, P[k]), bool(_HET_CAU.search(P[k]))
                dung.append(k)
                continue
            break
        # đã trọn câu: chỉ nhận đoạn mở bằng chữ hoa, và chỉ khi chắc là chữ chính
        if dau_thuong:
            break
        if ket == "moc" or (ket == "chu_thich" and tren_cung and n == 0):
            van = _noi(van, P[k])
            dung.append(k)
            continue
        break
    return van, dung


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
        if heads:
            k = heads[-1] + 1
            while k < l1 and T[k] in ("RAC", "HDR"):
                k += 1
            if k < l1:
                van = _DAN.sub("", P[k])
                van, dung = _noi_tiep(P, T, k, van, False)
                van = _DAN.sub("", van)
                q["que_tu"], q["vi_tri"]["que_tu"] = _sach(van), dung
        if "que_tu" not in q:
            q["que_tu"] = ""
            q["_loi"].append("khong_thay_quai_tu")
        # ---- tên theo đầu trang chạy (sạch hơn tiêu đề quẻ): lấy bản xuất hiện nhiều nhất, chỉ gồm chữ cái
        ten = Counter()
        for i in range(cuoi + 1, (nhom[n][0] if n < len(nhom) else len(P))):
            m = re.search(r"THE +(.+?) +HEXAGRAM", P[i]) if T[i] == "HDR" else None
            if m and re.fullmatch(r"[A-Z]+( [A-Z]+)?", m.group(1)):
                ten[m.group(1).title()] += 1
        q["_ten_ung"] = ten
        # ---- hào
        for i in ds:
            m = _RX_HAO.match(P[i])
            if T[i] == "L7":
                van, dung = _noi_tiep(P, T, i, _bo_so(P[i]), True)
                q["dung"], q["vi_tri"]["dung"] = _sach(van), dung
                cuoi = max(dung)
                continue
            van, dung = _noi_tiep(P, T, i, _bo_so(P[i]), _VI_TRI[m.group(2)] == 6)
            q["hao"].append(_sach(van))
            q["vach"].append({"divided": 0, "undivided": 1}.get(m.group(3)))
            q["_thu_tu"] = q.get("_thu_tu", []) + [_VI_TRI[m.group(2)]]
            q["vi_tri"]["hao"].append(dung)
            cuoi = max(dung)
        ra.append(q)
    # tên: quẻ sau không lấy lại đầu trang của quẻ trước (trang chung hai quẻ mang tên quẻ trước)
    for a, b in zip(ra, ra[1:]):
        pass
    return ra


def vach_king_wen() -> dict[int, list[int]]:
    """Vạch âm (0) dương (1) từ hào 1 lên hào 6 của 64 quẻ — bảng King Wen của engine."""
    from app.calc import kinhdich_vendor as v
    return {so: list(v.TRI_BITS[ha]) + list(v.TRI_BITS[thuong]) for ha, hang in v.KW.items() for thuong, so in hang.items()}


def _co_trong_sach(w: str, dem: Counter) -> bool:
    """Từ `w` (chữ thường) có trong sách ≥ 2 lần, hoặc một dạng biến hình của nó có trong sách (đuôi s / ed / ing / ly…)."""
    if dem[w] >= 2:
        return True
    goc = {w}
    for duoi in ("s", "es", "ed", "d", "ing", "ly", "er", "est", "ness", "ful", "less", "ment", "ion", "ions", "ings", "ers"):
        if w.endswith(duoi) and len(w) - len(duoi) >= 3:
            g = w[: -len(duoi)]
            goc |= {g, g + "e", g[:-1] if len(g) > 3 and g[-1] == g[-2] else g, (g[:-1] + "y") if g.endswith("i") else g}
    goc.discard(w)
    if any(dem[g] >= 1 for g in goc):
        return True
    return any(dem[w + duoi] >= 1 for duoi in ("s", "d", "ed", "ing", "ly", "es", "r", "rs", "ion", "ment"))


def _tu_la(van: str, dem: Counter) -> list[str]:
    """Từ có vẻ bị đọc hỏng: lẫn số, ký hiệu lạ, chữ hoa giữa từ / cả từ viết hoa, hoặc từ không gặp lại ở đâu trong sách
    (kể cả dạng biến hình). Sách dài ~ 800 nghìn ký tự, phần Phụ lục nhắc lại gần hết từ của kinh văn."""
    la = re.findall(r"[^\sA-Za-z0-9.,;:?!()‘’“”'\"—\-]+", van)
    for w in re.findall(r"[A-Za-z0-9]+", van):
        if re.search(r"\d", w) and re.search(r"[A-Za-z]", w):
            la.append(w)
        elif re.search(r"[a-z][A-Z]", w) or (re.fullmatch(r"[A-Z]{2,}", w) and w not in ("I",)):
            la.append(w)
        elif w.isalpha() and not _co_trong_sach(w.lower(), dem):
            la.append(w)
    return la


def kiem(ds: list[dict], chuong: list[dict], han: dict | None = None) -> list[dict]:
    """Gắn `ten_legge`, `can_soat`, `ly_do` cho từng quẻ (xem đầu tệp)."""
    dem = Counter(w.lower() for c in chuong for p in c["doan"] for w in re.findall(r"[A-Za-z]+", p))
    kw = vach_king_wen()
    truoc = None
    for q in ds:
        ly = list(q.pop("_loi"))
        thu_tu = q.pop("_thu_tu", [])
        ung = q.pop("_ten_ung")
        if truoc and truoc in ung and len(ung) > 1:
            del ung[truoc]
        q["ten_legge"] = ung.most_common(1)[0][0] if ung else None
        truoc = q["ten_legge"]
        if thu_tu != [1, 2, 3, 4, 5, 6]:
            ly.append("thieu_hao")
        if q["vach"] != kw[q["so"]]:
            ly.append("vach_khong_khop" if None not in q["vach"] else "chu_divided_hong")
        if q["so"] in (1, 2) and not q.get("dung"):
            ly.append("thieu_dung")
        # tên quẻ ở đầu quái từ: tách riêng (hay bị đọc hỏng) — phần còn lại mới soát từ lạ
        m = re.match(r"^(?:In |Under the conditions of )?(.{1,16}?)(?= ?(?:%s))" % _DONG_TU, q["que_tu"])
        q["ten_dau_que_tu"] = m.group(1).strip() if m and m.group(1)[:1].isupper() or (m and m.group(1)[:1] == "(") else None
        than = q["que_tu"]
        if q["ten_dau_que_tu"] and not q["ten_dau_que_tu"].startswith("("):
            than = than.replace(q["ten_dau_que_tu"], "", 1)
        cac = [("que_tu", than)] + [(f"hao_{i + 1}", h) for i, h in enumerate(q["hao"])] + ([("dung", q["dung"])] if q.get("dung") else [])
        for ten, van in cac:
            goc = q["que_tu"] if ten == "que_tu" else van
            if not goc or not _HET_CAU.search(goc):
                ly.append(f"{ten}:khong_het_cau")
            if (la := _tu_la(van, dem)):
                ly.append(f"{ten}:tu_la({' '.join(la[:4])})")
            if goc.count("(") != goc.count(")"):
                ly.append(f"{ten}:lech_ngoac")
        if han:
            hq = han[str(q["so"])]
            for ten, van, h in [("que_tu", q["que_tu"], hq["que_tu"]["han"])] + [(f"hao_{i + 1}", v_, hq["hao"][i]["han"]) for i, v_ in enumerate(q["hao"][:6])]:
                n = len(re.sub(r"[^一-鿿]", "", h)) or 1
                if not 4.0 <= len(van) / n <= 40:
                    ly.append(f"{ten}:do_dai_lech({len(van) / n:.0f})")
        q["can_soat"], q["ly_do"] = bool(ly), ly
    return ds


def hien_thi(q: dict) -> dict:
    """Bản hiển thị của một quẻ: tên quẻ ở đầu quái từ thay bằng tên in ở đầu trang chạy của chính sách (mất dấu phụ)."""
    qt = q["que_tu"]
    t = q.get("ten_dau_que_tu")
    if t and not t.startswith("(") and q.get("ten_legge"):
        qt = qt.replace(t, q["ten_legge"], 1)
    ra = {"que_tu": qt, "hao": list(q["hao"])}
    if q.get("dung"):
        ra["dung"] = q["dung"]
    return ra


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
          "nguoi_dich": NGUOI_DICH, "que": {str(q["so"]): hien_thi(q) for q in ds if not q["can_soat"]}}
    RA_KB.write_text(json.dumps(kb, ensure_ascii=False, indent=1) + "\n", "utf-8")
    print(f"{len(ds)} quẻ; cần soát {ra['so_que_can_soat']}; hiển thị {len(kb['que'])}")
    for q in ds:
        if q["can_soat"]:
            print(f"  quẻ {q['so']:2d} ({q['ten_legge']}): {'; '.join(q['ly_do'])}")


if __name__ == "__main__":
    main()
