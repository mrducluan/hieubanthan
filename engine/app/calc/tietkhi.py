# -*- coding: utf-8 -*-
"""Tiết khí — thời điểm Mặt Trời đạt kinh độ hoàng đạo biểu kiến k·15° (tầng CALC, tất định).

Thuật toán: chuỗi VSOP87D rút gọn cho kinh độ Trái Đất (Meeus, *Astronomical Algorithms*,
chương 32 + phụ lục III) → kinh độ Mặt Trời hình học, hiệu chỉnh FK5, chương động (4 số hạng
chính) và quang sai; giải bằng Newton. ΔT theo đa thức Espenak–Meeus (NASA). Kết quả là giờ UTC.

Đối chiếu oracle lunar-typescript 1.8.6: sai số lớn nhất 0,63 phút trên 4.623 thời điểm
1900–2100 (tests/test_tietkhi.py giữ ngưỡng 1,5 phút). Không phụ thuộc thư viện ngoài.
"""
from __future__ import annotations

import datetime as dt
import math
from functools import lru_cache

# Hệ số VSOP87D (A, B, C) — đơn vị 1e-8 rad; L = Σ Lᵢ·τⁱ, số hạng A·cos(B + C·τ).
_L0 = """175347046 0 0
3341656 4.6692568 6283.0758500
34894 4.62610 12566.15170
3497 2.7441 5753.3849
3418 2.8289 3.5231
3136 3.6277 77713.7715
2676 4.4181 7860.4194
2343 6.1352 3930.2097
1324 0.7425 11506.7698
1273 2.0371 529.6910
1199 1.1096 1577.3435
990 5.233 5884.927
902 2.045 26.298
857 3.508 398.149
780 1.179 5223.694
753 2.533 5507.553
505 4.583 18849.228
492 4.205 775.523
357 2.920 0.067
317 5.849 11790.629
284 1.899 796.298
271 0.315 10977.079
243 0.345 5486.778
206 4.806 2544.314
205 1.869 5573.143
202 2.458 6069.777
156 0.833 213.299
132 3.411 2942.463
126 1.083 20.775
115 0.645 0.980
103 0.636 4694.003
102 0.976 15720.839
102 4.267 7.114
99 6.21 2146.17
98 0.68 155.42
86 5.98 161000.69
85 1.30 6275.96
85 3.67 71430.70
80 1.81 17260.15
79 3.04 12036.46
75 1.76 5088.63
74 3.50 3154.69
74 4.68 801.82
70 0.83 9437.76
62 3.98 8827.39
61 1.82 7084.90
57 2.78 6286.60
56 4.39 14143.50
56 3.47 6279.55
52 0.19 12139.55
52 1.33 1748.02
51 0.28 5856.48
49 0.49 1194.45
41 5.37 8429.24
41 2.40 19651.05
39 6.17 10447.39
37 6.04 10213.29
37 2.57 1059.38
36 1.71 2352.87
36 1.78 6812.77
33 0.59 17789.85
30 0.44 83996.85
30 2.74 1349.87
25 3.16 4690.48"""
_L1 = """628331966747 0 0
206059 2.678235 6283.075850
4303 2.6351 12566.1517
425 1.590 3.523
119 5.796 26.298
109 2.966 1577.344
93 2.59 18849.23
72 1.14 529.69
68 1.87 398.15
67 4.41 5507.55
59 2.89 5223.69
56 2.17 155.42
45 0.40 796.30
36 0.47 775.52
29 2.65 7.11
21 5.34 0.98
19 1.85 5486.78
19 4.97 213.30
17 2.99 6275.96
16 0.03 2544.31
16 1.43 2146.17
15 1.21 10977.08
12 2.83 1748.02
12 3.26 5088.63
12 5.27 1194.45
12 2.08 4694.00
11 0.77 553.57
10 1.30 6286.60
10 4.24 1349.87
9 2.70 242.73
9 5.64 951.72
8 5.30 2352.87
6 2.65 9437.76
6 4.67 4690.48"""
_L2 = """52919 0 0
8720 1.0721 6283.0758
309 0.867 12566.152
27 0.05 3.52
16 5.19 26.30
16 3.68 155.42
10 0.76 18849.23
9 2.06 77713.77
7 0.83 775.52
5 4.66 1577.34
4 1.03 7.11
4 3.44 5573.14
3 5.14 796.30
3 6.05 5507.55
3 1.19 242.73
3 6.12 529.69
3 0.31 398.15
3 2.28 553.57
2 4.38 5223.69
2 3.75 0.98"""
_L3 = """289 5.844 6283.076
35 0 0
17 5.49 12566.15
3 5.20 155.42
1 4.72 3.52
1 5.30 18849.23
1 5.97 242.73"""
_L4 = """114 3.142 0
8 4.13 6283.08
1 3.84 12566.15"""
_L5 = "1 3.14 0"


def _bang(s: str) -> list[tuple[float, float, float]]:
    return [tuple(map(float, dong.split())) for dong in s.strip().splitlines()]  # type: ignore[misc]


