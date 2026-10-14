# -*- coding: utf-8 -*-
"""TDG-1 — API tuổi làm nhà / cưới, hướng xấu theo năm, tuổi xông đất. Ngày sinh chỉ dùng trong lượt gọi, không lưu."""
from __future__ import annotations

import datetime as _dt
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel, ConfigDict, Field

from app.luangiai import tuoi_dan_gian as L

router = APIRouter(tags=["tuoi-dan-gian"])
NamXem = Annotated[int, Path(ge=1901, le=2099)]
NamSinh = Annotated[int, Path(ge=1900, le=2099)]


class _Sinh(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nam_sinh: int = Field(ge=1900, le=2099)
    thang_sinh: int | None = Field(default=None, ge=1, le=12)
    ngay_sinh: int | None = Field(default=None, ge=1, le=31)


def _kiem(inp: _Sinh, nam_xem: int) -> None:
    if inp.thang_sinh and inp.ngay_sinh:
        try:
            _dt.date(inp.nam_sinh, inp.thang_sinh, inp.ngay_sinh)
        except ValueError:
            raise HTTPException(422, detail="Ngày sinh không tồn tại")
    if inp.nam_sinh > nam_xem:
        raise HTTPException(422, detail="Năm sinh phải trước năm xem")


class LamNhaInput(_Sinh):
    nam_xay: int = Field(ge=1901, le=2099)


@router.post("/v1/tuoi/lam-nha")
def api_lam_nha(inp: LamNhaInput) -> dict:
    _kiem(inp, inp.nam_xay)
    return L.xem_tuoi_lam_nha(inp.nam_sinh, inp.nam_xay, inp.thang_sinh, inp.ngay_sinh)


@router.get("/v1/tuoi/lam-nha/{nam}/{nam_sinh}")
def api_lam_nha_cong_khai(nam: NamXem, nam_sinh: NamSinh) -> dict:
    if nam_sinh > nam:
        raise HTTPException(422, detail="Năm sinh phải trước năm xem")
    return L.xem_tuoi_lam_nha(nam_sinh, nam)


@router.get("/v1/tuoi/han-nam/{nam}")
def api_han_nam(nam: NamXem) -> dict:
    return L.han_nam_luan(nam)


class XongDatInput(_Sinh):
    nam: int = Field(ge=1901, le=2099)


@router.post("/v1/tuoi/xong-dat")
def api_xong_dat(inp: XongDatInput) -> dict:
    _kiem(inp, inp.nam)
    return L.xong_dat_luan(inp.nam, inp.nam_sinh, inp.thang_sinh, inp.ngay_sinh)


@router.get("/v1/tuoi/xong-dat/{nam}/{nam_sinh}")
def api_xong_dat_cong_khai(nam: NamXem, nam_sinh: NamSinh) -> dict:
    if nam_sinh > nam:
        raise HTTPException(422, detail="Năm sinh phải trước năm xem")
    return L.xong_dat_luan(nam, nam_sinh)
