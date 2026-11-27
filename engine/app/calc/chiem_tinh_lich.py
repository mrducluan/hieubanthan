# -*- coding: utf-8 -*-
"""Chặng 4.1 — Lịch thiên văn Chiêm tinh phương Tây tất định (`engine/app/calc/chiem_tinh_lich.py`).

100% không AGPL (`pyswisseph` bị loại theo `docs/NGUON-MO.md` dòng 49), không thư viện C ngoài:
  - Mặt Trời (`mat_troi`): `calc.tietkhi` — chuỗi VSOP87D + chương động + quang sai + ΔT Espenak–Meeus (NASA).
  - Mặt Trăng (`mat_trang`): Jean Meeus, *Astronomical Algorithms* (2nd ed., Ch. 47) — 60 số hạng kinh độ ELP2000-82
    kèm nhiễu loạn Kim tinh, Mộc tinh, độ dẹt Trái Đất và chương động Δψ.
  - La Hầu / Kế Đô (`la_hau` / `ke_do` — True North & South Lunar Nodes): công thức nút thực Meeus Ch. 47.
  - Thuỷ tinh → Diêm Vương tinh & Chiron (`jpl_de441_ephem.json`): nội suy bậc ba Lagrange 4 điểm trên chuỗi góc mở
    liên tục (unwrapped milli-degrees) trích từ hệ lịch công cộng NASA JPL Horizons DE441 (`1925–2051`, Public Domain
    17 U.S.C. § 105), kèm đạo hàm vận tốc góc để xác định chính xác trạng thái Nghịch hành (`nghich_hanh = toc_do < 0`).
  - Giờ sao biểu kiến địa phương (`LAST`), Thiên Đỉnh (`MC`), Cung Mọc (`Ascendant`) và 12 nhà (`Whole Sign` & `Placidus`
    có tự động lùi an toàn về `Whole Sign` khi |vĩ độ| ≥ 66°).
"""
from __future__ import annotations

import datetime as dt
import json
import math
from functools import lru_cache
from pathlib import Path

from app.calc import tietkhi

_J2000 = 2451545.0
_EPOCH = dt.datetime(2000, 1, 1, 12)
_EPHEM_PATH = Path(__file__).parent / "data" / "jpl_de441_ephem.json"

CUNG_HOANG_DAO = (
    "bach_duong",
    "kim_nguu",
    "song_tu",
    "cu_giai",
    "su_tu",
    "xu_nu",
    "thien_binh",
    "bo_cap",
    "nhan_ma",
    "ma_ket",
    "bao_binh",
    "song_ngu",
)

HANH_TINH_THU_TU = (
    "mat_troi",
    "mat_trang",
    "thuy_tinh",
    "kim_tinh",
    "hoa_tinh",
    "moc_tinh",
    "tho_tinh",
    "thien_vuong",
    "hai_vuong",
    "diem_vuong",
    "la_hau",
    "ke_do",
    "chiron",
)

# 60 số hạng chính kinh độ Mặt Trăng — Meeus, Astronomical Algorithms, Table 47.A: (D, M, M', F, hệ số Σl đơn vị 1e-6 độ)
_ELP_LON: tuple[tuple[int, int, int, int, int], ...] = (
    (0, 0, 1, 0, 6288774),
    (2, 0, -1, 0, 1274027),
    (2, 0, 0, 0, 658314),
    (0, 0, 2, 0, 213618),
    (0, 1, 0, 0, -185116),
    (0, 0, 0, 2, -114332),
    (2, 0, -2, 0, 58793),
    (2, -1, -1, 0, 57066),
    (2, 0, 1, 0, 53322),
    (2, -1, 0, 0, 45758),
    (0, 1, -1, 0, -40923),
    (1, 0, 0, 0, -34720),
    (0, 1, 1, 0, -30383),
    (2, 0, 0, -2, 15327),
    (0, 0, 1, 2, -12528),
    (0, 0, 1, -2, 10980),
    (4, 0, -1, 0, 10675),
    (0, 0, 3, 0, 10034),
    (4, 0, -2, 0, 8548),
    (2, 1, -1, 0, -7888),
    (2, 1, 0, 0, -6766),
    (1, 0, -1, 0, -5163),
    (1, 1, 0, 0, 4987),
    (2, -1, 1, 0, 4036),
    (2, 0, 2, 0, 3994),
    (4, 0, 0, 0, 3861),
    (2, 0, -3, 0, 3665),
    (0, 1, -2, 0, -2689),
    (2, 0, -1, 2, -2602),
    (2, -1, -2, 0, 2390),
    (1, 0, 1, 0, -2348),
    (2, -2, 0, 0, 2236),
    (0, 1, 2, 0, -2120),
    (0, 2, 0, 0, -2069),
    (2, -2, -1, 0, 2048),
    (2, 0, 1, -2, -1773),
    (2, 0, 0, 2, -1595),
    (4, -1, -1, 0, 1215),
    (0, 0, 2, 2, -1110),
    (3, 0, -1, 0, -892),
    (2, 1, 1, 0, -810),
    (4, -1, -2, 0, 759),
    (0, 2, -1, 0, -713),
    (2, 2, -1, 0, -700),
    (2, 1, -2, 0, 691),
    (2, -1, 0, -2, 596),
    (4, 0, 1, 0, 549),
    (0, 0, 4, 0, 537),
    (4, -1, 0, 0, 520),
    (1, 0, -2, 0, -487),
    (2, 1, 0, -2, -399),
    (0, 0, 2, -2, -381),
    (1, 1, 1, 0, 351),
    (3, 0, -2, 0, -340),
    (4, 0, -3, 0, 330),
    (2, -1, 2, 0, 327),
    (0, 2, 1, 0, -323),
    (1, 1, -1, 0, 299),
    (2, 0, 3, 0, 294),
    (2, 0, -1, -2, 0),
)


