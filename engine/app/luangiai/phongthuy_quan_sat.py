# -*- coding: utf-8 -*-
"""TY-2 (2026-11-25) — "Nhìn quanh nhà": điều Dương Trạch Thập Thư không gắn với dấu hiệu trong nhà thành câu hỏi quan sát.

KB `phongthuy_sach_ghi.json`: mục có trường `quan_sat` {nhom, hoi}; tên nhóm ở `quan_sat_nhom`. Người dùng TỰ TÍCH điều
mình thấy quanh nhà (chỉ mã, lưu trên máy) → câu sách tương ứng đi qua MỘT khuôn SX-C (`sach_ghi_mon.khoi`: nhóm C chỉ tới
người đọc từ 16 tuổi, câu kết, lời tham khảo). Không chấm mức, không đổi mức bài đọc nào, không sinh câu mới. Chỉ bản Việt
(kho Thập Thư chưa có lời tiếng Anh).
"""
from __future__ import annotations

from app import ngon_ngu
from app.kb import nap
from app.luangiai import sach_ghi_mon as sm

TEP = "phongthuy_sach_ghi.json"
TOI_DA_CHON = 60


def _kb() -> dict:
    return nap.doc(TEP)


def _muc() -> dict[str, dict]:
    return {m["ma"]: m for m in _kb()["dieu"] if m.get("quan_sat") and m.get("con_ap_dung", True)}


def ma_hop_le() -> frozenset[str]:
    return frozenset(_muc())


def danh_sach() -> dict:
    """Câu hỏi theo nhóm (thứ tự theo KB). Bản khác tiếng Việt: rỗng."""
    if not ngon_ngu.la_viet():
        return {"nhom": []}
    ten = _kb()["quan_sat_nhom"]
    nhom: dict[str, list[dict]] = {k: [] for k in ten if not k.startswith("_")}
    for ma, m in _muc().items():
        nhom[m["quan_sat"]["nhom"]].append({"ma": ma, "hoi": m["quan_sat"]["hoi"]})
    return {"nhom": [{"ma": k, "ten": ten[k], "cau": v} for k, v in nhom.items() if v]}


def cap(chon: list[str]) -> list[tuple[str, str, list[tuple[dict, str]]]]:
    """Mã đã tích → nhóm (mã, tên, [(mục KB, câu hỏi)]) cho khuôn SX-C. Mã lạ bị bỏ."""
    muc = _muc()
    ten = _kb()["quan_sat_nhom"]
    co = set(chon)
    ra = []
    for k in (x for x in ten if not x.startswith("_")):
        cac = [(m, m["quan_sat"]["hoi"]) for ma, m in muc.items() if ma in co and m["quan_sat"]["nhom"] == k]
        if cac:
            ra.append((f"quan_sat_{k}", ten[k], cac))
    return ra


def doc(chon: list[str], tuoi: int | None) -> dict:
    """Khối "Sách xưa ghi" cho các điều đã tích + số mục nhóm C đang ẩn (để web mời người đọc xác nhận đủ tuổi)."""
    if not ngon_ngu.la_viet():
        return {"sach_ghi": None, "so_chon": 0}
    nhom = cap(chon)
    sach = sm.khoi(nhom, tuoi)
    ra: dict = {"sach_ghi": sach, "so_chon": sum(len(c) for _, _, c in nhom)}
    if tuoi is None or tuoi < sm.TUOI_NHOM_C:
        an = (sm.khoi(nhom, 99) or {}).get("so_muc", 0) - (sach or {}).get("so_muc", 0)
        if an > 0 and tuoi is None:
            ra["nhom_c_an"] = an
    return ra
