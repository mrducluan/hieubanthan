# -*- coding: utf-8 -*-
"""HTT-1 — POST /v1/giao-thoa: "Điểm giao thoa từ điều bạn đã xác nhận". Đầu vào chỉ MÃ hộp đã bấm + kết quả (không câu
chữ, không lá số); ngôn ngữ theo `x-ngon-ngu`. Không lưu gì."""
from __future__ import annotations

from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from app.config import ENGINE_VERSION
from app.luangiai import giao_thoa
from app.tuvi_api import _MaMau, _Phieu

router = APIRouter(tags=["giao-thoa"])


class PhieuVao(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ma: _MaMau
    ket_qua: Literal["dung", "chua_dung"]


class GiaoThoaInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    phieu: list[PhieuVao] = Field(default_factory=list, max_length=200)
    ca_nhan: dict[_MaMau, Literal["dung", "chua_dung"]] | None = Field(default=None, max_length=500)
    trong_so: dict[_MaMau, _Phieu] | None = Field(default=None, max_length=5000)
    # HTT-2 H5: web gửi true khi cài đặt quản trị `giao_thoa.dien_dat` bật — AI chỉ diễn đạt lại hộp đã ghép (bản tất định
    # vẫn là bản chính); chỉ bản tiếng Việt.
    dien_dat: bool = False


@router.post("/v1/giao-thoa")
def api_giao_thoa(inp: GiaoThoaInput) -> dict:
    kq = giao_thoa.lap([p.model_dump() for p in inp.phieu], ca_nhan=inp.ca_nhan,
                       trong_so={k: v.model_dump() for k, v in inp.trong_so.items()} if inp.trong_so else None)
    if inp.dien_dat:
        kq = giao_thoa.dien_dat(kq)
    return {"engine_version": ENGINE_VERSION, **kq}
