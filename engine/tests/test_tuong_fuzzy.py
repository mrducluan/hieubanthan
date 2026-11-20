# -*- coding: utf-8 -*-
"""GĐ A — Kiểm định Bridge Layer Fuzzy Z-Score cho Nhân Tướng (Bridges 5 Ngũ Hành) & Chỉ Tay (4 Dạng Tay)."""
from __future__ import annotations

import re

from app import ngon_ngu
from app.calc import tuong_fuzzy as tf

_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)


def test_fuzzy_zscore_muot_va_dung_ranh_gioi():
    thap = tf.fuzzy_zscore(0.24, 0.33, 0.04, "ngan", "vua", "cao")
    vua = tf.fuzzy_zscore(0.33, 0.33, 0.04, "ngan", "vua", "cao")
    cao = tf.fuzzy_zscore(0.42, 0.33, 0.04, "ngan", "vua", "cao")
    assert thap["semantic_tag"] == "ngan" and thap["z_score"] < -1.5
    assert vua["semantic_tag"] == "vua" and 0.55 <= vua["confidence"] <= 0.98
    assert cao["semantic_tag"] == "cao" and cao["z_score"] > 1.5


def test_cau_noi_nhan_tuong_bridges_va_en_sach():
    sd = {"cao_rong": 1.44, "tran_ma": 0.90, "ham_ma": 0.84, "may_khoe": 0.95, "tam_dinh": {"thuong": 37, "trung": 32, "ha": 31}}
    kq = tf.cau_noi_nhan_tuong(sd)
    assert kq["chi_so_fuzzy"]["thuong_dinh"]["semantic_tag"] == "thuong_dinh_cao_rong"
    assert kq["ngu_hanh_bridges"]["hanh"] == "moc"
    assert kq["ngu_hanh_bridges"]["nghia_doi_thuong"]
    assert kq["ngu_hanh_bridges"]["mat_tieu_cuc_can_chu_y"]
    assert kq["ngu_hanh_bridges"]["sach_ghi"]["trich"]

    with ngon_ngu.dung("en"):
        kq_en = tf.cau_noi_nhan_tuong(sd)
        assert not _VIET.search(str(kq_en)), f"Rò chữ Việt ở bản EN: {kq_en}"


def test_cau_noi_chi_tay_4_dang_va_en_sach():
    cases = [
        ({"rong_long": 0.92, "ngon": {"giua": 0.74}, "tro_ap_ut": 0.98}, "tho"),
        ({"rong_long": 0.92, "ngon": {"giua": 0.90}, "tro_ap_ut": 1.04}, "khi"),
        ({"rong_long": 0.78, "ngon": {"giua": 0.74}, "tro_ap_ut": 0.93}, "hoa"),
        ({"rong_long": 0.78, "ngon": {"giua": 0.90}, "tro_ap_ut": 0.99}, "thuy"),
    ]
    for sd, ky_vong in cases:
        kq = tf.cau_noi_chi_tay(sd)
        assert kq["dang_ban_tay"]["ma"] == ky_vong
        assert kq["dang_ban_tay"]["nghia_doi_thuong"]
        assert kq["dang_ban_tay"]["mat_tieu_cuc_can_chu_y"]
        with ngon_ngu.dung("en"):
            kq_en = tf.cau_noi_chi_tay(sd)
            assert kq_en["dang_ban_tay"]["ma"] == ky_vong
            assert not _VIET.search(str(kq_en)), f"Rò chữ Việt ở bản EN: {kq_en}"
