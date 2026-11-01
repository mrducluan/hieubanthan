# -*- coding: utf-8 -*-
"""Hàm chạy chung cho test EN-3 (một hồ sơ mẫu cho 5 mảng)."""
import datetime as dt

from app.hoidap import battu, kinhdich, phongthuy, tuvi
from app.narrative import hoi_van

XEM = dt.date(2026, 11, 1)


def chay(md: str, c: str) -> dict:
    if md == "thanso":
        return hoi_van.tra_loi(c, {"ho_ten": ["Nguyễn Thị Mai Anh"], "ngay": 17, "thang": 5, "nam": 1990,
                                   "quy_uoc": "tung_phan"}, None, XEM, dung_llm=False)
    if md == "tuvi":
        return tuvi.tra_loi(c, "tham_khao", sinh={"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nu"}, ngay_xem=XEM)
    if md == "battu":
        return battu.tra_loi(c, sinh={"lich": dt.datetime(1990, 5, 17, 12), "gioi_tinh": "nu", "gio_ty": "da_ty"},
                             ngay_xem=XEM)
    if md == "phongthuy":
        return phongthuy.tra_loi(c, sinh={"nam": 1990, "gioi_tinh": "nu", "ngay": dt.date(1990, 5, 17),
                                          "moc_nam": "lap_xuan"}, ngay_xem=XEM)
    return kinhdich.tra_loi(c, "tu_dong", gia_tri_hao=[7, 8, 9, 7, 6, 8], thoi_diem=dt.datetime(2026, 11, 1, 9),
                            cach_ra_que="gieo_tay")
