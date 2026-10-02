# -*- coding: utf-8 -*-
"""Đổi lịch âm-dương theo thuật toán Hồ Ngọc Đức, kinh tuyến 105°Đ (UTC+7).

Nguồn chân lý của test: các mốc lịch CÔNG KHAI kiểm chứng được (ngày Tết các
năm, sự kiện lịch sử có ngày âm được ghi chép), cộng một cặp đã nghiệm trong
nhật ký của người vận hành (02/12/1988 dương = 24/10 âm năm Mậu Thìn).

Thuật toán sai một hệ số thiên văn → các test mốc Tết sẽ đỏ ngay.
"""
from __future__ import annotations

import pytest

from app.calc import lunar

TZ = 7.0  # kinh tuyến lịch Việt Nam — khớp config.CALENDAR_MERIDIAN_TZ


# --------------------------------------------------------------------------- #
# Mốc Tết — ngày mùng 1 tháng Giêng, công khai và không tranh cãi
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "duong, am_mong_doi",
    [
        # (dd, mm, yyyy dương) → (ngày, tháng, năm âm, nhuận)
        ((6, 2, 1970), (1, 1, 1970, 0)),    # Tết Canh Tuất
        ((17, 2, 1988), (1, 1, 1988, 0)),   # Tết Mậu Thìn
        ((5, 2, 2000), (1, 1, 2000, 0)),    # Tết Canh Thìn
        ((25, 1, 2020), (1, 1, 2020, 0)),   # Tết Canh Tý
        ((12, 2, 2021), (1, 1, 2021, 0)),   # Tết Tân Sửu
        ((10, 2, 2024), (1, 1, 2024, 0)),   # Tết Giáp Thìn
    ],
)
def test_mung_1_tet(duong, am_mong_doi) -> None:
    d, m, y = duong
    assert lunar.solar_to_lunar(d, m, y, TZ) == am_mong_doi


def test_truoc_tet_van_thuoc_nam_am_cu() -> None:
    """05/02/1988 dương: Tết Mậu Thìn là 17/02 → vẫn là tháng Chạp Đinh Mão."""
    day, month, year, leap = lunar.solar_to_lunar(5, 2, 1988, TZ)
    assert year == 1987
    assert month == 12
    assert leap == 0


def test_cap_da_nghiem_tu_nhat_ky() -> None:
    """Cặp từ nhật ký người vận hành: 02/12/1988 dương = 24/10 âm."""
    assert lunar.solar_to_lunar(2, 12, 1988, TZ) == (24, 10, 1988, 0)


def test_su_kien_lich_su() -> None:
    """30/04/1975 = 20/3 âm năm Ất Mão.

    Nguồn đối chiếu ngoài: lịch vạn niên (xemlicham.com, baonghean.vn) —
    thống nhất 20/3, ngày Bính Ngọ, tháng Canh Thìn. Ghi chú quá trình: bản
    nháp test đầu tiên khẳng định 19/3 theo trí nhớ và đã SAI — engine đúng.
    Bài học được giữ lại ở đây: mốc golden phải có nguồn, không lấy từ trí nhớ.
    """
    assert lunar.solar_to_lunar(30, 4, 1975, TZ) == (20, 3, 1975, 0)


# --------------------------------------------------------------------------- #
# Năm nhuận
# --------------------------------------------------------------------------- #
def test_nam_2020_nhuan_thang_4() -> None:
    """2020 âm có tháng 4 nhuận. Không cần biết trước ngày bắt đầu tháng nhuận:
    quét cả năm, tìm mọi ngày mang cờ nhuận, khẳng định chúng đều là tháng 4."""
    import datetime as dt

    thang_nhuan: set[int] = set()
    d = dt.date(2020, 1, 25)          # mùng 1 Tết Canh Tý
    while d < dt.date(2021, 2, 12):   # tới trước Tết Tân Sửu
        _, month, _, leap = lunar.solar_to_lunar(d.day, d.month, d.year, TZ)
        if leap:
            thang_nhuan.add(month)
        d += dt.timedelta(days=1)
    assert thang_nhuan == {4}


def test_nam_am_2020_dai_384_ngay() -> None:
    """Năm nhuận 13 tháng: Tết 2020 (25/01) → Tết 2021 (12/02) = 384 ngày."""
    import datetime as dt

    assert (dt.date(2021, 2, 12) - dt.date(2020, 1, 25)).days == 384


