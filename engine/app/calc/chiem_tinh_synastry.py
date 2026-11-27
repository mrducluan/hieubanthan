# -*- coding: utf-8 -*-
"""Chặng 4.1 — Đối chiếu Tương tác 2 Bản đồ sao (Synastry — `engine/app/calc/chiem_tinh_synastry.py`).

Tuân thủ nghiêm ngặt Kỷ luật Thép (`CD-1` & Quyền riêng tư):
  - TUYỆT ĐỐI KHÔNG chấm điểm phần trăm hợp đôi giả tạo.
  - Chỉ tính các góc chiếu chéo thực chất giữa các hành tinh cá nhân & xã hội của hai người theo 5 chiều tương tác:
    `mat_troi_mat_trang` · `kim_tinh_hoa_tinh` · `thuy_tinh_giao_tiep` · `tho_tinh_cam_ket` · `asc_an_tuong_dau`.
"""
from __future__ import annotations

from app.calc import chiem_tinh_natal as ctn

_DIEM_SYNASTRY = ("mat_troi", "mat_trang", "thuy_tinh", "kim_tinh", "hoa_tinh", "moc_tinh", "tho_tinh")


def _goc_ngan(a: float, b: float) -> float:
    d = abs((a - b) % 360.0)
    return 360.0 - d if d > 180.0 else d


def _phan_chieu(m1: str, m2: str) -> str:
    cap = {m1, m2}
    if "asc" in cap:
        return "asc_an_tuong_dau"
    if "tho_tinh" in cap:
        return "tho_tinh_cam_ket"
    if cap & {"kim_tinh", "hoa_tinh"}:
        return "kim_tinh_hoa_tinh"
    if "thuy_tinh" in cap:
        return "thuy_tinh_giao_tiep"
    return "mat_troi_mat_trang"


def tinh_synastry(natal_a: dict, natal_b: dict) -> dict:
    """Tính góc chiếu chéo giữa hai bản đồ sao `natal_a` và `natal_b` (orb ≤ 5°)."""
    tt_a = natal_a["thien_the"]
    tt_b = natal_b["thien_the"]
    ds_a = [(m, tt_a[m]["kinh_do"]) for m in _DIEM_SYNASTRY]
    ds_b = [(m, tt_b[m]["kinh_do"]) for m in _DIEM_SYNASTRY]
    if natal_a.get("co_gio_sinh") and natal_a.get("truc"):
        ds_a.append(("asc", natal_a["truc"]["asc"]["kinh_do"]))
    if natal_b.get("co_gio_sinh") and natal_b.get("truc"):
        ds_b.append(("asc", natal_b["truc"]["asc"]["kinh_do"]))

    # Người không biết giờ sinh: Mặt Trăng của họ chỉ biết trong khoảng 00:00–23:59 (~12–15°) — góc chiếu chéo dính tới
    # Mặt Trăng ấy chỉ giữ khi đúng SUỐT cả ngày (cùng một luật với bản đồ gốc, `ctn.goc_giu_ca_khoang`).
    def _khoang(natal: dict, ma: str, lon: float) -> tuple[float, ...]:
        bd = natal.get("mat_trang_bien_do_ngay")
        if ma == "mat_trang" and not natal.get("co_gio_sinh") and bd:
            return (bd["kinh_do_00h"], bd["kinh_do_24h"])
        return (lon,)

    goc_cheo: list[dict] = []
    for ma_a, lon_a in ds_a:
        for ma_b, lon_b in ds_b:
            ka, kb = _khoang(natal_a, ma_a, lon_a), _khoang(natal_b, ma_b, lon_b)
            sep = _goc_ngan(lon_a, lon_b)
            for loai, goc_chuan, _, _ in ctn.GOC_CHIEU_CHINH:
                sai_so = abs(sep - goc_chuan)
                if sai_so <= 5.0:
                    if (len(ka) > 1 or len(kb) > 1) and not ctn.goc_giu_ca_khoang(ka, kb, goc_chuan, 5.0):
                        break
                    goc_cheo.append({
                        "nguoi_a": ma_a,
                        "nguoi_b": ma_b,
                        "loai": loai,
                        "goc_chuan": int(goc_chuan),
                        "sai_so": round(sai_so, 2),
                        "chieu": _phan_chieu(ma_a, ma_b),
                    })
                    break

    goc_cheo.sort(key=lambda x: x["sai_so"])
    return {
        "khong_cham_diem": True,
        "goc_cheo": goc_cheo[:18],
    }
