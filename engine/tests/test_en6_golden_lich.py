# -*- coding: utf-8 -*-
"""EN-6 — golden mở rộng trong CI: MỌI ngày mùng 1 âm lịch Trung Quốc 1901–2099 (2.461 tháng, oracle lunar-typescript)
khớp thuật toán Hồ Ngọc Đức chạy ở kinh tuyến 120°Đ (UTC+8). Lịch Việt Nam (UTC+7) dùng đúng thuật toán đó."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

from app.calc import lunar

# Sóc (trăng mới) rơi sát nửa đêm giờ Bắc Kinh: thuật toán Hồ Ngọc Đức (công thức Meeus rút gọn) và lunar-typescript
# (thiên văn chính xác hơn) chọn khác ngày mùng 1. Lịch Việt Nam lấy Hồ Ngọc Đức làm chuẩn (CLAUDE.md) — 5/2.461 tháng,
# ghi tên từng ca; có ca lệch MỚI thì test báo đỏ.
LECH_DA_BIET = {"1914-11-17", "1916-02-03", "1920-11-10", "2057-09-29", "2097-08-07"}

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lich_tq_mung1.json").read_text(encoding="utf-8"))


def test_moi_mung_1_lich_trung_quoc_1901_2099():
    lech = []
    for ngay, nam, thang, nhuan in G["mung1"]:
        d = dt.date.fromisoformat(ngay)
        kq = lunar.solar_to_lunar(d.day, d.month, d.year, 8.0)
        if ngay in LECH_DA_BIET:
            continue
        if kq != (1, thang, nam, nhuan):
            lech.append((ngay, kq, (1, thang, nam, nhuan)))
        truoc = d - dt.timedelta(days=1)
        if lunar.solar_to_lunar(truoc.day, truoc.month, truoc.year, 8.0)[0] == 1 and \
                (d + dt.timedelta(days=0)).isoformat() not in LECH_DA_BIET:
            lech.append((truoc.isoformat(), "mùng 1 thừa", None))
    assert len(G["mung1"]) > 2400
    assert lech == [], lech[:10]


def test_doi_nguoc_mung_1():
    for ngay, nam, thang, nhuan in G["mung1"][::7]:
        if ngay in LECH_DA_BIET:
            continue
        d, m, y = lunar.lunar_to_solar(1, thang, nam, nhuan, 8.0)
        assert dt.date(y, m, d).isoformat() == ngay


def test_lech_da_biet_van_lech_mot_ngay():
    """Ngoại lệ chỉ được phép lệch đúng MỘT ngày (sóc sát nửa đêm), không hơn."""
    for ngay, nam, thang, nhuan in G["mung1"]:
        if ngay not in LECH_DA_BIET:
            continue
        d = dt.date.fromisoformat(ngay)
        ke = [d + dt.timedelta(days=k) for k in (-1, 1)]
        assert any(lunar.solar_to_lunar(x.day, x.month, x.year, 8.0)[:3] == (1, thang, nam) for x in ke), ngay
