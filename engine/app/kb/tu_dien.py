# -*- coding: utf-8 -*-
"""GN — Từ điển thuật ngữ dễ hiểu (KB) + nhận diện thuật ngữ trong một đoạn văn đã sinh.

Chỉ TRA bảng (tầng KB): không sinh nghĩa mới. `nhan_dien` tìm các thuật ngữ của đúng mảng trong câu trả lời /
chương luận giải để web gạch chân và dựng khung "Giải nghĩa thuật ngữ".
"""
from __future__ import annotations

import re
import unicodedata
from pathlib import Path
from app import ngon_ngu
from app.kb import nap

_F = Path(__file__).parent / "data" / "tu_dien.json"
TOI_DA = 12
# Biến thể quá ngắn / nhập nhằng → không dùng để tự gạch chân (vẫn có trong từ điển).
_BO_BIEN_THE = {"Sát", "Lộc", "Ấn", "Thân", "hợp", "xung", "khắc", "sinh", "kỵ", "hỷ", "lộ", "chi", "can", "nhuận",
                "tiết", "vạch", "sơn", "Kiêu", "Quý Nhân", "Hình"}
# Hai lối bỏ dấu: "Hoá" / "Hóa", "Thuỷ" / "Thủy"… — quy về một dạng, GIỮ NGUYÊN độ dài chuỗi.
_DOI = {"óa": "oá", "òa": "oà", "ỏa": "oả", "õa": "oã", "ọa": "oạ", "óe": "oé", "òe": "oè", "ỏe": "oẻ", "õe": "oẽ",
        "ọe": "oẹ", "úy": "uý", "ùy": "uỳ", "ủy": "uỷ", "ũy": "uỹ", "ụy": "uỵ"}
_RE_DOI = re.compile("|".join(_DOI), re.IGNORECASE)


def _chuan(s: str) -> str:
    s = unicodedata.normalize("NFC", s)
    return _RE_DOI.sub(lambda m: _DOI[m.group(0).lower()] if m.group(0).islower() else m.group(0)[0] + _DOI[m.group(0).lower()][1], s)


@nap.nho
def _d() -> dict:
    d = nap.doc(_F.name)
    # EN-ALL: biến thể tên là danh sách CỦA RIÊNG mỗi ngôn ngữ (dùng để nhận diện thuật ngữ trong chữ ngôn ngữ đó) — bản
    # phủ thay HẲN danh sách, không trộn biến thể tiếng Việt vào (nap.gop gộp danh sách theo vị trí).
    nn = ngon_ngu.hien_tai()
    if nn != ngon_ngu.MAC_DINH and nap.co_ban_phu(_F.name, nn):
        phu = {m.get("ma"): m for m in (nap._doc_tho(nap.duong(_F.name, nn)).get("muc") or []) if isinstance(m, dict)}
        d = {**d, "muc": [{**m, "bien_the": list(phu[m["ma"]]["bien_the"])} if isinstance((phu.get(m["ma"]) or {}).get("bien_the"), list) else m
                          for m in d["muc"]]}
    return d


def meta() -> dict:
    d = _d()
    return {k: d[k] for k in ("_nguon", "source_id", "school_id", "trang_thai", "can_doi_chieu")}


def tat_ca(mo_dun: str | None = None) -> list[dict]:
    return [m for m in _d()["muc"] if mo_dun is None or m["mo_dun"] == mo_dun]


@nap.nho
def _mau(mo_dun: str) -> list[tuple[re.Pattern, dict]]:
    ds = []
    for m in tat_ca(mo_dun):
        if not m["tu_dong"]:
            continue
        # KHÔNG lặp qua `set`: thứ tự set của chuỗi đổi theo hạt băm tiến trình (PYTHONHASHSEED) → thứ tự mẫu cùng độ dài,
        # rồi thứ tự `khop` trong đầu ra, khác nhau giữa hai tiến trình. Tên chính trước, biến thể theo thứ tự trong KB.
        for f in dict.fromkeys([m["ten"], *m["bien_the"]]):
            if len(f) < 3 or f in _BO_BIEN_THE or f.isdigit():
                continue
            co = re.IGNORECASE if len(f) >= 6 else 0          # tên ngắn: phân biệt hoa thường (tránh "mệnh" thường)
            ds.append((len(f), re.compile(r"(?<!\w)" + re.escape(_chuan(f)) + r"(?!\w)", co), m))
    ds.sort(key=lambda x: -x[0])                              # dài trước: "Lộc Tồn" trước "Lộc"
    return [(p, m) for _, p, m in ds]


def nhan_dien(van: str, mo_dun: str) -> list[dict]:
    """Thuật ngữ của mảng `mo_dun` có trong `van`, theo thứ tự xuất hiện (tối đa TOI_DA)."""
    if not van:
        return []
    goc, chuan = unicodedata.normalize("NFC", van), _chuan(van)
    da_chiem = [False] * len(chuan)
    gap: dict[str, dict] = {}
    for p, m in _mau(mo_dun):
        for k in p.finditer(chuan):
            a, b = k.span()
            if any(da_chiem[a:b]):
                continue
            da_chiem[a:b] = [True] * (b - a)
            g = gap.setdefault(m["ma"], {"vt": a, "m": m, "khop": []})
            g["vt"] = min(g["vt"], a)
            if goc[a:b] not in g["khop"]:
                g["khop"].append(goc[a:b])
    ra = sorted(gap.values(), key=lambda g: g["vt"])[:TOI_DA]
    return [{"ma": g["m"]["ma"], "ten": g["m"]["ten"], "han": g["m"]["han"], "mo_dun": g["m"]["mo_dun"],
             "de_hieu": g["m"]["de_hieu"], "vi_du": g["m"]["vi_du"], "khop": g["khop"]} for g in ra]
