# -*- coding: utf-8 -*-
"""EN-6 — hoàng lịch MỌI ngày 1930–2030 khớp oracle lunar-python 1.4.8 (MIT), so bằng băm theo tháng.

Golden `fixtures/golden/hoang_lich_bam.json` sinh bằng `fixtures/golden/_sinh_hoang_lich_bam.py` (giờ Bắc Kinh UTC+8,
đúng như test 898 ngày `test_hoang_lich.py`). Bản ghi chuẩn ở đây phải giống HỆT hàm `ngay_chuan` của tệp sinh.
Lệch → báo danh sách tháng; chạy `ngay_chuan` của tệp sinh cho tháng đó để so từng ngày.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
from pathlib import Path

from app.calc import hoang_lich as hl

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "hoang_lich_bam.json").read_text(encoding="utf-8"))


def _ngay_chuan(d: dt.date) -> list:
    k = hl.ngay(d, tz=8.0)
    return [d.isoformat(), k["thang_gz"], k["ngay_gz"], k["truc"], k["than"], k["nghi"], k["ky"], k["cat_than"],
            k["hung_sat"], k["tu"], f"{k['xung']['can']}{k['xung']['chi']}", k["sat_phuong"], list(k["banh_to"]),
            [k["huong"]["hy_than"], k["huong"]["tai_than"], k["huong"]["phuc_than"]], k["thai_than"],
            [x["than"] for x in k["gio"]]]


def _bam(ds: list) -> str:
    return hashlib.sha256(json.dumps(ds, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()[:16]


def test_du_moi_thang_1930_2030():
    assert len(G["thang"]) == (2030 - 1930 + 1) * 12


def test_moi_ngay_khop_oracle_theo_bam_thang():
    thang: dict[str, list] = {}
    d, den = dt.date.fromisoformat(G["tu"]), dt.date.fromisoformat(G["den"])
    while d <= den:
        thang.setdefault(f"{d.year:04d}-{d.month:02d}", []).append(_ngay_chuan(d))
        d += dt.timedelta(days=1)
    lech = [k for k, v in thang.items() if _bam(v) != G["thang"][k]]
    assert not lech, f"{len(lech)} tháng lệch oracle: {lech[:20]}"
