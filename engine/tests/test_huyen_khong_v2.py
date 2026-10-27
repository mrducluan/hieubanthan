# -*- coding: utf-8 -*-
"""PT-V3 CALC: lưu nguyệt phi tinh theo tiết khí, tổ hợp sơn–hướng tinh (81 cặp, nghĩa 45 cặp không thứ tự + vai),
hành thông quan / hướng chung hai mệnh quái. Test viết TRƯỚC, tính tay.

Lưu nguyệt (quy tắc phổ biến — Thẩm thị): năm Tý Ngọ Mão Dậu → tháng Dần nhập trung 8; Thìn Tuất Sửu Mùi → 5;
Dần Thân Tỵ Hợi → 2; mỗi tháng giảm một. Bảng trong tài liệu chủ dự án gửi lệch một nhóm (2024 Thìn ghi 8) →
không dùng, ghi chú ở docs.
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import huyen_khong as hk
from app.kb import phongthuy_kb


@pytest.mark.parametrize("nam,thang,tam", [
    (2026, 1, 8), (2026, 2, 7), (2026, 12, 6),     # Bính Ngọ
    (2024, 1, 5), (2024, 9, 6),                    # Giáp Thìn
    (2025, 1, 2), (2025, 6, 6),                    # Ất Tỵ: 2,1,9,8,7,6
    (2027, 1, 5),                                  # Đinh Mùi
])
def test_luu_nguyet_tam(nam, thang, tam):
    r = hk.luu_nguyet(nam, thang)
    assert r["tam"] == tam and r["cung"]["Trung cung"] == tam and r["nam"] == nam and r["thang"] == thang
    assert r["sao_tam"] == hk.SAO[tam] and len(r["cung"]) == 9


def test_luu_nguyet_thang_ngoai_khoang():
    with pytest.raises(ValueError):
        hk.luu_nguyet(2026, 13)


@pytest.mark.parametrize("ngay,nam,thang,chi", [
    (dt.date(2026, 5, 20), 2026, 4, "Tỵ"),         # sau Lập hạ (5/5)
    (dt.date(2026, 1, 20), 2025, 12, "Sửu"),       # trước Lập xuân 2026 → vẫn năm 2025, tháng Sửu
    (dt.date(2026, 2, 10), 2026, 1, "Dần"),
    (dt.date(2026, 12, 10), 2026, 11, "Tý"),       # sau Đại tuyết (7/12)
])
def test_luu_nguyet_tai_ngay(ngay, nam, thang, chi):
    r = hk.luu_nguyet_tai(ngay)
    assert (r["nam"], r["thang"], r["chi_thang"]) == (nam, thang, chi)
    assert r["tam"] == hk.luu_nguyet(nam, thang)["tam"]


def test_to_hop_cung_quan_he_va_muc():
    x = hk.to_hop_cung(1, 4, 9)
    assert x["ma"] == "1-4" and x["quan_he"] == "son_sinh_huong" and not x["hop_thap"]
    assert x["trang_thai_son"] == "sinh" and x["trang_thai_huong"] == "tử" and x["muc"] == "thuan"
    assert x["ten"] and "Sơn tinh 1" in x["y"] and "hướng tinh 4" in x["y"]
    assert hk.to_hop_cung(1, 9, 9)["hop_thap"] and hk.to_hop_cung(1, 9, 9)["quan_he"] == "son_khac_huong"
    assert hk.to_hop_cung(9, 1, 9)["quan_he"] == "huong_khac_son"
    assert hk.to_hop_cung(2, 5, 9)["muc"] == "can_chu_dong"
    assert hk.to_hop_cung(3, 7, 9)["muc"] == "can_chu_dong"
    assert hk.to_hop_cung(9, 9, 9)["muc"] == "thuan" and hk.to_hop_cung(9, 9, 9)["quan_he"] == "ty_hoa"
    assert hk.to_hop_cung(8, 8, 9)["muc"] == "thuan"
    # cặp đảo chiều: cùng nghĩa gốc, vai đổi
    a, b = hk.to_hop_cung(3, 7, 9), hk.to_hop_cung(7, 3, 9)
    assert a["ten"] == b["ten"] and a["y"] != b["y"]


def test_kb_mot_nguon_81_to_hop_va_9_sao_doi_thuong():
    """Y8 (2026-10-26): KB một nguồn — `to_hop_81` đủ 81 tổ hợp có thứ tự, bảng 45 cặp cũ đã gỡ (không còn dự phòng)."""
    k = phongthuy_kb.huyen_khong()
    assert "cap_sao" not in k and "mau_cap" not in k
    t = k["to_hop_81"]
    assert set(t) == {f"{s}-{h}" for s in range(1, 10) for h in range(1, 10)}
    for s in range(1, 10):
        for h in range(1, 10):
            m = t[f"{s}-{h}"]
            assert m["ten"] and m["y"] and m["nhom"] in ("thuan", "can_bang", "can_chu_dong") and m["hop_cho"] and m["luu_y"]
            assert m["ten"] == t[f"{h}-{s}"]["ten"] and m["nhom"] == t[f"{h}-{s}"]["nhom"]   # cặp đảo: cùng tên, cùng nhóm
    assert len(k["sao_doi_thuong"]) == 9 and all(k["sao_doi_thuong"][str(i)]["ten"] for i in range(1, 10))
    # không vật phẩm hoá giải, không tên bệnh
    van = str(t) + str(k["sao_doi_thuong"])
    for cam in ("vật phẩm", "tỳ hưu", "thạch anh", "ung thư", "đột quỵ", "tiểu đường", "chết", "tang"):
        assert cam not in van.lower(), cam


def test_toan_bo_81_cap_dung_duoc():
    for van in (8, 9):
        for s in range(1, 10):
            for h in range(1, 10):
                x = hk.to_hop_cung(s, h, van)
                assert x["muc"] in ("thuan", "can_bang", "can_chu_dong") and x["ten"]


@pytest.mark.parametrize("a,b,qh,hanh", [
    ("Chấn", "Khôn", "a_khac_b", "Hoả"), ("Khôn", "Chấn", "b_khac_a", "Hoả"), ("Khảm", "Ly", "a_khac_b", "Mộc"),
    ("Khảm", "Chấn", "a_sinh_b", None), ("Càn", "Khảm", "a_sinh_b", None), ("Khảm", "Càn", "b_sinh_a", None),
    ("Khảm", "Khảm", "cung_hanh", None), ("Càn", "Đoài", "cung_hanh", None),
])
def test_thong_quan(a, b, qh, hanh):
    r = hk.thong_quan(a, b)
    assert r["quan_he"] == qh and r["hanh_thong_quan"] == hanh
    if hanh:
        assert r["goi_y"]


def test_huong_chung():
    assert set(hk.huong_chung("Khảm", "Ly")) == {"Bắc", "Đông", "Đông Nam", "Nam"}
    assert hk.huong_chung("Khảm", "Càn") == []
    assert set(hk.huong_chung("Càn", "Khôn")) == {"Tây", "Tây Bắc", "Tây Nam", "Đông Bắc"}