# --------------------------------------------------------------------------- #
# Vòng khứ hồi — bất biến không cần nguồn ngoài
# --------------------------------------------------------------------------- #
def test_khu_hoi_solar_lunar_solar() -> None:
    """Đổi xuôi rồi đổi ngược phải về đúng ngày gốc, quét nhiều năm gồm cả
    năm nhuận và các ngày sát Tết."""
    import datetime as dt

    cac_ngay = [
        dt.date(1970, 2, 5), dt.date(1970, 2, 6), dt.date(1970, 2, 7),
        dt.date(1975, 6, 13), dt.date(1988, 12, 2), dt.date(2000, 1, 1),
        dt.date(2004, 3, 25), dt.date(2020, 5, 25), dt.date(2020, 6, 25),
        dt.date(2024, 2, 9), dt.date(2024, 2, 10),
    ]
    for ngay in cac_ngay:
        ld, lm, ly, leap = lunar.solar_to_lunar(ngay.day, ngay.month, ngay.year, TZ)
        lai = lunar.lunar_to_solar(ld, lm, ly, leap, TZ)
        assert lai == (ngay.day, ngay.month, ngay.year), f"khu hoi hong tai {ngay}"


def test_lunar_to_solar_tu_choi_thang_nhuan_khong_ton_tai() -> None:
    """2024 không nhuận tháng 4 — khai nhuận bừa phải bị từ chối."""
    with pytest.raises(ValueError):
        lunar.lunar_to_solar(1, 4, 2024, 1, TZ)


# --------------------------------------------------------------------------- #
# Can chi năm — phụ thuộc năm ÂM, không phải năm dương
# --------------------------------------------------------------------------- #
def test_can_chi_nam() -> None:
    assert lunar.can_chi_nam(1984) == ("Giáp", "Tý")
    assert lunar.can_chi_nam(1988) == ("Mậu", "Thìn")
    assert lunar.can_chi_nam(1970) == ("Canh", "Tuất")
    assert lunar.can_chi_nam(2000) == ("Canh", "Thìn")
    assert lunar.can_chi_nam(2024) == ("Giáp", "Thìn")


def test_can_chi_truoc_tet_lay_nam_cu() -> None:
    """Điểm hay sai nhất toàn ngành: sinh 05/02/1988 (trước Tết 17/02) thì
    năm can chi là Đinh Mão 1987, KHÔNG phải Mậu Thìn 1988."""
    _, _, nam_am, _ = lunar.solar_to_lunar(5, 2, 1988, TZ)
    assert lunar.can_chi_nam(nam_am) == ("Đinh", "Mão")


# ---- AL: kiểm tra ngày âm không tồn tại + tháng nhuận + can chi (test viết trước) ----------
import pytest as _pt


def test_ngay_30_cua_thang_thieu_bi_tu_choi():
    # Tháng Giêng Giáp Thìn 2024 chỉ có 29 ngày (mùng 1 tháng 2 = 10/03/2024).
    assert lunar.lunar_to_solar(29, 1, 2024, 0, 7) == (9, 3, 2024)
    with _pt.raises(ValueError, match="29 ngày"):
        lunar.lunar_to_solar(30, 1, 2024, 0, 7)


@_pt.mark.parametrize("ngay", [0, 31])
def test_ngay_am_ngoai_khoang(ngay):
    with _pt.raises(ValueError):
        lunar.lunar_to_solar(ngay, 1, 2024, 0, 7)


@_pt.mark.parametrize("nam,thang", [(2023, 2), (2020, 4), (2017, 6), (2025, 6), (2024, None), (1987, 7)])
def test_thang_nhuan(nam, thang):
    assert lunar.thang_nhuan(nam, 7) == thang


def test_thang_nhuan_1987_lech_lich_trung_quoc():
    # Lịch Việt (UTC+7) nhuận tháng 7, lịch Trung Quốc (UTC+8) nhuận tháng 6 — khác biệt có thật.
    assert lunar.thang_nhuan(1987, 8) == 6


def test_thang_nhuan_khop_vet_can_1900_2100():
    import datetime as dt
    d, gap = dt.date(1900, 1, 31), {}
    while d.year < 2100:
        ng, th, na, nh = lunar.solar_to_lunar(d.day, d.month, d.year, 7)
        if nh and ng == 1:
            gap[na] = th
        d += dt.timedelta(days=29 if ng == 1 else 1)
    for y in range(1901, 2099):
        assert lunar.thang_nhuan(y, 7) == gap.get(y), y


def test_so_ngay_thang():
    assert lunar.so_ngay_thang(1, 2024, 0, 7) == 29
    assert lunar.so_ngay_thang(12, 2023, 0, 7) == 30        # Chạp Quý Mão: 11/01–09/02/2024


def test_can_chi_ngay_thang():
    # Mốc: 01/01/2000 là ngày Mậu Ngọ; tháng Giêng năm Giáp Thìn 2024 là tháng Bính Dần.
    import datetime as dt
    assert lunar.can_chi_ngay(dt.date(2000, 1, 1)) == ("Mậu", "Ngọ")
    assert lunar.can_chi_thang(1, 2024) == ("Bính", "Dần")
    assert lunar.can_chi_thang(12, 2023) == ("Ất", "Sửu")     # tháng Chạp Quý Mão
