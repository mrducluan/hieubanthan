# -*- coding: utf-8 -*-
"""NT-1 — route Nhân tướng học `/v1/nhan-tuong/*`. Lớp vỏ mỏng: kiểm đầu vào, gọi RULES, trả JSON. Không lưu gì.

  GET  /khao-sat         bộ câu hỏi tự quan sát + bộ vị (vùng vẽ) + trường phái — web chỉ hiển thị
  POST /luan-giai        báo cáo "Gương mặt của bạn" (khuôn doi_song_1) từ câu trả lời (+ năm sinh, giới tính, Bát tự tuỳ chọn)
  POST /hoi              hỏi đáp theo bộ vị / cung / nốt ruồi / tuổi lưu niên
  POST /do-anh           điểm người dùng tự chấm trên ảnh (toạ độ chuẩn hoá, KHÔNG ảnh) → tỉ lệ ba đình + lựa chọn điền sẵn
  POST /doc-anh          (mặc định tắt) máy gợi ý lựa chọn từ ảnh chân dung — mọi nhãn can_xac_nhan
  GET  /cau-hinh         {doc_anh: bật/tắt}
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.config import ENGINE_VERSION
from app.calc import nhan_tuong as calc
from app.luangiai import nhan_tuong as nt
from app.tuvi_api import TuanTrietInput, _MaMau, _Phieu

router = APIRouter(prefix="/v1/nhan-tuong", tags=["nhan-tuong"])

_MA = r"^[a-z0-9_]{2,40}$"


class _TraLoi(BaseModel):
    model_config = ConfigDict(extra="forbid")


def _kiem_tra_loi(v: dict | None) -> dict:
    v = v or {}
    if len(v) > 60:
        raise ValueError("quá nhiều câu trả lời")
    import re
    for k, a in v.items():
        if not (isinstance(k, str) and re.match(_MA, k) and isinstance(a, str) and re.match(_MA, a)):
            raise ValueError("mã câu / lựa chọn không hợp lệ")
    return v


class LuanGiaiNTInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    tra_loi: dict[str, str] = Field(default_factory=dict)
    nam_sinh: int | None = Field(default=None, ge=1900, le=2100)
    ngay_sinh: _dt.date | None = Field(default=None, ge=_dt.date(1900, 1, 1), le=_dt.date(2100, 12, 31))
    gioi_tinh: Literal["nam", "nu"] | None = None
    ngay_xem: _dt.date | None = None
    # Tướng và lá số: tuỳ chọn, cùng đầu vào lá số Bát tự (web gửi khi hồ sơ có giờ sinh).
    la_so: TuanTrietInput | None = None
    trong_so: dict[_MaMau, _Phieu] | None = Field(default=None, max_length=5000)
    ca_nhan: dict[_MaMau, Literal["dung", "chua_dung"]] | None = Field(default=None, max_length=500)

    @field_validator("tra_loi")
    @classmethod
    def _v(cls, v):
        return _kiem_tra_loi(v)


class HoiNTInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cau_hoi: str = Field(min_length=2, max_length=500)
    tra_loi: dict[str, str] = Field(default_factory=dict)
    nam_sinh: int | None = Field(default=None, ge=1900, le=2100)
    gioi_tinh: Literal["nam", "nu"] | None = None

    @field_validator("tra_loi")
    @classmethod
    def _v(cls, v):
        return _kiem_tra_loi(v)


class _Diem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)


class DoAnhInput(BaseModel):
    """Toạ độ chuẩn hoá (0..1) của 4 điểm người dùng tự chấm trên ảnh CỦA HỌ trên trình duyệt — ảnh không gửi."""
    model_config = ConfigDict(extra="forbid")
    chan_toc: _Diem
    an_duong: _Diem
    chuan_dau: _Diem
    cam: _Diem


class _Anh(BaseModel):
    model_config = ConfigDict(extra="forbid")
    du_lieu: str = Field(min_length=16, max_length=1_600_000, pattern=r"^[A-Za-z0-9+/]+={0,2}$")
    loai: Literal["image/jpeg", "image/png", "image/webp"]


class DocAnhMatInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    anh: list[_Anh] = Field(min_length=1, max_length=1)


def _battu(inp: LuanGiaiNTInput) -> dict | None:
    if inp.la_so is None:
        return None
    from app.battu_api import _sinh  # noqa: PLC0415
    from app.calc import battu  # noqa: PLC0415
    from app.luangiai import battu_doi_song  # noqa: PLC0415
    try:
        sinh, _ = _sinh(inp.la_so)
        ls = battu.la_so(sinh["lich"], sinh["gioi_tinh"], sinh["gio_ty"], sinh["utc_lich"])
        pt = battu_doi_song.phan_tich(ls)
        return {"cach_1": {"hanh": pt["cach_1"]["hanh"]}, "cach_2": {"hanh": pt["cach_2"]["hanh"]}}
    except Exception:  # noqa: BLE001 — lá số lỗi (kể cả 422 của _sinh) → chương Tướng và lá số ghi thiếu, không vỡ báo cáo
        return None


@router.get("/khao-sat")
def api_khao_sat() -> dict:
    return {"engine_version": ENGINE_VERSION, **nt.khao_sat()}


@router.post("/luan-giai")
def api_luan_giai(inp: LuanGiaiNTInput) -> dict:
    ns = inp.ngay_sinh or inp.nam_sinh
    bc = nt.bao_cao(inp.tra_loi, nam_sinh=ns, gioi_tinh=inp.gioi_tinh, ngay_xem=inp.ngay_xem, battu=_battu(inp),
                    trong_so=inp.trong_so, ca_nhan=inp.ca_nhan)
    return {"engine_version": ENGINE_VERSION, "pham_vi": "nhan_tuong_doi_song", **bc}


@router.post("/hoi")
def api_hoi(inp: HoiNTInput) -> dict:
    kq = nt.hoi(inp.cau_hoi, inp.tra_loi, nam_sinh=inp.nam_sinh, gioi_tinh=inp.gioi_tinh)
    return {"engine_version": ENGINE_VERSION, "pham_vi": "nhan_tuong_hoi", **kq}


@router.post("/do-anh")
def api_do_anh(inp: DoAnhInput) -> dict:
    kq = calc.tam_dinh_tu_diem(inp.model_dump())
    if kq is None:
        raise HTTPException(422, detail="Bốn điểm phải đi từ chân tóc xuống cằm (trên → dưới).")
    return {"engine_version": ENGINE_VERSION, "pham_vi": "nhan_tuong_tam_dinh", "tam_dinh": kq}


@router.post("/doc-anh")
def api_doc_anh(inp: DocAnhMatInput) -> dict:
    from app.narrative import doc_anh_mat  # noqa: PLC0415
    r = doc_anh_mat.doc_anh({"anh": [{"du_lieu": a.du_lieu, "loai": a.loai} for a in inp.anh]})
    return {"engine_version": ENGINE_VERSION, "pham_vi": "nhan_tuong_doc_anh", **r}


@router.get("/cau-hinh")
def api_cau_hinh() -> dict:
    from app.narrative import doc_anh_mat  # noqa: PLC0415
    return {"engine_version": ENGINE_VERSION, "doc_anh": doc_anh_mat.da_bat()}
