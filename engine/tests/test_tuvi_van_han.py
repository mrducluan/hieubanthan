# -*- coding: utf-8 -*-
"""HH-2 — vận hạn tử vi (đại hạn / tiểu hạn / lưu niên) qua iztro.horoscope. Test viết TRƯỚC.

Golden: fixtures/golden/ziwei_van_han.json (iztro 2.6.0, _generate_ziwei_van_han.mjs).
Thêm hai phép thử ĐỘC LẬP với iztro: tuổi mụ theo năm âm (Hồ Ngọc Đức) và chi lưu niên
= chi năm âm của ngày xem.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest

from app import config
from app.calc import lunar, tuvi_an_sao as az

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "ziwei_van_han.json")
               .read_text(encoding="utf-8"))["cases"]


def _ngay(s: str) -> dt.date:
    y, m, d = (int(x) for x in s.split("-"))
    return dt.date(y, m, d)


def _chay(c: dict) -> dict:
    return az.van_han(_ngay(c["d"]), c["ti"], "nam" if c["g"] == "male" else "nu", _ngay(c["ngay_xem"]))


@pytest.mark.parametrize("ma", sorted(G))
def test_khop_golden(ma):
    assert _chay(G[ma]["input"]) == G[ma]["expect"]


@pytest.mark.parametrize("ma", sorted(G))
def test_doc_lap_tuoi_mu_va_chi_luu_nien(ma):
    c = G[ma]["input"]
    kq = _chay(c)
    sinh, xem = _ngay(c["d"]), _ngay(c["ngay_xem"])
    nam_am_sinh = lunar.solar_to_lunar(sinh.day, sinh.month, sinh.year, config.CALENDAR_MERIDIAN_TZ)[2]
    nam_am_xem = lunar.solar_to_lunar(xem.day, xem.month, xem.year, config.CALENDAR_MERIDIAN_TZ)[2]
    assert kq["tuoi_mu"] == nam_am_xem - nam_am_sinh + 1
    assert kq["luu_nien"]["chi"] == lunar.can_chi_nam(nam_am_xem)[1]
    assert kq["dai_han"]["tu_tuoi"] <= kq["tuoi_mu"] <= kq["dai_han"]["den_tuoi"]


def test_truoc_tet_chua_tang_tuoi():
    """20/01/2027 còn trước Tết Đinh Mùi → vẫn năm Bính Ngọ, tuổi mụ chưa tăng."""
    a = _chay({"d": "1990-5-17", "ti": 6, "g": "male", "ngay_xem": "2027-1-20"})
    b = _chay({"d": "1990-5-17", "ti": 6, "g": "male", "ngay_xem": "2027-3-1"})
    assert b["tuoi_mu"] == a["tuoi_mu"] + 1
    assert (a["luu_nien"]["chi"], b["luu_nien"]["chi"]) == ("Ngọ", "Mùi")


def test_an_sao_khong_doi_khi_khong_xem_han():
    la = az.an_sao_tho(dt.date(1990, 5, 17), 6, "nam")
    assert "horoscope" not in la
