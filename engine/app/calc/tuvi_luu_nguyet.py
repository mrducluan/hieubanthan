# -*- coding: utf-8 -*-
"""TV-LN — lưu nguyệt (tháng hạn) Tử vi theo PHÁI người dùng chọn. Tầng CALC: Python thuần, deterministic.

Các nhà tử vi bất đồng thật sự về cung khởi tháng Giêng; không chọn giùm người dùng (quyết định 2026-10-08).
Mặc định = Đẩu Quân từ lưu Thái Tuế (Đẩu số toàn thư; khớp iztro 680/680 ca — tests/test_tuvi_luu_nguyet.py).
Chi đánh số 0 = Tý … 11 = Hợi; "thuận" = chiều kim đồng hồ trên lá số = chi tăng. Tài liệu: docs/LUU-NGUYET-TUVI.md.
"""
from __future__ import annotations

import datetime as dt

from app.calc import lunar

PHAI: dict[str, dict] = {
    "dau_quan_thai_tue": {
        "ten": "Đẩu Quân từ Thái Tuế",
        "cach_tinh": "Từ cung lưu Thái Tuế (cung mang chi năm xem) gọi là tháng Giêng, đếm nghịch tới tháng sinh; "
                     "từ cung đó gọi là giờ Tý, đếm thuận tới giờ sinh → cung tháng Giêng (Đẩu Quân). "
                     "Các tháng sau đi thuận, mỗi tháng một cung.",
        "nguon": "Tử Vi Đẩu Số Toàn Thư (斗君, 正月初一日管事); phần mềm iztro (MIT) — phổ biến nhất",
    },
    "dau_quan_tieu_han": {
        "ten": "Đẩu Quân từ Tiểu hạn",
        "cach_tinh": "Như Đẩu Quân, nhưng khởi đếm từ cung Tiểu hạn của năm xem thay cho cung Thái Tuế.",
        "nguon": "Một số sách/trang tử vi Việt Nam (cách an nguyệt hạn theo tiểu hạn)",
    },
    "tieu_han": {
        "ten": "Tháng Giêng tại Tiểu hạn",
        "cach_tinh": "Cung Tiểu hạn của năm xem là tháng Giêng, các tháng sau đi thuận. Cách xem nhanh, giản lược.",
        "nguon": "Cách xem nhanh lưu hành ở Việt Nam",
    },
    "luu_nien": {
        "ten": "Tháng Giêng tại cung lưu niên",
        "cach_tinh": "Cung lưu niên (cung mang chi năm xem) là tháng Giêng, các tháng sau đi thuận "
                     "— không xét tháng, giờ sinh.",
        "nguon": "Tuỳ chọn 流年命宮順數月 trong phần mềm tử vi Đài Loan/Hồng Kông",
    },
    "dia_chi_thang": {
        "ten": "Theo địa chi của tháng",
        "cach_tinh": "Cung mang địa chi của tháng là cung tháng: tháng Giêng ở Dần, tháng Hai ở Mão… "
                     "— giống nhau cho mọi lá số trong cùng năm, chỉ khác sao trong cung.",
        "nguon": "Tuỳ chọn 流月地支 trong phần mềm tử vi Đài Loan",
    },
}
MAC_DINH = "dau_quan_thai_tue"
CHI = list(lunar.CHI)          # 0 = Tý … 11 = Hợi
THANG_NHUAN = ("thang_sau", "thang_chinh")

# Tứ hoá theo thiên can [Lộc, Quyền, Khoa, Kỵ] — giống iztro (giữ iztro cho Canh/Nhâm, quyết định 2026-10-02).
TU_HOA: dict[str, list[str]] = {
    "Giáp": ["Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"],
    "Ất": ["Thiên Cơ", "Thiên Lương", "Tử Vi", "Thái Âm"],
    "Bính": ["Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"],
    "Đinh": ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"],
    "Mậu": ["Tham Lang", "Thái Âm", "Hữu Bật", "Thiên Cơ"],
    "Kỷ": ["Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"],
    "Canh": ["Thái Dương", "Vũ Khúc", "Thái Âm", "Thiên Đồng"],
    "Tân": ["Cự Môn", "Thái Dương", "Văn Khúc", "Văn Xương"],
    "Nhâm": ["Thiên Lương", "Tử Vi", "Tả Phù", "Vũ Khúc"],
    "Quý": ["Phá Quân", "Cự Môn", "Thái Âm", "Tham Lang"],
}