_LS = [_bang(x) for x in (_L0, _L1, _L2, _L3, _L4, _L5)]
_J2000 = 2451545.0
_TOC_DO = 0.98564736          # độ/ngày, trung bình
_EPOCH = dt.datetime(2000, 1, 1, 12)


def delta_t(nam: float) -> float:
    """ΔT = TT − UT (giây), đa thức Espenak–Meeus, hợp lệ 1860–2150."""
    y = nam
    if y < 1900:
        t = y - 1860
        return 7.62 + 0.5737 * t - 0.251754 * t**2 + 0.01680668 * t**3 - 0.0004473624 * t**4 + t**5 / 233174
    if y < 1920:
        t = y - 1900
        return -2.79 + 1.494119 * t - 0.0598939 * t**2 + 0.0061966 * t**3 - 0.000197 * t**4
    if y < 1941:
        t = y - 1920
        return 21.20 + 0.84493 * t - 0.076100 * t**2 + 0.0020936 * t**3
    if y < 1961:
        t = y - 1950
        return 29.07 + 0.407 * t - t**2 / 233 + t**3 / 2547
    if y < 1986:
        t = y - 1975
        return 45.45 + 1.067 * t - t**2 / 260 - t**3 / 718
    if y < 2005:
        t = y - 2000
        return (63.86 + 0.3345 * t - 0.060374 * t**2 + 0.0017275 * t**3 + 0.000651814 * t**4
                + 0.00002373599 * t**5)
    if y < 2050:
        t = y - 2000
        return 62.92 + 0.32217 * t + 0.005589 * t**2
    return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y)


def _kinh_do_jde(jde: float) -> float:
    """Kinh độ biểu kiến của Mặt Trời (độ) tại JDE (giờ TT)."""
    tau = (jde - _J2000) / 365250
    L = sum(sum(a * math.cos(b + c * tau) for a, b, c in S) * tau**i for i, S in enumerate(_LS)) / 1e8
    T = tau * 10
    lon = math.degrees(L) + 180 - 0.09033 / 3600
    om = math.radians(125.04452 - 1934.136261 * T)
    ls = math.radians(280.4665 + 36000.7698 * T)
    lm = math.radians(218.3165 + 481267.8813 * T)
    dpsi = (-17.20 * math.sin(om) - 1.32 * math.sin(2 * ls) - 0.23 * math.sin(2 * lm)
            + 0.21 * math.sin(2 * om)) / 3600
    m = math.radians(357.52911 + 35999.05029 * T)
    e = 0.016708634 - 0.000042037 * T
    c = math.radians((1.914602 - 0.004817 * T) * math.sin(m) + 0.019993 * math.sin(2 * m))
    r = 1.000001018 * (1 - e * e) / (1 + e * math.cos(m + c))
    return (lon + dpsi - 20.4898 / 3600 / r) % 360


def _jd(t: dt.datetime) -> float:
    return _J2000 + (t - _EPOCH).total_seconds() / 86400


def _nam_thap_phan(t: dt.datetime) -> float:
    return t.year + (t.timetuple().tm_yday - 0.5) / 365.25


def kinh_do_mat_troi(t_utc: dt.datetime) -> float:
    """Kinh độ biểu kiến của Mặt Trời (độ, 0–360) tại thời điểm UTC (naive)."""
    return _kinh_do_jde(_jd(t_utc) + delta_t(_nam_thap_phan(t_utc)) / 86400)


@lru_cache(maxsize=4096)
def thoi_diem(nam: int, kinh_do: int) -> dt.datetime:
    """Thời điểm (UTC, naive, làm tròn giây) Mặt Trời đạt `kinh_do` trong năm dương lịch `nam`."""
    if kinh_do % 15:
        raise ValueError("kinh_do phải là bội của 15")
    # Xuân phân ≈ 20/3; ước lượng rồi Newton trên JDE.
    uoc = dt.datetime(nam, 3, 20) + dt.timedelta(days=((kinh_do % 360) / _TOC_DO))
    if uoc.year > nam:
        uoc -= dt.timedelta(days=365.2422)
    jde = _jd(uoc)
    for _ in range(12):
        d = ((kinh_do - _kinh_do_jde(jde) + 180) % 360) - 180
        jde += d / _TOC_DO
        if abs(d) < 1e-8:
            break
    t = _EPOCH + dt.timedelta(days=jde - _J2000)
    t -= dt.timedelta(seconds=delta_t(_nam_thap_phan(t)))
    return (t + dt.timedelta(microseconds=500_000)).replace(microsecond=0)


TIET = [315 + 30 * k for k in range(12)]      # 12 "tiết" (节) mở đầu tháng: Lập xuân → Tiểu hàn


def tiet_bao_quanh(t_utc: dt.datetime) -> tuple[tuple[dt.datetime, int], tuple[dt.datetime, int]]:
    """Hai tiết (节) liền trước và liền sau thời điểm `t_utc`: ((thời điểm, kinh độ), …)."""
    ds = sorted((thoi_diem(n, g % 360), g % 360) for n in (t_utc.year - 1, t_utc.year, t_utc.year + 1)
                for g in TIET)
    truoc = max(x for x in ds if x[0] <= t_utc)
    sau = min(x for x in ds if x[0] > t_utc)
    return truoc, sau
