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


def clock_offset(d: date, region: Region) -> tuple[float, bool]:
    """Múi giờ đồng hồ tại nơi sinh vào ngày sinh. Uỷ quyền cho config."""
    return config.clock_offset(d, region)


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
    offset, disputed = clock_offset(clock_dt.date(), region)
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


def phuong_trinh_thoi_gian(d: date) -> float:
    """Phương trình thời gian (phút): giờ mặt trời thực − giờ mặt trời trung bình.

    Công thức xấp xỉ chuẩn (sai ≤ ~1 phút) — đủ cho CẢNH BÁO, không dùng để an sao.
    """
    b = math.radians(360.0 / 365.0 * (d.timetuple().tm_yday - 81))
    return 9.87 * math.sin(2 * b) - 7.53 * math.cos(b) - 1.5 * math.sin(b)


def gio_mat_troi_thuc(calendar_dt: datetime, kinh_do: float) -> datetime:
    """Giờ mặt trời thực tại kinh độ `kinh_do` từ giờ kinh tuyến lịch (UTC+7, 105°Đ)."""
    lech = (kinh_do - config.CALENDAR_MERIDIAN_TZ * 15.0) * 4.0 + phuong_trinh_thoi_gian(calendar_dt.date())
    return calendar_dt + timedelta(minutes=lech)


def chi_gio(dt: datetime) -> int:
    """Chỉ số canh giờ 0..11 (0 = Tý 23:00–00:59, 1 = Sửu, …)."""
    return ((dt.hour + 1) // 2) % 12
