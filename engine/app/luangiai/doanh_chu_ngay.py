# -*- coding: utf-8 -*-
"""Chọn ngày cho công cụ chủ cơ sở (Mặt bằng & Khai trương, Lịch quyết định 12 tháng) — MỘT cách lọc dùng chung.

Chỉ đọc `hoang_lich.chon_ngay` (đã lọc: việc nằm trong mục Nên, không trong mục Kiêng, không xung tuổi; đã xếp theo điểm
cộng hoàng đạo / trực tốt / hợp tuổi). Ở đây chỉ: đưa ngày vướng kiêng dân gian (Tam nương, Nguyệt kỵ…) và nhãn tập quán
(Tuế Phá, Thụ Tử) xuống sau — KHÔNG loại — lấy `so` ngày, rồi xếp theo thời gian. Rà soát PR #328/#329 (2026-11-21):
hai PR từng tự xếp lại theo nhãn tập quán và bỏ mất điểm cộng, có cả ngày không hoàng đạo đứng trên ngày tốt hơn."""
from __future__ import annotations

import datetime as dt

from app import ngon_ngu
from app.kb.nap import doc
from app.luangiai import hoang_lich as hl


def _nhan_en(x: dict) -> tuple[list[str], str]:
    """Bản Anh: `hoang_lich.chon_ngay` ghi điểm cộng + tên trực bằng chữ Việt → dựng lại từ CÙNG dữ kiện (hoàng đạo, trực,
    quan hệ tuổi) bằng bản phủ tiếng Anh của KB hoàng lịch. Bản Việt không đi qua đây."""
    vi_kb, en_kb = hl.KB, doc("hoang_lich_kb.json")
    ma_truc = next((m for m, v in vi_kb["truc"].items() if v["ten"] == x.get("truc")), None)
    truc_en = en_kb["truc"][ma_truc]["ten"] if ma_truc else x.get("truc", "")
    cong = [lbl for lbl in (
        "Yellow Path day" if any(c == "hoàng đạo" for c in x.get("diem_cong") or []) else None,
        f"{truc_en} day officer" if any(c.startswith("trực ") for c in x.get("diem_cong") or []) else None,
        en_kb["quan_he_tuoi"][x["quan_he_tuoi"]]["ten"] if x.get("quan_he_tuoi") in ("tam_hop", "luc_hop") else None)
        if lbl]
    return cong, truc_en


def ngay_tot(viec: str, tu: dt.date, den: dt.date, ngay_sinh: dt.date, so: int) -> list[dict]:
    if tu > den:
        return []
    ra = hl.chon_ngay(viec, tu, den, ngay_sinh.year, ngay_sinh.month, ngay_sinh.day)["ngay"]
    xep = sorted(enumerate(ra), key=lambda ix: (bool(ix[1].get("ky_dan_gian")), bool(ix[1].get("nhan_tap_quan")), ix[0]))
    chon = sorted((x for _, x in xep[:so]), key=lambda x: x["ngay"])
    if not ngon_ngu.la_viet():
        chon = [{**x, **dict(zip(("diem_cong", "truc"), _nhan_en(x)))} for x in chon]
    return [{"ngay": x["ngay"], "am": x.get("am", ""), "can_chi": x.get("can_chi", ""), "truc": x.get("truc", ""),
             "dep": bool(x.get("dep")), "hoang_dao": bool(x.get("hoang_dao")),
             "diem_cong": list(x.get("diem_cong") or []), "quan_he_tuoi": x.get("quan_he_tuoi"),
             "ky_dan_gian": list(x.get("ky_dan_gian") or []), "luu_y_ngay": list(x.get("nhan_tap_quan") or [])}
            for x in chon]
