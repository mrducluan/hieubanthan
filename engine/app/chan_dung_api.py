# -*- coding: utf-8 -*-
"""CD-1 — POST /v1/chan-dung: "Chân dung tổng hợp" — ba cách nhìn (Tử vi · Bát tự · Nhân tướng) theo mảng đời.
Lá số (giờ + giới tính + nơi sinh) bắt buộc; câu trả lời khảo sát gương mặt tuỳ chọn (thiếu → hai môn). Không lưu gì;
tiền xử lý thời gian dùng lại `_DauVao` (một bộ tính) như Thời gian tới."""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.calc import tuvi_an_sao
from app.config import ENGINE_VERSION
from app.luangiai import chan_dung_tong_hop as CD
from app.nhan_tuong_api import _kiem_tra_loi
from app.tuvi_api import TuanTrietInput, _DauVao, _loi_an_sao, _MaMau, _Phieu

router = APIRouter(tags=["chan-dung"])
_VN = _dt.timezone(_dt.timedelta(hours=7))


class ChanDungInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    la_so: TuanTrietInput
    tra_loi: dict[str, str] = Field(default_factory=dict)
    ngay_xem: _dt.date | None = None
    dien_dat_toi_da: int | None = Field(default=None, ge=0, le=13)     # SAO-2 gửi kèm; báo cáo này không diễn đạt AI
    trong_so: dict[_MaMau, _Phieu] | None = Field(default=None, max_length=5000)
    ca_nhan: dict[_MaMau, Literal["dung", "chua_dung"]] | None = Field(default=None, max_length=500)

    @field_validator("tra_loi")
    @classmethod
    def _v(cls, v):
        return _kiem_tra_loi(v)


@router.post("/v1/chan-dung")
def api_chan_dung(inp: ChanDungInput) -> dict:
    hom_nay = inp.ngay_xem or _dt.datetime.now(_VN).date()
    dv = _DauVao(inp.la_so)
    cal = dv.tb.calendar_dt
    tv_sinh = {"ngay": cal.date(), "ti": tuvi_an_sao.time_index(cal.hour, cal.minute), "gioi_tinh": inp.la_so.gender,
               "tz_lich": dv.tz_lich, **dv.tuy_chon, "luu_nguyet": inp.la_so.luu_nguyet}
    bt_sinh = {"lich": cal, "gioi_tinh": inp.la_so.gender, "gio_ty": inp.la_so.gio_ty, "utc_lich": dv.utc_lich}
    try:
        bc = CD.lap(tv_sinh, bt_sinh, inp.tra_loi, hom_nay,
                    trong_so={k: v.model_dump() for k, v in inp.trong_so.items()} if inp.trong_so else None, ca_nhan=inp.ca_nhan)
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    return {"engine_version": ENGINE_VERSION, **bc, "co_canh_bao": list(dv.flags)}
