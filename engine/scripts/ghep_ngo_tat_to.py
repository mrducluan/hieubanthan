"""Ghép bản dịch «Kinh Dịch» của Ngô Tất Tố (1888–1954, đã thuộc công chúng ở Việt Nam) với kho nguồn
Chu Dịch Truyện Nghĩa Đại Toàn (fixtures/nguon/chu_dich_truyen_nghia.json) theo từng đoạn kinh văn.

Ngô Tất Tố dịch đúng bộ sách này: mỗi đoạn có LỜI KINH (chữ Hán), Dịch âm, Dịch nghĩa, Truyện của Trình Di,
Bản nghĩa của Chu Hy, Lời bàn của Tiên Nho. Kịch bản khớp chữ Hán của hai bên theo thứ tự sách rồi ghi
KB app/kb/data/kinhdich_truyen_nghia.json (lời bàn của Tiên Nho không lấy).

Chạy (tệp chữ do người chạy tự rút từ PDF: `pdftotext kinh-dich.pdf ntt.txt`):
    python scripts/ghep_ngo_tat_to.py /duong/dan/ntt.txt
"""
from __future__ import annotations

import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
NGUON = GOC / "fixtures" / "nguon" / "chu_dich_truyen_nghia.json"
DICH = GOC / "app" / "kb" / "data" / "kinhdich_truyen_nghia.json"
_DI_THE = str.maketrans(
    "徃渉説徳䝉恒内亾飬兑黄衆牀乗㢲虚来㓂竆髙矦宼歳䘮羣𤼵戸㧞彚嵗敎舎宫逺曵恵隣彊𢎞𤣥䧟宂况乆旣罸勅腊剥啇朶頥虗兹䑕莅脩禄旡賔㝠卽躳静𤨏懐户隂鼔於耽无強强說",
    "往涉說德蒙恆內亡養兌黃眾床乘巽虛來寇窮高侯寇歲喪群發戶拔彙歲教舍宮遠曳惠鄰強弘玄陷穴況久既罰敕臘剝商朵頤虛茲鼠蒞修祿無賓冥即躬靜瑣懷戶陰鼓于眈無彊彊説".translate(
        str.maketrans("説彊", "說強")),
)
TEN_HAO = re.compile("^(初九|初六|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六|用九|用六|彖曰|象曰|文言曰)")


