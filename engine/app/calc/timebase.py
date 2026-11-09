# -*- coding: utf-8 -*-
"""Nền thời gian: múi giờ đồng hồ lịch sử → giờ kinh tuyến lịch → ngày can chi.

Đây là tầng dễ sai âm thầm nhất: sai một giờ thì trụ ngày đổi mà bản luận vẫn
trôi chảy như thường. Mọi chính sách nằm ở `app.config` — file này chỉ áp dụng,
không quyết định.

Tầng CALC: thuần tuý, tất định, không LLM, không DB.
"""
from __future__ import annotations

from dataclasses import dataclass
import math
from datetime import date, datetime, timedelta

from app import config
from app.config import Region, TyBoundary, TY_EDGE_WINDOW


def clock_offset(d: date, region: Region, gio: int | None = None) -> tuple[float, bool]:
    """Múi giờ đồng hồ tại nơi sinh vào ngày sinh (và giờ, khi mốc đổi giữa ngày). Uỷ quyền cho config."""
    return config.clock_offset(d, region, gio)


@dataclass(frozen=True)
class CalendarTime:
    """Kết quả quy đổi một mốc đồng hồ về kinh tuyến lịch 105°Đ."""
    calendar_dt: datetime     # thời điểm theo kinh tuyến lịch (UTC+7)
    clock_offset: float       # múi giờ đồng hồ gốc lúc sinh
    tz_disputed: bool         # nằm trong vùng nguồn sử liệu mâu thuẫn


def to_calendar_time(clock_dt: datetime, region: Region) -> CalendarTime:
    """Đổi giờ đồng hồ lúc sinh → giờ theo kinh tuyến lịch.

    Ví dụ kinh điển: sinh 00:30 ngày 02/12/1970 tại Sài Gòn. Đồng hồ khi đó
    chạy UTC+8, kinh tuyến lịch là UTC+7 → giờ lịch thật là 23:30 ngày 01/12.
    Cả NGÀY sinh lẫn GIỜ sinh đều đổi. Bỏ bước này là sai từ gốc.
    """
    offset, disputed = clock_offset(clock_dt.date(), region, clock_dt.hour)
    delta_hours = config.CALENDAR_MERIDIAN_TZ - offset
    return CalendarTime(
        calendar_dt=clock_dt + timedelta(hours=delta_hours),
        clock_offset=offset,
        tz_disputed=disputed,
    )


def ngay_can_chi(calendar_dt: datetime) -> date:
    """Ngày dùng để lấy can chi, theo chính sách ranh giới giờ Tý ĐÃ CHỐT.

    SWITCH_AT_2300: 23:00–23:59 thuộc ngày can chi HÔM SAU (tảo Tý).
    SWITCH_AT_0000: 23:00–23:59 vẫn thuộc ngày can chi HÔM ĐÓ.

    Gọi hàm này khi chính sách chưa chốt → RuntimeError. Đó là hành vi đúng.
    """
    policy = config.require_ty_boundary()
    if policy is TyBoundary.SWITCH_AT_2300 and calendar_dt.hour == 23:
        return calendar_dt.date() + timedelta(days=1)
    return calendar_dt.date()


def sat_bien_gio_ty(calendar_dt: datetime) -> bool:
    """Sinh trong 23:00–00:59 → lá số nhạy với sai số vài phút, luôn gắn cờ."""
    start, end = TY_EDGE_WINDOW
    return calendar_dt.hour >= start or calendar_dt.hour < end


def phuong_trinh_thoi_gian_utc(t_utc: datetime) -> float:
    """Phương trình thời gian (phút) tại thời điểm UTC (naive): giờ mặt trời thực − giờ mặt trời trung bình.

    HTT-1: E = L0 − 0,0057183° − α (Meeus 28.3, bỏ số hạng Δψ·cos ε ≤ 1 giây) với L0 = kinh độ trung bình, α = xích kinh
    biểu kiến tính từ kinh độ biểu kiến VSOP87 đang dùng cho tiết khí (`tietkhi`) — sai vài giây, thay công thức xấp xỉ
    ~1 phút trước đây. Vẫn CHỈ để cảnh báo giờ mặt trời thực (SOLAR_TIME_ADJUST=False), không an sao.
    """
    from app.calc import tietkhi  # noqa: PLC0415 — tránh vòng import (tietkhi là tầng CALC thuần)
    jde = tietkhi._jd(t_utc) + tietkhi.delta_t(tietkhi._nam_thap_phan(t_utc)) / 86400
    t = (jde - 2451545.0) / 36525
    l0 = (280.46646 + 36000.76983 * t + 0.0003032 * t * t) % 360
    lam = math.radians(tietkhi._kinh_do_jde(jde))
    eps = math.radians(23.439291111 - (46.8150 * t + 0.00059 * t * t - 0.001813 * t ** 3) / 3600)
    alpha = math.degrees(math.atan2(math.cos(eps) * math.sin(lam), math.cos(lam))) % 360
    e_do = (l0 - 0.0057183 - alpha + 180) % 360 - 180
    return round(e_do * 4, 3)


def phuong_trinh_thoi_gian(d: date) -> float:
    """Phương trình thời gian (phút) của một ngày — lấy tại trưa kinh tuyến lịch (12:00 UTC+7)."""
    return phuong_trinh_thoi_gian_utc(datetime(d.year, d.month, d.day, 12) - timedelta(hours=config.CALENDAR_MERIDIAN_TZ))


def gio_mat_troi_thuc(calendar_dt: datetime, kinh_do: float) -> datetime:
    """Giờ mặt trời thực tại kinh độ `kinh_do` từ giờ kinh tuyến lịch (UTC+7, 105°Đ) — vỏ mỏng của bản UTC bên dưới."""
    # Giờ mặt trời thực là "giờ địa phương biểu kiến" — không có khung múi giờ để cộng lại.
    return gio_mat_troi_thuc_utc(calendar_dt - timedelta(hours=config.CALENDAR_MERIDIAN_TZ), kinh_do)


def gio_mat_troi_thuc_utc(t_utc: datetime, kinh_do: float) -> datetime:
    """HTT-1: giờ mặt trời thực tại kinh độ `kinh_do` (độ Đông dương, Tây âm) từ thời điểm UTC — dùng cho người sinh ở
    nước ngoài (đồng hồ địa phương → UTC qua tzdata rồi mới cộng 4 phút/độ + phương trình thời gian)."""
    return t_utc + timedelta(minutes=kinh_do * 4.0 + phuong_trinh_thoi_gian_utc(t_utc))


def chi_gio(dt: datetime) -> int:
    """Chỉ số canh giờ 0..11 (0 = Tý 23:00–00:59, 1 = Sửu, …)."""
    return ((dt.hour + 1) // 2) % 12
