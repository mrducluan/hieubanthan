# -*- coding: utf-8 -*-
"""HH-3 — Lục Hào vượng suy: nguyệt kiến (theo tiết), nhật thần, tuần không. Test viết TRƯỚC.

Bảng tay (Tăng San Bốc Dịch): hành cùng hành tháng → vượng; tháng sinh → tướng; sinh tháng → hưu;
khắc tháng → tù; bị tháng khắc → tử. Tuần không: tuần Giáp Tý → Tuất Hợi.
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import vuong_suy as vs


@pytest.mark.parametrize("hanh,chi_thang,ket", [
    ("Mộc", "Dần", "vượng"), ("Hỏa", "Dần", "tướng"), ("Thủy", "Dần", "hưu"),
    ("Kim", "Dần", "tù"), ("Thổ", "Dần", "tử"), ("Thổ", "Thìn", "vượng"), ("Kim", "Thìn", "tướng"),
])
def test_nguyet_lenh(hanh, chi_thang, ket):
    assert vs.nguyet_lenh(hanh, chi_thang) == ket


@pytest.mark.parametrize("can,chi,khong", [
    ("Giáp", "Tý", ["Tuất", "Hợi"]), ("Quý", "Dậu", ["Tuất", "Hợi"]), ("Giáp", "Tuất", ["Thân", "Dậu"]),
    ("Giáp", "Dần", ["Tý", "Sửu"]), ("Mậu", "Ngọ", ["Tý", "Sửu"]), ("Mậu", "Thìn", ["Tuất", "Hợi"]),
])
def test_tuan_khong(can, chi, khong):
    assert vs.tuan_khong(can, chi) == khong


@pytest.mark.parametrize("chi_hao,chi_ngay,ket", [
    ("Dần", "Dần", "lâm nhật"), ("Dần", "Thân", "nhật xung"), ("Ngọ", "Dần", "nhật sinh"),
    ("Dần", "Dậu", "nhật khắc"), ("Tý", "Sửu", "nhật hợp"), ("Tý", "Mão", "không"),
])
def test_nhat_than(chi_hao, chi_ngay, ket):
    assert vs.nhat_than(chi_hao, chi_ngay) == ket


def test_thoi_diem_lay_thang_theo_tiet_ngay_theo_can_chi():
    # 17/05/1990 12:30 giờ VN: sau Lập hạ → tháng Tỵ; ngày Nhâm Ngọ (golden bát tự).
    tg = vs.thoi_gian(dt.datetime(1990, 5, 17, 12, 30))
    assert tg["chi_thang"] == "Tỵ" and (tg["can_ngay"], tg["chi_ngay"]) == ("Nhâm", "Ngọ")
    assert tg["tuan_khong"] == ["Thân", "Dậu"]


def test_danh_gia_hao():
    tg = {"chi_thang": "Tỵ", "can_ngay": "Nhâm", "chi_ngay": "Ngọ", "tuan_khong": ["Thân", "Dậu"]}
    d = vs.danh_gia("Dậu", "Kim", tg)
    assert d["nguyet_lenh"] == "tử" and d["nhat_than"] == "nhật khắc" and d["tuan_khong"] is True
    assert d["tong"] == "suy"
    d2 = vs.danh_gia("Ngọ", "Hỏa", tg)
    assert d2["nguyet_lenh"] == "vượng" and d2["nhat_than"] == "lâm nhật" and d2["tong"] == "vượng"
