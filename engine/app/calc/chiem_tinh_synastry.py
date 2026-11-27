# -*- coding: utf-8 -*-
"""Chặng 4.1 & Chặng 5 — Đối chiếu Tương tác 2 Bản đồ sao (Synastry & Composite Midpoint Chart — `engine/app/calc/chiem_tinh_synastry.py`).

Tuân thủ nghiêm ngặt Kỷ luật Thép (`CD-1` & Quyền riêng tư):
  - TUYỆT ĐỐI KHÔNG chấm điểm phần trăm hợp đôi giả tạo (`khong_cham_diem: True`).
  - Synastry: góc chiếu chéo thực chất giữa các hành tinh cá nhân & xã hội của hai người theo 5 chiều tương tác.
  - Composite Midpoint Chart: bản đồ điểm giữa theo cung ngắn nhất trên vòng hoàng đạo 360° (bảo toàn tính giao hoán
    `diem_giua_vong_tron(a, b) == diem_giua_vong_tron(b, a)` kể cả qua mốc 0°/360° và tại đúng 180° đối xung), tôn trọng
    biên độ Mặt Trăng khi khuyết giờ sinh và chỉ lập Cung Mọc / 12 nhà Composite khi cả hai người đều có giờ sinh.
"""
from __future__ import annotations

from app.calc import chiem_tinh_lich as ctl, chiem_tinh_natal as ctn

_DIEM_SYNASTRY = ("mat_troi", "mat_trang", "thuy_tinh", "kim_tinh", "hoa_tinh", "moc_tinh", "tho_tinh")
_DIEM_COMPOSITE = ctl.HANH_TINH_THU_TU[:10]


def _goc_ngan(a: float, b: float) -> float:
    d = abs((a - b) % 360.0)
    return 360.0 - d if d > 180.0 else d


def diem_giua_vong_tron(lon_a: float, lon_b: float) -> float:
    """Tính điểm giữa cung ngắn nhất trên vòng tròn 0–360° (giao hoán tuyệt đối, xử lý chuẩn mốc 355° ↔ 5° → 0°)."""
    a = lon_a % 360.0
    b = lon_b % 360.0
    lo, hi = (a, b) if a <= b else (b, a)
    span = hi - lo
    if abs(span - 180.0) < 1e-9:
        mid = (lo + 90.0) % 360.0
    elif span < 180.0:
        mid = (lo + span / 2.0) % 360.0
    else:
        mid = (hi + (360.0 - span) / 2.0) % 360.0
    return round(0.0 if abs(mid - 360.0) < 1e-9 or abs(mid) < 1e-9 else mid, 4)


