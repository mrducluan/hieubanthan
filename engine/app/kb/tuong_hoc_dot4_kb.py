# -*- coding: utf-8 -*-
"""Đợt 4 — Bộ tra cứu tất định cho Nhân Tướng (Bridges + 150 quy tắc cổ thư), Chỉ Tay phương Tây, Kỳ Môn Cửu Độn & Tử Vi Tử Vân."""
from __future__ import annotations

from functools import lru_cache

from app.kb.nap import doc


@lru_cache(maxsize=1)
def nhantuong_bridges_co_thu() -> dict:
    return doc("nhantuong_ngu_hanh_va_co_thu.json")


@lru_cache(maxsize=1)
def chitay_phuong_tay() -> dict:
    return doc("chitay_phuong_tay_kinh_dien.json")


@lru_cache(maxsize=1)
def kymon_cuu_don() -> dict:
    return doc("ky_mon_bi_kip_cuu_don.json")


@lru_cache(maxsize=1)
def tuvi_tu_van() -> dict:
    return doc("tuvi_tu_van_thai_tue.json")


def tra_ngu_hanh_bridges(hanh: str) -> dict | None:
    """Tra hình tướng Ngũ Hành Lillian Bridges: thuy | moc | hoa | tho | kim."""
    return (nhantuong_bridges_co_thu().get("ngu_hanh_bridges") or {}).get(hanh.lower())


def tra_cuu_don_cung(can_thien: str, can_dia: str, cua: str, than: str, cung_so: int) -> list[dict]:
    """Nhận diện các cách Cửu Độn (Kỳ Môn Bí Kíp Đại Toàn Q.21) xuất hiện tại 1 cung cụ thể."""
    kb = kymon_cuu_don().get("cuu_don") or {}
    khop: list[str] = []
    tam_ky = can_thien in ("Ất", "Bính", "Đinh")
    tam_cat = cua in ("Khai", "Hưu", "Sinh")
    if can_thien == "Bính" and cua == "Sinh" and can_dia == "Đinh":
        khop.append("thien_don")
    if can_thien == "Ất" and cua == "Khai" and can_dia == "Kỷ":
        khop.append("dia_don")
    if can_thien == "Đinh" and cua == "Hưu" and than == "Thái Âm":
        khop.append("nhan_don")
    if can_thien == "Bính" and cua == "Sinh" and than == "Cửu Thiên":
        khop.append("than_don")
    if can_thien == "Đinh" and cua in ("Hưu", "Đỗ", "Khai") and than == "Cửu Địa":
        khop.append("quy_don")
    if tam_ky and tam_cat and cung_so == 4:
        khop.append("phong_don")
    if can_thien == "Ất" and tam_cat and (can_dia == "Tân" or cung_so == 2):
        khop.append("van_don")
    if can_thien == "Ất" and tam_cat and (can_dia == "Quý" or cung_so == 1):
        khop.append("long_don")
    if can_thien == "Ất" and cua == "Sinh" and (can_dia == "Tân" or cung_so == 8):
        khop.append("ho_don")
    return [{"ma": m, **kb[m]} for m in khop if m in kb]
