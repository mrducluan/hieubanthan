# -*- coding: utf-8 -*-
"""Múi giờ lịch sử và ranh giới giờ Tý.

Đây là tầng dễ sai nhất và sai âm thầm nhất của toàn hệ thống: sai một giờ thì
trụ ngày đổi, và bản luận vẫn trôi chảy như thường, không có dấu hiệu nào.
"""
from __future__ import annotations

from datetime import date, datetime

import pytest

from app import config
from app.calc import timebase
from app.config import Region, TyBoundary


# --------------------------------------------------------------------------- #
# Múi giờ đồng hồ theo lịch sử
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize(
    "ngay, vung, mong_doi",
    [
        (date(1970, 5, 1), Region.SOUTH, 8.0),   # VNCH đang dùng UTC+8
        (date(1965, 3, 3), Region.SOUTH, 8.0),
        (date(1975, 6, 13), Region.SOUTH, 7.0),  # đúng ngày thống nhất múi giờ
        (date(1975, 6, 12), Region.SOUTH, 8.0),  # trước đó một ngày vẫn +8
        (date(1980, 1, 1), Region.SOUTH, 7.0),
        (date(1950, 5, 1), Region.SOUTH, 7.0),   # trước khi VNCH đổi
        (date(1944, 1, 1), Region.SOUTH, 8.0),   # thời Nhật chiếm đóng
        (date(1988, 12, 2), Region.NORTH, 7.0),
        (date(2000, 1, 1), Region.NORTH, 7.0),
    ],
)
def test_clock_offset(ngay: date, vung: Region, mong_doi: float) -> None:
    offset, _ = timebase.clock_offset(ngay, vung)
    assert offset == mong_doi


def test_mien_nam_1960_la_ranh_gioi_cung() -> None:
    assert timebase.clock_offset(date(1959, 12, 31), Region.SOUTH)[0] == 7.0
    assert timebase.clock_offset(date(1960, 1, 1), Region.SOUTH)[0] == 8.0


def test_mien_bac_giai_doan_tranh_cai_phai_gan_co() -> None:
    """Nguồn mâu thuẫn thì phải báo, không được im lặng đưa ra một con số."""
    _, disputed = timebase.clock_offset(date(1965, 6, 1), Region.NORTH)
    assert disputed is True


def test_ngoai_giai_doan_tranh_cai_thi_khong_gan_co() -> None:
    _, disputed = timebase.clock_offset(date(1990, 6, 1), Region.NORTH)
    assert disputed is False


def test_sinh_nuoc_ngoai_phai_tu_khai() -> None:
    with pytest.raises(ValueError):
        timebase.clock_offset(date(1990, 1, 1), Region.ABROAD)


# --------------------------------------------------------------------------- #
# Quy đổi về kinh tuyến lịch
# --------------------------------------------------------------------------- #
def test_quy_doi_ve_kinh_tuyen_lich() -> None:
    """Sinh 00:30 ngày 02/12/1970 tại Sài Gòn (đồng hồ UTC+8).
    Theo kinh tuyến lịch UTC+7 thì đó vẫn là 23:30 ngày 01/12."""
    kq = timebase.to_calendar_time(
        datetime(1970, 12, 2, 0, 30), Region.SOUTH
    )
    assert kq.calendar_dt == datetime(1970, 12, 1, 23, 30)
    assert kq.clock_offset == 8.0


def test_khong_lech_khi_dong_ho_trung_kinh_tuyen() -> None:
    kq = timebase.to_calendar_time(datetime(1990, 5, 5, 10, 0), Region.NORTH)
    assert kq.calendar_dt == datetime(1990, 5, 5, 10, 0)


# --------------------------------------------------------------------------- #
# Ranh giới giờ Tý — chính sách bắt buộc khai báo
# --------------------------------------------------------------------------- #
def test_engine_tu_choi_khi_chua_chot_chinh_sach(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(config, "TY_BOUNDARY_POLICY", None)
    with pytest.raises(RuntimeError, match="TY_BOUNDARY_POLICY"):
        config.require_ty_boundary()


@pytest.mark.parametrize(
    "policy, gio, ngay_can_chi_lech",
    [
        (TyBoundary.SWITCH_AT_2300, 23, 1),   # 23:xx sang ngày hôm sau
        (TyBoundary.SWITCH_AT_2300, 22, 0),
        (TyBoundary.SWITCH_AT_2300, 0, 0),
        (TyBoundary.SWITCH_AT_0000, 23, 0),   # 23:xx vẫn thuộc ngày hôm đó
        (TyBoundary.SWITCH_AT_0000, 0, 0),
    ],
)
def test_ngay_can_chi_theo_chinh_sach(
    monkeypatch: pytest.MonkeyPatch,
    policy: TyBoundary,
    gio: int,
    ngay_can_chi_lech: int,
) -> None:
    monkeypatch.setattr(config, "TY_BOUNDARY_POLICY", policy)
    goc = datetime(1990, 6, 15, gio, 30)
    ngay = timebase.ngay_can_chi(goc)
    assert (ngay - goc.date()).days == ngay_can_chi_lech


def test_hai_chinh_sach_cho_ket_qua_khac_nhau_o_23h(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Bằng chứng cụ thể vì sao hằng này không được phép có giá trị mặc định."""
    goc = datetime(1990, 6, 15, 23, 30)

    monkeypatch.setattr(config, "TY_BOUNDARY_POLICY", TyBoundary.SWITCH_AT_2300)
    a = timebase.ngay_can_chi(goc)
    monkeypatch.setattr(config, "TY_BOUNDARY_POLICY", TyBoundary.SWITCH_AT_0000)
    b = timebase.ngay_can_chi(goc)

    assert a != b


# --------------------------------------------------------------------------- #
# Cờ độ chính xác
# --------------------------------------------------------------------------- #
@pytest.mark.parametrize("gio, mong_doi", [(23, True), (0, True), (12, False), (22, False)])
def test_gan_co_gio_sat_bien(gio: int, mong_doi: bool) -> None:
    assert timebase.sat_bien_gio_ty(datetime(1990, 1, 1, gio, 15)) is mong_doi
