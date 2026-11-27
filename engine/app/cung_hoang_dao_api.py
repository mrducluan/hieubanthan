# -*- coding: utf-8 -*-
"""CHT-1 — route 12 cung hoàng đạo (`/v1/chiem-tinh/cung-hoang-dao/*`): bảng theo năm + tra cung theo ngày sinh.

Engine tính, web chỉ hiển thị. Không lưu ngày sinh."""
from __future__ import annotations

import datetime as dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app import config
from app.config import ENGINE_VERSION
from app.luangiai import cung_hoang_dao as chd

router = APIRouter(prefix="/v1/chiem-tinh/cung-hoang-dao", tags=["chiem-tinh"])


class TraIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay: dt.date
    gio: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    vung: Literal["north", "south"] = "north"


@router.get("/nam")
def api_bang_nam_nay() -> dict:
    return api_bang_nam(config.hom_nay_vn().year)


@router.get("/nam/{nam}")
def api_bang_nam(nam: int) -> dict:
    try:
        return {"engine_version": ENGINE_VERSION, **chd.bang_nam(nam)}
    except ValueError as e:
        raise HTTPException(422, detail=str(e)) from None


@router.post("/tra")
def api_tra(inp: TraIn) -> dict:
    try:
        return {"engine_version": ENGINE_VERSION, **chd.tra_cuu(inp.ngay, inp.gio, inp.vung)}
    except ValueError as e:
        raise HTTPException(422, detail=str(e)) from None
