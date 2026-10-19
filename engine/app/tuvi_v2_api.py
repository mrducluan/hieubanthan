# -*- coding: utf-8 -*-
"""TV-V2 — 4 route Tử vi mới (hợp đồng: docs/NANG-CAP-TUVI-V2.md mục 3). Không lưu gì.

- POST /v1/tuvi/phi-hoa       — phi tinh tứ hoá 12 cung (48 đường bay) + tứ hoá lưu niên tuỳ chọn
- POST /v1/tuvi/nhip-3-thang  — tháng âm hiện tại + 2 tháng sau: Thuận / Bình / Cần thận trọng theo luật công khai
- POST /v1/tuvi/hop-tham      — can năm người kia phi hoá vào lá của bạn (hai chiều nếu người kia có lá đầy đủ)
- POST /v1/tuvi/dinh-gio      — so lá số giờ trước / đã nhập / sau (hoặc 12 canh) bằng câu hỏi về năm cũ

Tiền xử lý (múi giờ lịch sử, lịch, phái) dùng lại `_DauVao` của app/tuvi_api.py — không viết lại.
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import lunar, tuvi_an_sao
from app.config import ENGINE_VERSION, Region
from app.hoidap.tuvi import tom_tat
from app.luangiai import tuvi_dinh_gio, tuvi_hop_tham, tuvi_nhip_3_thang, tuvi_phi_hoa
from app.tuvi_api import TuanTrietInput, _DauVao, _loi_an_sao

router = APIRouter(prefix="/v1/tuvi", tags=["tuvi"])
_VN = _dt.timezone(_dt.timedelta(hours=7))


def _hom_nay() -> _dt.date:
    return _dt.datetime.now(_VN).date()


def _sinh(dv: _DauVao, gioi_tinh: str) -> dict:
    cal = dv.tb.calendar_dt
    return {"ngay": cal.date(), "ti": tuvi_an_sao.time_index(cal.hour, cal.minute), "gioi_tinh": gioi_tinh,
            "tz_lich": dv.tz_lich, **dv.tuy_chon}


def _la(sinh: dict) -> dict:
    return tuvi_an_sao.an_sao_tho(sinh["ngay"], sinh["ti"], sinh["gioi_tinh"], "vi-VN", tz_lich=sinh["tz_lich"],
                                  hoa_linh=sinh["hoa_linh"], thang_nhuan=sinh["thang_nhuan"], lich=sinh["lich"])


def _can_nam(la: dict, du_phong: str) -> str:
    """Can năm iztro dùng để an lá (đầu `chineseDate`; đã theo âm lịch Việt khi lich=viet)."""
    can = str(la.get("chineseDate", "")).split(" ")[0]
    return can if can in lunar.CAN else du_phong


# ------------------------------------------------------------------ phi hoá
class PhiHoaInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    nam_xem: int | None = Field(default=None, ge=1900, le=2100, description="Năm âm lịch xem tứ hoá lưu niên")


@router.post("/phi-hoa")
def api_phi_hoa(inp: PhiHoaInput) -> dict:
    dv = _DauVao(inp.la_so)
    try:
        la = _la(_sinh(dv, inp.la_so.gender))
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    kq = tuvi_phi_hoa.lap(tom_tat(la), _can_nam(la, dv.can), inp.nam_xem)
    return {"engine_version": ENGINE_VERSION, **kq, "co_canh_bao": list(dv.flags)}


# ------------------------------------------------------------------ nhịp 3 tháng
class Nhip3ThangInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    ngay_xem: _dt.date | None = Field(default=None, description="Mặc định hôm nay (giờ Việt Nam)")


@router.post("/nhip-3-thang")
def api_nhip_3_thang(inp: Nhip3ThangInput) -> dict:
    dv = _DauVao(inp.la_so)
    try:
        kq = tuvi_nhip_3_thang.lap(_sinh(dv, inp.la_so.gender), inp.ngay_xem or _hom_nay(), inp.la_so.luu_nguyet)
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    return {"engine_version": ENGINE_VERSION, **kq, "co_canh_bao": list(dv.flags)}


# ------------------------------------------------------------------ hợp tham
class NguoiKiaInput(BaseModel):
    """Người kia: ngày sinh bắt buộc; đủ giờ + giới tính + nơi sinh → an lá đầy đủ để xem hai chiều."""
    model_config = ConfigDict(extra="forbid")

    birth_date: _dt.date
    calendar_type: Literal["duong", "am"] = "duong"
    am_nhuan: bool = False
    birth_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    gender: Literal["nam", "nu"] | None = None
    noi_sinh: str | None = Field(default=None, max_length=40)
    vung: Region | None = None


class HopThamInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    nguoi_kia: NguoiKiaInput
    quan_he: Literal["nguoi_yeu", "vo_chong", "ban_be", "dong_nghiep", "doi_tac", "sep", "cha_me_con",
                     "gia_dinh"] = "nguoi_yeu"


@router.post("/hop-tham")
def api_hop_tham(inp: HopThamInput) -> dict:
    dv = _DauVao(inp.la_so)
    k = inp.nguoi_kia
    try:
        la = _la(_sinh(dv, inp.la_so.gender))
        ls_kia, can_kia = None, None
        if k.birth_time and k.gender and k.noi_sinh:
            dv_k = _DauVao(TuanTrietInput(
                birth_date=k.birth_date, birth_time=k.birth_time, gender=k.gender, calendar_type=k.calendar_type,
                am_nhuan=k.am_nhuan, noi_sinh=k.noi_sinh, vung=k.vung, hoa_linh=inp.la_so.hoa_linh,
                thang_nhuan=inp.la_so.thang_nhuan, lich=inp.la_so.lich))
            la_k = _la(_sinh(dv_k, k.gender))
            ls_kia, can_kia = tom_tat(la_k), _can_nam(la_k, dv_k.can)
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    if can_kia is None:
        try:
            can_kia = tuvi_hop_tham.can_nam_viet(k.birth_date, k.calendar_type, k.vung)
        except ValueError as e:
            raise HTTPException(422, detail=str(e))
    kq = tuvi_hop_tham.lap(tom_tat(la), _can_nam(la, dv.can), can_kia, inp.quan_he, ls_kia=ls_kia)
    return {"engine_version": ENGINE_VERSION, **kq}


# ------------------------------------------------------------------ định giờ
class DinhGioInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    nam_doi_chieu: list[int] | None = Field(default=None, max_length=3,
                                             description="Năm âm lịch bạn nhớ rõ (tối đa 3); mặc định 3 năm đã qua")
    tat_ca_gio: bool = False


def _ung_vien(inp: DinhGioInput, dv: _DauVao) -> list[dict]:
    ls_ = inp.la_so
    gio, phut = int(ls_.birth_time[:2]), int(ls_.birth_time[3:])
    dong_ho = _dt.datetime(dv.duong_goc.year, dv.duong_goc.month, dv.duong_goc.day, gio, phut)
    ti_nhap = tuvi_an_sao.time_index(dv.tb.calendar_dt.hour, dv.tb.calendar_dt.minute) % 12
    if inp.tat_ca_gio:
        lech = dong_ho - dv.tb.calendar_dt                      # đồng hồ − kinh tuyến lịch (múi giờ, giờ mùa hè)
        goc = _dt.datetime.combine(dv.tb.calendar_dt.date(), _dt.time())
        ds = [(f"Giờ {lunar.CHI[i]}", dong_ho if i == ti_nhap else goc + _dt.timedelta(hours=2 * i) + lech)
              for i in range(12)]
    else:
        ds = [("Giờ trước", dong_ho - _dt.timedelta(hours=2)), ("Giờ đã nhập", dong_ho),
              ("Giờ sau", dong_ho + _dt.timedelta(hours=2))]
    ra = []
    for nhan, t in ds:
        dau_vao = {"birth_date": t.date().isoformat(), "birth_time": t.strftime("%H:%M"), "calendar_type": "duong"}
        dv_u = _DauVao(ls_.model_copy(update={**dau_vao, "birth_date": t.date(), "am_nhuan": False}))
        ra.append({"nhan": nhan, "gio_dai_dien": dau_vao["birth_time"], "la_gio_nhap": t == dong_ho,
                   "sinh": _sinh(dv_u, ls_.gender), "dau_vao": dau_vao})
    return ra


@router.post("/dinh-gio")
def api_dinh_gio(inp: DinhGioInput) -> dict:
    nam = sorted(set(inp.nam_doi_chieu)) if inp.nam_doi_chieu else tuvi_dinh_gio.nam_mac_dinh(_hom_nay())
    if any(not 1900 <= n <= 2100 for n in nam):
        raise HTTPException(422, detail="Năm đối chiếu phải trong 1900–2100")
    dv = _DauVao(inp.la_so)
    cal = dv.tb.calendar_dt
    ly_do = tuvi_dinh_gio.ly_do(cal.hour, cal.minute, inp.la_so.do_tin_gio.value)
    try:
        kq = tuvi_dinh_gio.lap(_ung_vien(inp, dv), nam, ly_do)
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    except ValueError as e:
        raise HTTPException(422, detail=str(e))
    return {"engine_version": ENGINE_VERSION, **kq, "co_canh_bao": list(dv.flags)}
