# -*- coding: utf-8 -*-
"""KC-4 GĐ2 — /v1/push/sang-nay: chữ thông báo buổi sáng cho web máy chủ (cron). Chỉ nhận NGÀY + THÁNG sinh (không
năm, không tên), không lưu."""
from __future__ import annotations

import datetime as dt
from typing import Annotated

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.config import ENGINE_VERSION
from app.luangiai.sang_nay import goi_sang_nay

router = APIRouter(prefix="/v1/push", tags=["push"])


class SangNayInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay_xem: dt.date
    ngay_sinh: list[Annotated[str, StringConstraints(pattern=r"^\d{2}-\d{2}$")]] = Field(default_factory=list, max_length=5000)


@router.post("/sang-nay")
def api_sang_nay(inp: SangNayInput) -> dict:
    return {"engine_version": ENGINE_VERSION, **goi_sang_nay(inp.ngay_xem, inp.ngay_sinh)}
