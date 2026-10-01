# -*- coding: utf-8 -*-
"""Endpoint Bát tự — /v1/battu/la-so (tứ trụ, thập thần, ngũ hành, đại vận) và /v1/battu/hoi.

Dùng chung tiền xử lý thời gian với tử vi (âm→dương, múi giờ lịch sử VN, cờ) qua _DauVao.
Giờ Tý bát tự: SWITCH_AT_0000 (chính sách đã chốt) — khác tử vi (iztro); luôn gắn cờ khi 23:xx.
"""
from __future__ import annotations

import datetime as _dt

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import battu, battu_mo_rong
from app import nhat_ky
from app.config import ENGINE_VERSION
from app.hoidap import battu as hoidap_bt
from app.tuvi_api import TuanTrietInput, _DauVao

router = APIRouter(prefix="/v1/battu", tags=["battu"])


def _sinh(inp: TuanTrietInput) -> tuple[dict, list[dict]]:
    dv = _DauVao(inp)
    flags = [f for f in dv.flags if f["loai"] != "tet_edge"]   # bát tự đổi năm tại Lập xuân, không tại Tết
    return {"lich": dv.tb.calendar_dt, "gioi_tinh": inp.gender}, flags


@router.post("/la-so")
def api_la_so(inp: TuanTrietInput) -> dict:
    sinh, flags = _sinh(inp)
    ls = battu.la_so(sinh["lich"], sinh["gioi_tinh"])
    ls["co_canh_bao"] = flags + ls["co_canh_bao"]
    return {"engine_version": ENGINE_VERSION, "pham_vi": "bat_tu", "gio_lich": sinh["lich"].isoformat(), **ls,
            "mo_rong": battu_mo_rong.mo_rong(ls)}


class LuuNienBTInput(BaseModel):
    """VZ-3 — lưu niên + 12 lưu nguyệt đặt cạnh tứ trụ."""
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    nam_xem: int = Field(ge=1900, le=2100)


@router.post("/luu-nien")
def api_luu_nien(inp: LuuNienBTInput) -> dict:
    sinh, _ = _sinh(inp.la_so)
    ls = battu.la_so(sinh["lich"], sinh["gioi_tinh"])
    return {"engine_version": ENGINE_VERSION, **battu_mo_rong.luu_nien(ls, inp.nam_xem)}


class HoiBTInput(BaseModel):
    """Hỏi đáp Bát tự (HH-3). `la_so` tuỳ chọn: câu hỏi chung (nhật chủ, thập thần, thuật ngữ) không cần."""
    model_config = ConfigDict(extra="forbid")

    cau_hoi: str = Field(min_length=3, max_length=500)
    la_so: TuanTrietInput | None = None
    ngay_xem: _dt.date | None = None


@router.post("/hoi")
def api_hoi(inp: HoiBTInput, background: BackgroundTasks) -> dict:
    sinh, flags = (None, [])
    if inp.la_so is not None:
        sinh, flags = _sinh(inp.la_so)
    try:
        kq = hoidap_bt.tra_loi(inp.cau_hoi.strip(), sinh=sinh, ngay_xem=inp.ngay_xem)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    kq["co_canh_bao"] = flags + kq["co_canh_bao"]
    background.add_task(nhat_ky.ghi_huyenhoc, "battu", inp.cau_hoi, kq, inp.la_so is not None)
    return {"engine_version": ENGINE_VERSION, **kq}
