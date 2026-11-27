# -*- coding: utf-8 -*-
"""POST /v1/co-van — Cố vấn liên mảng Tam Tài: ba cách xem đọc riêng (không gộp mức), miễn phí, không lưu."""
from __future__ import annotations

import datetime as dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from app.calc import tuvi_an_sao
from app.config import ENGINE_VERSION
from app.luangiai import co_van_tam_tai as cv
from app.luangiai import su_vu_tuc_thoi as sv
from app.kb.loi import L
from app import config
from app.tuvi_api import _loi_an_sao

router = APIRouter(tags=["co-van"])


class NhaCoVanIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    do_huong: float = Field(..., ge=0.0, lt=360.0)
    nam_xay: int | None = Field(default=None, ge=1864, le=2043)


class DoiTacCoVanIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay_sinh: dt.date
    gioi_tinh: Literal["nam", "nu"] = "nam"
    vai_tro: Literal["nguoi_thuong", "gop_von", "cong_su"] = "cong_su"
    dong_y_tu_nguyen: bool = Field(default=False, description="Bắt buộc true: người liên quan đã đồng ý cho dùng ngày sinh")


class CoVanIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cau_hoi: str = Field(..., min_length=3, max_length=500)
    ngay_sinh: dt.date
    gioi_tinh: Literal["nam", "nu"] = "nam"
    gio_sinh: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    do_tin_gio: Literal["exact", "approx", "unknown"] = "unknown"
    noi_sinh: str | None = Field(default=None, max_length=60)
    nha: NhaCoVanIn | None = None
    doi_tac: DoiTacCoVanIn | None = None
    che_do: Literal["doi_song", "kinh_doanh"] = "doi_song"
    ngay_xem: dt.date | None = None


@router.post("/v1/co-van")
def api_co_van(inp: CoVanIn) -> dict:
    if not (1930 <= inp.ngay_sinh.year <= 2025):
        raise HTTPException(422, detail="Năm sinh cần nằm trong khoảng 1930–2025.")
    if inp.doi_tac:
        if not inp.doi_tac.dong_y_tu_nguyen:
            raise HTTPException(422, detail="Cần xác nhận người liên quan đã đồng ý cho dùng ngày sinh.")
        if not (1930 <= inp.doi_tac.ngay_sinh.year <= 2025):
            raise HTTPException(422, detail="Năm sinh người liên quan cần nằm trong khoảng 1930–2025.")
        hn = inp.ngay_xem or config.hom_nay_vn()
        ns = inp.doi_tac.ngay_sinh
        if hn.year - ns.year - ((hn.month, hn.day) < (ns.month, ns.day)) < config.TUOI_NGUOI_LON:
            raise HTTPException(422, detail="Người liên quan cần đủ 16 tuổi.")
    try:
        kq = cv.lap(
            cau_hoi=inp.cau_hoi,
            ngay_sinh=inp.ngay_sinh,
            gioi_tinh=inp.gioi_tinh,
            gio_sinh=inp.gio_sinh,
            do_tin_gio=inp.do_tin_gio if inp.gio_sinh else "unknown",
            noi_sinh=inp.noi_sinh,
            nha=inp.nha.model_dump() if inp.nha else None,
            doi_tac=inp.doi_tac.model_dump() if inp.doi_tac else None,
            che_do=inp.che_do,
            ngay_xem=inp.ngay_xem,
        )
    except tuvi_an_sao.AnSaoLoi as e:
        raise _loi_an_sao(e)
    except ValueError as e:
        raise HTTPException(422, detail=str(e)) from e
    return {"engine_version": ENGINE_VERSION, **kq}


TinhHuongSuVu = Literal[
    "dam_phan_thuong_vu",
    "ky_ket_hop_dong",
    "thu_hoi_cong_no",
    "ra_mat_khai_truong",
    "hoa_giai_bat_dong",
    "cho_tin_ket_qua",
]


class SuVuIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    cau_hoi: str = Field(..., min_length=3, max_length=500)
    tinh_huong: TinhHuongSuVu = "dam_phan_thuong_vu"
    ngay_xem: dt.date | None = None
    gio_xem: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    utc: float = Field(default=7.0, ge=-12.0, le=14.0, multiple_of=0.25)
    gia_tri_hao: list[Literal[6, 7, 8, 9]] | None = Field(default=None, min_length=6, max_length=6)
    hat_giong: str | None = Field(default=None, min_length=4, max_length=128, pattern=r"^[A-Za-z0-9._:-]+$")
    ngay_sinh: dt.date | None = None


@router.post("/v1/co-van/su-vu")
def api_co_van_su_vu(inp: SuVuIn) -> dict:
    if inp.ngay_sinh and not (1900 <= inp.ngay_sinh.year and inp.ngay_sinh <= config.hom_nay_vn()):
        # Chỉ cần ngày sinh cho cổng TUOI-16 → nhận mọi ngày hợp lệ, không chặn người sinh trước 1930 / sau 2025.
        raise HTTPException(422, detail=L("chang3.ngay_sinh", "Ngày sinh cần trong khoảng từ năm 1900 đến hôm nay."))
    try:
        kq = sv.xem_su_vu(
            cau_hoi=inp.cau_hoi,
            tinh_huong=inp.tinh_huong,
            ngay_xem=inp.ngay_xem,
            gio_xem=inp.gio_xem,
            utc=inp.utc,
            gia_tri_hao=list(inp.gia_tri_hao) if inp.gia_tri_hao else None,
            hat_giong=inp.hat_giong,
            ngay_sinh=inp.ngay_sinh,
        )
    except ValueError as e:
        raise HTTPException(422, detail=str(e)) from e
    return {"engine_version": ENGINE_VERSION, **kq}

