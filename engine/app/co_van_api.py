# -*- coding: utf-8 -*-
"""Chặng 2 — POST /v1/co-van: Cổng Cố vấn Liên mảng Tam Tài (Nhân · Thiên · Địa, thích nghi 3 Bậc đầu vào)."""
from __future__ import annotations

import datetime as dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import tuvi_an_sao
from app.config import ENGINE_VERSION
from app.luangiai import co_van_tam_tai as cv
from app.tuvi_api import _loi_an_sao, _MaMau, _Phieu

router = APIRouter(tags=["co-van"])


class NhaCoVanIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    do_huong: float = Field(..., ge=0.0, lt=360.0)
    nam_xay: int | None = Field(default=None, ge=1864, le=2043)


class DoiTacCoVanIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay_sinh: dt.date
    gioi_tinh: Literal["nam", "nu"] = "nam"
    vai_tro: Literal["nguoi_thuong", "gop_von", "cong_su"] = "cong_su"


class CoVanIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cau_hoi: str = Field(..., min_length=3, max_length=500)
    ngay_sinh: dt.date
    gioi_tinh: Literal["nam", "nu"] = "nam"
    gio_sinh: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    do_tin_gio: Literal["exact", "approx", "unknown"] = "unknown"
    noi_sinh: str | None = Field(default=None, max_length=60)
    nha: NhaCoVanIn | None = None
    doi_tac: DoiTacCoVanIn | None = None
    che_do: Literal["doi_song", "kinh_doanh"] = "doi_song"
    ngay_xem: dt.date | None = None
    dien_dat_toi_da: int | None = Field(default=None, ge=0, le=13)
    trong_so: dict[_MaMau, _Phieu] | None = Field(default=None, max_length=5000)
    ca_nhan: dict[_MaMau, Literal["dung", "chua_dung"]] | None = Field(default=None, max_length=500)


@router.post("/v1/co-van")
def api_co_van(inp: CoVanIn) -> dict:
    if not (1930 <= inp.ngay_sinh.year <= 2025):
        raise HTTPException(422, detail="Năm sinh cần nằm trong khoảng 1930–2025.")
    if inp.doi_tac and not (1930 <= inp.doi_tac.ngay_sinh.year <= 2025):
        raise HTTPException(422, detail="Năm sinh người liên quan cần nằm trong khoảng 1930–2025.")
    try:
        kq = cv.lap(
            cau_hoi=inp.cau_hoi,
            ngay_sinh=inp.ngay_sinh,
            gioi_tinh=inp.gioi_tinh,
            gio_sinh=inp.gio_sinh,
            do_tin_gio=inp.do_tin_gio if inp.gio_sinh else "unknown",
            noi_sinh=inp.noi_sinh,
            nha=inp.nha.model_dump() if inp.nha else None,
            doi_tac=inp.doi_tac.model_dump() if inp.doi_tac else None,
            che_do=inp.che_do,
            ngay_xem=inp.ngay_xem,
            trong_so={k: v.model_dump() for k, v in inp.trong_so.items()} if inp.trong_so else None,
            ca_nhan=inp.ca_nhan,
        )
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    except ValueError as e:
        raise HTTPException(422, detail=str(e)) from e
    return {"engine_version": ENGINE_VERSION, **kq}
