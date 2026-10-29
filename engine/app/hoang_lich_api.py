# -*- coding: utf-8 -*-
"""HL-1 — API "Xem ngày tốt": thẻ một ngày, lịch tháng, chọn ngày theo việc. Không lưu gì (ngày sinh chỉ dùng để
tính tuổi xung/hợp trong lượt gọi)."""
from __future__ import annotations

import datetime as _dt
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel, ConfigDict, Field

from app.luangiai import hoang_lich as L

router = APIRouter(tags=["hoang-lich"])
_VN = _dt.timezone(_dt.timedelta(hours=7))
_MIN, _MAX = _dt.date(1901, 1, 1), _dt.date(2099, 12, 31)
MaViec = Literal[tuple(v["ma"] for v in L.KB["viec"])]  # type: ignore[valid-type]


class _NguoiXem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nam_sinh: int | None = Field(default=None, ge=1900, le=2100)
    thang_sinh: int | None = Field(default=None, ge=1, le=12)
    ngay_sinh: int | None = Field(default=None, ge=1, le=31)


def _kiem_sinh(inp: _NguoiXem) -> None:
    if inp.nam_sinh and inp.thang_sinh and inp.ngay_sinh:
        try:
            _dt.date(inp.nam_sinh, inp.thang_sinh, inp.ngay_sinh)
        except ValueError:
            raise HTTPException(422, detail="Ngày sinh không tồn tại")


def _trong_khoang(d: _dt.date) -> None:
    if not (_MIN <= d <= _MAX):
        raise HTTPException(422, detail="Chỉ xem được ngày từ 1901 đến 2099")


class NgayInput(_NguoiXem):
    ngay: _dt.date | None = None
    viec: MaViec | None = None


@router.post("/v1/lich/ngay-tot")
def api_ngay_tot(inp: NgayInput) -> dict:
    _kiem_sinh(inp)
    d = inp.ngay or _dt.datetime.now(_VN).date()
    _trong_khoang(d)
    return L.ngay_xem(d, inp.nam_sinh, inp.thang_sinh, inp.ngay_sinh, viec=inp.viec)


class ThangInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nam: int = Field(ge=1901, le=2099)
    thang: int = Field(ge=1, le=12)


@router.post("/v1/lich/thang")
def api_thang(inp: ThangInput) -> dict:
    return L.thang(inp.nam, inp.thang)


class ChonNgayInput(_NguoiXem):
    viec: MaViec
    tu: _dt.date
    den: _dt.date


@router.post("/v1/lich/chon-ngay")
def api_chon_ngay(inp: ChonNgayInput) -> dict:
    _kiem_sinh(inp)
    _trong_khoang(inp.tu)
    _trong_khoang(inp.den)
    if inp.den < inp.tu or (inp.den - inp.tu).days > 92:
        raise HTTPException(422, detail="Khoảng chọn ngày tối đa 3 tháng")
    return L.chon_ngay(inp.viec, inp.tu, inp.den, inp.nam_sinh, inp.thang_sinh, inp.ngay_sinh)


@router.get("/v1/lich/viec")
def api_viec() -> dict:
    return {"viec": [{"ma": v["ma"], "ten": v["ten"]} for v in L.KB["viec"]]}


# GET không kèm dữ liệu cá nhân → web cache được (trang chủ, trang ngày/tháng cho SEO).
@router.get("/v1/lich/ngay-tot/{ngay}")
def api_ngay_tot_cong_khai(ngay: _dt.date) -> dict:
    _trong_khoang(ngay)
    return L.ngay_xem(ngay)


@router.get("/v1/lich/thang/{nam}/{thang}")
def api_thang_cong_khai(nam: Annotated[int, Path(ge=1901, le=2099)], thang: Annotated[int, Path(ge=1, le=12)]) -> dict:
    return L.thang(nam, thang)


# KH-BL đợt 1: bảng giờ hoàng đạo theo địa chi ngày (không phụ thuộc ngày xem → cache dài).
@router.get("/v1/lich/gio-hoang-dao")
def api_gio_hoang_dao() -> dict:
    return L.gio_hoang_dao_bang()


# SEO-L2: ngày tốt theo việc trong một tháng (không dữ liệu cá nhân → web cache được).
@router.get("/v1/lich/viec-thang/{viec}/{nam}/{thang}")
def api_viec_thang(viec: str, nam: Annotated[int, Path(ge=1901, le=2099)], thang: Annotated[int, Path(ge=1, le=12)]) -> dict:
    if viec not in {v["ma"] for v in L.VIEC_SEO}:
        raise HTTPException(404, detail="Không có trang cho việc này")
    return L.viec_thang(viec, nam, thang)
