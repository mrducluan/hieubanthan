# -*- coding: utf-8 -*-
"""TV-A — đổi lịch âm ↔ dương cho form hồ sơ + danh sách nơi sinh.

Web không tự đổi lịch (quy tắc "web không tính"): form gọi endpoint này để đổi
ngày âm người dùng nhập ra ngày dương (lưu hồ sơ) và hiển thị ngày âm để họ đối
chiếu với giấy tờ/sổ tử vi của gia đình.
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app import config
from app.calc import dia_ly, lunar
from app.config import Region

router = APIRouter(tags=["lich"])


@router.get("/v1/dia-ly/tinh")
def api_tinh() -> dict:
    return {"tinh": [{k: t[k] for k in ("ma", "ten", "vung")} for t in dia_ly.danh_sach()],
            "nuoc_ngoai": dia_ly.NUOC_NGOAI}


class DoiLichInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    chieu: Literal["am_sang_duong", "duong_sang_am"]
    ngay: int = Field(ge=1, le=31)
    thang: int = Field(ge=1, le=12)
    nam: int = Field(ge=1900, le=2100)
    nhuan: bool = False                 # chỉ với am_sang_duong
    noi_sinh: str | None = Field(default=None, max_length=40)


def _tz_lich(d: _dt.date, noi_sinh: str | None) -> float:
    """Lịch âm đang lưu hành tại nơi sinh vào ngày đó (miền Nam 1960–1975: UTC+8)."""
    t = dia_ly.tra(noi_sinh) if noi_sinh and noi_sinh != dia_ly.NUOC_NGOAI else None
    if t and t["vung"] == Region.SOUTH.value:
        return config.clock_offset(d, Region.SOUTH)[0]
    return config.CALENDAR_MERIDIAN_TZ


@router.post("/v1/lich/doi")
def api_doi_lich(inp: DoiLichInput) -> dict:
    if inp.noi_sinh and inp.noi_sinh != dia_ly.NUOC_NGOAI and dia_ly.tra(inp.noi_sinh) is None:
        raise HTTPException(422, detail="Nơi sinh không có trong danh sách tỉnh/thành")
    try:
        if inp.chieu == "am_sang_duong":
            args = (inp.ngay, inp.thang, inp.nam, 1 if inp.nhuan else 0)
            d, m, y = lunar.lunar_to_solar(*args, config.CALENDAR_MERIDIAN_TZ)
            tz = _tz_lich(_dt.date(y, m, d), inp.noi_sinh)
            if tz != config.CALENDAR_MERIDIAN_TZ:
                d, m, y = lunar.lunar_to_solar(*args, tz)
            duong = _dt.date(y, m, d)
            am = (inp.ngay, inp.thang, inp.nam, inp.nhuan)
        else:
            duong = _dt.date(inp.nam, inp.thang, inp.ngay)
            tz = _tz_lich(duong, inp.noi_sinh)
            ld, lm, ly, leap = lunar.solar_to_lunar(duong.day, duong.month, duong.year, tz)
            am = (ld, lm, ly, bool(leap))
    except ValueError as e:
        raise HTTPException(422, detail=f"Ngày không tồn tại: {e}")
    can, chi = lunar.can_chi_nam(am[2])
    return {
        "duong": {"ngay": duong.day, "thang": duong.month, "nam": duong.year},
        "am": {"ngay": am[0], "thang": am[1], "nam": am[2], "nhuan": am[3]},
        "can_chi_nam": f"{can} {chi}",
        "lich_mien_nam_utc8": tz != config.CALENDAR_MERIDIAN_TZ,
    }
