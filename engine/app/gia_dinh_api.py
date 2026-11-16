# -*- coding: utf-8 -*-
"""GD-1 đợt 1 — POST /v1/gia-dinh: "Bảng nhà mình" (luangiai/gia_dinh). Không nhận tên người (extra="forbid"), không lưu."""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app import config
from app.calc import tuvi_an_sao
from app.luangiai import gia_dinh as G
from app.tuvi_api import TuanTrietInput, _DauVao, _loi_an_sao

router = APIRouter(tags=["gia-dinh"])


class NguoiNha(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern=r"^[a-z0-9]{1,12}$")
    vai: Literal[tuple(G.VAI)]  # type: ignore[valid-type]
    nam_sinh: int = Field(ge=1901, le=2098)
    gioi_tinh: Literal["nam", "nu"] | None = None
    ngay_sinh: _dt.date | None = Field(default=None, ge=_dt.date(1901, 1, 1), le=_dt.date(2098, 12, 31))


class GiaDinhInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    nam: int | None = Field(default=None, ge=1901, le=2098)
    nguoi: list[NguoiNha] = Field(min_length=1, max_length=G.TOI_DA)
    # GD-2: lá số theo ngày giờ sinh của CHÍNH người dùng (như các route luận giải; không lưu) → khối "lá số của bạn".
    la_so: TuanTrietInput | None = None
    ngay_xem: _dt.date | None = None


@router.post("/v1/gia-dinh")
def api_gia_dinh(inp: GiaDinhInput) -> dict:
    ds = []
    for p in inp.nguoi:
        x = p.model_dump()
        if p.ngay_sinh:
            if p.ngay_sinh.year != p.nam_sinh:
                raise HTTPException(422, detail="Năm sinh không khớp ngày sinh")
            x["ngay_sinh"] = p.ngay_sinh.isoformat()
        ds.append(x)
    la_so = None
    if inp.la_so:
        dv = _DauVao(inp.la_so)
        cal = dv.tb.calendar_dt
        la_so = {"ngay_xem": inp.ngay_xem or config.hom_nay_vn(),
                 "tv_sinh": {"ngay": cal.date(), "ti": tuvi_an_sao.time_index(cal.hour, cal.minute), "gioi_tinh": inp.la_so.gender,
                             "tz_lich": dv.tz_lich, **dv.tuy_chon, "luu_nguyet": inp.la_so.luu_nguyet},
                 "bt_sinh": {"lich": cal, "gioi_tinh": inp.la_so.gender, "gio_ty": inp.la_so.gio_ty, "utc_lich": dv.utc_lich}}
    try:
        return G.bang(inp.nam or G.nam_am_hien_tai(), ds, la_so)
    except tuvi_an_sao.AnSaoLoi as e:
        # QC: máy an sao bận → vẫn trả bảng nhà (phần theo năm sinh), chỉ thiếu khối "lá số của bạn".
        if la_so is None:
            raise _loi_an_sao(e)
        try:
            return G.bang(inp.nam or G.nam_am_hien_tai(), ds, None)
        except ValueError as e2:
            raise HTTPException(422, detail=str(e2))
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
