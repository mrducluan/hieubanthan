# -*- coding: utf-8 -*-
"""EN-3 — Bát tự: chủ đề của câu (câu tự viết)."""
import pytest

from app.hoidap import battu as bt


@pytest.mark.parametrize("cau, cd", [
    ("Nhật chủ của em mạnh hay yếu ạ", "ngu_hanh"),
    ("Màu sắc may mắn hợp với tôi là màu gì", "ngu_hanh"),
    ("Bát tự tôi có được ai giúp đỡ, nâng đỡ không", "quan_he"),
    ("Hay bị đồng nghiệp tranh công thì bát tự nói sao", "quan_he"),
    ("Đường học vấn của tôi theo tứ trụ ra sao", "hoc_hanh"),
])
def test_chu_de(cau, cd):
    p = bt.phan_loai(cau)
    assert p["loai"] == "la_so" and p["chu_de"] == cd, (cau, p["loai"], p["chu_de"])


def test_xung_trong_tu_tru_khong_phai_hop_hai_nguoi():
    p = bt.phan_loai("Trong bát tự của tôi trụ năm và trụ giờ có xung nhau không")
    assert p["loai"] == "la_so", p["loai"]


def test_tru_cua_hai_vo_chong_van_la_hop():
    assert bt.phan_loai("Trụ ngày của hai vợ chồng có xung nhau không?")["loai"] == "hop"
