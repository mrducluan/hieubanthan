# -*- coding: utf-8 -*-
"""Đợt 3 — Bộ tra cứu tất định cho KB Tử Vi Lương phái (672 Tượng), Trung Châu phái (60 Tinh Hệ) & Bát Tự (Thiên Lý Mệnh Cảo)."""
from __future__ import annotations

from app.kb.nap import doc, nho

_SAO_VI_HAN = {
    "Tử Vi": "紫微", "Thiên Cơ": "天機", "Thái Dương": "太陽", "Vũ Khúc": "武曲",
    "Thiên Đồng": "天同", "Liêm Trinh": "廉貞", "Thiên Phủ": "天府", "Thái Âm": "太陰",
    "Tham Lang": "貪狼", "Cự Môn": "巨門", "Thiên Tướng": "天相", "Thiên Lương": "天梁",
    "Thất Sát": "七殺", "Phá Quân": "破軍",
}

_THAP_THAN_RULE = {
    "Thất Sát": "that_sat_che_kiep_cuu_tai",
    "Thực Thần": "thuc_than_tuoc_tho",
    "Chính Ấn": "chinh_thien_an_ho_than",
    "Thiên Ấn": "chinh_thien_an_ho_than",
}


@nho
def _luong() -> dict:
    return doc("tuvi_phi_hoa_luong_672.json")


@nho
def _trung_chau() -> dict:
    return doc("tuvi_trung_chau_60_tinh_he.json")


@nho
def _thien_ly() -> dict:
    return doc("battu_thien_ly_menh_cao.json")


NHAN_LUONG = "Theo cách đọc phái Phi tinh (Lương Nhược Du) — ban biên tập tóm ý"
NHAN_TRUNG_CHAU = "Theo Tử vi Trung Châu phái (Vương Đình Chi) — ban biên tập tóm ý"


def tra_phi_hoa_luong(tu_cung: str, hoa: str, den_cung: str | None) -> dict | None:
    """Tra 1 tượng phi hoá theo phái Lương Nhược Du. KB là lời TÓM Ý của ban biên tập (sách hiện đại còn bản quyền — không
    giữ nguyên văn, PR #320): trả `y_chinh` + lĩnh vực + hướng + trang để đối chiếu, kèm quy tắc hai chiều của Hoá."""
    if not den_cung:
        return None
    kb = _luong()
    muc = (kb.get("tuong") or {}).get(f"{tu_cung}|{hoa}|{den_cung}")
    if not muc:
        return None
    qt = (kb.get("quy_tac_hai_chieu") or {}).get(hoa) or {}
    return {
        "y_chinh": muc.get("y_chinh"),
        "linh_vuc": list(muc.get("linh_vuc") or []),
        "huong": muc.get("huong"),
        "trang": muc.get("trang"),
        "mat_tich_cuc": qt.get("mat_tich_cuc"),
        "mat_tieu_cuc_can_chu_y": qt.get("mat_tieu_cuc_can_chu_y"),
        "nhan": NHAN_LUONG,
        "nguon": "Lương Nhược Du — Thập nhị cung lục thất nhị tượng (tóm ý)",
    }


def tra_tinh_he_trung_chau(chinh_tinh: list[str], chi: str) -> dict | None:
    """Khớp chính tinh (tên Việt) + địa chi cung Mệnh (tên Việt) vào đúng 1 trong 60 tinh hệ Trung Châu (tóm ý)."""
    if not chi or not chinh_tinh:
        return None
    sao = {s for s in chinh_tinh if s in _SAO_VI_HAN}
    if not sao:
        return None
    kb = _trung_chau()
    nt = kb.get("nguyen_tac_luan") or {}
    for th in kb.get("tinh_he") or []:
        if chi in (th.get("cung_chi") or []) and set(th.get("chinh_tinh") or []) == sao:
            return {
                "ma": th["ma"],
                "so": th["so"],
                "ten": th["ten"],
                "cung_chi": list(th["cung_chi"]),
                "y_chinh": th["y_chinh"],
                "linh_vuc": list(th.get("linh_vuc") or []),
                "huong": th.get("huong"),
                "trang": th.get("trang"),
                "nhan": NHAN_TRUNG_CHAU,
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
