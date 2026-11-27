# -*- coding: utf-8 -*-
"""Chặng 3.3A — Đối chiếu 5 trường phái Thần số học (`POST /v1/thanso/doi-chieu-phai`).

Phần SO SÁNH PHỤ, người dùng tự mở (lệch TS-PHAI-3 có chủ ý, chủ dự án duyệt 2026-11-27): bộ chọn phái chính vẫn là
Pitago + Phillips. Đặt cạnh nhau 5 góc nhìn từ cùng ngày sinh (+ họ tên nếu có), ĐỌC RIÊNG, không gộp điểm (CD-1):
  1. Pitago hiện đại — `calc.thanso` (Đường đời + năm cá nhân mốc 1/1 dương lịch, như trang đọc).
  2. Sách «The Philosophy of Numbers» (1908; tên tác giả bị BM-1 chặn ở đầu ra) — con số ngày sinh rút gọn ("birth number"); câu trích là câu sách nói về đúng con số đó.
  3. Westcott — tính chất của con số; câu trích lấy từ `bo_sung_so.json` (đã khớp kho nguồn, TK-2).
  4. Phillips — `calc.thanso_phillips` (Số chủ đạo + chặng Đỉnh đang đi).
  5. Chaldea — `calc.thanso_chaldean`; câu trích lấy từ `thanso_chaldean.json` (`kep.*.trich`, khớp sách Cheiro).

Tên sách / tác giả chỉ nằm trong `can_cu` và `trich_nguon`; lời hiển thị là lời đời thường.
"""
from __future__ import annotations

import datetime as dt

from app import config
import re

from app.calc import thanso as ts_calc, thanso_chaldean as ch_calc, thanso_phillips as ph_calc
from app.kb import nap, thanso_v2


# Câu Cheiro dán nhãn số "xấu" / cảnh báo phản bội, nguy hiểm — vẫn ở trang kiến thức Số kép (TK-2), nhưng không đặt
# lên khối kết quả cá nhân (KB Chaldea đã viết trung tính, bỏ nhãn "xấu" của Cheiro — TS-PHAI).
_PHAN_XET = re.compile(r"unfortunate|treacher|danger|destruction|warn|deception|disaster|ruin|evil|lonely|isolat|sorrow|grief", re.I)


def _kb() -> dict:
    return nap.doc("thanso_da_phai_kb.json")


def _westcott(so_goc: int) -> dict | None:
    """Câu Westcott về đúng con số — một nguồn với trang Ý nghĩa số (`bo_sung_so.json`)."""
    trang = (nap.doc("bo_sung_so.json").get("trang") or {}).get(f"so-{so_goc}") or {}
    return next((t for t in trang.get("trich_dan") or [] if "Westcott" in str(t.get("sach")) and t.get("nguyen_van")), None)


