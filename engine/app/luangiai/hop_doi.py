# -*- coding: utf-8 -*-
"""Hợp đôi có cấu trúc (UI-5, docs/THIET-KE-UI.md §6.2) — RULES ghép CALC + KB, không gọi LLM.

Cặp số theo từng vị trí có ở cả hai người (chỉ ngày sinh → chỉ đường đời; có tên cả hai → thêm
linh hồn, nhân cách, sứ mệnh). Mỗi cặp: điểm hoà · điểm va · việc cùng làm (thanso_cap_so.json).
CỐ Ý không chấm điểm hợp/khắc: không có căn cứ công bố cho một thang điểm như vậy.

TS-SAU: thêm LOẠI quan hệ (người yêu · bạn bè · đồng nghiệp · sếp · gia đình) — mỗi người được đọc
"trong vai" của mình (thanso_quan_he.json), cặp số giữ phần động lực chung; có ngày sinh hai người
thì thêm nhịp năm cá nhân của cả hai năm đang xem.
"""
from __future__ import annotations

import datetime

from app.calc import thanso, thanso_mo_rong as mr
from app.config import ENGINE_VERSION
from app.kb import store, thanso_v2 as kb
from app.luangiai.thanso import _nghia_cua

THU_TU = ("duong_doi", "linh_hon", "nhan_cach", "su_menh")
TEN_VI_TRI = {"duong_doi": "Đường đời", "linh_hon": "Linh hồn", "nhan_cach": "Nhân cách", "su_menh": "Sứ mệnh"}


def _chi_so(nguoi: dict, quy_uoc: str = "tong_het") -> dict[str, int]:
    d, m, y = nguoi["ngay"], nguoi["thang"], nguoi["nam"]
    ten = (nguoi.get("ho_ten") or [None])[0]
    if ten:
        return thanso.chi_so_xac_dinh(ten, d, m, y, quy_uoc)
    return {"duong_doi": thanso.duong_doi(d, m, y, quy_uoc)}


QUAN_HE_MAC_DINH = "nguoi_yeu"


def _nhip(n: dict, nam: int) -> dict:
    so = thanso.nam_ca_nhan(n["ngay"], n["thang"], nam, "duong_lich")
    ng = store.nghia_nam_ca_nhan(so) or {}
    return {"so": so, "chu_de": ng.get("chu_de"), "y_nghia": ng.get("y_nghia")}


def luan_hop_doi(a: dict, b: dict, quan_he: str = QUAN_HE_MAC_DINH, nam_xem: int | None = None,
                 quy_uoc: str = "tong_het") -> dict:
    """Từ ngày sinh (+ tên nếu có) của hai người. `quy_uoc`: cách cộng Đường đời (TS-V3), cùng một cách cho cả hai."""
    kq = luan_hop_doi_tu_chi_so(_chi_so(a, quy_uoc), _chi_so(b, quy_uoc), quan_he)
    nam = nam_xem or datetime.date.today().year
    kq["nhip_nam"] = {
        "nam": nam, "a": _nhip(a, nam), "b": _nhip(b, nam),
        "cach_doc": ("Năm cá nhân của mỗi người năm nay — hai nhịp khác nhau thì một người muốn tiến, người kia "
                     "muốn chậm; biết trước để không trách nhau."),
    }
    return kq


def _trong_vai(so: int, vai: str) -> dict:
    return {"so": so, "vai_cua_ban": vai, **(kb.nguoi_trong_vai(so, vai) or {})}


def luan_hop_doi_tu_chi_so(cs_a: dict[str, int], cs_b: dict[str, int], quan_he: str = QUAN_HE_MAC_DINH) -> dict:
    """Từ các CON SỐ đã tính (dùng cho lời mời: link chỉ mang số, không mang ngày sinh)."""
    qh = kb.quan_he(quan_he)
    if qh is None:
        raise ValueError(f"quan_he không hợp lệ: {quan_he!r}")
    # Với sếp: người ấy (b) trong vai sếp, bạn (a) trong vai người cùng làm việc.
    vai_a = "dong_nghiep" if quan_he == "sep" else quan_he
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
        "quan_he": qh,
        "trong_vai": {"a": _trong_vai(cs_a["duong_doi"], vai_a), "b": _trong_vai(cs_b["duong_doi"], quan_he)},
        "cach_doc": ("Không có điểm số hợp hay khắc. Mỗi cặp số cho thấy chỗ hai người dễ hoà, chỗ dễ va, "
                     "và một việc cụ thể nên cùng làm — để hai người tự nhìn lại cách mình đối xử với nhau."),
        "nguon": {k: meta.get(k) for k in ("source_id", "school_id", "trang_thai", "nguon")},
    }