@lru_cache(maxsize=1)
def _nap_jpl() -> dict[str, tuple[float, float, list[int]]]:
    """Giải nén chuỗi cộng dồn (prefix sum) một lần vào RAM: body -> (jd0, step_days, unwrapped_mdeg_list)."""
    raw = json.loads(_EPHEM_PATH.read_text(encoding="utf-8"))
    ra: dict[str, tuple[float, float, list[int]]] = {}
    for name, b in raw["bodies"].items():
        ds: list[int] = []
        acc = 0
        for d in b["d_mdeg"]:
            acc += d
            ds.append(acc)
        ra[name] = (float(b["jd0"]), float(b["step"]), ds)
    return ra


def jd_ut(t_utc: dt.datetime) -> float:
    return _J2000 + (t_utc - _EPOCH).total_seconds() / 86400.0


def jde_tt(t_utc: dt.datetime) -> float:
    nam_tp = t_utc.year + (t_utc.timetuple().tm_yday - 0.5) / 365.25
    return jd_ut(t_utc) + tietkhi.delta_t(nam_tp) / 86400.0


def chuong_dong_va_hoang_dao(jde: float) -> tuple[float, float]:
    """Trả (Δψ tính bằng độ, độ nghiêng hoàng đạo biểu kiến ε tính bằng độ) theo IAU / Meeus Ch. 22."""
    T = (jde - _J2000) / 36525.0
    om = math.radians(125.04452 - 1934.136261 * T + 0.0020708 * T * T)
    ls = math.radians(280.4665 + 36000.7698 * T)
    lm = math.radians(218.3165 + 481267.8813 * T)
    dpsi_arcsec = -17.20 * math.sin(om) - 1.32 * math.sin(2 * ls) - 0.23 * math.sin(2 * lm) + 0.21 * math.sin(2 * om)
    deps_arcsec = 9.20 * math.cos(om) + 0.57 * math.cos(2 * ls) + 0.10 * math.cos(2 * lm) - 0.09 * math.cos(2 * om)
    eps0_arcsec = 84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T
    return dpsi_arcsec / 3600.0, (eps0_arcsec + deps_arcsec) / 3600.0


