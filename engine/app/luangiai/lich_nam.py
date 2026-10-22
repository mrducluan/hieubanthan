# -*- coding: utf-8 -*-
"""SEO-L5 — "lịch âm năm X": các tháng âm lịch Việt của một năm (ngày mùng 1 dương lịch, tháng đủ/thiếu, tháng nhuận),
Tết, can chi tháng. Chỉ ghép các hàm của `calc/lunar` (Hồ Ngọc Đức, UTC+7) — không phép tính mới, không LLM."""
from __future__ import annotations

import datetime as dt

from app.calc import lunar
from app.config import CALENDAR_MERIDIAN_TZ as TZ


def _duong(d: int, m: int, y: int, nhuan: int) -> dt.date:
    dd, mm, yy = lunar.lunar_to_solar(d, m, y, nhuan, TZ)
    return dt.date(yy, mm, dd)


def lich_nam(nam: int) -> dict:
    nhuan = lunar.thang_nhuan(nam, TZ)
    thang = []
    for m in range(1, 13):
        for ln in ((0, 1) if m == nhuan else (0,)):
            mot = _duong(1, m, nam, ln)
            so = lunar.so_ngay_thang(m, nam, ln, TZ)
            can, chi = lunar.can_chi_thang(m, nam)
            thang.append({"thang": m, "nhuan": bool(ln), "mung_mot": mot.isoformat(), "so_ngay": so,
                          "cuoi": (mot + dt.timedelta(days=so - 1)).isoformat(), "can_chi": f"{can} {chi}",
                          "ram": (mot + dt.timedelta(days=14)).isoformat()})
    can, chi = lunar.can_chi_nam(nam)
    tet, tet_sau = _duong(1, 1, nam, 0), _duong(1, 1, nam + 1, 0)
    dmy = lambda d: f"{d.day:02d}/{d.month:02d}/{d.year}"  # noqa: E731
    tra_loi = (f"Năm âm lịch {can} {chi} {nam} bắt đầu từ Tết ngày {dmy(tet)} và kết thúc ngày "
               f"{dmy(tet_sau - dt.timedelta(days=1))} (dương lịch), gồm {len(thang)} tháng, "
               + (f"có tháng {nhuan} nhuận." if nhuan else "không có tháng nhuận."))
    hd = [
        {"hoi": f"Tết âm lịch {nam} là ngày nào?", "dap": f"Mùng 1 Tết {can} {chi} là ngày {dmy(tet)} dương lịch (theo âm lịch Việt Nam)."},
        {"hoi": f"Năm {nam} âm lịch có tháng nhuận không?",
         "dap": f"Có, năm {nam} nhuận tháng {nhuan}: năm có 13 tháng âm." if nhuan else f"Không, năm {nam} âm lịch có 12 tháng."},
        {"hoi": f"Rằm tháng Giêng {nam} là ngày nào?", "dap": f"Ngày {dmy(dt.date.fromisoformat(thang[0]['ram']))} dương lịch."},
    ]
    return {"nam": nam, "can_chi": f"{can} {chi}", "tet": tet.isoformat(), "tet_sau": tet_sau.isoformat(),
            "thang_nhuan": nhuan, "thang": thang, "tra_loi_nhanh": tra_loi, "hoi_dap": hd,
            "cach_tinh": ("Âm lịch Việt Nam tính theo giờ Hà Nội (UTC+7) theo phép tính thiên văn: mùng 1 là ngày có điểm sóc, "
                          "tháng nhuận là tháng đầu tiên trong năm không chứa trung khí. Lịch Trung Quốc tính theo UTC+8 nên "
                          "có năm lệch một ngày hoặc một tháng.")}
