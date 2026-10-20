# -*- coding: utf-8 -*-
"""Tỉ lệ ngày sinh cho cùng con số — "bạn hiếm cỡ nào" (gói Bản đồ con số).

Đếm trên MỌI ngày dương lịch 01/01/1940–31/12/2010 (mẫu cố định, không dùng dữ liệu người dùng; mỗi ngày tính như
nhau — không phải thống kê dân số thật). Trả tỉ lệ ngày có cùng Đường đời, và cùng cặp (Đường đời, số Ngày sinh).
Tầng CALC: thuần, tất định, không LLM, không DB. Bảng đếm dựng một lần mỗi quy ước rồi giữ trong bộ nhớ.
"""
from __future__ import annotations

import collections
import datetime as dt
import functools

from app.calc import thanso, thanso_mo_rong as mr

TU, DEN = dt.date(1940, 1, 1), dt.date(2010, 12, 31)


@functools.lru_cache(maxsize=2)
def _dem(quy_uoc: str) -> tuple[int, collections.Counter, collections.Counter]:
    theo_dd: collections.Counter = collections.Counter()
    theo_cap: collections.Counter = collections.Counter()
    d, tong = TU, 0
    while d <= DEN:
        x = thanso.duong_doi(d.day, d.month, d.year, quy_uoc)
        theo_dd[x] += 1
        theo_cap[(x, mr.so_ngay_sinh(d.day))] += 1
        tong += 1
        d += dt.timedelta(days=1)
    return tong, theo_dd, theo_cap


def bang_duong_doi(quy_uoc: str = "tong_het") -> dict[int, float]:
    tong, theo_dd, _ = _dem(quy_uoc)
    return {k: v / tong for k, v in sorted(theo_dd.items())}


def ty_le(ngay: int, thang: int, nam: int, quy_uoc: str = "tong_het") -> dict:
    tong, theo_dd, theo_cap = _dem(quy_uoc)
    dd = thanso.duong_doi(ngay, thang, nam, quy_uoc)
    sns = mr.so_ngay_sinh(ngay)
    return {
        "tong_ngay": tong, "mau": f"{TU.year}–{DEN.year}",
        "duong_doi": {"so": dd, "so_ngay": theo_dd[dd], "ty_le": theo_dd[dd] / tong},
        "cap": {"duong_doi": dd, "ngay_sinh": sns, "so_ngay": theo_cap[(dd, sns)], "ty_le": theo_cap[(dd, sns)] / tong},
    }