def chuan(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[^㐀-鿿\U00020000-\U0002ffff]", "", s).translate(_DI_THE)
    return TEN_HAO.sub("", s)


def _gon(dong: list[str]) -> str:
    s = " ".join(x.strip() for x in dong if x.strip())
    s = re.sub(r"\[\d+\]", "", s)
    return re.sub(r"\s+", " ", s).strip()


_MOC = [("am", re.compile(r"^Dịch âm\s*[.\-–: ]*")), ("nghia", re.compile(r"^Dịch nghĩa\s*[.\-–: ]*")),
        ("giai", re.compile(r"^GIẢI NGHĨA\s*$")), ("trinh", re.compile(r"^(Truyện|Bản nghĩa)( của)+ Tr[iì]nh [DĐ]i\s*[.\-–_,: ]*")),
        ("chu", re.compile(r"^(Bản nghĩa|Bản|Truyện)( của)+ Chu H[yi]\s*[.\-–_,: ]*")),
        ("nho", re.compile(r"^Lời bàn của [Tt]iên [Nn]ho\s*[.\-–_,: ]*"))]


def doc_ntt(duong: Path) -> list[dict]:
    dong = [d for d in duong.read_text(encoding="utf-8").splitlines() if "thuviensach.vn" not in d and d.strip() != "\f"]
    don_vi, cur, phan = [], None, None
    for d in dong:
        d = d.replace("\f", "")
        if d.strip() == "LỜI KINH":
            cur = {"han": [], "am": [], "nghia": [], "trinh": [], "chu": [], "nho": [], "them": []}
            don_vi.append(cur)
            phan = "han"
            continue
        if cur is None:
            continue
        for ten, mau in _MOC:
            m = mau.match(d.strip())
            if m:
                if ten in ("trinh", "chu") and cur[ten]:
                    phan = "them"       # lần thứ hai trong cùng đơn vị = lời dẫn của quẻ kế tiếp
                else:
                    phan = ten if ten != "giai" else "giai"
                d = d.strip()[m.end():]
                break
        if phan in cur:
            cur[phan].append(d)
    return [{k: _gon(v) for k, v in u.items()} for u in don_vi]


def ghep(ntt: list[dict], nguon: dict) -> tuple[dict, dict]:
    doan = [(q, i, d) for q in sorted(nguon["que"], key=int) for i, d in enumerate(nguon["que"][q]["doan"]) if d["kinh"]]
    ch = [chuan(d["kinh"]) for _, _, d in doan]
    kq: dict[tuple[str, int], dict] = {}
    p, khop, bo = 0, 0, []
    for u in ntt:
        h = chuan(u["han"])
        if not h:
            continue
        tot = (0.0, None, None)
        for lui in range(0, 10):                 # cho phép kho nguồn có đoạn Ngô Tất Tố không dịch riêng
            for k in range(1, 5):                # một đơn vị Ngô Tất Tố = 1–4 đoạn kho nguồn
                if p + lui + k > len(ch):
                    break
                r = difflib.SequenceMatcher(None, h, "".join(ch[p + lui:p + lui + k]), autojunk=False).ratio() - 0.02 * lui
                if r > tot[0]:
                    tot = (r, lui, k)
            if tot[0] > 0.93:
                break
        if tot[0] < 0.62 and not (tot[0] >= 0.4 and tot[1] is not None and tot[1] <= 1):   # sát vị trí đang chờ thì nới (bản điện tử gõ sai chữ Hán)
            bo.append(u["han"][:24])
            continue
        _, lui, k = tot
        for j in range(p + lui, p + lui + k):
            q, i, _ = doan[j]
            kq[(q, i)] = u if j == p + lui else {"noi": True}
        p += lui + k
        khop += 1
    return kq, {"don_vi": len(ntt), "khop": khop, "bo": bo, "doan_nguon": len(doan), "doan_co_dich": len(kq)}


_VI_TRI = re.compile(r"\s*Hào\s+(?:Chín|Sáu)\s+(Đầu|Hai|Ba|Tư|Bốn|Năm|Trên)\b", re.I)
_SO_HAO = {"đầu": 1, "hai": 2, "ba": 3, "tư": 4, "bốn": 4, "năm": 5, "trên": 6}


def _nhap(a: str, b: str) -> str:
    return (a + " " + b).strip() if a and b else a or b


def dung(nguon: dict, kq: dict) -> dict:
    ra = {}
    for q in sorted(nguon["que"], key=int):
        o: dict = {"quai_tu": {}, "thoan": [], "dai_tuong": {}, "hao": {}, "van_ngon": []}
        for i, d in enumerate(nguon["que"][q]["doan"]):
            u = kq.get((q, i))
            if not u or u.get("noi"):
                continue
            muc = {"han": d["kinh"], "am": u["am"], "dich": u["nghia"], "trinh": u["trinh"], "chu": u["chu"]}
            # gộp chữ Hán của các đoạn nối
            j = i + 1
            while kq.get((q, j), {}).get("noi"):
                muc["han"] += nguon["que"][q]["doan"][j]["kinh"]
                j += 1
            muc = {k: v for k, v in muc.items() if v}
            loai = d["loai"]
            if loai in ("thoan", "van_ngon"):
                o[loai].append(muc)
            elif loai in ("quai_tu", "dai_tuong"):
                o[loai] = {k: _nhap(o[loai].get(k, ""), v) for k, v in {**o[loai], **muc}.items()} if o[loai] else muc
            else:
                h = o["hao"].setdefault(str(d["hao"]), {})
                khoa = "tu" if loai == "hao" else "tieu_tuong"
                h[khoa] = {k: _nhap(h[khoa].get(k, ""), muc.get(k, "")) for k in {**h[khoa], **muc}} if khoa in h else muc
        for h, x in list(o["hao"].items()):      # kiểm chéo: câu dịch phải nói đúng vị trí hào; lệch thì bỏ, không đoán
            d = (x.get("tu") or {}).get("dich", "")
            m = _VI_TRI.match(d)
            if d and (d.startswith("Lời Tượng") or (m and _SO_HAO.get(m.group(1).lower(), int(h)) != int(h))):
                x.pop("tu")
            t = (x.get("tieu_tuong") or {}).get("dich", "")
            if t and _VI_TRI.match(t) and not t.startswith("Lời"):
                x.pop("tieu_tuong")
            if not x:
                o["hao"].pop(h)
        ra[q] = {k: v for k, v in o.items() if v}
    return ra


if __name__ == "__main__":
    nguon = json.loads(NGUON.read_text(encoding="utf-8"))
    ntt = doc_ntt(Path(sys.argv[1]))
    kq, tk = ghep(ntt, nguon)
    que = dung(nguon, kq)
    DICH.write_text(json.dumps({
        "_nguon": "Kinh Dịch — Ngô Tất Tố dịch và chú giải (1943; dịch giả mất 1954, tác phẩm đã thuộc về công chúng ở Việt Nam): "
                  "dịch âm, dịch nghĩa lời kinh, Truyện của Trình Di, Bản nghĩa của Chu Hy. Chữ Hán theo Chu Dịch Truyện Nghĩa Đại Toàn "
                  "(bản Tứ khố). Ghép tự động theo chữ Hán (scripts/ghep_ngo_tat_to.py); bản điện tử có thể còn lỗi gõ.",
        "source_id": "kinh_dich_ngo_tat_to", "school_id": "nghia_ly", "trang_thai": "ban_dich_co", "can_doi_chieu": True,
        "nguoi_dich": "Ngô Tất Tố", "que": que}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(json.dumps({k: (v if k != "bo" else v[:30]) for k, v in tk.items()}, ensure_ascii=False), len(tk["bo"]))
