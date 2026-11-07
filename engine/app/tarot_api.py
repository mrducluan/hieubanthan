# -*- coding: utf-8 -*-
"""TR-1 — route Tarot `/v1/tarot/*`. Lớp vỏ mỏng: kiểm đầu vào, gọi CALC/RULES, trả JSON. Không lưu gì, không trả lại câu hỏi.

  GET  /bo-bai     78 lá rút gọn + bộ, nguyên tố, trải bài, chủ đề, trường phái — web vẽ bộ bài
  POST /xao-bai    thứ tự 78 lá + cờ ngược (hạt giống từ cử chỉ người dùng → tất định; trống → CSPRNG)
  POST /doc-bai    bài đọc "Trải bài của bạn" (khuôn doi_song_1) từ lá NGƯỜI DÙNG đã rút
  POST /hieu-cau   ý định của câu hỏi + trải bài gợi ý (TR-2; không trả lại câu hỏi)
  POST /hoi        hỏi đáp tất định (nghĩa lá, vị trí trong trải bài vừa rút, trải bài, khái niệm)
  GET|POST /la-ngay  lá của ngày (chung) / lá riêng theo ngày sinh (POST, không lưu)
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.config import ENGINE_VERSION
from app.calc import tarot as calc
from app.kb import tarot_kb as kb
from app.luangiai import tarot as tr
from app.tuvi_api import _MaMau, _Phieu

router = APIRouter(prefix="/v1/tarot", tags=["tarot"])
_MA_LA = r"^[a-z]{3,4}_[a-z0-9_]{1,12}$"
_MA_NT = r"^[a-z0-9_]{2,40}$"


class _La(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern=_MA_LA)
    nguoc: bool = False


class XaoInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    hat_giong: str | None = Field(default=None, min_length=4, max_length=256, pattern=r"^[A-Za-z0-9._:-]+$")
    nguoc: bool = True


class DocBaiInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    trai_bai: str = Field(pattern=r"^[a-z_]{3,30}$")
    la: list[_La] = Field(min_length=1, max_length=10)
    cau_hoi: str | None = Field(default=None, max_length=500)
    chu_de: str | None = Field(default=None, max_length=30, pattern=r"^[a-z_]+$")
    ngay_xem: _dt.date | None = None
    nam_sinh: int | None = Field(default=None, ge=1900, le=2100)
    ngay_sinh: _dt.date | None = Field(default=None, ge=_dt.date(1900, 1, 1), le=_dt.date(2100, 12, 31))
    gioi_tinh: Literal["nam", "nu"] | None = None
    # Tướng và lá bài: câu trả lời khảo sát Nhân tướng của CHÍNH người hỏi (lưu trên máy) — chỉ mã; hoặc bộ tự chọn.
    tra_loi_nhan_tuong: dict[str, str] | None = Field(default=None, max_length=60)
    bo_dai_dien: Literal["gay", "coc", "kiem", "tien"] | None = None
    trong_so: dict[_MaMau, _Phieu] | None = Field(default=None, max_length=5000)
    ca_nhan: dict[_MaMau, Literal["dung", "chua_dung"]] | None = Field(default=None, max_length=500)

    @field_validator("tra_loi_nhan_tuong")
    @classmethod
    def _nt(cls, v):
        import re  # noqa: PLC0415
        for k, a in (v or {}).items():
            if not (re.match(_MA_NT, k) and re.match(_MA_NT, a)):
                raise ValueError("mã câu / lựa chọn không hợp lệ")
        return v


class HoiInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cau_hoi: str = Field(min_length=2, max_length=500)
    trai_bai: str | None = Field(default=None, pattern=r"^[a-z_]{3,30}$")
    la: list[_La] | None = Field(default=None, max_length=10)


class HieuCauInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cau_hoi: str = Field(default="", max_length=500)
    chu_de: str | None = Field(default=None, max_length=30, pattern=r"^[a-z_]+$")


class LaNgayInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay: _dt.date | None = None
    ngay_sinh: _dt.date | None = Field(default=None, ge=_dt.date(1900, 1, 1), le=_dt.date(2100, 12, 31))


@router.get("/bo-bai")
def api_bo_bai() -> dict:
    return {"engine_version": ENGINE_VERSION, "pham_vi": "tarot_bo_bai", **tr.bo_bai()}


@router.post("/xao-bai")
def api_xao_bai(inp: XaoInput) -> dict:
    return {"engine_version": ENGINE_VERSION, "pham_vi": "tarot_xao", **calc.xao(inp.hat_giong, inp.nguoc)}


@router.post("/doc-bai")
def api_doc_bai(inp: DocBaiInput) -> dict:
    if inp.trai_bai not in kb.trai_bai():
        raise HTTPException(422, detail="Không có trải bài này.")
    try:
        bc = tr.bao_cao(inp.trai_bai, [l.model_dump() for l in inp.la], cau_hoi=inp.cau_hoi, chu_de=inp.chu_de, ngay_xem=inp.ngay_xem,
                        nam_sinh=inp.ngay_sinh or inp.nam_sinh, gioi_tinh=inp.gioi_tinh, tra_loi_nhan_tuong=inp.tra_loi_nhan_tuong,
                        bo_dai_dien=inp.bo_dai_dien, trong_so={k: v.model_dump() for k, v in (inp.trong_so or {}).items()} or None, ca_nhan=inp.ca_nhan)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    return {"engine_version": ENGINE_VERSION, "pham_vi": "tarot_doi_song", **bc}


@router.post("/hoi")
def api_hoi(inp: HoiInput) -> dict:
    kq = tr.hoi(inp.cau_hoi, trai_bai=inp.trai_bai, la=[l.model_dump() for l in inp.la] if inp.la else None)
    return {"engine_version": ENGINE_VERSION, "pham_vi": "tarot_hoi", **kq}


@router.post("/hieu-cau")
def api_hieu_cau(inp: HieuCauInput) -> dict:
    """TR-2: ý định + lĩnh vực + trải bài hợp câu hỏi (chỉ mã / nhãn danh mục; câu hỏi không lưu, không trả lại)."""
    return {"engine_version": ENGINE_VERSION, "pham_vi": "tarot_hieu_cau", **tr.hieu_cau_cong_khai(inp.cau_hoi, inp.chu_de)}


@router.get("/la-ngay")
def api_la_ngay(ngay: _dt.date | None = None) -> dict:
    return {"engine_version": ENGINE_VERSION, "pham_vi": "tarot_la_ngay", **tr.la_ngay(ngay)}


@router.post("/la-ngay")
def api_la_ngay_rieng(inp: LaNgayInput) -> dict:
    return {"engine_version": ENGINE_VERSION, "pham_vi": "tarot_la_ngay", **tr.la_ngay(inp.ngay, inp.ngay_sinh)}
