# -*- coding: utf-8 -*-
"""Chặng 3.3A — Đối chiếu 5 Trường phái Thần số học (`POST /v1/thanso/doi-chieu-phai`).

Đặt cạnh nhau 5 góc nhìn phương Tây từ cùng ngày sinh & họ tên (ĐỌC RIÊNG, không gộp điểm — CD-1):
  1. Pitago hiện đại (Đường đời & Năm cá nhân — `calc.thanso`)
  2. Balliett 1908 (Độ rung thanh âm & chữ số gốc — nguyên văn công cộng 1908)
  3. Westcott 1911 & Sepharial 1913 (Gốc Hình học – Kabala cổ điển — nguyên văn công cộng)
  4. David Phillips (Biểu đồ ngày sinh & 4 Đỉnh cao Kim tự tháp — `calc.thanso_phillips`)
  5. Chaldea · Cheiro 1926 (Số kép tên gọi & Số ngày sinh — `calc.thanso_chaldean`)
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import thanso as ts_calc, thanso_chaldean as ch_calc, thanso_phillips as ph_calc
from app.kb import nap
from app.ngon_ngu import la_viet


def _kb() -> dict:
    return nap.doc("thanso_da_phai_kb.json")


def doi_chieu_da_phai(
    *,
    ngay_sinh: dt.date,
    ho_ten: str = "",
    quy_uoc_duong_doi: str = "tong_het",
    ngay_xem: dt.date | None = None,
) -> dict:
    kb = _kb()
    khung = kb["khung"]
    trich = kb["trich_co_dien"]
    hn = ngay_xem or config.hom_nay_vn()

    dd = ts_calc.duong_doi(ngay_sinh.day, ngay_sinh.month, ngay_sinh.year, quy_uoc_duong_doi)
    nam_cn = ts_calc.nam_ca_nhan(ngay_sinh.day, ngay_sinh.month, hn.year)
    so_goc = ((dd - 1) % 9) + 1 if dd > 0 else 1
    so_key = str(dd) if str(dd) in kb["theo_so"] else str(so_goc)
    so_info = kb["theo_so"][so_key]

    ten_sach = (ho_ten or "").strip()
    tu_ten = [w for w in ten_sach.split() if w]
    ph = ph_calc.luan_phillips(tu_ten, ngay_sinh.day, ngay_sinh.month, ngay_sinh.year, nam_xem=hn.year)
    ds_dinh = (ph.get("kim_tu_thap") or {}).get("dinh") or [{}]
    dinh_hien = next((d for d in ds_dinh if d.get("trang_thai") == "dang_trong"), ds_dinh[0])
    scd_raw = ph.get("so_chu_dao")
    scd_hien = scd_raw.get("nhan", scd_raw.get("so", dd)) if isinstance(scd_raw, dict) else (scd_raw or dd)

    ch = ch_calc.tinh(ten_sach, ngay_sinh.day, ngay_sinh.month, ngay_sinh.year) if ten_sach else None
    so_ngay_ch = ch_calc.so_ngay(ngay_sinh.day)
    ch_ten = (ch or {}).get("so_ten") or {}
    bl_quote = (
        trich["balliett_1908"]["nguyen_van_1"]
        if so_goc in (1, 2, 3)
        else trich["balliett_1908"]["nguyen_van_4"]
        if so_goc in (4, 5, 6, 7)
        else trich["balliett_1908"]["nguyen_van_8"]
    )

    vi = la_viet()
    nam_phai = [
        {
            "ma": "pitago_hien_dai",
            "ten_phai": "Pitago hiện đại (Life Path)" if vi else "Modern Pythagorean (Life Path)",
            "chi_so_chinh": f"{dd} · {so_info['nhan']}",
            "nhan_xet": (
                f"Đường đời {dd}, năm cá nhân {hn.year} đang ở nhịp số {nam_cn}. {so_info['ung_dung']}"
                if vi
                else f"Life Path {dd}, Personal Year {hn.year} at cycle {nam_cn}. {so_info['ung_dung']}"
            ),
            "trich_nguon": None,
        },
        {
            "ma": "balliett_1908",
            "ten_phai": "L. Dow Balliett (1908 · Độ rung thanh âm)" if vi else "L. Dow Balliett (1908 · Vibrational Harmony)",
            "chi_so_chinh": f"{so_goc}",
            "nhan_xet": (
                f"Balliett xem con số gốc {so_goc} là nhịp điệu cần rèn qua thói quen thân – tâm đều đặn mỗi ngày."
                if vi
                else f"Balliett frames root digit {so_goc} as a daily rhythm cultivated through steady physical and mental habits."
            ),
            "trich_nguon": {"sach": trich["balliett_1908"]["sach"], "nguyen_van_en": bl_quote},
        },
        {
            "ma": "westcott_sepharial",
            "ten_phai": "Westcott (1911) & Sepharial (1913 · Cổ điển)" if vi else "Westcott (1911) & Sepharial (1913 · Classical)",
            "chi_so_chinh": f"{so_goc}",
            "nhan_xet": (
                "Truyền thống Hình học Pitago và Kabala cổ xem con số là tỷ lệ cấu trúc (Monad – Decad), nhấn mạnh tính cân đối hơn là đoán định sự kiện."
                if vi
                else "Classical Pythagorean geometry and Kabbalistic tradition treat numerals as structural proportions rather than deterministic fortune-telling."
            ),
            "trich_nguon": {
                "sach": f"{trich['westcott_1911']['sach']} · {trich['sepharial_kabala']['sach']}",
                "nguyen_van_en": trich["westcott_1911"]["nguyen_van_en"],
            },
        },
        {
            "ma": "david_phillips",
            "ten_phai": "David Phillips (Biểu đồ ngày sinh & 4 Đỉnh)" if vi else "David Phillips (Birth Arrows & Four Peaks)",
            "chi_so_chinh": f"{scd_hien}",
            "nhan_xet": (
                f"Số chủ đạo theo Phillips là {scd_hien}; giai đoạn hiện tại chạm Đỉnh số {dinh_hien.get('so', '—')} (mốc tuổi {dinh_hien.get('tuoi', '—')})."
                if vi
                else f"Phillips Ruling Number is {scd_hien}; active Pyramid Peak carries number {dinh_hien.get('so', '—')} (milestone age {dinh_hien.get('tuoi', '—')})."
            ),
            "trich_nguon": None,
        },
        {
            "ma": "chaldea_cheiro",
            "ten_phai": "Chaldea · Cheiro (1926 · Số kép)" if vi else "Chaldean · Cheiro (1926 · Compound Numbers)",
            "chi_so_chinh": (
                f"{ch_ten['kep']}/{ch_ten['goc']}"
                if ch_ten.get("kep")
                else f"{so_ngay_ch.get('tong', ngay_sinh.day)}/{so_ngay_ch['goc']}"
            ),
            "nhan_xet": (
                (
                    f"Theo bảng chữ âm thanh Chaldea (không gán chữ vào số 9), họ tên cho số {ch_ten.get('kep') or ch_ten['goc']} và ngày sinh {ngay_sinh.day} mang gốc {so_ngay_ch['goc']}."
                    if ch_ten.get("goc")
                    else f"Ngày sinh {ngay_sinh.day} theo Cheiro mang gốc số {so_ngay_ch['goc']} (nhập thêm họ tên để tính số kép tên gọi Chaldea)."
                )
                if vi
                else (
                    f"Under Cheiro's sound-value Chaldean table (omitting 9 in letter assignments), your name yields {ch_ten.get('kep') or ch_ten['goc']} alongside birth-day root {so_ngay_ch['goc']}."
                    if ch_ten.get("goc")
                    else f"Birth day {ngay_sinh.day} carries Cheiro root {so_ngay_ch['goc']} (enter your name to compute your Chaldean compound name number)."
                )
            ),
            "trich_nguon": {"sach": trich["sepharial_kabala"]["sach"], "nguyen_van_en": trich["sepharial_kabala"]["nguyen_van_en"]},
        },
    ]

    return {
        "mo_dun": "thanso_da_phai",
        "khung": khung,
        "duong_doi": dd,
        "nam_ca_nhan": nam_cn,
        "nam_phai": nam_phai,
        "lien_ket_mo_rong": [
            {"ten": "Xem Lá số Tử vi 12 cung" if vi else "Explore 12-Palace Zi Wei Chart", "duong": "/tu-vi"},
            {"ten": "Xem Bát tự Tứ trụ theo mùa sinh" if vi else "Explore Seasonal BaZi Four Pillars", "duong": "/bat-tu"},
        ],
    }
