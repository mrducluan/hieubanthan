# -*- coding: utf-8 -*-
"""Endpoint tử vi.

SPEC-004a — /tuan-triet: tuần/triệt + can chi (Nam phái, vendor nguyên văn).
SPEC-005  — /an-sao: lá số đầy đủ bằng iztro (phái Trung Quốc) chạy cục bộ qua
Node subprocess (app/calc/ziwei.py). Hai endpoint dùng chung phần chuẩn hoá
thời gian và cờ cảnh báo.

Đường đi: giờ đồng hồ → timebase (múi giờ lịch sử) → lịch âm (HND, UTC+7)
→ can chi năm → tuan_triet_vendor.phan_tich (bản sao nguyên văn engine của
người dùng — KHÔNG viết lại logic).

Phạm vi output khai báo rõ: pham_vi = "tuan_triet_only" | "an_sao_iztro".
"""
from __future__ import annotations

import datetime as _dt
from dataclasses import dataclass
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app import config
from app.calc import lunar, timebase, tuan_triet_vendor, ziwei
from app.config import ENGINE_VERSION, HourConfidence, Region

router = APIRouter(prefix="/v1/tuvi", tags=["tuvi"])

_NGAY_THONG_NHAT_MUI_GIO = _dt.date(1975, 6, 13)
_TET_EDGE_DAYS = 2   # sinh cách mùng 1 Tết ≤ 2 ngày → gắn cờ nhạy cảm


class TuanTrietInput(BaseModel):
    birth_date: _dt.date
    birth_time: str = Field(pattern=r"^\d{2}:\d{2}$", examples=["23:30"])
    gender: Literal["nam", "nu"]
    calendar_type: Literal["duong", "am"] = "duong"
    am_nhuan: bool = False                       # chỉ dùng khi calendar_type=am
    vung: Region | None = None                   # bắt buộc nếu sinh trước 13/06/1975
    truong_phai: Literal["npl", "vvt"] | None = None
    che_do: Literal["hep", "tam_hop", "tptc"] | None = None
    do_tin_gio: HourConfidence = HourConfidence.EXACT


@dataclass(frozen=True)
class _ThoiGian:
    """Mốc sinh đã chuẩn hoá: dương gốc → kinh tuyến lịch UTC+7 → âm lịch."""
    duong_goc: _dt.date
    tb: timebase.CalendarTime
    ngay_kinh_tuyen: _dt.date
    ld: int
    lm: int
    ly: int
    leap: int


def _chuan_hoa_thoi_gian(birth_date: _dt.date, birth_time: str,
                         calendar_type: str, am_nhuan: bool,
                         vung_khai: Region | None) -> _ThoiGian:
    gio, phut = int(birth_time[:2]), int(birth_time[3:])
    if gio > 23 or phut > 59:
        raise HTTPException(422, detail="Giờ sinh không hợp lệ")

    # ---- 0. Âm lịch đầu vào? Đổi về dương trước đã ------------------------
    duong_goc = birth_date
    if calendar_type == "am":
        try:
            d, m, y = lunar.lunar_to_solar(
                birth_date.day, birth_date.month, birth_date.year,
                1 if am_nhuan else 0, config.CALENDAR_MERIDIAN_TZ,
            )
        except ValueError as e:
            raise HTTPException(422, detail=str(e))
        duong_goc = _dt.date(y, m, d)

    # ---- 1. Múi giờ lịch sử ----------------------------------------------
    if duong_goc < _NGAY_THONG_NHAT_MUI_GIO and vung_khai is None:
        raise HTTPException(422, detail=(
            "Sinh trước 13/06/1975: bắt buộc khai 'vung' (north/south theo NƠI "
            "SINH) vì hai miền dùng múi giờ khác nhau — kết quả có thể lệch cả "
            "ngày can chi."))
    vung = vung_khai or Region.NORTH   # sau 1975 hai vùng cùng UTC+7, chọn gì cũng vậy

    clock_dt = _dt.datetime(duong_goc.year, duong_goc.month, duong_goc.day, gio, phut)
    tb = timebase.to_calendar_time(clock_dt, vung)
    ngay_kinh_tuyen = tb.calendar_dt.date()

    # ---- 2. Lịch âm ------------------------------------------------------
    ld, lm, ly, leap = lunar.solar_to_lunar(
        ngay_kinh_tuyen.day, ngay_kinh_tuyen.month, ngay_kinh_tuyen.year,
        config.CALENDAR_MERIDIAN_TZ,
    )
    return _ThoiGian(duong_goc, tb, ngay_kinh_tuyen, ld, lm, ly, leap)


