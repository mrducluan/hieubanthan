# -*- coding: utf-8 -*-
"""SEO-L5 — "lịch âm năm X": các tháng âm lịch Việt của một năm (ngày mùng 1 dương lịch, tháng đủ/thiếu, tháng nhuận),
Tết, can chi tháng. Chỉ ghép các hàm của `calc/lunar` (Hồ Ngọc Đức, UTC+7) — không phép tính mới, không LLM."""
from __future__ import annotations

import datetime as dt

from app.calc import lunar
from app.config import CALENDAR_MERIDIAN_TZ as TZ
from app.kb.loi import L
from app.luangiai import lich_hien as lh


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


def _thu(i: int) -> str:
    return L(f"lich.thu.{i}", THU[i])


def _cc(can: str, chi: str) -> str:
    """Can chi theo ngôn ngữ (EN-ALL GĐ 8; bản Việt: "Giáp Thìn")."""
    return lh.can_chi(f"{can} {chi}")


def _dmy(d: dt.date) -> str:
    if lh.la_viet():
        return f"{d.day:02d}/{d.month:02d}/{d.year}"
    from app.luangiai import lich_trang_hien as lth  # noqa: PLC0415
    return lth.ngay_dai(d)


def _le(nam: int, tet_sau: dt.date) -> list[dict]:
    ds = [{"ma": ma, "ten": L(f"lich.le.{ma}", ten), "am": f"{d}/{m}", "duong": (n := _duong(d, m, nam, 0)).isoformat(),
           "thu": _thu(n.weekday())} for ma, ten, d, m in LE_AM]
    gt = tet_sau - dt.timedelta(days=1)
    ds.append({"ma": "giao_thua", "ten": L("lich.le.giao_thua", "Giao thừa (ngày cuối tháng Chạp)"),
               "am": f"{(gt - _duong(1, 12, nam, 0)).days + 1}/12", "duong": gt.isoformat(), "thu": _thu(gt.weekday())})
    return sorted(ds, key=lambda x: x["duong"])


def cac_nam(tu: int, den: int) -> list[dict]:
    """Bảng ngắn nhiều năm: can chi, con giáp, Tết, tháng nhuận, số ngày của năm âm."""
    kq = []
    for n in range(tu, den + 1):
        can, chi = lunar.can_chi_nam(n)
        tet, sau = _duong(1, 1, n, 0), _duong(1, 1, n + 1, 0)
        kq.append({"nam": n, "can_chi": _cc(can, chi), "con_giap": chi, "tet": tet.isoformat(),
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
                          "cuoi": (mot + dt.timedelta(days=so - 1)).isoformat(), "can_chi": _cc(can, chi),
                          "ram": (mot + dt.timedelta(days=14)).isoformat()})
    can, chi = lunar.can_chi_nam(nam)
    cc = _cc(can, chi)
    tet, tet_sau = _duong(1, 1, nam, 0), _duong(1, 1, nam + 1, 0)
    dmy = _dmy
    tra_loi = (L("lich.nam.tl", "Năm âm lịch {cc} {nam} bắt đầu từ Tết ngày {tet} và kết thúc ngày {cuoi} (dương lịch), gồm {so} "
                              "tháng, ", cc=cc, nam=nam, tet=dmy(tet), cuoi=dmy(tet_sau - dt.timedelta(days=1)), so=len(thang))
               + (L("lich.nam.tl_nhuan", "có tháng {n} nhuận.", n=nhuan) if nhuan else L("lich.nam.tl_khong_nhuan", "không có tháng nhuận.")))
    hd = [
        {"hoi": L("lich.nam.h_tet", "Tết âm lịch {nam} là ngày nào?", nam=nam),
         "dap": L("lich.nam.d_tet", "Mùng 1 Tết {cc} là ngày {ngay} dương lịch (theo âm lịch Việt Nam).", cc=cc, ngay=dmy(tet))},
        {"hoi": L("lich.nam.h_nhuan", "Năm {nam} âm lịch có tháng nhuận không?", nam=nam),
         "dap": L("lich.nam.d_nhuan", "Có, năm {nam} nhuận tháng {n}: năm có 13 tháng âm.", nam=nam, n=nhuan) if nhuan
         else L("lich.nam.d_khong_nhuan", "Không, năm {nam} âm lịch có 12 tháng.", nam=nam)},
        {"hoi": L("lich.nam.h_ram", "Rằm tháng Giêng {nam} là ngày nào?", nam=nam),
         "dap": L("lich.nam.d_ram", "Ngày {ngay} dương lịch.", ngay=dmy(dt.date.fromisoformat(thang[0]['ram'])))},
    ]
    le = _le(nam, tet_sau)
    ld = {x["ma"]: x for x in le}
    for ma, hoi in (("gio_to", L("lich.nam.h_gio_to", "Giỗ Tổ Hùng Vương {nam} (10/3 âm) là ngày nào?", nam=nam)),
                    ("vu_lan", L("lich.nam.h_vu_lan", "Rằm tháng Bảy {nam} là ngày nào?", nam=nam)),
                    ("trung_thu", L("lich.nam.h_trung_thu", "Tết Trung thu {nam} (15/8 âm) là ngày nào?", nam=nam)),
                    ("ong_tao", L("lich.nam.h_ong_tao", "Cúng ông Công ông Táo năm {cc} là ngày nào?", cc=cc))):
        x = ld[ma]
        hd.append({"hoi": hoi, "dap": L("lich.nam.d_le", "{thu}, ngày {ngay} dương lịch (ngày {am} âm lịch).", thu=x["thu"],
                                        ngay=dmy(dt.date.fromisoformat(x["duong"])), am=x["am"])})
    return {"nam": nam, "can_chi": cc, "tet": tet.isoformat(), "tet_sau": tet_sau.isoformat(),
            "thang_nhuan": nhuan, "thang": thang, "tra_loi_nhanh": tra_loi, "hoi_dap": hd, "le": le,
            "so_ngay": (tet_sau - tet).days,
            "cach_tinh": L("lich.nam.cach_tinh", "Âm lịch Việt Nam tính theo giờ Hà Nội (UTC+7) theo phép tính thiên văn: mùng 1 là "
                           "ngày có điểm sóc, tháng nhuận là tháng đầu tiên trong năm không chứa trung khí. Lịch Trung Quốc "
                           "tính theo UTC+8 nên có năm lệch một ngày hoặc một tháng.")}