def doi_chieu_da_phai(
    *,
    ngay_sinh: dt.date,
    ho_ten: str = "",
    quy_uoc_duong_doi: str = "tong_het",
    ngay_xem: dt.date | None = None,
) -> dict:
    kb = _kb()
    khung = kb["khung"]
    mau = kb["mau"]
    hn = ngay_xem or config.hom_nay_vn()
    d, m, y = ngay_sinh.day, ngay_sinh.month, ngay_sinh.year

    dd = ts_calc.duong_doi(d, m, y, quy_uoc_duong_doi)
    nam_cn = ts_calc.nam_ca_nhan(d, m, hn.year, moc="duong_lich")
    so_goc = ((dd - 1) % 9) + 1 if dd > 0 else 1
    so_info = kb["theo_so"].get(str(dd)) or kb["theo_so"][str(so_goc)]

    ten = " ".join((ho_ten or "").split())
    co_ten = bool(ten)

    # 1. Pitago
    pitago = {
        "ma": "pitago_hien_dai",
        "ten_phai": khung["ten_phai"]["pitago_hien_dai"],
        "chi_so_chinh": f"{dd} · {so_info['nhan']}",
        "nhan_xet": mau["pitago"].format(dd=dd, nam=hn.year, nam_cn=nam_cn, ung_dung=so_info["ung_dung"]),
        "can_ho_ten": False,
        "trich_nguon": None,
        "can_cu": [mau["can_cu_pitago"].format(dd=dd, nam_cn=nam_cn)],
    }

    # 2. Balliett — câu sách nói về đúng "birth number" đó (không có câu hợp → không trích)
    bl = kb["trich_co_dien"]["balliett_1908"]
    bl_cau = bl["theo_so"].get(str(so_goc))
    balliett = {
        "ma": "nhac_so_1908",
        "ten_phai": khung["ten_phai"]["balliett_1908"],
        "chi_so_chinh": f"{so_goc}",
        "nhan_xet": mau["balliett"].format(so=so_goc),
        "can_ho_ten": False,
        "trich_nguon": {"sach": bl["sach"], "nguyen_van_en": bl_cau} if bl_cau else None,
        "can_cu": [mau["can_cu_balliett"].format(so=so_goc)],
    }

    # 3. Westcott
    wc = _westcott(so_goc)
    westcott = {
        "ma": "westcott_sepharial",
        "ten_phai": khung["ten_phai"]["westcott_sepharial"],
        "chi_so_chinh": f"{so_goc}",
        "nhan_xet": mau["westcott"].format(so=so_goc),
        "can_ho_ten": False,
        "trich_nguon": {"sach": f"{wc['sach']} · {wc['chuong']}", "nguyen_van_en": wc["nguyen_van"]} if wc else None,
        "can_cu": [wc["nghia"]] if wc else [],
    }

    # 4. Phillips — chỉ cần ngày sinh
    ph = ph_calc.luan_phillips([ten] if co_ten else [], d, m, y, nam_xem=hn.year)
    scd = ph["so_chu_dao"]
    dinh = next((x for x in (ph.get("kim_tu_thap") or {}).get("dinh") or [] if x.get("trang_thai") == "dang_trong"), None)
    nx_ph = (mau["phillips"].format(scd=scd["nhan"], dinh=dinh["so"], tu=dinh["tu_tuoi"], den=dinh["den_tuoi"])
             if dinh and dinh.get("den_tuoi") is not None
             else mau["phillips_khong_dinh"].format(scd=scd["nhan"]))
    phillips = {
        "ma": "david_phillips",
        "ten_phai": khung["ten_phai"]["david_phillips"],
        "chi_so_chinh": f"{scd['nhan']}",
        "nhan_xet": nx_ph,
        "can_ho_ten": False,
        "trich_nguon": None,
        "can_cu": [mau["can_cu_phillips"].format(cach=scd.get("cach_tinh", ""))],
    }

    # 5. Chaldea — số kép của tên cần họ tên; không có thì dùng số ngày sinh
    sn = ch_calc.so_ngay(d)
    ch_ten = (ch_calc.tinh(ten, d, m, y) or {}).get("so_ten") if co_ten else None
    if ch_ten and ch_ten.get("goc"):
        kep_dung = ch_ten.get("kep")
        chi_so = f"{kep_dung}/{ch_ten['goc']}" if kep_dung else f"{ch_ten['goc']}"
        nx_ch = mau["chaldea_ten"].format(so=chi_so, ngay=d, goc_ngay=sn["goc"])
    else:
        kep_dung = sn.get("kep")
        chi_so = f"{sn['tong']}/{sn['goc']}" if kep_dung else f"{sn['goc']}"
        nx_ch = mau["chaldea_ngay"].format(ngay=d, goc_ngay=sn["goc"])
    kep = thanso_v2.chaldea_kep(kep_dung) if kep_dung else None
    tr_kep = (kep or {}).get("trich") or {}
    if _PHAN_XET.search(tr_kep.get("en", "")):
        tr_kep = {}  # câu sách phán xấu / cảnh báo (Cheiro gọi số "unfortunate") không gắn vào kết quả của chính người đọc
    chaldea = {
        "ma": "chaldea_cheiro",
        "ten_phai": khung["ten_phai"]["chaldea_cheiro"],
        "chi_so_chinh": chi_so,
        "nhan_xet": nx_ch,
        "can_ho_ten": not co_ten,
        "trich_nguon": ({"sach": f"{kb['trich_co_dien']['cheiro']['sach']} · {tr_kep.get('chuong', '')}".rstrip(" ·"),
                         "nguyen_van_en": tr_kep["en"]} if tr_kep.get("en") else None),
        "can_cu": [mau["can_cu_chaldea"]] + ([mau["can_ho_ten"]] if not co_ten else []),
    }

    return {
        "mo_dun": "thanso_da_phai",
        "khung": {k: khung[k] for k in ("tieu_de", "phu_de", "cau_noi_dong_phuong")},
        "duong_doi": dd,
        "nam_ca_nhan": nam_cn,
        "co_ho_ten": co_ten,
        "nam_phai": [pitago, balliett, westcott, phillips, chaldea],
        "lien_ket_mo_rong": [dict(x) for x in khung["lien_ket"]],
    }

