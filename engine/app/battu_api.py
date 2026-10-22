# -*- coding: utf-8 -*-
"""Endpoint Bát tự — /v1/battu/la-so (tứ trụ, thập thần, ngũ hành, đại vận) và /v1/battu/hoi.

Dùng chung tiền xử lý thời gian với tử vi (âm→dương, múi giờ lịch sử VN, cờ) qua _DauVao.
Giờ Tý bát tự: SWITCH_AT_0000 (chính sách đã chốt) — khác tử vi (iztro); luôn gắn cờ khi 23:xx.
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import battu, battu_mo_rong
from app.kb import tu_dien
from app import nhat_ky
from app.config import ENGINE_VERSION
from app.hoidap import battu as hoidap_bt
from app.kb import battu_kb
from app.tuvi_api import TuanTrietInput, _DauVao, _MaMau, _Phieu

router = APIRouter(prefix="/v1/battu", tags=["battu"])


def _sinh(inp: TuanTrietInput) -> tuple[dict, list[dict]]:
    dv = _DauVao(inp)
    flags = [f for f in dv.flags if f["loai"] != "tet_edge"]   # bát tự đổi năm tại Lập xuân, không tại Tết
    return {"lich": dv.tb.calendar_dt, "gioi_tinh": inp.gender, "gio_ty": inp.gio_ty}, flags


@router.post("/la-so")
def api_la_so(inp: TuanTrietInput) -> dict:
    sinh, flags = _sinh(inp)
    ls = battu.la_so(sinh["lich"], sinh["gioi_tinh"], sinh["gio_ty"])
    ls["co_canh_bao"] = flags + ls["co_canh_bao"]
    return {"engine_version": ENGINE_VERSION, "pham_vi": "bat_tu", "gio_lich": sinh["lich"].isoformat(), **ls,
            "mo_rong": {**battu_mo_rong.mo_rong(ls), "dieu_hau_ctbg": dieu_hau(ls), "cach_cuc_tbct": cach_tbct(ls)}}


def cach_tbct(ls: dict) -> dict:
    """KB-3b: CALC định cách (battu.cach_cuc_tbct) + KB nghĩa, hỷ, kỵ."""
    c = ls["dung_than"]["cach_cuc"]
    return {**c, **(battu_kb.cach_cuc_tbct(c["ma"]) or {})}


def dieu_hau(ls: dict) -> dict | None:
    """KB-3: tra bảng Cùng Thông Bảo Giám (KB) → CALC ghép vai trò → kèm lời mùa của nhật chủ (KB)."""
    b = battu_kb.dieu_hau(ls["nhat_chu"]["can"], ls["tru"][1]["chi"])
    if not b:
        return None
    d = battu_mo_rong.dieu_hau_ctbg(ls, b["can"])
    mua = (battu_kb.nhat_chu(ls["nhat_chu"]["can"]) or {}).get("mua", {}).get(d["mua"])
    return {**d, "mua_y": mua, "nguon": b["nguon"], "trang_thai": b["trang_thai"], "can_doi_chieu": b["can_doi_chieu"]}


class LuuNienBTInput(BaseModel):
    """VZ-3 — lưu niên + 12 lưu nguyệt đặt cạnh tứ trụ."""
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    nam_xem: int = Field(ge=1900, le=2100)


@router.post("/luu-nien")
def api_luu_nien(inp: LuuNienBTInput) -> dict:
    sinh, _ = _sinh(inp.la_so)
    ls = battu.la_so(sinh["lich"], sinh["gioi_tinh"], sinh["gio_ty"])
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
    return {"engine_version": ENGINE_VERSION, **kq, "thuat_ngu": tu_dien.nhan_dien(kq.get("cau_tra_loi", ""), "battu")}


class LuanGiaiBTInput(BaseModel):
    """LG / BT-ĐS — luận giải toàn bộ Bát tự "đời sống" theo chương (không lưu)."""
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    ngay_xem: _dt.date | None = None
    # SAO-2: bản xem trước khi thu Sao — chỉ diễn đạt AI N chương đầu (web cắt phần còn lại).
    dien_dat_toi_da: int | None = Field(default=None, ge=0, le=13)
    # Tầng HỌC (như Tử vi LG-ĐS): bảng tỉ lệ "thấy đúng" công khai theo mã mẫu (≥ 30 phiếu) + phiếu của chính người
    # đang xem. Chỉ xếp lại / hạ hộp, không sinh câu mới.
    trong_so: dict[_MaMau, _Phieu] | None = Field(default=None, max_length=5000)
    ca_nhan: dict[_MaMau, Literal["dung", "chua_dung"]] | None = Field(default=None, max_length=500)


class DoiChieuBTInput(BaseModel):
    """BT-DC — "Cách nào đúng với mình?": câu hỏi nhìn lại năm đã qua (không lưu, không trừ Sao)."""
    model_config = ConfigDict(extra="forbid")

    la_so: TuanTrietInput
    ngay_xem: _dt.date | None = None


@router.post("/doi-chieu-cach")
def api_doi_chieu_cach(inp: DoiChieuBTInput) -> dict:
    from app.luangiai import battu_doi_chieu
    sinh, flags = _sinh(inp.la_so)
    return {"engine_version": ENGINE_VERSION, **battu_doi_chieu.lap(sinh, inp.ngay_xem), "co_canh_bao": flags}


@router.post("/luan-giai")
def api_luan_giai(inp: LuanGiaiBTInput) -> dict:
    from app.luangiai import toan_bo
    from app.narrative import luan_giai_van
    sinh, flags = _sinh(inp.la_so)
    trong_so = {k: v.model_dump() for k, v in inp.trong_so.items()} if inp.trong_so else None
    bc = luan_giai_van.gan_thuat_ngu(luan_giai_van.dien_dat(
        toan_bo.battu(sinh, ngay_xem=inp.ngay_xem, trong_so=trong_so, ca_nhan=inp.ca_nhan),
        toi_da=inp.dien_dat_toi_da))
    return {"engine_version": ENGINE_VERSION, **bc, "co_canh_bao": flags}
