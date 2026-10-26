# -*- coding: utf-8 -*-
"""KC-4 GĐ2 — /v1/push/sang-nay: chữ thông báo buổi sáng cho web máy chủ (cron). Chỉ nhận NGÀY + THÁNG sinh (không
năm, không tên), không lưu."""
from __future__ import annotations

import datetime as dt
from typing import Annotated, Literal

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.config import ENGINE_VERSION
from app.luangiai.sang_nay import goi_sang_nay

router = APIRouter(prefix="/v1/push", tags=["push"])


class NhaPush(BaseModel):
    """Y3: chỉ HƯỚNG nhà (độ hoặc 8 hướng) — không năm xây, không bố cục, không người ở."""
    model_config = ConfigDict(extra="forbid")
    huong_do: float | None = Field(default=None, ge=0, lt=360)
    huong: Literal["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] | None = None


class SangNayInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay_xem: dt.date
    ngay_sinh: list[Annotated[str, StringConstraints(pattern=r"^\d{2}-\d{2}$")]] = Field(default_factory=list, max_length=5000)
    nha: list[NhaPush] = Field(default_factory=list, max_length=5000)


@router.post("/sang-nay")
def api_sang_nay(inp: SangNayInput) -> dict:
    return {"engine_version": ENGINE_VERSION,
            **goi_sang_nay(inp.ngay_xem, inp.ngay_sinh, [n.model_dump(exclude_none=True) for n in inp.nha])}
