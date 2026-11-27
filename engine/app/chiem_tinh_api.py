# -*- coding: utf-8 -*-
"""Chặng 4.2 — Route Chiêm tinh phương Tây & Cầu nối Đông–Tây (`/v1/chiem-tinh/*`)."""
from __future__ import annotations

import datetime as dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.config import ENGINE_VERSION
from app.luangiai import chiem_tinh as ct

router = APIRouter(prefix="/v1/chiem-tinh", tags=["chiem-tinh"])


class BanDoSaoIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay_sinh: dt.date
    gio_sinh: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    gioi_tinh: Literal["nam", "nu"] = "nam"
    noi_sinh: str | None = Field(default=None, max_length=60)
    vung_vn: Literal["north", "south"] = "north"
    vi_do: float | None = Field(default=None, ge=-89.9, le=89.9)
    kinh_do: float | None = Field(default=None, ge=-180.0, le=180.0)
    utc_lech: float | None = Field(default=None, ge=-12.0, le=14.0)
    he_nha: Literal["whole_sign", "placidus"] = "whole_sign"
    ngay_xem: dt.date | None = None
    kem_cau_noi_dong_tay: bool = True


class NguoiSynastryIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay_sinh: dt.date
    gio_sinh: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    noi_sinh: str | None = Field(default=None, max_length=60)


class HopDoiSaoIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nguoi_a: NguoiSynastryIn
    nguoi_b: NguoiSynastryIn
    dong_y_tu_nguyen: bool = Field(default=False, description="Bắt buộc true: người liên quan đã tự nguyện đồng ý")
    ngay_xem: dt.date | None = None


@router.post("/ban-do")
def api_ban_do_chiem_tinh(inp: BanDoSaoIn) -> dict:
    if not (1926 <= inp.ngay_sinh.year <= 2049):
        raise HTTPException(422, detail="Năm sinh cần nằm trong phạm vi 1926–2049.")
    if inp.ngay_xem and not (1926 <= inp.ngay_xem.year <= 2049):
        raise HTTPException(422, detail="Năm xem cần nằm trong phạm vi 1926–2049.")
    try:
        kq = ct.doc_ban_do_chiem_tinh(
            ngay_sinh=inp.ngay_sinh,
            gio_sinh=inp.gio_sinh,
            gioi_tinh=inp.gioi_tinh,
            noi_sinh=inp.noi_sinh,
            vung_vn=inp.vung_vn,
            vi_do=inp.vi_do,
            kinh_do=inp.kinh_do,
            utc_lech=inp.utc_lech,
            he_nha=inp.he_nha,
            ngay_xem=inp.ngay_xem,
            kem_cau_noi_dong_tay=inp.kem_cau_noi_dong_tay,
        )
    except ValueError as e:
        raise HTTPException(422, detail=str(e)) from e
    return {"engine_version": ENGINE_VERSION, **kq}


@router.post("/hop-doi")
def api_hop_doi_chiem_tinh(inp: HopDoiSaoIn) -> dict:
    if not inp.dong_y_tu_nguyen:
        raise HTTPException(422, detail="Cần xác nhận người liên quan đã tự nguyện đồng ý chia sẻ ngày sinh.")
    for ng in (inp.nguoi_a, inp.nguoi_b):
        if not (1926 <= ng.ngay_sinh.year <= 2049):
            raise HTTPException(422, detail="Năm sinh cần nằm trong phạm vi 1926–2049.")
    try:
        kq = ct.doc_hop_doi_synastry(
            nguoi_a=inp.nguoi_a.model_dump(),
            nguoi_b=inp.nguoi_b.model_dump(),
            ngay_xem=inp.ngay_xem,
        )
    except ValueError as e:
        raise HTTPException(422, detail=str(e)) from e
    return {"engine_version": ENGINE_VERSION, **kq}
