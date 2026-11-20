# -*- coding: utf-8 -*-
"""API Bậc 2 & 3 cho Chủ Doanh Nghiệp: POST /v1/doanh-chu/doi-ngu."""
from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import doanh_chu
from app.config import ENGINE_VERSION

router = APIRouter(prefix="/v1/doanh-chu", tags=["doanh-chu"])


class ThanhVienIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ten: str = Field(default="", max_length=60)
    vai_tro: str = Field(default="", max_length=60)
    ngay: int = Field(..., ge=1, le=31)
    thang: int = Field(..., ge=1, le=12)
    nam: int = Field(..., ge=1930, le=2025)
    gioi_tinh: str = Field(default="nam", pattern="^(nam|nu)$")
    dong_y_tu_nguyen: bool = Field(default=False, description="Bắt buộc true cho mỗi thành viên (Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15)")


class DoiNguIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ong_chu: ThanhVienIn
    doi_ngu: list[ThanhVienIn] = Field(..., min_length=1, max_length=8)
    nam_xem: int = Field(..., ge=2020, le=2050)
    cam_ket_thoa_thuan: bool = Field(
        default=False,
        description="Chủ doanh nghiệp xác nhận đã ký thoả thuận riêng và có đồng ý của từng thành viên trước khi nhập dữ liệu",
    )


def _kiem_ngay(tv: ThanhVienIn) -> None:
    try:
        dt.date(tv.nam, tv.thang, tv.ngay)
    except ValueError as e:
        raise HTTPException(422, detail=f"Ngày sinh không hợp lệ: {tv.ngay}/{tv.thang}/{tv.nam}") from e


@router.post("/doi-ngu")
def phan_tich_doi_ngu(inp: DoiNguIn) -> dict:
    """Phân tích Bản Đồ Cân Bằng Ngũ Hành & Ma Trận Giao Tiếp 2 chiều (không lưu dữ liệu, bắt buộc đồng ý tự nguyện)."""
    if not inp.cam_ket_thoa_thuan:
        raise HTTPException(
            422,
            detail="Chủ doanh nghiệp cần xác nhận đã có thoả thuận riêng và sự đồng ý của từng thành viên (cam_ket_thoa_thuan=true).",
        )
    _kiem_ngay(inp.ong_chu)
    for tv in inp.doi_ngu:
        _kiem_ngay(tv)
        if not tv.dong_y_tu_nguyen:
            raise HTTPException(422, detail="Mỗi thành viên cần tự nguyện đồng ý (dong_y_tu_nguyen=true) theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.")
    kq = doanh_chu.ban_do_doi_ngu(
        inp.ong_chu.model_dump(),
        [tv.model_dump() for tv in inp.doi_ngu],
        nam_xem=inp.nam_xem,
    )
    return {"engine_version": ENGINE_VERSION, "khong_luu_du_lieu": True, **kq}