def _thong_tin_cung(lon: float) -> tuple[str, float]:
    lon_n = lon % 360.0
    idx = int(lon_n // 30.0) % 12
    return ctl.CUNG_HOANG_DAO[idx], round(lon_n - idx * 30.0, 2)


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


def tinh_composite(natal_a: dict, natal_b: dict) -> dict:
    """Lập Bản đồ điểm giữa (Composite Midpoint Chart) cho hai bản đồ `natal_a` và `natal_b`."""
    co_du_gio = bool(natal_a.get("co_gio_sinh") and natal_b.get("co_gio_sinh") and natal_a.get("truc") and natal_b.get("truc"))
    mat_trang_khuyet_gio = not (bool(natal_a.get("co_gio_sinh")) and bool(natal_b.get("co_gio_sinh")))

    truc_comp = None
    nha_comp: list[dict] | None = None
    dinh_12: list[float] | None = None
    if co_du_gio:
        asc_mid = diem_giua_vong_tron(natal_a["truc"]["asc"]["kinh_do"], natal_b["truc"]["asc"]["kinh_do"])
        mc_mid = diem_giua_vong_tron(natal_a["truc"]["mc"]["kinh_do"], natal_b["truc"]["mc"]["kinh_do"])
        asc_cung, asc_do = _thong_tin_cung(asc_mid)
        mc_cung, mc_do = _thong_tin_cung(mc_mid)
        truc_comp = {
            "asc": {"kinh_do": asc_mid, "cung": asc_cung, "do_cung": asc_do},
            "mc": {"kinh_do": mc_mid, "cung": mc_cung, "do_cung": mc_do},
        }
        idx_nha_1 = int(asc_mid // 30.0) % 12
        nha_comp = []
        for i in range(12):
            idx_c = (idx_nha_1 + i) % 12
            nha_comp.append({
                "so": i + 1,
                "kinh_do": float(idx_c * 30),
                "cung": ctl.CUNG_HOANG_DAO[idx_c],
                "do_cung": 0.0,
            })
        dinh_12 = [n["kinh_do"] for n in nha_comp]

    thien_the_comp: dict[str, dict] = {}
    for ma in _DIEM_COMPOSITE:
        mid = diem_giua_vong_tron(natal_a["thien_the"][ma]["kinh_do"], natal_b["thien_the"][ma]["kinh_do"])
        cung, do_cung = _thong_tin_cung(mid)
        thien_the_comp[ma] = {
            "kinh_do": mid,
            "cung": cung,
            "do_cung": do_cung,
            "nghich_hanh": False,
            "nha": ctl.nha_cua_kinh_do(mid, dinh_12) if dinh_12 else None,
        }

    # Biên độ điểm giữa Mặt Trăng khi ít nhất một bên khuyết giờ sinh
    khoang_mt_comp: tuple[float, ...] | None = None
    if mat_trang_khuyet_gio:
        ka = (
            (natal_a["mat_trang_bien_do_ngay"]["kinh_do_00h"], natal_a["mat_trang_bien_do_ngay"]["kinh_do_24h"])
            if not natal_a.get("co_gio_sinh") and natal_a.get("mat_trang_bien_do_ngay")
            else (natal_a["thien_the"]["mat_trang"]["kinh_do"],)
        )
        kb = (
            (natal_b["mat_trang_bien_do_ngay"]["kinh_do_00h"], natal_b["mat_trang_bien_do_ngay"]["kinh_do_24h"])
            if not natal_b.get("co_gio_sinh") and natal_b.get("mat_trang_bien_do_ngay")
            else (natal_b["thien_the"]["mat_trang"]["kinh_do"],)
        )
        khoang_mt_comp = tuple(diem_giua_vong_tron(xa, xb) for xa in ka for xb in kb)

    # Góc chiếu nội tại trong bản đồ Composite (orb ≤ 5°)
    ds_diem = [(m, thien_the_comp[m]["kinh_do"]) for m in _DIEM_COMPOSITE]
    if truc_comp:
        ds_diem.append(("asc", truc_comp["asc"]["kinh_do"]))
    goc_comp: list[dict] = []
    for i in range(len(ds_diem)):
        m1, lon1 = ds_diem[i]
        for j in range(i + 1, len(ds_diem)):
            m2, lon2 = ds_diem[j]
            sep = _goc_ngan(lon1, lon2)
            for loai, goc_chuan, _, _ in ctn.GOC_CHIEU_CHINH:
                sai_so = abs(sep - goc_chuan)
                if sai_so <= 5.0:
                    if khoang_mt_comp and ("mat_trang" in (m1, m2)):
                        k1 = khoang_mt_comp if m1 == "mat_trang" else (lon1,)
                        k2 = khoang_mt_comp if m2 == "mat_trang" else (lon2,)
                        if not all(abs(_goc_ngan(x1, x2) - goc_chuan) <= 5.0 for x1 in k1 for x2 in k2):
                            break
                    goc_comp.append({
                        "diem_1": m1,
                        "diem_2": m2,
                        "loai": loai,
                        "goc_chuan": int(goc_chuan),
                        "sai_so": round(sai_so, 2),
                    })
                    break
    goc_comp.sort(key=lambda x: x["sai_so"])

    return {
        "khong_cham_diem": True,
        "co_du_gio_hai_nguoi": co_du_gio,
        "mat_trang_khuyet_gio": mat_trang_khuyet_gio,
        "truc": truc_comp,
        "nha": nha_comp,
        "thien_the": thien_the_comp,
        "goc_chieu": goc_comp[:14],
    }
