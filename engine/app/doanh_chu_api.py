# -*- coding: utf-8 -*-
"""API Bậc 2 & 3 cho Chủ Doanh Nghiệp: POST /v1/doanh-chu/doi-ngu."""
from __future__ import annotations

import datetime as dt
import os

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


def _kiem_ngay(tv: ThanhVienIn) -> None:
    try:
        dt.date(tv.nam, tv.thang, tv.ngay)
    except ValueError as e:
        raise HTTPException(422, detail=f"Ngày sinh không hợp lệ: {tv.ngay}/{tv.thang}/{tv.nam}") from e


def da_bat() -> bool:
    """Route mặc định TẮT (404) cho tới khi chủ dự án chốt chính sách.

    Nội dung gợi ý vai trò / giao chỉ tiêu cho nhân sự theo lá số đang va quy tắc CY-1/CY-2 trong CLAUDE.md
    ("chọn / xếp hạng nhân viên theo lá số" vẫn chặn). Bật bằng env DOANH_CHU_BAT=1 sau khi duyệt.
    """
    return os.getenv("DOANH_CHU_BAT", "").strip() == "1"


@router.post("/doi-ngu")
def phan_tich_doi_ngu(inp: DoiNguIn) -> dict:
    """Phân tích Bản Đồ Cân Bằng Ngũ Hành & Ma Trận Giao Tiếp 2 chiều (không lưu dữ liệu, bắt buộc đồng ý tự nguyện)."""
    if not da_bat():
        raise HTTPException(404, detail="Not Found")
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
