# -*- coding: utf-8 -*-
"""TV-ZW "Cùng sao Mệnh" — đường tính nhanh chính tinh cung Mệnh (Python thuần) + bảng tỉ lệ dựng sẵn.

Viết TRƯỚC hàm. Đường nhanh phải trùng khít lá số iztro (bộ an sao thật của engine) trên 1.000 lá `lasotuvi_1000.json`
và trên các ngày dễ lệch (nửa sau tháng nhuận, ngày 30, quanh Tết, giờ Tý muộn); bảng tỉ lệ phải dựng lại ra đúng tệp
đã lưu (tất định) và tổng = 100 %.
"""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import lunar, tuvi_an_sao as az, tuvi_sao_menh as sm
from tests._tuvi_1000 import DAU_VAO, la_1000


def _menh_iztro(la: dict) -> tuple[list[str], bool]:
    p = la["palaces"]
    i = next(k for k, x in enumerate(p) if x["name"] == "Mệnh")
    muon = not p[i]["majorStars"]
    c = p[(i + 6) % 12] if muon else p[i]
    return [s["name"] for s in c["majorStars"]], muon


def _nhanh(d: dt.date, ti: int) -> tuple[list[str], bool]:
    r = sm.sao_menh(d, ti)
    return r["sao"], r["muon"]


def test_chi_menh_khau_quyet():
    # tháng Giêng giờ Tý → Mệnh ở Dần; mỗi tháng tiến 1, mỗi giờ lùi 1
    assert sm.chi_menh(1, 0) == 2
    assert sm.chi_menh(2, 0) == 3
    assert sm.chi_menh(1, 1) == 1
    assert sm.chi_menh(12, 11) == (2 + 11 - 11) % 12


def test_tu_vi_theo_cuc_vi_du_sach():
    # Thủy nhị cục, ngày 1 → Sửu; ngày 2 → Dần; Hỏa lục cục ngày 1 → Dậu (bảng an Tử Vi kinh điển)
    assert sm.chi_tu_vi(1, 2) == 1
    assert sm.chi_tu_vi(2, 2) == 2
    assert sm.chi_tu_vi(1, 6) == 9
    assert sm.chi_tu_vi(30, 2) == 4          # 30/2 = 15 → Dần + 14 = Thìn
    for cuc in (2, 3, 4, 5, 6):
        assert {sm.chi_tu_vi(n, cuc) for n in range(1, 31)} <= set(range(12))


def test_duong_nhanh_trung_iztro_1000_la():
    sai = [(d, ti) for (d, ti, _), la in zip(DAU_VAO, la_1000()) if _nhanh(d, ti) != _menh_iztro(la)]
    assert len(DAU_VAO) == 1000
    assert sai == [], sai[:5]


def _dl(*a) -> dt.date:
    d, m, y = lunar.lunar_to_solar(*a)
    return dt.date(y, m, d)


def _ngay_kho() -> list[tuple[dt.date, int]]:
    """Ngày dễ lệch: nửa sau tháng nhuận (cả tháng Chạp nhuận), ngày 30, đêm giao thừa / mùng 1, giờ Tý muộn."""
    ra: list[tuple[dt.date, int]] = []
    for nam in (1941, 1944, 1949, 1952, 1955, 1957, 1963, 1966, 1968, 1971, 1974, 1979, 1982, 1984, 1987, 1990, 1993,
                1995, 1998, 2001, 2004, 2006, 2009):
        th = lunar.thang_nhuan(nam, 7.0)
        if th:
            for ng, ti in ((16, 3), (29, 7), (2, 11)):
                try:
                    ra.append((_dl(ng, th, nam, 1, 7.0), ti))
                except ValueError:
                    pass
        tet = _dl(1, 1, nam, 0, 7.0)
        ra += [(tet - dt.timedelta(days=1), 5), (tet, 0), (tet - dt.timedelta(days=1), 12)]
        for th2 in (3, 8):
            try:
                ra.append((_dl(30, th2, nam, 0, 7.0), 9))
            except ValueError:
                ra.append((_dl(29, th2, nam, 0, 7.0), 12))
    return ra


def test_duong_nhanh_trung_iztro_ngay_kho():
    ds = _ngay_kho()
    assert len(ds) >= 120
    sai = [(d, ti) for d, ti in ds if _nhanh(d, ti) != _menh_iztro(az.an_sao_tho(d, ti, "nam"))]
    assert sai == [], sai[:5]


def test_gioi_tinh_khong_doi_chinh_tinh():
    d = dt.date(1990, 7, 15)
    assert _menh_iztro(az.an_sao_tho(d, 4, "nam")) == _menh_iztro(az.an_sao_tho(d, 4, "nu"))


def test_bang_dung_lai_trung_tep_va_tong_100():
    tep = sm.bang()
    moi = sm.dem_mau()
    assert moi == {k: tep[k] for k in moi}, "Bảng lưu lệch phép tính — chạy scripts/sinh_tuvi_sao_menh.py"
    so_ngay = (sm.DEN - sm.TU).days + 1
    assert tep["tong"] == so_ngay * 12 == sum(tep["dem"].values())
    assert sum(v / tep["tong"] for v in tep["dem"].values()) == pytest.approx(1.0)


def test_khoa_va_ty_le():
    assert sm.khoa(["Thiên Phủ", "Tử Vi"], False) == "Tử Vi + Thiên Phủ"        # thứ tự chuẩn, không theo đầu vào
    assert sm.khoa(["Thái Dương", "Thiên Lương"], True) == "vô chính diệu (mượn Thái Dương + Thiên Lương)"
    t = sm.ty_le(["Tử Vi"], False)
    assert 0 < t["ty_le"] < 1 and t["so"] == sm.bang()["dem"]["Tử Vi"]
    assert t["hang"] >= 1 and t["so_to_hop"] == len(sm.bang()["dem"])
    assert sm.ty_le(["Tử Vi", "Thất Sát", "Phá Quân"], False) is None              # tổ hợp không thể có
    # mọi tổ hợp trong bảng đều đọc lại được, hạng 1 = tổ hợp gặp nhiều nhất
    dem = sm.bang()["dem"]
    dau = max(dem, key=dem.get)
    assert sm.ty_le_theo_khoa(dau)["hang"] == 1


def test_tat_dinh():
    assert sm.dem_mau() == sm.dem_mau()
    d = dt.date(1975, 4, 30)
    assert sm.sao_menh(d, 6) == sm.sao_menh(d, 6)
