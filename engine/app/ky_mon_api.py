# -*- coding: utf-8 -*-
"""Kỳ Môn Độn Giáp — route `/v1/ky-mon/*`. Lớp vỏ mỏng: lập bàn (CALC), đọc bàn (RULES), tra KB. Không lưu gì.

  POST /v1/ky-mon/ban        bàn của một giờ + bài đọc (hướng nào thuận, hợp việc gì); `viec` (tuỳ chọn) → hướng cho việc ấy
  POST /v1/ky-mon/ngay       13 khung giờ của một ngày; `viec` → các giờ hợp việc ấy
  GET  /v1/ky-mon/danh-muc   tám cửa, chín sao, tám thần, cách cục, danh sách việc (trang giải nghĩa)

Không nhận tên, ngày sinh: bàn Kỳ Môn theo giờ là của THỜI ĐIỂM, ai xem cũng ra cùng một bàn."""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import ky_mon as km
from app.config import ENGINE_VERSION
from app.kb import ky_mon_kb as kb
from app.luangiai import ky_mon as doc

router = APIRouter(prefix="/v1/ky-mon", tags=["ky-mon"])

Phep = Literal["sach_bo", "tri_nhuan"]
GioTy = Literal["da_ty", "sang_ngay"]
Huong = Literal["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"]
Viec = Literal["gap_go", "ky_ket", "di_xa", "giay_to", "hoa_giai", "thu_no", "tinh_tam",
               "mo_thi_truong", "ra_mat", "canh_tranh", "chinh_doi_ngu"]


class _Chung(BaseModel):
    model_config = ConfigDict(extra="forbid")
    utc: float = Field(default=7, ge=-12, le=14, multiple_of=0.25)
    phep: Phep = "sach_bo"
    gio_ty: GioTy = "da_ty"
    viec: Viec | None = None
    huong_hop: list[Huong] | None = Field(default=None, max_length=8)   # KM-3: tên hướng hợp mệnh (không năm sinh)


class BanIn(_Chung):
    thoi_diem: _dt.datetime | None = None      # giờ đồng hồ địa phương (không múi giờ); bỏ trống = bây giờ theo `utc`


class NgayIn(_Chung):
    ngay: _dt.date | None = None


def _bay_gio(utc: float) -> _dt.datetime:
    return (_dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(hours=utc)).replace(tzinfo=None, second=0, microsecond=0)


def _tuy_chon(d: _Chung) -> dict:
    return {"utc": d.utc, "phep": d.phep, "gio_ty": d.gio_ty,
            "phep_ghi_chu": None if d.phep == "sach_bo" else "Phép trí nhuận dựng theo sách xưa, chưa có bộ đối chiếu ngoài."}


def _meta() -> dict:
    return {"engine_version": ENGINE_VERSION, **kb.meta()}


@router.post("/ban")
def ban(d: BanIn) -> dict:
    t = d.thoi_diem.replace(tzinfo=None) if d.thoi_diem else _bay_gio(d.utc)
    try:
        b = km.lap_ban(t, utc=d.utc, phep=d.phep, gio_ty=d.gio_ty)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    return {"thoi_diem": t.isoformat(timespec="minutes"), "ban": b, "doc": doc.doc_gio(b, d.viec, d.huong_hop),
            "tuy_chon": _tuy_chon(d), "meta": _meta()}


@router.post("/ngay")
def ngay(d: NgayIn) -> dict:
    n = d.ngay or _bay_gio(d.utc).date()
    try:
        kq = doc.doc_ngay(n, utc=d.utc, phep=d.phep, gio_ty=d.gio_ty, viec=d.viec, huong_hop=d.huong_hop)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e
    return {**kq, "tuy_chon": _tuy_chon(d), "meta": _meta()}


@router.get("/danh-muc")
def danh_muc() -> dict:
    return {**doc.danh_muc(), "meta": _meta()}
