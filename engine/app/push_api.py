# -*- coding: utf-8 -*-
"""KC-4 GĐ2 — /v1/push/sang-nay: chữ thông báo buổi sáng cho web máy chủ (cron). Chỉ nhận NGÀY + THÁNG sinh (không
năm, không tên), không lưu."""
from __future__ import annotations

import datetime as dt
from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.calc import tuvi_an_sao
from app.config import ENGINE_VERSION, HourConfidence
from app.luangiai import thang_hai_la_so, tuan_hai_nguoi
from app.luangiai.sang_nay import goi_sang_nay
from app.tuvi_api import TuanTrietInput, _DauVao

router = APIRouter(prefix="/v1/push", tags=["push"])


class NhaPush(BaseModel):
    """Y3: chỉ HƯỚNG nhà (độ hoặc 8 hướng) — không năm xây, không bố cục, không người ở."""
    model_config = ConfigDict(extra="forbid")
    huong_do: float | None = Field(default=None, ge=0, lt=360)
    huong: Literal["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] | None = None


class SangNayInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay_xem: dt.date
    ngay_sinh: list[Annotated[str, StringConstraints(pattern=r"^\d{2}-\d{2}$")]] = Field(default_factory=list, max_length=5000)
    nha: list[NhaPush] = Field(default_factory=list, max_length=5000)


@router.post("/sang-nay")
def api_sang_nay(inp: SangNayInput) -> dict:
    return {"engine_version": ENGINE_VERSION,
            **goi_sang_nay(inp.ngay_xem, inp.ngay_sinh, [n.model_dump(exclude_none=True) for n in inp.nha])}


# ---------------------------------------------------------------- Ý1 (HTT-2 mục 8): đầu tháng "hai lá số cùng nói"
class NguoiThang(BaseModel):
    model_config = ConfigDict(extra="forbid")
    la_so: TuanTrietInput


class ThangHaiLaSoInput(BaseModel):
    """Cron web gửi lá số (ngày giờ nơi sinh, giới tính — KHÔNG tên, không user_id) của những người đã TỰ TÍCH nhận mốc
    `thang_hai_la_so` (migration 0035). Tối đa 200 người một lượt; engine không lưu."""
    model_config = ConfigDict(extra="forbid")
    ngay_xem: dt.date
    nguoi: list[NguoiThang] = Field(default_factory=list, max_length=200)


@router.post("/thang-hai-la-so")
def api_thang_hai_la_so(inp: ThangHaiLaSoInput) -> dict:
    """`ket_qua[i]` theo đúng thứ tự `nguoi` — None khi không biết giờ sinh, lá số lỗi, hoặc tháng không có đủ hai lá."""
    ra: list[dict | None] = []
    for ng in inp.nguoi:
        ls = ng.la_so
        if ls.do_tin_gio is HourConfidence.UNKNOWN:
            ra.append(None)                           # không đọc Tử vi / Bát tự theo giờ tạm (review EN-2 #10)
            continue
        try:
            dv = _DauVao(ls)
            cal = dv.tb.calendar_dt
            tv_sinh = {"ngay": cal.date(), "ti": tuvi_an_sao.time_index(cal.hour, cal.minute), "gioi_tinh": ls.gender,
                       "tz_lich": dv.tz_lich, **dv.tuy_chon, "luu_nguyet": ls.luu_nguyet}
            bt_sinh = {"lich": cal, "gioi_tinh": ls.gender, "gio_ty": ls.gio_ty, "utc_lich": dv.utc_lich}
            ra.append(thang_hai_la_so.lap(ls.birth_date, inp.ngay_xem, ls.gender, tv_sinh, bt_sinh))
        except (HTTPException, ValueError, tuvi_an_sao.AnSaoLoi):
            ra.append(None)                           # một lá lỗi không làm hỏng cả lượt cron
    return {"engine_version": ENGINE_VERSION, "ngay_xem": inp.ngay_xem.isoformat(), "ket_qua": ra}


# ---------------------------------------------------------------- BT-UI đợt 3: sáng thứ Hai "Tuần này của bạn"
class NguoiTuan(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay_sinh: dt.date


class TuanPushInput(BaseModel):
    """Cron web gửi NGÀY SINH dương lịch (không tên, không giờ sinh, không user_id) của những người đã TỰ TÍCH nhận mốc
    `tuan_cua_toi` (migration 0036). Tối đa 500 người một lượt; engine không lưu."""
    model_config = ConfigDict(extra="forbid")
    ngay_xem: dt.date
    nguoi: list[NguoiTuan] = Field(default_factory=list, max_length=500)


@router.post("/tuan")
def api_push_tuan(inp: TuanPushInput) -> dict:
    """`ket_qua[i]` theo đúng thứ tự `nguoi` — None khi `ngay_xem` không phải thứ Hai hoặc ngày sinh ngoài khoảng tính được."""
    ra: list[dict | None] = []
    for ng in inp.nguoi:
        d = ng.ngay_sinh
        try:
            ra.append(tuan_hai_nguoi.push_tuan(d.day, d.month, d.year, inp.ngay_xem) if 1900 <= d.year <= 2100 else None)
        except ValueError:
            ra.append(None)                           # một người lỗi không làm hỏng cả lượt cron
    return {"engine_version": ENGINE_VERSION, "ngay_xem": inp.ngay_xem.isoformat(), "ket_qua": ra}
