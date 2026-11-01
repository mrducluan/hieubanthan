# -*- coding: utf-8 -*-
"""NAM-2 — POST /v1/thoi-gian-toi: "Thời gian tới của bạn" (3 tháng · 12 tháng · năm). Ngày sinh / lá số chỉ dùng
trong lượt gọi, không lưu. Có `la_so` (giờ + giới tính + nơi sinh) → thêm lớp Tử vi + Bát tự; tiền xử lý thời gian dùng
lại `_DauVao` (một bộ tính)."""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import tuvi_an_sao
from app.config import ENGINE_VERSION
from app.luangiai import thoi_gian_toi as T
from app.tuvi_api import TuanTrietInput, _DauVao, _loi_an_sao, _MaMau, _Phieu

router = APIRouter(tags=["thoi-gian-toi"])
_VN = _dt.timezone(_dt.timedelta(hours=7))


class ThoiGianToiInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ngay_sinh: _dt.date
    gioi_tinh: Literal["nam", "nu"] | None = None
    la_so: TuanTrietInput | None = None
    nam: int | None = Field(default=None, ge=1901, le=2099)
    ngay_xem: _dt.date | None = None
    dien_dat_toi_da: int | None = Field(default=None, ge=0, le=13)     # SAO-2 gửi kèm; báo cáo này không diễn đạt AI
    trong_so: dict[_MaMau, _Phieu] | None = Field(default=None, max_length=5000)
    ca_nhan: dict[_MaMau, Literal["dung", "chua_dung"]] | None = Field(default=None, max_length=500)


@router.post("/v1/thoi-gian-toi")
def api_thoi_gian_toi(inp: ThoiGianToiInput) -> dict:
    hom_nay = inp.ngay_xem or _dt.datetime.now(_VN).date()
    if inp.ngay_sinh > hom_nay:
        raise HTTPException(422, detail="Ngày sinh phải trước hôm nay")
    tv_sinh = bt_sinh = None
    gioi_tinh = inp.gioi_tinh
    flags: list = []
    if inp.la_so:
        dv = _DauVao(inp.la_so)
        cal = dv.tb.calendar_dt
        gioi_tinh = gioi_tinh or inp.la_so.gender
        tv_sinh = {"ngay": cal.date(), "ti": tuvi_an_sao.time_index(cal.hour, cal.minute), "gioi_tinh": inp.la_so.gender,
                   "tz_lich": dv.tz_lich, **dv.tuy_chon, "luu_nguyet": inp.la_so.luu_nguyet}
        bt_sinh = {"lich": cal, "gioi_tinh": inp.la_so.gender, "gio_ty": inp.la_so.gio_ty}
        flags = list(dv.flags)
    try:
        bc = T.lap(inp.ngay_sinh, hom_nay, inp.nam, gioi_tinh, tv_sinh, bt_sinh,
                   trong_so={k: v.model_dump() for k, v in inp.trong_so.items()} if inp.trong_so else None,
                   ca_nhan=inp.ca_nhan)
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    return {"engine_version": ENGINE_VERSION, **bc, "co_canh_bao": flags}


@router.get("/v1/thoi-gian-toi/nam")
def api_thoi_gian_toi_nam() -> dict:
    """Năm chọn được (năm âm đang đi + năm tới) và năm mặc định (năm tới khi Tết sau còn ≤ 120 ngày) — web chỉ hiện."""
    hom_nay = _dt.datetime.now(_VN).date()
    return {"cac_nam": T.cac_nam(hom_nay), "mac_dinh": T.nam_mac_dinh(hom_nay)}
