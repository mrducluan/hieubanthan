# -*- coding: utf-8 -*-
"""Thoán truyện: 64 đoạn nguyên văn (cổ thư công cộng) + dịch nghĩa (nháp AI); hiện trên trang quẻ và
khi lời chủ là quái từ (0 hoặc 3 hào động). Test viết TRƯỚC."""
from __future__ import annotations

import pytest

from app.hoidap import kinhdich as hd
from app.kb import kinhdich_kb as kb
from app.kb import trang
from app.narrative import hoi_van


@pytest.mark.parametrize("so", range(1, 65))
def test_du_64_doan_dich(so):
    t = kb.que_van(so)["thoan"]
    assert t["han"] and 40 <= len(t["dich"]) <= 900
    for c in hoi_van.CAM:
        assert c not in t["dich"].lower()


def test_que_tu_lam_chu_kem_thoan():
    kq = hd.tra_loi("Tôi có nên nhận lời làm quản lý không?", gia_tri_hao=[7, 7, 7, 7, 7, 7])   # Càn, không động
    assert "Thoán truyện giảng: " + kb.que_van(1)["thoan"]["dich"] in kq["cau_tra_loi"]


def test_hao_dong_khong_chen_thoan():
    kq = hd.tra_loi("Tôi có nên nhận lời làm quản lý không?", gia_tri_hao=[9, 7, 7, 7, 7, 7])
    assert "Thoán truyện giảng" not in kq["cau_tra_loi"]


def test_trang_que_co_thoan():
    m = next(m for m in trang.lay("que", "que-1-can")["muc"] if m["tieu_de"] == "Quái từ và Đại tượng")
    assert any(d.startswith("Thoán truyện 「大哉乾元") for d in m["danh_sach"])