def kinh_do_mat_trang(t_utc: dt.datetime) -> float:
    """Kinh độ hoàng đạo biểu kiến địa tâm của Mặt Trăng (0–360°, Meeus Ch. 47 ELP2000-82)."""
    jde = jde_tt(t_utc)
    T = (jde - _J2000) / 36525.0
    T2, T3, T4 = T * T, T * T * T, T * T * T * T

    Lp = (218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841.0 - T4 / 65194000.0) % 360.0
    D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868.0 - T4 / 113065000.0) % 360.0
    M = (357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000.0) % 360.0
    Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699.0 - T4 / 14712000.0) % 360.0
    F = (93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000.0 + T4 / 863310000.0) % 360.0

    A1 = math.radians((119.75 + 131.849 * T) % 360.0)
    A2 = math.radians((53.09 + 479264.290 * T) % 360.0)
    E = 1.0 - 0.002516 * T - 0.0000074 * T2
    E2 = E * E

    Dr, Mr, Mpr, Fr, Lpr = map(math.radians, (D, M, Mp, F, Lp))
    sigma_l = 0.0
    for d_c, m_c, mp_c, f_c, coeff in _ELP_LON:
        if coeff == 0:
            continue
        arg = d_c * Dr + m_c * Mr + mp_c * Mpr + f_c * Fr
        am = abs(m_c)
        w = E if am == 1 else (E2 if am == 2 else 1.0)
        sigma_l += coeff * w * math.sin(arg)

    sigma_l += 3958.0 * math.sin(A1) + 1962.0 * math.sin(Lpr - Fr) + 318.0 * math.sin(A2)
    dpsi, _ = chuong_dong_va_hoang_dao(jde)
    return (Lp + sigma_l / 1_000_000.0 + dpsi) % 360.0


def kinh_do_la_hau(t_utc: dt.datetime) -> float:
    """Kinh độ hoàng đạo biểu kiến Nút Bắc thực Mặt Trăng (True North Node — Meeus Ch. 47)."""
    jde = jde_tt(t_utc)
    T = (jde - _J2000) / 36525.0
    T2, T3 = T * T, T * T * T
    om = (125.0445479 - 1934.1362891 * T + 0.0020754 * T2 + T3 / 467441.0) % 360.0
    D = math.radians((297.8501921 + 445267.1114034 * T) % 360.0)
    M = math.radians((357.5291092 + 35999.0502909 * T) % 360.0)
    Mp = math.radians((134.9633964 + 477198.8675055 * T) % 360.0)
    F = math.radians((93.2720950 + 483202.0175233 * T) % 360.0)
    true_corr = (
        -1.4979 * math.sin(2.0 * (D - F))
        - 0.1500 * math.sin(M)
        - 0.1226 * math.sin(2.0 * D)
        + 0.1176 * math.sin(2.0 * F)
        - 0.0801 * math.sin(2.0 * (Mp - F))
    )
    dpsi, _ = chuong_dong_va_hoang_dao(jde)
    return (om + true_corr + dpsi) % 360.0


def _noi_suy_lagrange_4(y0: float, y1: float, y2: float, y3: float, u: float, step: float) -> tuple[float, float]:
    """Nội suy đa thức bậc ba Lagrange qua (-1, y0), (0, y1), (1, y2), (2, y3) với u ∈ [0, 1].
    Trả (giá trị, đạo hàm theo ngày)."""
    l0 = -u * (u - 1.0) * (u - 2.0) / 6.0
    l1 = (u + 1.0) * (u - 1.0) * (u - 2.0) / 2.0
    l2 = -(u + 1.0) * u * (u - 2.0) / 2.0
    l3 = (u + 1.0) * u * (u - 1.0) / 6.0
    val = l0 * y0 + l1 * y1 + l2 * y2 + l3 * y3

    dl0 = -(3.0 * u * u - 6.0 * u + 2.0) / 6.0
    dl1 = (3.0 * u * u - 4.0 * u - 1.0) / 2.0
    dl2 = -(3.0 * u * u - 2.0 * u - 2.0) / 2.0
    dl3 = (3.0 * u * u - 1.0) / 6.0
    dval_du = dl0 * y0 + dl1 * y1 + dl2 * y2 + dl3 * y3
    return val, dval_du / step


