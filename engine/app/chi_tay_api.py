# -*- coding: utf-8 -*-
"""Chỉ tay — route `/v1/chi-tay/*`. Lớp vỏ mỏng: tra KB, ghép lời SX-C. Không ảnh, không lưu gì.

  GET  /v1/chi-tay        thư viện 67 hình vân (Thần Tướng Toàn Biên quyển 10) + đồ hình tám cung bàn tay
  POST /v1/chi-tay/doc    lời sách cho các vân + lựa chọn từng cung người dùng TỰ CHỌN; ngày sinh (tuỳ chọn) chỉ để biết đủ
                          18 tuổi (nhóm C)
  POST /v1/chi-tay/do-tay CT-2: đo bàn tay từ 21 điểm mốc (máy người dùng tìm trên ảnh của họ — ảnh KHÔNG gửi lên), chiếu
                          tám cung lên ảnh; bắt buộc `dong_y: true`. Không lưu toạ độ.
"""
from __future__ import annotations

import datetime as _dt
import re
from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field, StrictBool, field_validator, model_validator

from app import config
from app.calc import chi_tay_do
from app.config import ENGINE_VERSION
from app.kb import chi_tay_kb as kb
from app.luangiai import hoan_canh

router = APIRouter(prefix="/v1/chi-tay", tags=["chi-tay"])


_NGAY_SINH = Field(default=None, ge=_dt.date(1900, 1, 1), le=_dt.date(2100, 12, 31))


class DocIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    van: list[str] = Field(default_factory=list, max_length=30)
    cung: dict[str, str] | None = Field(default=None, max_length=12)
    duong: dict[str, str] | None = Field(default=None, max_length=8)
    ngay_sinh: _dt.date | None = _NGAY_SINH

    @field_validator("van")
    @classmethod
    def _ma(cls, v: list[str]) -> list[str]:
        if any(not re.fullmatch(r"[a-z0-9-]{2,40}", x) for x in v):
            raise ValueError("mã vân không hợp lệ")
        return v

    @field_validator("cung")
    @classmethod
    def _cung(cls, v: dict[str, str] | None) -> dict[str, str] | None:
        if v and (loi := kb.lua_chon_hop_le(v)):
            raise ValueError("; ".join(loi))
        return v

    @field_validator("duong")
    @classmethod
    def _duong(cls, v: dict[str, str] | None) -> dict[str, str] | None:
        if v and (loi := kb.duong_hop_le(v)):
            raise ValueError("; ".join(loi))
        return v

    @model_validator(mode="after")
    def _co_mot(self) -> "DocIn":
        if not self.van and not self.cung and not self.duong:
            raise ValueError("cần ít nhất một vân, một lựa chọn cung hoặc một lựa chọn đường chỉ")
        return self


class DoTayIn(BaseModel):
    """Chỉ toạ độ — không ảnh. `dong_y` phải đúng `true` (người dùng tự tích ô đồng ý `ct1`)."""
    model_config = ConfigDict(extra="forbid")
    dong_y: StrictBool
    tay: Literal["trai", "phai"]
    ty_le: float = Field(ge=0.2, le=5)
    diem: list[tuple[float, float]] = Field(min_length=chi_tay_do.SO_DIEM, max_length=chi_tay_do.SO_DIEM)
    ngay_sinh: _dt.date | None = _NGAY_SINH

    @field_validator("dong_y")
    @classmethod
    def _dong_y(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("cần người dùng đồng ý")
        return v

    @field_validator("diem")
    @classmethod
    def _diem(cls, v: list[tuple[float, float]]) -> list[tuple[float, float]]:
        if any(not (0 <= x <= 1 and 0 <= y <= 1) for x, y in v):
            raise ValueError("toạ độ phải trong khoảng 0..1")
        return v


def _tuoi(ngay_sinh: _dt.date | None) -> int | None:
    return hoan_canh.tuoi_tron(ngay_sinh, config.hom_nay_vn()) if ngay_sinh else None


@router.get("")
def api_thu_vien() -> dict:
    return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb.thu_vien()}


@router.post("/doc")
def api_doc(inp: DocIn) -> dict:
    return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb.doc(inp.van, _tuoi(inp.ngay_sinh), inp.cung, inp.duong)}


@router.post("/do-tay")
def api_do_tay(inp: DoTayIn) -> dict:
    kq = chi_tay_do.do_tay([list(p) for p in inp.diem], inp.ty_le, inp.tay)
    return {"engine_version": ENGINE_VERSION, "pham_vi": "chi_tay", **kb.ket_qua_do_tay(kq, inp.tay, _tuoi(inp.ngay_sinh))}
