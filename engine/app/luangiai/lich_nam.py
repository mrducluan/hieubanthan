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


# SEO-O: ngày lễ / ngày giỗ theo âm lịch hay được hỏi (chỉ tháng thường, không lấy tháng nhuận). Ngày dương do
# `lunar_to_solar` tính — không bảng gõ tay.
LE_AM: tuple[tuple[str, str, int, int], ...] = (
    ("tet", "Tết Nguyên đán (mùng 1 Tết)", 1, 1),
    ("ram_gieng", "Rằm tháng Giêng (Tết Nguyên tiêu)", 15, 1),
    ("han_thuc", "Tết Hàn thực", 3, 3),
    ("gio_to", "Giỗ Tổ Hùng Vương", 10, 3),
    ("phat_dan", "Lễ Phật đản", 15, 4),
    ("doan_ngo", "Tết Đoan ngọ", 5, 5),
    ("vu_lan", "Rằm tháng Bảy (Vu Lan)", 15, 7),
    ("trung_thu", "Tết Trung thu", 15, 8),
    ("ha_nguyen", "Rằm tháng Mười (Tết Hạ nguyên)", 15, 10),
    ("ong_tao", "Ông Công Ông Táo", 23, 12),
)
THU = ("Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ nhật")


def _le(nam: int, tet_sau: dt.date) -> list[dict]:
    ds = [{"ma": ma, "ten": ten, "am": f"{d}/{m}", "duong": (n := _duong(d, m, nam, 0)).isoformat(), "thu": THU[n.weekday()]}
          for ma, ten, d, m in LE_AM]
    gt = tet_sau - dt.timedelta(days=1)
    ds.append({"ma": "giao_thua", "ten": "Giao thừa (ngày cuối tháng Chạp)", "am": f"{(gt - _duong(1, 12, nam, 0)).days + 1}/12",
               "duong": gt.isoformat(), "thu": THU[gt.weekday()]})
    return sorted(ds, key=lambda x: x["duong"])


def cac_nam(tu: int, den: int) -> list[dict]:
    """Bảng ngắn nhiều năm: can chi, con giáp, Tết, tháng nhuận, số ngày của năm âm."""
    kq = []
    for n in range(tu, den + 1):
        can, chi = lunar.can_chi_nam(n)
        tet, sau = _duong(1, 1, n, 0), _duong(1, 1, n + 1, 0)
        kq.append({"nam": n, "can_chi": f"{can} {chi}", "con_giap": chi, "tet": tet.isoformat(),
                   "thang_nhuan": lunar.thang_nhuan(n, TZ), "so_ngay": (sau - tet).days})
    return kq


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
    le = _le(nam, tet_sau)
    ld = {x["ma"]: x for x in le}
    for ma, hoi in (("gio_to", f"Giỗ Tổ Hùng Vương {nam} (10/3 âm) là ngày nào?"),
                    ("vu_lan", f"Rằm tháng Bảy {nam} là ngày nào?"),
                    ("trung_thu", f"Tết Trung thu {nam} (15/8 âm) là ngày nào?"),
                    ("ong_tao", f"Cúng ông Công ông Táo năm {can} {chi} là ngày nào?")):
        x = ld[ma]
        hd.append({"hoi": hoi, "dap": f"{x['thu']}, ngày {dmy(dt.date.fromisoformat(x['duong']))} dương lịch (ngày {x['am']} âm lịch)."})
    return {"nam": nam, "can_chi": f"{can} {chi}", "tet": tet.isoformat(), "tet_sau": tet_sau.isoformat(),
            "thang_nhuan": nhuan, "thang": thang, "tra_loi_nhanh": tra_loi, "hoi_dap": hd, "le": le,
            "so_ngay": (tet_sau - tet).days,
            "cach_tinh": ("Âm lịch Việt Nam tính theo giờ Hà Nội (UTC+7) theo phép tính thiên văn: mùng 1 là ngày có điểm sóc, "
                          "tháng nhuận là tháng đầu tiên trong năm không chứa trung khí. Lịch Trung Quốc tính theo UTC+8 nên "
                          "có năm lệch một ngày hoặc một tháng.")}
