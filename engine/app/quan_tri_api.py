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


# ---------------------------------------------------------------- HTT-1: lệch tỉ lệ "Đúng với mình" theo ngôn ngữ
class DongTyLe(BaseModel):
    mau: str = Field(pattern=r"^[a-z0-9_.+-]{3,60}$")
    ngon_ngu: str = Field(pattern=r"^[a-z]{2}(-[a-z]{2,4})?$")
    dung: int = Field(ge=0, le=100_000_000)
    chua_dung: int = Field(ge=0, le=100_000_000)


class LechNgonNguVao(BaseModel):
    dong: list[DongTyLe] = Field(default_factory=list, max_length=10_000)
    toi_thieu: int = Field(default=100, ge=10, le=100_000)
    delta: float = Field(default=0.15, ge=0.01, le=0.9)


@router.post("/lech-ngon-ngu")
def lech_ngon_ngu(vao: LechNgonNguVao) -> dict:
    """Web máy chủ đọc `ty_le_kiem_chung_ngon_ngu()` (migration 0034) rồi gửi số vào đây; engine chỉ tính (không chạm DB),
    trả danh sách mã lệch cho NGƯỜI DUYỆT — không sửa gì."""
    from app.luangiai import lech_ngon_ngu as ln  # noqa: PLC0415
    return ln.quet([d.model_dump() for d in vao.dong], toi_thieu=vao.toi_thieu, delta=vao.delta)


class SoanLaiLechVao(BaseModel):
    """HTT-2 H6 — soạn lại NHÁP bản dịch cho một mã hộp bị lệch theo ngôn ngữ (khung "Lệch theo ngôn ngữ" ở /quan-tri/hoc)."""
    ma: str = Field(pattern=r"^ds\.[a-z0-9_]+(\.[a-z0-9_+-]+)+$", max_length=60)
    ngon_ngu: Literal["en"] = "en"


@router.post("/soan-lai-lech")
def soan_lai_lech(vao: SoanLaiLechVao) -> dict:
    """Suy cụm KB từ mã → máy chuyển ngữ QT-0 ba lượt chỉ trên cụm đó → nháp cho người duyệt mở PR (web, QT-1). Không ghi
    KB, không trừ lượt AI của người dùng (quản trị). Thiếu khoá AI → 503."""
    from app.chuyen_ngu import soan_lai  # noqa: PLC0415
    from app.narrative.ai_goi import goi_chat  # noqa: PLC0415
    if not os.environ.get("OPENROUTER_API_KEY"):
        raise HTTPException(503, detail="Chưa cấu hình khoá AI cho máy chuyển ngữ")
    mo_hinh = os.environ.get("CHUYEN_NGU_MODEL")

    def goi(messages, **kw):
        return goi_chat(messages, mo_hinh=mo_hinh, nho=False, tru_luot=False, het_gio=120, **kw)

    try:
        return soan_lai.soan_lai(vao.ma, vao.ngon_ngu, goi=goi)
    except Exception as e:  # noqa: BLE001 — lỗi mạng / JSON của máy chuyển ngữ → báo gọn, không lộ chi tiết nhà cung cấp
        raise HTTPException(502, detail=f"Máy chuyển ngữ chưa trả nháp ({type(e).__name__})") from e
