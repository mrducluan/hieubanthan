# -*- coding: utf-8 -*-
"""GD-1 đợt 1 — POST /v1/gia-dinh: "Bảng nhà mình" (luangiai/gia_dinh). Không nhận tên người (extra="forbid"), không lưu."""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.luangiai import gia_dinh as G

router = APIRouter(tags=["gia-dinh"])


class NguoiNha(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern=r"^[a-z0-9]{1,12}$")
    vai: Literal[tuple(G.VAI)]  # type: ignore[valid-type]
    nam_sinh: int = Field(ge=1901, le=2098)
    gioi_tinh: Literal["nam", "nu"] | None = None
    ngay_sinh: _dt.date | None = Field(default=None, ge=_dt.date(1901, 1, 1), le=_dt.date(2098, 12, 31))


class GiaDinhInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nam: int | None = Field(default=None, ge=1901, le=2098)
    nguoi: list[NguoiNha] = Field(min_length=1, max_length=G.TOI_DA)


@router.post("/v1/gia-dinh")
def api_gia_dinh(inp: GiaDinhInput) -> dict:
    ds = []
    for p in inp.nguoi:
        x = p.model_dump()
        if p.ngay_sinh:
            if p.ngay_sinh.year != p.nam_sinh:
                raise HTTPException(422, detail="Năm sinh không khớp ngày sinh")
            x["ngay_sinh"] = p.ngay_sinh.isoformat()
        ds.append(x)
    try:
        return G.bang(inp.nam or G.nam_am_hien_tai(), ds)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
