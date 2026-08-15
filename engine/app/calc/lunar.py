# -*- coding: utf-8 -*-
"""Đổi lịch âm-dương — thuật toán Hồ Ngọc Đức (amlich), bản cài đặt Python.

Thuật toán gốc do Hồ Ngọc Đức công bố công khai, dựa trên "Astronomical
Algorithms" (Jean Meeus): tính điểm sóc (new moon) và kinh độ mặt trời để xác
định tháng âm, tháng nhuận. `time_zone` là THAM SỐ — lịch Việt Nam truyền 7.0
(kinh tuyến 105°Đ). Truyền 8.0 sẽ ra lịch Trung Quốc, có năm lệch cả ngày Tết.

Chỉ dùng math thuần — không dependency ngoài. Tầng CALC: tất định, không LLM.
"""
from __future__ import annotations

import math

CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi",
       "Thân", "Dậu", "Tuất", "Hợi"]

_SYNODIC = 29.530588853          # tháng giao hội trung bình (ngày)
_JD_EPOCH_NM = 2415021.076998695  # điểm sóc gốc của chuỗi k


def jd_from_date(dd: int, mm: int, yy: int) -> int:
    """Ngày dương lịch → số ngày Julian (nguyên, mốc giữa trưa)."""
    a = (14 - mm) // 12
    y = yy + 4800 - a
    m = mm + 12 * a - 3
    return dd + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045


