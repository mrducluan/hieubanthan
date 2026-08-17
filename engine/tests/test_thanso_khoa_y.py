# -*- coding: utf-8 -*-
"""Quy tắc Y đã KHOÁ (deterministic) — theo spec chủ dự án 2026-08-15.

Quy tắc:
  1. Bỏ dấu tiếng Việt trước khi quy đổi.
  2. Nguyên âm mặc định: A, E, I, O, U.
  3. Y là nguyên âm CHỈ khi không có nguyên âm nào (AEIOU hoặc Y khác) liền kề
     trước/sau trong cùng âm tiết; ngược lại Y là phụ âm.
  4. Không loại 'u' trong cụm qu/gu — tính theo mặt chữ.
  5. Giữ 11/22/33 nếu tổng cuối rơi đúng vào đó.

Giá trị mong đợi tính TAY (Pythagoras: A=1..I=9,J=1..R=9,S=1..Z=8):
  "Nguyễn Đức Luân" -> "Nguyen Duc Luan", âm tiết: Nguyen | Duc | Luan
  - Y trong "Nguyen": kề U (nguyên âm) → phụ âm.
  - Nguyên âm: U,E | U | U,A
  - Sứ mệnh (mọi chữ):  N5 G7 U3 Y7 E5 N5 + D4 U3 C3 + L3 U3 A1 N5 = 54 -> 9
  - Linh hồn (nguyên âm): U3 E5 + U3 + U3 A1 = 15 -> 6
  - Nhân cách (phụ âm):  N5 G7 Y7 N5 + D4 C3 + L3 N5 = 39 -> 3
  Đường đời 24/10/1988: 2+4+1+0+1+9+8+8 = 33 (số cái) -> giữ 33
"""
from __future__ import annotations

from app.calc import thanso


# --------------------------------------------------------------------------- #
# Phân loại Y theo ngữ cảnh âm tiết
# --------------------------------------------------------------------------- #
def test_y_ke_nguyen_am_la_phu_am() -> None:
    # "Nguyen": Y kề U và E → phụ âm
    assert thanso.y_la_nguyen_am_tai("NGUYEN", 3) is False
    # "Huy": Y kề U → phụ âm
    assert thanso.y_la_nguyen_am_tai("HUY", 2) is False


def test_y_khong_ke_nguyen_am_la_nguyen_am() -> None:
    # "Ly": Y chỉ kề L (phụ âm) → nguyên âm
    assert thanso.y_la_nguyen_am_tai("LY", 1) is True
    # "Ny": Y chỉ kề N → nguyên âm
    assert thanso.y_la_nguyen_am_tai("NY", 1) is True


def test_y_ke_y_khac_la_phu_am() -> None:
    # "YY": mỗi Y kề một Y khác → phụ âm (theo quy tắc, Y khác cũng tính)
    assert thanso.y_la_nguyen_am_tai("YY", 0) is False
    assert thanso.y_la_nguyen_am_tai("YY", 1) is False


# --------------------------------------------------------------------------- #
# Chỉ số xác định — khoá cho "Nguyễn Đức Luân, 24/10/1988"
# --------------------------------------------------------------------------- #
def test_chi_so_xac_dinh_nguyen_duc_luan() -> None:
    cs = thanso.chi_so_xac_dinh("Nguyễn Đức Luân", 24, 10, 1988)
    assert cs["su_menh"] == 9
    assert cs["linh_hon"] == 6
    assert cs["nhan_cach"] == 3
    assert cs["duong_doi"] == 33


def test_giu_so_cai_duong_doi() -> None:
    """Đường đời 24/10/1988 = 33 → phải GIỮ, không rút về 6."""
    cs = thanso.chi_so_xac_dinh("Test", 24, 10, 1988)
    assert cs["duong_doi"] == 33


def test_khong_loai_u_trong_qu() -> None:
    """Rule #4: 'u' trong 'Quy' vẫn được tính là nguyên âm (theo mặt chữ)."""
    # "Quy": Q-U-Y. U là nguyên âm; Y kề U → phụ âm. Nguyên âm = U.
    val = thanso.gia_tri_xac_dinh("Quy", "linh_hon")
    # U = 3 → rút gọn 3
    assert val == 3


def test_bo_dau_truoc_khi_quy_doi() -> None:
    """Có dấu và không dấu phải cho cùng kết quả (rule #1)."""
    a = thanso.chi_so_xac_dinh("Nguyễn Đức Luân", 24, 10, 1988)
    b = thanso.chi_so_xac_dinh("Nguyen Duc Luan", 24, 10, 1988)
    assert a == b


def test_deterministic() -> None:
    a = thanso.chi_so_xac_dinh("Trần Thị Mai", 15, 7, 1995)
    b = thanso.chi_so_xac_dinh("Trần Thị Mai", 15, 7, 1995)
    assert a == b