def vi_tri_hanh_tinh(ma: str, t_utc: dt.datetime) -> tuple[float, float]:
    """Trả `(kinh_do_0_360, toc_do_do_moi_ngay)` tại `t_utc` (UTC naive)."""
    if ma == "mat_troi":
        lon = tietkhi.kinh_do_mat_troi(t_utc)
        dt_h = dt.timedelta(hours=2)
        lp = tietkhi.kinh_do_mat_troi(t_utc + dt_h)
        lm = tietkhi.kinh_do_mat_troi(t_utc - dt_h)
        sp = (((lp - lm + 180.0) % 360.0) - 180.0) / (4.0 / 24.0)
        return lon, sp
    if ma == "mat_trang":
        lon = kinh_do_mat_trang(t_utc)
        dt_h = dt.timedelta(hours=1)
        lp = kinh_do_mat_trang(t_utc + dt_h)
        lm = kinh_do_mat_trang(t_utc - dt_h)
        sp = (((lp - lm + 180.0) % 360.0) - 180.0) / (2.0 / 24.0)
        return lon, sp
    if ma == "la_hau":
        lon = kinh_do_la_hau(t_utc)
        dt_h = dt.timedelta(hours=6)
        lp = kinh_do_la_hau(t_utc + dt_h)
        lm = kinh_do_la_hau(t_utc - dt_h)
        sp = (((lp - lm + 180.0) % 360.0) - 180.0) / 0.5
        return lon, sp
    if ma == "ke_do":
        lon, sp = vi_tri_hanh_tinh("la_hau", t_utc)
        return (lon + 180.0) % 360.0, sp

    bang = _nap_jpl()
    if ma not in bang:
        raise ValueError(f"Không có thiên thể: {ma}")
    jd0, step, ds = bang[ma]
    jd = jd_ut(t_utc)
    if jd < jd0 or jd > jd0 + step * (len(ds) - 1):
        raise ValueError("Thời điểm nằm ngoài phạm vi bảng lịch thiên văn 1925–2050.")
    pos = (jd - jd0) / step
    idx = int(math.floor(pos))
    idx = max(1, min(len(ds) - 3, idx))
    u = pos - idx
    y0, y1, y2, y3 = ds[idx - 1] / 1000.0, ds[idx] / 1000.0, ds[idx + 1] / 1000.0, ds[idx + 2] / 1000.0
    lon_unwrapped, speed = _noi_suy_lagrange_4(y0, y1, y2, y3, u, step)
    return lon_unwrapped % 360.0, speed