def tu_hoa(can: str) -> list[str]:
    """Bốn sao hoá [Lộc, Quyền, Khoa, Kỵ] của thiên can `can`."""
    return list(TU_HOA[can])


def thang_tinh(thang: int, ngay: int, nhuan: bool, thang_nhuan: str = "thang_sau") -> int:
    """Số tháng dùng để đếm cung. Nửa sau (từ ngày 16) tháng nhuận: `thang_sau` → tính sang tháng sau (iztro,
    mặc định của dự án), `thang_chinh` → như tháng chính. Có thể ra 13 (nửa sau nhuận tháng Chạp) — đếm vòng 12."""
    if thang_nhuan not in THANG_NHUAN:
        raise ValueError("thang_nhuan phải là 'thang_sau' hoặc 'thang_chinh'")
    return thang + (1 if nhuan and ngay > 15 and thang_nhuan == "thang_sau" else 0)


def cung_thang_gieng(phai: str, chi_nam_xem: int, chi_tieu_han: int, thang_sinh: int, chi_gio: int) -> int:
    """Chi của cung tháng Giêng năm xem theo phái. `thang_sinh` đã qua `thang_tinh`; `chi_gio` 0 = Tý."""
    if phai == "dau_quan_thai_tue":
        return (chi_nam_xem - (thang_sinh - 1) + chi_gio) % 12
    if phai == "dau_quan_tieu_han":
        return (chi_tieu_han - (thang_sinh - 1) + chi_gio) % 12
    if phai == "tieu_han":
        return chi_tieu_han % 12
    if phai == "luu_nien":
        return chi_nam_xem % 12
    if phai == "dia_chi_thang":
        return 2                                   # Dần
    raise ValueError(f"Phái lưu nguyệt không hợp lệ: {phai}")


def cung_luu_nguyet(phai: str, chi_nam_xem: int, chi_tieu_han: int, thang_sinh: int, chi_gio: int,
                    thang: int) -> int:
    """Chi của cung lưu nguyệt (Mệnh tháng) cho tháng `thang` (đã qua `thang_tinh`) của năm xem."""
    return (cung_thang_gieng(phai, chi_nam_xem, chi_tieu_han, thang_sinh, chi_gio) + thang - 1) % 12


def cac_thang(nam_am: int, tz: float = 7.0, thang_nhuan: str = "thang_sau") -> list[dict]:
    """Các tháng âm của năm `nam_am` kèm khoảng ngày dương. Tháng nhuận: `thang_sau` tách hai nửa (1–15 tính như
    tháng chính, 16–hết tính tháng sau); `thang_chinh` giữ nguyên cả tháng như tháng chính."""
    if thang_nhuan not in THANG_NHUAN:
        raise ValueError("thang_nhuan phải là 'thang_sau' hoặc 'thang_chinh'")
    nhuan = lunar.thang_nhuan(nam_am, tz)
    ra: list[dict] = []
    for m in range(1, 13):
        for la_nhuan in ((False, True) if m == nhuan else (False,)):
            d, mo, y = lunar.lunar_to_solar(1, m, nam_am, int(la_nhuan), tz)
            tu = dt.date(y, mo, d)
            so = lunar.so_ngay_thang(m, nam_am, int(la_nhuan), tz)
            can, chi = lunar.can_chi_thang(m, nam_am)
            goc = {"thang": m, "nhuan": la_nhuan, "can": can, "chi": chi, "can_chi": f"{can} {chi}"}
            if la_nhuan and thang_nhuan == "thang_sau":
                ra.append({**goc, "phan": "nua_dau", "thang_tinh": m, "ngay_am": (1, 15),
                           "tu": tu, "den": tu + dt.timedelta(days=14)})
                # Nửa sau tính như tháng sau: cả cung (thang_tinh) LẪN can chi tháng → tứ hoá tháng (khớp iztro
                # 80/80 ca, QC 2026-10-21). can_chi_thang(13, năm) = can chi tháng Giêng năm sau (công thức liền mạch).
                can2, chi2 = lunar.can_chi_thang(m + 1, nam_am)
                ra.append({**goc, "can": can2, "chi": chi2, "can_chi": f"{can2} {chi2}",
                           "phan": "nua_sau", "thang_tinh": m + 1, "ngay_am": (16, so),
                           "tu": tu + dt.timedelta(days=15), "den": tu + dt.timedelta(days=so - 1)})
            else:
                ra.append({**goc, "phan": "ca_thang", "thang_tinh": m, "ngay_am": (1, so),
                           "tu": tu, "den": tu + dt.timedelta(days=so - 1)})
    return ra