def _co_canh_bao(t: _ThoiGian, do_tin_gio: HourConfidence) -> list[dict]:
    """Cờ cảnh báo chung cho mọi endpoint tử vi — phơi ra hết, không giấu."""
    tb, ngay_kinh_tuyen, ly = t.tb, t.ngay_kinh_tuyen, t.ly
    flags: list[dict] = []
    if tb.clock_offset != config.CALENDAR_MERIDIAN_TZ:
        flags.append({"loai": "tz_adjusted", "chi_tiet": (
            f"Đồng hồ nơi sinh chạy UTC+{tb.clock_offset:g}; đã quy đổi về kinh "
            f"tuyến lịch UTC+7: {tb.calendar_dt.strftime('%H:%M ngày %d/%m/%Y')}.")})
    if tb.tz_disputed:
        flags.append({"loai": "tz_disputed", "chi_tiet": (
            "Ngày sinh nằm trong giai đoạn nguồn sử liệu về múi giờ mâu thuẫn — "
            "cần đối chiếu cả hai giả thiết.")})
    if timebase.sat_bien_gio_ty(tb.calendar_dt):
        flags.append({"loai": "ty_edge", "chi_tiet": (
            "Giờ sinh sát ranh giới giờ Tý (23:00–00:59) — trụ ngày nhạy với "
            "sai số vài phút và với quy ước ranh giới chưa chốt.")})
    if do_tin_gio is not HourConfidence.EXACT:
        flags.append({"loai": "hour_confidence",
                      "chi_tiet": f"Độ tin giờ sinh: {do_tin_gio.value}."})

    # Sát Tết: cách mùng 1 âm ≤ 2 ngày (về cả hai phía) → năm can chi nhạy cảm
    try:
        d1, m1, y1 = lunar.lunar_to_solar(1, 1, ly, 0, config.CALENDAR_MERIDIAN_TZ)
        tet_nam_nay = _dt.date(y1, m1, d1)
        d2, m2, y2 = lunar.lunar_to_solar(1, 1, ly + 1, 0, config.CALENDAR_MERIDIAN_TZ)
        tet_nam_sau = _dt.date(y2, m2, d2)
        khoang = min(abs((ngay_kinh_tuyen - tet_nam_nay).days),
                     abs((tet_nam_sau - ngay_kinh_tuyen).days))
        if khoang <= _TET_EDGE_DAYS:
            flags.append({"loai": "tet_edge", "chi_tiet": (
                f"Sinh cách mùng 1 Tết {khoang} ngày — năm can chi đổi ngay tại "
                "ranh giới này. Sai ngày sinh một ngày là sai cả lá số.")})
    except ValueError:
        pass
    return flags


@router.post("/tuan-triet")
def api_tuan_triet(inp: TuanTrietInput) -> dict:
    t = _chuan_hoa_thoi_gian(inp.birth_date, inp.birth_time, inp.calendar_type,
                             inp.am_nhuan, inp.vung)
    tb, ngay_kinh_tuyen = t.tb, t.ngay_kinh_tuyen
    duong_goc, ld, lm, ly, leap = t.duong_goc, t.ld, t.lm, t.ly, t.leap
    can, chi = lunar.can_chi_nam(ly)

    # ---- 3. Tuần/Triệt qua engine gốc (vendor nguyên văn) -----------------
    che_do = inp.che_do or (
        tuan_triet_vendor.PHAI[inp.truong_phai]["che_do"] if inp.truong_phai else "hep"
    )
    tt = tuan_triet_vendor.phan_tich(can, chi, che_do, inp.truong_phai)

    # ---- 4. Cờ cảnh báo — phơi ra hết, không giấu -------------------------
    flags = _co_canh_bao(t, inp.do_tin_gio)

    ngay_cc: str | None = None
    if config.TY_BOUNDARY_POLICY is not None:
        ngay_cc = timebase.ngay_can_chi(tb.calendar_dt).isoformat()

    return {
        "engine_version": ENGINE_VERSION,
        "pham_vi": "tuan_triet_only",
        "duong_lich_goc": duong_goc.isoformat(),
        "duong_lich_kinh_tuyen": ngay_kinh_tuyen.isoformat(),
        "mui_gio_dong_ho": tb.clock_offset,
        "am_lich": {"ngay": ld, "thang": lm, "nam": ly, "nhuan": leap},
        "can_chi_nam": {"can": can, "chi": chi},
        "gioi_tinh": inp.gender,
        "ngay_can_chi": ngay_cc,
        "ty_boundary_policy": (config.TY_BOUNDARY_POLICY.value
                               if config.TY_BOUNDARY_POLICY else None),
        "tuan_triet": tt,
        "co_canh_bao": flags,
    }


