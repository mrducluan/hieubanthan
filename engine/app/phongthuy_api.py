# -*- coding: utf-8 -*-
"""Endpoint Phong thuỷ — /v1/phongthuy/menh-quai và /v1/phongthuy/hoi (Bát trạch, HH-4).

Chỉ cần ngày sinh (hoặc năm) + giới tính; không cần giờ. Mệnh quái đổi năm tại Lập xuân.
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.calc import phongthuy as pt
from app import nhat_ky
from app.config import ENGINE_VERSION
from app.hoidap import phongthuy as hoidap_pt

router = APIRouter(prefix="/v1/phongthuy", tags=["phongthuy"])


class SinhInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    birth_date: _dt.date | None = None
    birth_year: int | None = Field(default=None, ge=1860, le=2150)
    gender: Literal["nam", "nu"]

    @model_validator(mode="after")
    def _can_nam(self) -> "SinhInput":
        if self.birth_date is None and self.birth_year is None:
            raise ValueError("cần birth_date hoặc birth_year")
        return self

    def sinh(self) -> dict:
        return {"nam": self.birth_date.year if self.birth_date else self.birth_year,
                "gioi_tinh": self.gender, "ngay": self.birth_date}


@router.post("/menh-quai")
def api_menh_quai(inp: SinhInput) -> dict:
    s = inp.sinh()
    mq = pt.menh_quai(s["nam"], s["gioi_tinh"], s["ngay"])
    bang = pt.bang_huong(mq["quai"])
    return {"engine_version": ENGINE_VERSION, **mq, "bang_huong": bang,
            "huong_cat": [h for h, d in bang.items() if d in pt.CAT]}


class HoiPTInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cau_hoi: str = Field(min_length=3, max_length=500)
    sinh: SinhInput | None = None
    ngay_xem: _dt.date | None = None


@router.post("/hoi")
def api_hoi(inp: HoiPTInput, background: BackgroundTasks) -> dict:
    try:
        kq = hoidap_pt.tra_loi(inp.cau_hoi.strip(), sinh=inp.sinh.sinh() if inp.sinh else None,
                               ngay_xem=inp.ngay_xem)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    background.add_task(nhat_ky.ghi_huyenhoc, "phongthuy", inp.cau_hoi, kq, inp.sinh is not None)
    return {"engine_version": ENGINE_VERSION, **kq}


class HuyenKhongInput(BaseModel):
    """PT-HK — hạ quái bàn Huyền Không: năm xây/nhập trạch + toạ sơn (tên 24 sơn hoặc độ la bàn)."""
    model_config = ConfigDict(extra="forbid")

    nam_xay: int = Field(ge=1864, le=2150)
    toa: str | None = Field(default=None, max_length=10, description="Toạ sơn, vd 'Tý', 'Nhâm'")
    do: float | None = Field(default=None, ge=0, lt=360, description="Độ la bàn của TOẠ (lưng nhà), 0 = chính Bắc")
    nam_xem: int | None = Field(default=None, ge=1900, le=2150)

    @model_validator(mode="after")
    def _can_toa(self) -> "HuyenKhongInput":
        if (self.toa is None) == (self.do is None):
            raise ValueError("cần đúng một trong hai: toa hoặc do")
        return self


def _bay_gio_utc() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc).replace(tzinfo=None)


@router.post("/huyen-khong")
def api_huyen_khong(inp: HuyenKhongInput) -> dict:
    from app.calc import huyen_khong as hk
    from app.kb import phongthuy_kb

    canh_bao = []
    toa = inp.toa
    if inp.do is not None:
        s = hk.son_tu_do(inp.do)
        toa = s["son"]
        if s["canh_bao"] == "khong_vong":
            canh_bao.append({"loai": "khong_vong", "chi_tiet": f"Toạ {s['do']}° nằm đúng ranh giới hai sơn (không vong) — nên đo lại; bàn có thể sai hoàn toàn."})
        elif s["canh_bao"] == "kiem_huong":
            canh_bao.append({"loai": "kiem_huong", "chi_tiet": f"Toạ lệch {abs(s['lech'])}° so với chính {toa} — gần ranh giới (kiêm hướng); trường phái dùng thế quái sẽ lập bàn khác, hệ thống chưa tính thế quái."})
    try:
        b = hk.trach_ban(inp.nam_xay, toa)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    kb = phongthuy_kb.huyen_khong()
    nam_xem = inp.nam_xem or hk.nam_theo_lap_xuan(_bay_gio_utc())
    return {
        "engine_version": ENGINE_VERSION, **b,
        "cuc_y": kb["cuc"][b["cuc"]],
        "to_hop": [{**t, **kb["to_hop"][t["ma"]]} for t in b["to_hop"]],
        "sao_y": kb["sao"],
        "luu_nien": hk.luu_nien(nam_xem),
        "luu_y": kb["luu_y"], "nguon": kb["_nguon"], "trang_thai": kb["trang_thai"],
        "canh_bao": canh_bao,
    }
