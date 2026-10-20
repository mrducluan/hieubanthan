# -*- coding: utf-8 -*-
"""Tỉ lệ "bạn hiếm cỡ nào" — đếm trên MỌI ngày sinh 01/01/1940–31/12/2010 (không cần dữ liệu người dùng): bao nhiêu
ngày cho cùng Đường đời, và cùng cặp (Đường đời, số Ngày sinh). Đáp án đối chiếu bằng vòng đếm độc lập trong test."""
from __future__ import annotations

import datetime as dt

from app.calc import thanso, thanso_mo_rong as mr, thanso_ty_le as tl


def _dem_doc_lap(dd: int, sns: int, quy_uoc: str) -> tuple[int, int, int]:
    tong = cung_dd = cung_cap = 0
    d = dt.date(1940, 1, 1)
    while d <= dt.date(2010, 12, 31):
        x = thanso.duong_doi(d.day, d.month, d.year, quy_uoc)
        tong += 1
        if x == dd:
            cung_dd += 1
            cung_cap += mr.so_ngay_sinh(d.day) == sns
        d += dt.timedelta(days=1)
    return tong, cung_dd, cung_cap


def test_ty_le_khop_dem_doc_lap():
    for quy_uoc in ("tung_phan", "tong_het"):
        kq = tl.ty_le(24, 10, 1988, quy_uoc)
        tong, cung_dd, cung_cap = _dem_doc_lap(kq["duong_doi"]["so"], kq["cap"]["ngay_sinh"], quy_uoc)
        assert kq["tong_ngay"] == tong == 25933
        assert kq["duong_doi"]["so_ngay"] == cung_dd and kq["cap"]["so_ngay"] == cung_cap
        assert abs(kq["duong_doi"]["ty_le"] - cung_dd / tong) < 1e-12


def test_moi_duong_doi_cong_lai_bang_1():
    bang = tl.bang_duong_doi("tung_phan")
    assert abs(sum(bang.values()) - 1) < 1e-9 and set(bang) <= {1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33}
    assert tl.ty_le(24, 10, 1988, "tung_phan")["duong_doi"]["so"] == 6
    assert tl.ty_le(24, 10, 1988, "tong_het")["duong_doi"]["so"] == 33
    # Số cái hiếm hơn hẳn số thường.
    assert bang.get(33, 0) < min(bang[n] for n in range(1, 10))
