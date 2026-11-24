# -*- coding: utf-8 -*-
"""Đợt 4 — Bộ tra cứu tất định cho Nhân Tướng (Bridges + 81 quy tắc cổ thư đạt chuẩn SX-C), Chỉ Tay phương Tây, Kỳ Môn Cửu Độn & Tử Vi Tử Vân."""
from __future__ import annotations

from app.kb.nap import doc, nho


@nho
def nhantuong_bridges_co_thu() -> dict:
    return doc("nhantuong_ngu_hanh_va_co_thu.json")


@nho
def chitay_phuong_tay() -> dict:
    return doc("chitay_phuong_tay_kinh_dien.json")


@nho
def kymon_cuu_don() -> dict:
    return doc("ky_mon_bi_kip_cuu_don.json")


@nho
def tuvi_tu_van() -> dict:
    return doc("tuvi_tu_van_thai_tue.json")


def tra_ngu_hanh_bridges(hanh: str) -> dict | None:
    """Tra hình tướng Ngũ Hành Lillian Bridges: thuy | moc | hoa | tho | kim."""
    return (nhantuong_bridges_co_thu().get("ngu_hanh_bridges") or {}).get(hanh.lower())


def tra_cuu_don_cung(can_thien: str, can_dia: str, cua: str, than: str, cung_so: int) -> list[dict]:
    """Nhận diện các cách Cửu Độn (Kỳ Môn Bí Kíp Đại Toàn Q.21) xuất hiện tại 1 cung cụ thể."""
    kb = kymon_cuu_don().get("cuu_don") or {}
    khop: list[str] = []
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
    # Vân / Phong / Long / Hổ Độn theo BÀI CA CHÍNH («歌曰») của Độn Giáp Diễn Nghĩa quyển 2 — cùng điều kiện với
    # calc/ky_mon_cach (van_don, phong_don) để hai khối không nói ngược nhau. Các câu «又曰 / 一云» chỉ ghi ở `sach_ghi_khac`.
    if can_thien == "Ất" and tam_cat and cung_so == 4:
        khop.append("phong_don")
    if can_thien == "Ất" and tam_cat and can_dia == "Tân":
        khop.append("van_don")
    if can_thien == "Ất" and cua == "Hưu" and cung_so == 1:
        khop.append("long_don")
    if can_thien == "Ất" and can_dia == "Tân" and cua == "Hưu" and cung_so == 8:
        khop.append("ho_don")
    return [_cuu_don_ra(m, kb[m]) for m in khop if m in kb]


_TEN_SACH_KM = {"don_giap_dien_nghia": "Độn Giáp Diễn Nghĩa (遁甲演義)"}


def _cuu_don_ra(ma: str, muc: dict) -> dict:
    """Một cách Cửu Độn để hiển thị. `sach_ghi` của KB là mục SX-C (câu Hán là chuỗi con kho nguồn, nhóm A) → đổi sang dạng
    hiển thị: câu Hán + phiên âm + lời Việt + nơi dẫn (sách, quyển). Lời đời thường tóm ý theo Bí Kíp ghi rõ ở `dien_giai_theo`."""
    ra = {"ma": ma, **{k: v for k, v in muc.items() if k not in ("sach_ghi", "sach_ghi_khac")}}
    khac = muc.get("sach_ghi_khac") or {}
    if khac.get("han"):
        noi = _TEN_SACH_KM.get(khac.get("nguon"), "sách xưa")
        ra["sach_ghi_khac"] = {"han": khac["han"], "loi": khac.get("y"),
                               "nguon": f"{noi}, {khac['chuong']}" if khac.get("chuong") else noi}
    sg = muc.get("sach_ghi") or {}
    if sg.get("han"):
        noi = _TEN_SACH_KM.get(sg.get("nguon"), "sách xưa")
        ra["sach_ghi"] = {"han": sg["han"], "am": sg.get("am"), "loi": sg.get("y"),
                          "nguon": f"{noi}, {sg['chuong']}" if sg.get("chuong") else noi}
    return ra
