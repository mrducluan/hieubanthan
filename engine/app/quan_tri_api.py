# -*- coding: utf-8 -*-
"""QT-3 — route cho trợ lý AI trang quản trị. Web gọi sau khi đã kiểm phiên quản trị (aal2 + vai trò sửa KB).
Trả JSONResponse thường (KHÔNG qua bộ lọc công khai BM-1): đây là nháp nội bộ, lọc chữ sẽ làm sai nội dung nháp."""
from __future__ import annotations

import hmac
import os
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app import quan_tri_ai



def _khoa_quan_tri(x_quan_tri_key: str = Header("")) -> None:
    """SEC-2: route AI quản trị là proxy LLM tuỳ ý → ngoài khoá dịch vụ chung còn cần khoá riêng `ENGINE_QUAN_TRI_KEY`
    (chỉ web + CMS máy chủ biết). Chưa đặt env thì không đòi (giữ chạy như cũ cho tới khi chủ dự án đặt)."""
    k = os.environ.get("ENGINE_QUAN_TRI_KEY", "")
    if k and not hmac.compare_digest(x_quan_tri_key.encode(), k.encode()):
        raise HTTPException(403, detail="Thiếu hoặc sai khoá quản trị")


router = APIRouter(prefix="/v1/quan-tri", tags=["quan-tri"], default_response_class=JSONResponse,
                   dependencies=[Depends(_khoa_quan_tri)])


class SoanNhapVao(BaseModel):
    tep: str = Field(pattern=r"^[a-z0-9_]+\.json$")
    duong: list[str | int] = Field(min_length=1, max_length=12)
    hien_tai: str = Field(max_length=20000)
    hanh_dong: Literal["viet_lai", "mo_rong", "rut_gon", "soat_loi", "doi_thuong"]
    yeu_cau: str = Field(default="", max_length=500)
    ngu_canh: dict = Field(default_factory=dict)


class MucKiem(BaseModel):
    moi: str = Field(max_length=20000)
    cu: str | None = Field(default=None, max_length=20000)


class KiemDinhVao(BaseModel):
    muc: list[MucKiem] = Field(min_length=1, max_length=200)


@router.post("/soan-nhap")
def soan_nhap(vao: SoanNhapVao) -> dict:
    ngu_canh = vao.ngu_canh if len(str(vao.ngu_canh)) <= 4000 else {}
    return quan_tri_ai.soan_nhap(tep=vao.tep, duong=vao.duong, hien_tai=vao.hien_tai, hanh_dong=vao.hanh_dong,
                                 yeu_cau=vao.yeu_cau, ngu_canh=ngu_canh)


@router.post("/kiem-dinh")
def kiem_dinh(vao: KiemDinhVao) -> dict:
    return {"ket_qua": [quan_tri_ai.kiem_dinh(m.moi, m.cu) for m in vao.muc]}
