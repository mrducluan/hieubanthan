# -*- coding: utf-8 -*-
"""Đợt 3 — Bộ tra cứu tất định cho KB Tử Vi Lương phái (672 Tượng), Trung Châu phái (60 Tinh Hệ) & Bát Tự (Thiên Lý Mệnh Cảo)."""
from __future__ import annotations

from functools import lru_cache

from app.kb.nap import doc

_SAO_VI_HAN = {
    "Tử Vi": "紫微", "Thiên Cơ": "天機", "Thái Dương": "太陽", "Vũ Khúc": "武曲",
    "Thiên Đồng": "天同", "Liêm Trinh": "廉貞", "Thiên Phủ": "天府", "Thái Âm": "太陰",
    "Tham Lang": "貪狼", "Cự Môn": "巨門", "Thiên Tướng": "天相", "Thiên Lương": "天梁",
    "Thất Sát": "七殺", "Phá Quân": "破軍",
}

_CHI_VI_HAN = {
    "Tý": "子", "Sửu": "丑", "Dần": "寅", "Mão": "卯", "Thìn": "辰", "Tỵ": "巳",
    "Ngọ": "午", "Mùi": "未", "Thân": "申", "Dậu": "酉", "Tuất": "戌", "Hợi": "亥",
}

_THAP_THAN_RULE = {
    "Thất Sát": "that_sat_che_kiep_cuu_tai",
    "Thực Thần": "thuc_than_tuoc_tho",
    "Chính Ấn": "chinh_thien_an_ho_than",
    "Thiên Ấn": "chinh_thien_an_ho_than",
}


@lru_cache(maxsize=1)
def _luong() -> dict:
    return doc("tuvi_phi_hoa_luong_672.json")


@lru_cache(maxsize=1)
def _trung_chau() -> dict:
    return doc("tuvi_trung_chau_60_tinh_he.json")


@lru_cache(maxsize=1)
def _thien_ly() -> dict:
    return doc("battu_thien_ly_menh_cao.json")


def tra_phi_hoa_luong(tu_cung: str, hoa: str, den_cung: str | None) -> dict | None:
    """Tra 1 tượng trong bộ 672 Tượng của Lương Nhược Du (kèm quy tắc 2 chiều của Tứ Hóa tương ứng)."""
    if not den_cung:
        return None
    kb = _luong()
    muc = (kb.get("tuong") or {}).get(f"{tu_cung}|{hoa}|{den_cung}")
    if not muc:
        return None
    qt = (kb.get("quy_tac_hai_chieu") or {}).get(hoa) or {}
    return {
        "sach_ghi": muc.get("sach_ghi"),
        "mat_tich_cuc": qt.get("mat_tich_cuc"),
        "mat_tieu_cuc_can_chu_y": qt.get("mat_tieu_cuc_can_chu_y"),
        "nguon": "Lương Nhược Du — Thập Nhị Cung Lục Thất Nhị Tượng",
    }


def tra_tinh_he_trung_chau(chinh_tinh: list[str], chi: str) -> dict | None:
    """Khớp chính tinh + Địa Chi cung Mệnh vào đúng 1 trong 60 Tinh Hệ Trung Châu của Vương Đình Chi."""
    chi_h = _CHI_VI_HAN.get(chi)
    if not chi_h or not chinh_tinh:
        return None
    sao_h = {_SAO_VI_HAN[s] for s in chinh_tinh if s in _SAO_VI_HAN}
    if not sao_h:
        return None
    kb = _trung_chau()
    nt = kb.get("nguyen_tac_luan") or {}
    for th in kb.get("tinh_he") or []:
        cung_chi = th.get("cung_chi") or ""
        ten_han = th.get("ten_han") or ""
        if chi_h not in cung_chi:
            continue
        if all(s in ten_han for s in sao_h) and sum(1 for v in _SAO_VI_HAN.values() if v in ten_han) == len(sao_h):
            return {
                "ma": th["ma"],
                "so": th["so"],
                "ten_han": th["ten_han"],
                "cung_chi": cung_chi,
                "sach_ghi": th["sach_ghi"],
                "mat_tich_cuc": nt.get("mat_tich_cuc"),
                "mat_tieu_cuc_can_chu_y": nt.get("mat_tieu_cuc_can_chu_y"),
            }
    return None


def tra_thien_ly_menh_cao(thap_than: str | None = None) -> list[dict]:
    """Lấy các quy tắc Thiên Lý Mệnh Cảo khớp với Thập Thần / Cách Cục của lá số Bát Tự."""
    rules = _thien_ly().get("quy_tac_thap_than_va_cach_cuc") or {}
    ma_chon = []
    if thap_than and thap_than in _THAP_THAN_RULE:
        ma_chon.append(_THAP_THAN_RULE[thap_than])
    for mac in ("nhan_nguyen_tang_can", "cach_cuc_thanh_bai"):
        if mac not in ma_chon:
            ma_chon.append(mac)
    return [{"ma": m, **rules[m]} for m in ma_chon if m in rules]
