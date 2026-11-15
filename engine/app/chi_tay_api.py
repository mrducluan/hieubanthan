# -*- coding: utf-8 -*-
"""Chỉ tay — route `/v1/chi-tay/*`. Lớp vỏ mỏng: tra KB, ghép lời SX-C. Không ảnh, không lưu gì.

  GET  /v1/chi-tay        thư viện 67 hình vân (Thần Tướng Toàn Biên quyển 10) + đồ hình tám cung bàn tay
  POST /v1/chi-tay/doc    lời sách cho các vân người dùng TỰ CHỌN; ngày sinh (tuỳ chọn) chỉ để biết đủ 18 tuổi (nhóm C)
"""
from __future__ import annotations

import datetime as _dt
import re

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app import config
from app.config import ENGINE_VERSION
from app.kb import chi_tay_kb as kb
from app.luangiai import hoan_canh

router = APIRouter(prefix="/v1/chi-tay", tags=["chi-tay"])


class DocIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    van: list[str] = Field(min_length=1, max_length=30)
    ngay_sinh: _dt.date | None = Field(default=None, ge=_dt.date(1900, 1, 1), le=_dt.date(2100, 12, 31))

    @field_validator("van")
    @classmethod
    def _ma(cls, v: list[str]) -> list[str]:
        if any(not re.fullmatch(r"[a-z0-9-]{2,40}", x) for x in v):
            raise ValueError("mã vân không hợp lệ")
        return v


@router.get("")
def api_thu_vien() -> dict:
    return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb.thu_vien()}


@router.post("/doc")
def api_doc(inp: DocIn) -> dict:
    tuoi = hoan_canh.tuoi_tron(inp.ngay_sinh, config.hom_nay_vn()) if inp.ngay_sinh else None
    return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb.doc(inp.van, tuoi)}
