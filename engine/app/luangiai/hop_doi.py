# -*- coding: utf-8 -*-
"""Hợp đôi có cấu trúc (UI-5, docs/THIET-KE-UI.md §6.2) — RULES ghép CALC + KB, không gọi LLM.

Cặp số theo từng vị trí có ở cả hai người (chỉ ngày sinh → chỉ đường đời; có tên cả hai → thêm
linh hồn, nhân cách, sứ mệnh). Mỗi cặp: điểm hoà · điểm va · việc cùng làm (thanso_cap_so.json).
CỐ Ý không chấm điểm hợp/khắc: không có căn cứ công bố cho một thang điểm như vậy.
"""
from __future__ import annotations

from app.calc import thanso, thanso_mo_rong as mr
from app.config import ENGINE_VERSION
from app.kb import thanso_v2 as kb
from app.luangiai.thanso import _nghia_cua

THU_TU = ("duong_doi", "linh_hon", "nhan_cach", "su_menh")
TEN_VI_TRI = {"duong_doi": "Đường đời", "linh_hon": "Linh hồn", "nhan_cach": "Nhân cách", "su_menh": "Sứ mệnh"}


def _chi_so(nguoi: dict) -> dict[str, int]:
    d, m, y = nguoi["ngay"], nguoi["thang"], nguoi["nam"]
    ten = (nguoi.get("ho_ten") or [None])[0]
    if ten:
        return thanso.chi_so_xac_dinh(ten, d, m, y)
    return {"duong_doi": thanso.duong_doi(d, m, y)}


def luan_hop_doi(a: dict, b: dict) -> dict:
    """Từ ngày sinh (+ tên nếu có) của hai người."""
    return luan_hop_doi_tu_chi_so(_chi_so(a), _chi_so(b))


def luan_hop_doi_tu_chi_so(cs_a: dict[str, int], cs_b: dict[str, int]) -> dict:
    """Từ các CON SỐ đã tính (dùng cho lời mời: link chỉ mang số, không mang ngày sinh)."""
    cap = mr.hop_doi(cs_a, cs_b)
    cac_cap = []
    for vt in THU_TU:
        if vt not in cap:
            continue
        n = kb.nghia_cap(cap[vt])
        cac_cap.append({
            "vi_tri": vt, "ten_vi_tri": TEN_VI_TRI[vt], "so_a": cs_a[vt], "so_b": cs_b[vt], "cap": cap[vt],
            "nghia": {"hoa": n["hoa"], "va": n["va"], "cung_lam": n["cung_lam"]} if n else None,
        })
    meta = kb.nghia_cap(cap["duong_doi"]) or {}

    def _nguoi(cs: dict) -> dict:
        ng = _nghia_cua(cs["duong_doi"])
        return {"duong_doi": cs["duong_doi"], "tu_khoa": ng["tu_khoa"] if ng else None}

    return {
        "engine_version": ENGINE_VERSION,
        "a": _nguoi(cs_a),
        "b": _nguoi(cs_b),
        "cac_cap": cac_cap,
        "cach_doc": ("Không có điểm số hợp hay khắc. Mỗi cặp số cho thấy chỗ hai người dễ hoà, chỗ dễ va, "
                     "và một việc cụ thể nên cùng làm — để hai người tự nhìn lại cách mình đối xử với nhau."),
        "nguon": {k: meta.get(k) for k in ("source_id", "school_id", "trang_thai", "nguon")},
    }
