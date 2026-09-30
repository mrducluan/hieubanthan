# -*- coding: utf-8 -*-
"""Endpoint Kinh Dịch — /v1/kinhdich/khoi-que.

Chỉ trả CẤU TRÚC quẻ, chưa luận giải (luận giải thuộc tầng KB/RULES/NARRATIVE).

Ép kỷ luật của skill kinh-dich ngay ở cửa vào:
  - chốt MỘT trường phái trước khi gieo (Nghĩa Lý / Lục Hào / Mai Hoa);
  - Lục Hào: bắt buộc chốt dụng thần trước, thiếu thì không cho gieo;
  - quẻ đến từ engine gieo (CSPRNG) hoặc người dùng gieo tay — không có trường
    nào để chọn quẻ theo số (extra="forbid").
Engine không lưu gì: câu hỏi chỉ được phản hồi lại trong meta.
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import kinhdich
from app.config import ENGINE_VERSION

router = APIRouter(prefix="/v1/kinhdich", tags=["kinhdich"])

LUC_THAN = ("Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ")


class KhoiQueInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cau_hoi: str = Field(min_length=3, max_length=500)
    truong_phai: Literal["nghia_ly", "luc_hao", "mai_hoa"]
    phuong_phap: Literal["thi", "tien", "thi-vatly"] = "thi"
    dung_than: Literal[LUC_THAN] | None = None                 # type: ignore[valid-type]
    tieu_chi_sai: str | None = Field(default=None, max_length=500)
    gia_tri_hao: list[int] | None = Field(default=None, min_length=6, max_length=6)


@router.post("/khoi-que")
def api_khoi_que(inp: KhoiQueInput) -> dict:
    if inp.truong_phai == "luc_hao" and not inp.dung_than:
        raise HTTPException(422, detail=(
            "Lục Hào: phải chốt dụng thần TRƯỚC khi gieo (Phụ Mẫu / Huynh Đệ / Tử Tôn "
            "/ Thê Tài / Quan Quỷ). Chọn sau khi thấy quẻ là tự lừa."))

    if inp.gia_tri_hao is not None:
        vals = inp.gia_tri_hao
        nguon = "gieo tay (người dùng nhập)"
    else:
        vals = kinhdich.gieo(inp.phuong_phap)
        nguon = f"engine, {inp.phuong_phap}, secrets CSPRNG"

    try:
        que = kinhdich.khoi_que(vals)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))

    flags: list[dict] = []
    if not inp.tieu_chi_sai:
        flags.append({"loai": "chua_chot_tieu_chi_sai", "chi_tiet": (
            "Chưa chốt tiêu chí sai — luận đoán này không kiểm chứng được.")})
    flags.append({"loai": "chua_tinh_vuong_suy", "chi_tiet": (
        "Vượng suy theo nguyệt kiến / nhật thần và tuần không CHƯA được tính.")})

    return {
        "engine_version": ENGINE_VERSION,
        "pham_vi": "cau_truc_que",
        "meta": {
            "cau_hoi": inp.cau_hoi,
            "truong_phai": inp.truong_phai,
            "dung_than_chot_truoc": inp.dung_than,
            "tieu_chi_sai": inp.tieu_chi_sai,
            "thoi_diem": _dt.datetime.now(_dt.timezone.utc).isoformat(),
            "phuong_phap": inp.phuong_phap if inp.gia_tri_hao is None else None,
            "nguon_ngau_nhien": nguon,
            "gia_tri_hao_1_den_6": vals,
        },
        **que,
        "co_canh_bao": flags,
    }
