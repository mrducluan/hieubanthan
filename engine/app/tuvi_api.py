# -*- coding: utf-8 -*-
"""SPEC-004a — endpoint tuần/triệt + can chi (chưa phải lá số an sao đầy đủ).

Đường đi: giờ đồng hồ → timebase (múi giờ lịch sử) → lịch âm (HND, UTC+7)
→ can chi năm → tuan_triet_vendor.phan_tich (bản sao nguyên văn engine của
người dùng — KHÔNG viết lại logic).

Phạm vi output khai báo rõ: pham_vi = "tuan_triet_only". An sao 14 chính tinh
là SPEC-005, cần quyết định nguồn tri thức riêng.
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app import config
from app.calc import lunar, timebase, tuan_triet_vendor
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


@router.post("/tuan-triet")
def api_tuan_triet(inp: TuanTrietInput) -> dict:
    gio, phut = int(inp.birth_time[:2]), int(inp.birth_time[3:])
    if gio > 23 or phut > 59:
        raise HTTPException(422, detail="Giờ sinh không hợp lệ")

    # ---- 0. Âm lịch đầu vào? Đổi về dương trước đã ------------------------
    duong_goc = inp.birth_date
    if inp.calendar_type == "am":
        try:
            d, m, y = lunar.lunar_to_solar(
                inp.birth_date.day, inp.birth_date.month, inp.birth_date.year,
                1 if inp.am_nhuan else 0, config.CALENDAR_MERIDIAN_TZ,
            )
        except ValueError as e:
            raise HTTPException(422, detail=str(e))
        duong_goc = _dt.date(y, m, d)

    # ---- 1. Múi giờ lịch sử ----------------------------------------------
    if duong_goc < _NGAY_THONG_NHAT_MUI_GIO and inp.vung is None:
        raise HTTPException(422, detail=(
            "Sinh trước 13/06/1975: bắt buộc khai 'vung' (north/south theo NƠI "
            "SINH) vì hai miền dùng múi giờ khác nhau — kết quả có thể lệch cả "
            "ngày can chi."))
    vung = inp.vung or Region.NORTH   # sau 1975 hai vùng cùng UTC+7, chọn gì cũng vậy

    clock_dt = _dt.datetime(duong_goc.year, duong_goc.month, duong_goc.day, gio, phut)
    tb = timebase.to_calendar_time(clock_dt, vung)
    ngay_kinh_tuyen = tb.calendar_dt.date()

    # ---- 2. Lịch âm + can chi năm ----------------------------------------
    ld, lm, ly, leap = lunar.solar_to_lunar(
        ngay_kinh_tuyen.day, ngay_kinh_tuyen.month, ngay_kinh_tuyen.year,
        config.CALENDAR_MERIDIAN_TZ,
    )
    can, chi = lunar.can_chi_nam(ly)

    # ---- 3. Tuần/Triệt qua engine gốc (vendor nguyên văn) -----------------
    che_do = inp.che_do or (
        tuan_triet_vendor.PHAI[inp.truong_phai]["che_do"] if inp.truong_phai else "hep"
    )
    tt = tuan_triet_vendor.phan_tich(can, chi, che_do, inp.truong_phai)

    # ---- 4. Cờ cảnh báo — phơi ra hết, không giấu -------------------------
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
    if inp.do_tin_gio is not HourConfidence.EXACT:
        flags.append({"loai": "hour_confidence",
                      "chi_tiet": f"Độ tin giờ sinh: {inp.do_tin_gio.value}."})

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
