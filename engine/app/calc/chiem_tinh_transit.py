# -*- coding: utf-8 -*-
"""Chặng 4.1 — Vận hạn Chiêm tinh phương Tây (Transit, Saturn Return, Jupiter Return, Solar Return).

Tầng CALC tất định:
  - Góc chiếu của 5 hành tinh ngoài (Mộc tinh, Thổ tinh, Thiên Vương, Hải Vương, Diêm Vương) lên các điểm Natal.
  - Chu kỳ Thổ tinh hồi quy (`Saturn Return` quanh ~29,5 tuổi và ~58,5 tuổi: xét sai số góc với Thổ tinh gốc).
  - Chu kỳ Mộc tinh hồi quy (`Jupiter Return` ~12 năm).
  - Thời điểm chính xác Mặt Trời trở về đúng kinh độ lúc sinh trong năm đang xem (`Solar Return`, giải Newton < 1 giây).
"""
from __future__ import annotations

import datetime as dt

from app.calc import chiem_tinh_lich as ctl, chiem_tinh_natal as ctn, tietkhi

HANH_TINH_NGOAI = ("moc_tinh", "tho_tinh", "thien_vuong", "hai_vuong", "diem_vuong")
DIEM_NATAL_NHAN_TRANSIT = (
    "mat_troi", "mat_trang", "thuy_tinh", "kim_tinh", "hoa_tinh", "moc_tinh", "tho_tinh",
)


def _goc_ngan(a: float, b: float) -> float:
    d = abs((a - b) % 360.0)
    return 360.0 - d if d > 180.0 else d


def thoi_diem_solar_return(kinh_do_mat_troi_goc: float, nam_xem: int, ngay_sinh_mau: dt.date) -> dt.datetime:
    """Tìm thời điểm UTC Mặt Trời đạt lại chính xác `kinh_do_mat_troi_goc` (0–360°) trong năm `nam_xem`."""
    ngay_uoc = min(ngay_sinh_mau.day, 28 if ngay_sinh_mau.month == 2 else ngay_sinh_mau.day)
    t = dt.datetime(nam_xem, ngay_sinh_mau.month, ngay_uoc, 12, 0)
    for _ in range(14):
        lon_now = tietkhi.kinh_do_mat_troi(t)
        diff = ((kinh_do_mat_troi_goc - lon_now + 180.0) % 360.0) - 180.0
        if abs(diff) < 1e-6:
            break
        t += dt.timedelta(days=diff / 0.98564736)
    return t.replace(microsecond=0)


def tinh_transit(natal: dict, ngay_xem: dt.date) -> dict:
    """Tính trạng thái Transit tại 12:00 UTC ngày `ngay_xem` so với bản đồ `natal`."""
    t_xem = dt.datetime(ngay_xem.year, ngay_xem.month, ngay_xem.day, 12, 0)
    bau_troi_nay = ctl.tat_ca_thien_the(t_xem)
    tt_goc = natal["thien_the"]

    # Góc chiếu Transit (sai số chặt ≤ 3,5° cho chu kỳ vận hạn thực chất)
    ds_transit: list[dict] = []
    diem_goc = list(DIEM_NATAL_NHAN_TRANSIT)
    truc = natal.get("truc") or {}
    for k_truc in ("asc", "mc"):
        if k_truc in truc:
            diem_goc.append(k_truc)

    for m_tr in HANH_TINH_NGOAI:
        lon_tr = bau_troi_nay[m_tr]["kinh_do"]
        v_tr = bau_troi_nay[m_tr]["toc_do_ngay"]
        for m_na in diem_goc:
            lon_na = truc[m_na]["kinh_do"] if m_na in ("asc", "mc") else tt_goc[m_na]["kinh_do"]
            sep = _goc_ngan(lon_tr, lon_na)
            for loai, goc_chuan, _, _ in ctn.GOC_CHIEU_CHINH:
                sai_so = abs(sep - goc_chuan)
                if sai_so <= 3.5:
                    sep_next = _goc_ngan(lon_tr + v_tr * 1.0, lon_na)
                    ds_transit.append({
                        "transit": m_tr,
                        "natal": m_na,
                        "loai": loai,
                        "goc_chuan": int(goc_chuan),
                        "sai_so": round(sai_so, 2),
                        "dang_hoi_vao": abs(sep_next - goc_chuan) < sai_so,
                    })
                    break
    ds_transit.sort(key=lambda x: x["sai_so"])

    # Saturn Return & Jupiter Return
    ns = dt.date.fromisoformat(natal["dau_vao_da_chuan"]["ngay_sinh"])
    tuoi_thuc = (ngay_xem - ns).days / 365.2425
    lech_tho = _goc_ngan(bau_troi_nay["tho_tinh"]["kinh_do"], tt_goc["tho_tinh"]["kinh_do"])
    if lech_tho <= 12.0 and 27.0 <= tuoi_thuc <= 31.5:
        trang_thai_saturn = "lan_1_29_tuoi"
    elif lech_tho <= 12.0 and 56.0 <= tuoi_thuc <= 61.0:
        trang_thai_saturn = "lan_2_58_tuoi"
    else:
        trang_thai_saturn = "ngoai_chu_ky"

    lech_moc = _goc_ngan(bau_troi_nay["moc_tinh"]["kinh_do"], tt_goc["moc_tinh"]["kinh_do"])
    dang_jupiter_return = lech_moc <= 10.0 and tuoi_thuc >= 11.0

    # Solar Return trong năm xem
    t_sr = thoi_diem_solar_return(tt_goc["mat_troi"]["kinh_do"], ngay_xem.year, ns)
    nha_mat_troi_sr = None
    if natal["co_gio_sinh"]:
        dv = natal["dau_vao_da_chuan"]
        nha_sr = ctl.tinh_nha_va_truc(t_sr, dv["vi_do"], dv["kinh_do"], he_nha=natal["he_nha"])
        nha_mat_troi_sr = ctl.nha_cua_kinh_do(
            tt_goc["mat_troi"]["kinh_do"], [n["kinh_do"] for n in nha_sr["nha"]]
        )

    return {
        "ngay_xem": ngay_xem.isoformat(),
        "tuoi_nam": round(tuoi_thuc, 1),
        "saturn_return": {
            "giai_doan": trang_thai_saturn,
            "goc_lech_tho_tinh": round(lech_tho, 2),
            "cung_tho_tinh_goc": tt_goc["tho_tinh"]["cung"],
        },
        "jupiter_return": {
            "dang_trong_chu_ky": dang_jupiter_return,
            "goc_lech_moc_tinh": round(lech_moc, 2),
        },
        "solar_return": {
            "nam": ngay_xem.year,
            "thoi_diem_utc": t_sr.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "nha_mat_troi_solar_return": nha_mat_troi_sr,
        },
        "goc_chieu_transit": ds_transit[:12],
    }
