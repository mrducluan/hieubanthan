# -*- coding: utf-8 -*-
"""Endpoint Phong thuỷ — /v1/phongthuy/menh-quai và /v1/phongthuy/hoi (Bát trạch, HH-4).

Chỉ cần ngày sinh (hoặc năm) + giới tính; không cần giờ. Mệnh quái đổi năm tại Lập xuân.
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.calc import phongthuy as pt
from app import nhat_ky
from app.config import ENGINE_VERSION
from app.hoidap import phongthuy as hoidap_pt

router = APIRouter(prefix="/v1/phongthuy", tags=["phongthuy"])


class SinhInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    birth_date: _dt.date | None = None
    birth_year: int | None = Field(default=None, ge=1860, le=2150)
    gender: Literal["nam", "nu"]

    @model_validator(mode="after")
    def _can_nam(self) -> "SinhInput":
        if self.birth_date is None and self.birth_year is None:
            raise ValueError("cần birth_date hoặc birth_year")
        return self

    def sinh(self) -> dict:
        return {"nam": self.birth_date.year if self.birth_date else self.birth_year,
                "gioi_tinh": self.gender, "ngay": self.birth_date}


@router.post("/menh-quai")
def api_menh_quai(inp: SinhInput) -> dict:
    s = inp.sinh()
    mq = pt.menh_quai(s["nam"], s["gioi_tinh"], s["ngay"])
    bang = pt.bang_huong(mq["quai"])
    return {"engine_version": ENGINE_VERSION, **mq, "bang_huong": bang,
            "huong_cat": [h for h, d in bang.items() if d in pt.CAT]}


class HoiPTInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cau_hoi: str = Field(min_length=3, max_length=500)
    sinh: SinhInput | None = None
    ngay_xem: _dt.date | None = None


@router.post("/hoi")
def api_hoi(inp: HoiPTInput, background: BackgroundTasks) -> dict:
    try:
        kq = hoidap_pt.tra_loi(inp.cau_hoi.strip(), sinh=inp.sinh.sinh() if inp.sinh else None,
                               ngay_xem=inp.ngay_xem)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    background.add_task(nhat_ky.ghi_huyenhoc, "phongthuy", inp.cau_hoi, kq, inp.sinh is not None)
    return {"engine_version": ENGINE_VERSION, **kq}