def jd_to_date(jd: int) -> tuple[int, int, int]:
    """Số ngày Julian → (ngày, tháng, năm) dương lịch."""
    a = jd + 32044
    b = (4 * a + 3) // 146097
    c = a - (b * 146097) // 4
    d = (4 * c + 3) // 1461
    e = c - (1461 * d) // 4
    m = (5 * e + 2) // 153
    day = e - (153 * m + 2) // 5 + 1
    month = m + 3 - 12 * (m // 10)
    year = b * 100 + d - 4800 + m // 10
    return day, month, year


def get_new_moon_day(k: int, time_zone: float) -> int:
    """Ngày (Julian, đã làm tròn theo múi giờ) của điểm sóc thứ k từ 1/1/1900."""
    T = k / 1236.85
    T2, T3 = T * T, T * T * T
    dr = math.pi / 180
    jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
    jd1 += 0.00033 * math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
    m = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
    mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
    f = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
    c1 = (0.1734 - 0.000393 * T) * math.sin(m * dr) + 0.0021 * math.sin(2 * dr * m)
    c1 -= 0.4068 * math.sin(mpr * dr) + 0.0161 * math.sin(dr * 2 * mpr)
    c1 -= 0.0004 * math.sin(dr * 3 * mpr)
    c1 += 0.0104 * math.sin(dr * 2 * f) - 0.0051 * math.sin(dr * (m + mpr))
    c1 -= 0.0074 * math.sin(dr * (m - mpr)) + 0.0004 * math.sin(dr * (2 * f + m))
    c1 -= 0.0004 * math.sin(dr * (2 * f - m)) - 0.0006 * math.sin(dr * (2 * f + mpr))
    c1 += 0.0010 * math.sin(dr * (2 * f - mpr)) + 0.0005 * math.sin(dr * (2 * mpr + m))
    if T < -11:
        deltat = (0.001 + 0.000839 * T + 0.0002261 * T2
                  - 0.00000845 * T3 - 0.000000081 * T * T3)
    else:
        deltat = -0.000278 + 0.000265 * T + 0.000262 * T2
    jd_new = jd1 + c1 - deltat
    return int(jd_new + 0.5 + time_zone / 24)


def get_sun_longitude(jdn: int, time_zone: float) -> int:
    """Cung hoàng đạo (0..11) của kinh độ mặt trời lúc 0h địa phương ngày jdn."""
    T = (jdn - 2451545.5 - time_zone / 24) / 36525
    T2 = T * T
    dr = math.pi / 180
    m = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2
    l0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
    dl = (1.914600 - 0.004817 * T - 0.000014 * T2) * math.sin(dr * m)
    dl += ((0.019993 - 0.000101 * T) * math.sin(dr * 2 * m)
           + 0.000290 * math.sin(dr * 3 * m))
    lon = (l0 + dl) * dr
    lon -= math.pi * 2 * int(lon / (math.pi * 2))
    return int(lon / math.pi * 6)


def get_lunar_month_11(yy: int, time_zone: float) -> int:
    """Ngày sóc bắt đầu tháng 11 âm của năm yy — tháng chứa Đông chí."""
    off = jd_from_date(31, 12, yy) - 2415021
    k = int(off / _SYNODIC)
    nm = get_new_moon_day(k, time_zone)
    if get_sun_longitude(nm, time_zone) >= 9:
        nm = get_new_moon_day(k - 1, time_zone)
    return nm


def get_leap_month_offset(a11: int, time_zone: float) -> int:
    """Vị trí tháng nhuận sau tháng 11 âm (chỉ gọi khi năm âm có 13 tháng)."""
    k = int((a11 - _JD_EPOCH_NM) / _SYNODIC + 0.5)
    last = 0
    i = 1
    arc = get_sun_longitude(get_new_moon_day(k + i, time_zone), time_zone)
    while True:
        last = arc
        i += 1
        arc = get_sun_longitude(get_new_moon_day(k + i, time_zone), time_zone)
        if arc == last or i >= 14:
            break
    return i - 1


def solar_to_lunar(dd: int, mm: int, yy: int,
                   time_zone: float) -> tuple[int, int, int, int]:
    """Dương → âm. Trả về (ngày, tháng, năm_âm, nhuận 0/1)."""
    day_number = jd_from_date(dd, mm, yy)
    k = int((day_number - _JD_EPOCH_NM) / _SYNODIC)
    month_start = get_new_moon_day(k + 1, time_zone)
    if month_start > day_number:
        month_start = get_new_moon_day(k, time_zone)
    a11 = get_lunar_month_11(yy, time_zone)
    b11 = a11
    if a11 >= month_start:
        lunar_year = yy
        a11 = get_lunar_month_11(yy - 1, time_zone)
    else:
        lunar_year = yy + 1
        b11 = get_lunar_month_11(yy + 1, time_zone)
    lunar_day = day_number - month_start + 1
    diff = int((month_start - a11) / 29)
    lunar_leap = 0
    lunar_month = diff + 11
    if b11 - a11 > 365:
        leap_month_diff = get_leap_month_offset(a11, time_zone)
        if diff >= leap_month_diff:
            lunar_month = diff + 10
            if diff == leap_month_diff:
                lunar_leap = 1
    if lunar_month > 12:
        lunar_month -= 12
    if lunar_month >= 11 and diff < 4:
        lunar_year -= 1
    return lunar_day, lunar_month, lunar_year, lunar_leap


def lunar_to_solar(lunar_day: int, lunar_month: int, lunar_year: int,
                   lunar_leap: int, time_zone: float) -> tuple[int, int, int]:
    """Âm → dương. ValueError nếu khai tháng nhuận không tồn tại."""
    if lunar_month < 11:
        a11 = get_lunar_month_11(lunar_year - 1, time_zone)
        b11 = get_lunar_month_11(lunar_year, time_zone)
    else:
        a11 = get_lunar_month_11(lunar_year, time_zone)
        b11 = get_lunar_month_11(lunar_year + 1, time_zone)
    k = int(0.5 + (a11 - _JD_EPOCH_NM) / _SYNODIC)
    off = lunar_month - 11
    if off < 0:
        off += 12
    if b11 - a11 > 365:
        leap_off = get_leap_month_offset(a11, time_zone)
        leap_month = leap_off - 2
        if leap_month < 0:
            leap_month += 12
        if lunar_leap != 0 and lunar_month != leap_month:
            raise ValueError(
                f"Năm âm {lunar_year} không nhuận tháng {lunar_month}")
        if lunar_leap != 0 or off >= leap_off:
            off += 1
    elif lunar_leap != 0:
        raise ValueError(f"Năm âm {lunar_year} không có tháng nhuận")
    month_start = get_new_moon_day(k + off, time_zone)
    return jd_to_date(month_start + lunar_day - 1)


def can_chi_nam(nam_am: int) -> tuple[str, str]:
    """Can chi của một NĂM ÂM LỊCH. Mốc: 1984 = Giáp Tý.

    Tham số là năm âm (đã qua solar_to_lunar), không phải năm dương —
    truyền năm dương cho người sinh trước Tết là sai cả lá số.
    """
    return CAN[(nam_am - 4) % 10], CHI[(nam_am - 4) % 12]