def tat_ca_thien_the(t_utc: dt.datetime) -> dict[str, dict]:
    """Trả thông số vị trí 13 điểm thiên văn trên vòng hoàng đạo 360°."""
    ra: dict[str, dict] = {}
    for ma in HANH_TINH_THU_TU:
        lon, toc_do = vi_tri_hanh_tinh(ma, t_utc)
        chi_so_cung = int(lon // 30.0) % 12
        do_trong_cung = lon - chi_so_cung * 30.0
        ra[ma] = {
            "ma": ma,
            "kinh_do": round(lon, 4),
            "cung": CUNG_HOANG_DAO[chi_so_cung],
            "do_cung": round(do_trong_cung, 2),
            "toc_do_ngay": round(toc_do, 4),
            "nghich_hanh": bool(toc_do < -0.0005),
        }
    return ra


def gio_sao_dia_phuong_deg(t_utc: dt.datetime, kinh_do_dong: float) -> float:
    """Giờ sao biểu kiến địa phương (Local Apparent Sidereal Time = RAMC, tính bằng độ 0–360, Meeus eq. 12.4)."""
    jd = jd_ut(t_utc)
    T = (jd - _J2000) / 36525.0
    gmst = (
        280.46061837
        + 360.98564736629 * (jd - _J2000)
        + 0.000387933 * T * T
        - T * T * T / 38710000.0
    ) % 360.0
    jde = jde_tt(t_utc)
    dpsi, eps = chuong_dong_va_hoang_dao(jde)
    gast = gmst + dpsi * math.cos(math.radians(eps))
    return (gast + kinh_do_dong) % 360.0


def _ra_cung_hoang_dao(ra_deg: float, eps_rad: float) -> float:
    """Đổi xích kinh trên hoàng đạo về kinh độ hoàng đạo (0–360°)."""
    r = math.radians(ra_deg % 360.0)
    return math.degrees(math.atan2(math.sin(r), math.cos(r) * math.cos(eps_rad))) % 360.0


def _placidus_cusp(ramc_deg: float, phi_rad: float, eps_rad: float, f_semi: float, nocturnal: bool) -> float:
    """Giải lặp cố định đỉnh nhà Placidus (11: f=1/3 ngày, 12: f=2/3 ngày, 2: f=2/3 đêm, 3: f=1/3 đêm)."""
    ra_est = (ramc_deg + (180.0 + f_semi * 90.0 if nocturnal else f_semi * 90.0)) % 360.0
    for _ in range(25):
        lam_rad = math.atan2(math.sin(math.radians(ra_est)), math.cos(math.radians(ra_est)) * math.cos(eps_rad))
        sin_dec = math.sin(eps_rad) * math.sin(lam_rad)
        tan_dec = sin_dec / math.sqrt(max(1e-12, 1.0 - sin_dec * sin_dec))
        x = max(-0.999999, min(0.999999, math.tan(phi_rad) * tan_dec))
        ad_deg = math.degrees(math.asin(x))
        if not nocturnal:
            semi_arc = 90.0 + ad_deg
            ra_next = (ramc_deg + f_semi * semi_arc) % 360.0
        else:
            semi_arc = 90.0 - ad_deg
            ra_next = (ramc_deg + 180.0 + f_semi * semi_arc) % 360.0
        if abs(((ra_next - ra_est + 180.0) % 360.0) - 180.0) < 1e-6:
            ra_est = ra_next
            break
        ra_est = ra_next
    return _ra_cung_hoang_dao(ra_est, eps_rad)


def tinh_nha_va_truc(
    t_utc: dt.datetime,
    vi_do: float,
    kinh_do_dong: float,
    he_nha: str = "whole_sign",
) -> dict:
    """Tính Cung Mọc (Ascendant), Thiên Đỉnh (MC) và 12 đỉnh nhà (`whole_sign` hoặc `placidus`).
    Khi |vĩ độ| ≥ 66° (vùng cực Placidus suy biến), tự động lùi an toàn sang `whole_sign` kèm cờ `canh_bao_vi_do_cao`."""
    ramc = gio_sao_dia_phuong_deg(t_utc, kinh_do_dong)
    _, eps_deg = chuong_dong_va_hoang_dao(jde_tt(t_utc))
    eps_r = math.radians(eps_deg)
    ramc_r = math.radians(ramc)
    phi_r = math.radians(vi_do)

    mc = math.degrees(math.atan2(math.sin(ramc_r), math.cos(ramc_r) * math.cos(eps_r))) % 360.0
    asc = math.degrees(
        math.atan2(math.cos(ramc_r), -(math.sin(ramc_r) * math.cos(eps_r) + math.tan(phi_r) * math.sin(eps_r)))
    ) % 360.0

    vi_do_cao = abs(vi_do) >= 66.0
    he_thuc = "whole_sign" if (he_nha == "whole_sign" or vi_do_cao) else "placidus"

    if he_thuc == "whole_sign":
        cung_asc_idx = int(asc // 30.0) % 12
        dinh_12 = [(cung_asc_idx * 30.0 + i * 30.0) % 360.0 for i in range(12)]
    else:
        c1 = asc
        c10 = mc
        c4 = (mc + 180.0) % 360.0
        c7 = (asc + 180.0) % 360.0
        c11 = _placidus_cusp(ramc, phi_r, eps_r, 1.0 / 3.0, nocturnal=False)
        c12 = _placidus_cusp(ramc, phi_r, eps_r, 2.0 / 3.0, nocturnal=False)
        c2 = _placidus_cusp(ramc, phi_r, eps_r, 1.0 / 3.0, nocturnal=True)
        c3 = _placidus_cusp(ramc, phi_r, eps_r, 2.0 / 3.0, nocturnal=True)
        c5 = (c11 + 180.0) % 360.0
        c6 = (c12 + 180.0) % 360.0
        c8 = (c2 + 180.0) % 360.0
        c9 = (c3 + 180.0) % 360.0
        dinh_12 = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12]

    def _thong_tin_diem(deg: float) -> dict:
        idx = int(deg // 30.0) % 12
        return {
            "kinh_do": round(deg, 4),
            "cung": CUNG_HOANG_DAO[idx],
            "do_cung": round(deg - idx * 30.0, 2),
        }

    return {
        "he_nha_yeu_cau": he_nha,
        "he_nha_thuc_te": he_thuc,
        "canh_bao_vi_do_cao": vi_do_cao and he_nha == "placidus",
        "ramc_deg": round(ramc, 4),
        "asc": _thong_tin_diem(asc),
        "mc": _thong_tin_diem(mc),
        "dsc": _thong_tin_diem((asc + 180.0) % 360.0),
        "ic": _thong_tin_diem((mc + 180.0) % 360.0),
        "nha": [
            {"so": i + 1, **_thong_tin_diem(dinh_12[i])}
            for i in range(12)
        ],
    }


def nha_cua_kinh_do(kinh_do: float, dinh_nha_12: list[float]) -> int:
    """Xác định một kinh độ (0–360°) rơi vào nhà nào (1..12) theo chiều hoàng đạo."""
    lon = kinh_do % 360.0
    for i in range(12):
        dau = dinh_nha_12[i] % 360.0
        cuoi = dinh_nha_12[(i + 1) % 12] % 360.0
        span = (cuoi - dau) % 360.0
        dist = (lon - dau) % 360.0
        if dist < span or (span == 0 and i == 0):
            return i + 1
    return 1
