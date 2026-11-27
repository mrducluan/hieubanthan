# -*- coding: utf-8 -*-
"""Chặng 4.3 — Tầng RULES Đối chiếu Trạch Nhật *Hiệp Kỷ Biện Phương Thư* (`luangiai/trach_nhat_chuyen_sau.py`).

Mọi câu hiển thị lấy ở KB `trach_nhat_hiep_ky_kb.json` (+ bản phủ `en/`); số liệu ở `calc.trach_nhat_hiep_ky` (đọc
đúng giá trị thẻ ngày của trang Xem ngày tốt)."""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import trach_nhat_hiep_ky as hk_calc
from app.kb import nap, ten as _tn


def _kb() -> dict:
    return nap.doc("trach_nhat_hiep_ky_kb.json")


def _luu_y(raw: dict, loi: dict) -> list[str]:
    ra: list[str] = []
    if raw["tu_ly"]:
        ra.append(loi["tu_ly"])
    if raw["tu_tuyet"]:
        ra.append(loi["tu_tuyet"])

    ta = raw["thap_ac_dai_bai"]
    if ta:
        chi = _tn.ten("chi", ta["chi_loc"])
        if ta["da_dien_thuc"]:
            dien = loi["noi"].join(loi["dien_thuc"][m] for m in ta["dien_thuc_boi"])
            ra.append(loi["thap_ac_dien_thuc"].format(chi=chi, dien=dien))
        else:
            ra.append(loi["thap_ac_khong"].format(chi=chi))

    if raw["duong_cong_ky"]:
        ra.append(loi["duong_cong"])

    ts = raw["tam_sat_nam"]
    if ts["cham_huong_dang_xet"]:
        ra.append(loi["tam_sat"].format(huong=_tn.ten("huong", raw["_huong"]), phuong=_tn.ten("huong", ts["phuong_chinh"])))
    return ra


def doi_chieu_hiep_ky(
    *,
    tu_ngay: dt.date | None = None,
    so_ngay: int = 7,
    huong_tu_tao: str | None = None,
) -> dict:
    """`huong_tu_tao`: tên Việt của một trong 8 hướng (`hk_calc.HUONG_MA` — API đổi mã sang tên trước khi gọi)."""
    kb = _kb()
    loi = kb["loi"]
    bat_dau = tu_ngay or config.hom_nay_vn()
    so_ngay = max(1, min(30, so_ngay))

    ds_ngay = []
    for i in range(so_ngay):
        d = bat_dau + dt.timedelta(days=i)
        raw = {**hk_calc.phan_tich_ngay_hiep_ky(d, huong_tu_tao=huong_tu_tao), "_huong": huong_tu_tao}
        nl = kb["ngu_loai_nhat"][raw["ngu_loai_ma"]]
        am = raw["am"]
        ds_ngay.append({
            "ngay": raw["ngay"],
            "am_lich": f"{am['ngay']:02d}/{am['thang']:02d}/{am['nam']}" + (loi["nhuan"] if am["nhuan"] else ""),
            "can_chi_ngay": f"{_tn.ten('can', raw['can_ngay'])} {_tn.ten('chi', raw['chi_ngay'])}",
            "ngu_loai_ma": raw["ngu_loai_ma"],
            "ngu_loai_ten": nl["ten"],
            "ngu_loai_y_nghia": nl["y_nghia"],
            "phuong_tam_sat_nam": _tn.ten("huong", raw["tam_sat_nam"]["phuong_chinh"]),
            "luu_y_hiep_ky": _luu_y(raw, loi),
        })

    return {
        "mo_dun": "trach_nhat_hiep_ky",
        "khung": kb["khung"],
        "ngay_phan_tich": ds_ngay,
        "trich_co_thu": [{"sach": v["sach"], "han": v["han"], "y_nghia": v["y_nghia"]}
                         for v in kb["trich_co_thu"].values()],
    }