# --------------------------------------------------------------------------- #
# SPEC-005 — an sao đầy đủ qua iztro (Node subprocess, chạy cục bộ)
# --------------------------------------------------------------------------- #
class AnSaoInput(BaseModel):
    birth_date: _dt.date
    birth_time: str = Field(pattern=r"^\d{2}:\d{2}$", examples=["23:30"])
    gender: Literal["nam", "nu"]
    calendar_type: Literal["duong", "am"] = "duong"
    am_nhuan: bool = False                       # chỉ dùng khi calendar_type=am
    vung: Region | None = None                   # bắt buộc nếu sinh trước 13/06/1975
    do_tin_gio: HourConfidence = HourConfidence.EXACT


_TRUONG_PHAI_AN_SAO = (
    "iztro — Tử Vi Đẩu Số Trung Quốc (theo phái Trung Quốc, sách 紫微斗数全书), "
    "KHÔNG phải lá số Nam phái Việt Nam. Dùng làm lá số đối chiếu; Tuần/Triệt "
    "Nam phái lấy từ /v1/tuvi/tuan-triet."
)


@router.post("/an-sao")
def api_an_sao(inp: AnSaoInput) -> dict:
    t = _chuan_hoa_thoi_gian(inp.birth_date, inp.birth_time, inp.calendar_type,
                             inp.am_nhuan, inp.vung)
    gio_lich = t.tb.calendar_dt
    ti = ziwei.time_index(gio_lich.hour)

    try:
        la_so = ziwei.an_sao(t.ngay_kinh_tuyen, ti, inp.gender)
    except ziwei.ZiweiUnavailable as e:
        raise HTTPException(503, detail=f"An sao tạm không khả dụng: {e}")
    except ziwei.ZiweiError as e:
        raise HTTPException(500, detail=str(e))

    flags = _co_canh_bao(t, inp.do_tin_gio)

    # Tý muộn: tử vi (iztro, SWITCH_AT_2300) lấy trụ ngày HÔM SAU, thần số
    # (SWITCH_AT_0000) giữ ngày hôm đó. Bắt buộc gắn cờ — quyết định 2026-08-15.
    ty_conflict = ti == 12
    if ty_conflict:
        flags.append({"loai": "ty_conflict", "chi_tiet": (
            "Sinh 23:00–23:59 (Tý muộn): lá số tử vi tính trụ ngày sang HÔM SAU "
            "(theo iztro), còn thần số học vẫn tính ngày HÔM ĐÓ. Hai module dùng "
            "hai quy ước khác nhau — đây là chủ ý, không phải lỗi.")})

    # Đối chiếu độc lập: lịch âm HND của engine vs lịch âm iztro (lunar-lite).
    am_hnd = {"ngay": t.ld, "thang": t.lm, "nam": t.ly, "nhuan": bool(t.leap)}
    if la_so["am_lich"] != am_hnd:
        flags.append({"loai": "lich_am_lech", "chi_tiet": (
            f"Lịch âm Hồ Ngọc Đức ({t.ld}/{t.lm}/{t.ly}"
            f"{' nhuận' if t.leap else ''}) khác lịch âm iztro "
            f"({la_so['am_lich']['ngay']}/{la_so['am_lich']['thang']}/"
            f"{la_so['am_lich']['nam']}) — có thể do lịch Việt (UTC+7) và lịch "
            "Trung Quốc lệch thật ở tháng này, hoặc do lỗi đã biết trong "
            "app/calc/lunar.py (xem NHAT-KY-DU-AN.md). Lá số an theo lịch iztro.")})

    return {
        "engine_version": ENGINE_VERSION,
        "pham_vi": "an_sao_iztro",
        "truong_phai_an_sao": _TRUONG_PHAI_AN_SAO,
        "iztro_version": la_so["iztro_version"],
        "duong_lich_goc": t.duong_goc.isoformat(),
        "duong_lich_kinh_tuyen": t.ngay_kinh_tuyen.isoformat(),
        "gio_kinh_tuyen": gio_lich.strftime("%H:%M"),
        "mui_gio_dong_ho": t.tb.clock_offset,
        "time_index": ti,
        "am_lich": am_hnd,
        "gioi_tinh": inp.gender,
        "_ty_conflict": ty_conflict,
        "ty_boundary_tuvi": config.TUVI_TY_BOUNDARY.value,
        "ty_boundary_than_so": (config.TY_BOUNDARY_POLICY.value
                                if config.TY_BOUNDARY_POLICY else None),
        "la_so": la_so,
        "co_canh_bao": flags,
    }
