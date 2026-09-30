# -*- coding: utf-8 -*-
"""Hồi quy lỗi port Hồ Ngọc Đức (phát hiện 2026-09-30 khi làm SPEC-005).

Hai lỗi trong bản Python so với bản JS gốc:
  1. INT() của HND là Math.floor; bản port dùng int() (cắt về 0) → kinh độ mặt
     trời âm với mọi ngày trước 2000 → chọn sai tháng 11 âm → lệch cả tháng.
  2. Ba hạng tử trong NewMoon bị đảo dấu do viết `c1 -= a + b` thay vì
     `c1 = c1 - a + b`.
Hệ quả thấy được: Tết Canh Ngọ 1990 bị tính là 25/02 (đúng: 27/01).

Mốc đối chiếu: ngày Tết Việt Nam đã biết (gồm các năm VN khác Trung Quốc) và
tháng nhuận. Đối chiếu độc lập toàn dải 1901–2099 với lunar-lite (UTC+8): 198/199
ngày Tết khớp; phần lệch còn lại là giới hạn xấp xỉ của chính thuật toán HND.
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import lunar

TET_VN = [  # (năm âm, ngày Tết dương lịch ở Việt Nam)
    (1968, dt.date(1968, 1, 29)),   # Mậu Thân: VN 29/1, TQ 30/1
    (1985, dt.date(1985, 1, 21)),   # Ất Sửu: VN 21/1, TQ 20/2
    (1988, dt.date(1988, 2, 17)),
    (1990, dt.date(1990, 1, 27)),   # Canh Ngọ — ca lộ lỗi
    (1996, dt.date(1996, 2, 19)),
    (2000, dt.date(2000, 2, 5)),
    (2007, dt.date(2007, 2, 17)),   # Đinh Hợi: VN 17/2, TQ 18/2
    (2024, dt.date(2024, 2, 10)),
    (2026, dt.date(2026, 2, 17)),
]


@pytest.mark.parametrize("nam,ngay", TET_VN, ids=[str(n) for n, _ in TET_VN])
def test_tet_viet_nam(nam, ngay):
    assert lunar.lunar_to_solar(1, 1, nam, 0, 7.0) == (ngay.day, ngay.month, ngay.year)
    assert lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, 7.0) == (1, 1, nam, 0)
    truoc = ngay - dt.timedelta(days=1)
    assert lunar.solar_to_lunar(truoc.day, truoc.month, truoc.year, 7.0)[2] == nam - 1


def test_nhuan_thang_5_nam_1990():
    assert lunar.solar_to_lunar(23, 6, 1990, 7.0) == (1, 5, 1990, 1)
    assert lunar.solar_to_lunar(22, 7, 1990, 7.0) == (1, 6, 1990, 0)
    assert lunar.solar_to_lunar(15, 5, 1990, 7.0) == (21, 4, 1990, 0)


def test_kinh_do_mat_troi_khong_am_truoc_2000():
    """INT = floor: cung hoàng đạo luôn trong 0..11, kể cả khi T < 0."""
    for jd in range(lunar.jd_from_date(1, 1, 1901), lunar.jd_from_date(1, 1, 2000), 97):
        assert 0 <= lunar.get_sun_longitude(jd, 7.0) <= 11


def test_khu_hoi_toan_dai():
    """Dương → âm → dương khớp mọi ngày 1901–2099 (bước 3 ngày cho nhanh)."""
    d = dt.date(1901, 1, 1)
    while d < dt.date(2099, 12, 1):
        a = lunar.solar_to_lunar(d.day, d.month, d.year, 7.0)
        assert lunar.lunar_to_solar(*a, 7.0) == (d.day, d.month, d.year), d
        d += dt.timedelta(days=3)
