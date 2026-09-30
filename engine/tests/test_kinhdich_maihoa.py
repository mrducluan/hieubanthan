# -*- coding: utf-8 -*-
"""Mai Hoa Dịch Số — khởi quẻ theo thời gian + thể/dụng. Test viết TRƯỚC hàm.

Golden: hai ví dụ kinh điển trong chính sách Mai Hoa (fixtures/golden/kinhdich_maihoa.json).
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app.calc import kinhdich, kinhdich_maihoa as mh

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "kinhdich_maihoa.json")
               .read_text(encoding="utf-8"))["cac_ca"]


@pytest.mark.parametrize("c", G, ids=[c["ten"] for c in G])
def test_vi_du_kinh_dien(c):
    kq = mh.khoi_que_thoi_gian(c["chi_nam"], c["thang_am"], c["ngay_am"], c["chi_gio"])
    assert (kq["thuong"], kq["ha"], kq["hao_dong"]) == (c["thuong"], c["ha"], c["hao_dong"])
    que = kinhdich.khoi_que(kq["gia_tri_hao"])
    assert que["quai_ban"]["so_king_wen"] == c["que_ban"] and que["quai_bien"]["so_king_wen"] == c["que_bien"]
    td = mh.the_dung(kq["thuong"], kq["ha"], kq["hao_dong"])
    assert (td["the"], td["dung"], td["quan_he"]) == (c["the"], c["dung"], c["the_dung"])


@pytest.mark.parametrize("the,dung,qh", [
    ("Càn", "Khôn", "dung_sinh_the"),     # Thổ sinh Kim
    ("Càn", "Chấn", "the_khac_dung"),     # Kim khắc Mộc
    ("Càn", "Đoài", "ty_hoa"),            # Kim–Kim
    ("Càn", "Khảm", "the_sinh_dung"),     # Kim sinh Thuỷ
    ("Càn", "Ly", "dung_khac_the"),       # Hoả khắc Kim
])
def test_nam_quan_he_the_dung(the, dung, qh):
    assert mh.quan_he(the, dung) == qh


def test_so_du_0_lay_8_va_6():
    # 1+7+8 = 16 → 16 mod 8 = 0 → Khôn (8); +12 = 28 → 28 mod 8 = 4 → Chấn; 28 mod 6 = 4
    kq = mh.khoi_que_thoi_gian("Tý", 7, 8, "Hợi")
    assert (kq["thuong"], kq["ha"], kq["hao_dong"]) == ("Khôn", "Chấn", 4)


def test_tu_ngay_gio_duong_lich():
    """Đổi dương → âm (Hồ Ngọc Đức, UTC+7), chi năm âm, chi giờ; 23:xx vẫn là ngày đó (SWITCH_AT_0000)."""
    kq = mh.khoi_que_tu_thoi_diem(dt.datetime(2026, 9, 30, 10, 15))
    assert kq["dau_vao"]["chi_nam"] == "Ngọ"          # năm Bính Ngọ
    assert kq["dau_vao"]["chi_gio"] == "Tỵ"           # 09–11h
    t = mh.khoi_que_tu_thoi_diem(dt.datetime(2026, 9, 30, 23, 30))
    assert t["dau_vao"]["chi_gio"] == "Tý" and t["dau_vao"]["ngay_am"] == kq["dau_vao"]["ngay_am"]


def test_gia_tri_hao_hop_le():
    kq = mh.khoi_que_thoi_gian("Dần", 1, 1, "Tý")
    assert len(kq["gia_tri_hao"]) == 6 and sum(v in (6, 9) for v in kq["gia_tri_hao"]) == 1
