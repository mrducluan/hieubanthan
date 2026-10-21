# -*- coding: utf-8 -*-
"""CTA-1 — /v1/goi-y-cheo (khối "Đọc tiếp về bạn" cuối phần xem) và /v1/ban-do-5-mang (dữ liệu thẻ chia sẻ
"Bản đồ 5 mảng"). Lớp vỏ mỏng: kiểm đầu vào, gọi RULES `luangiai/goi_y_cheo.py`. Không lưu gì."""
from __future__ import annotations

import datetime as _dt
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.config import ENGINE_VERSION
from app.luangiai import goi_y_cheo as gy

router = APIRouter(prefix="/v1", tags=["goi_y_cheo"])


def _hom_nay_vn() -> _dt.date:
    return _dt.datetime.now(_dt.timezone(_dt.timedelta(hours=7))).date()


class _HoSoInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay: int | None = Field(default=None, ge=1, le=31)
    thang: int | None = Field(default=None, ge=1, le=12)
    nam: int | None = Field(default=None, ge=1900, le=2100)
    gio: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    do_tin_gio: Literal["exact", "approx", "unknown"] | None = None
    gioi_tinh: Literal["nam", "nu"] | None = None
    ho_ten: list[str] | None = Field(default=None, max_length=5)
    noi_sinh: str | None = Field(default=None, max_length=40)
    vung: Literal["north", "south"] | None = None
    gio_mua_he: bool = False
    lich: Literal["viet", "trung"] = "viet"
    quy_uoc_duong_doi: Literal["tong_het", "tung_phan"] = "tong_het"
    ngay_xem: _dt.date | None = Field(default=None, ge=_dt.date(1900, 1, 1), le=_dt.date(2100, 12, 31))

    @field_validator("ho_ten")
    @classmethod
    def _ten(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return None
        v = [t.strip() for t in v if t.strip()]
        if any(len(t) > 80 for t in v):
            raise ValueError("Tên tối đa 80 ký tự")
        return v or None

    def ho_so(self, bat_buoc: bool) -> gy.HoSo | None:
        co = [x is not None for x in (self.ngay, self.thang, self.nam)]
        if not any(co) and not bat_buoc:
            return None
        if not all(co):
            raise HTTPException(422, detail="Cần đủ ngày, tháng, năm sinh")
        try:
            _dt.date(self.nam, self.thang, self.ngay)
        except ValueError:
            raise HTTPException(422, detail="Ngày không tồn tại")
        return gy.HoSo(ngay=self.ngay, thang=self.thang, nam=self.nam, gio=self.gio, gioi_tinh=self.gioi_tinh,
                       ho_ten=self.ho_ten, noi_sinh=self.noi_sinh, vung=self.vung, gio_mua_he=self.gio_mua_he,
                       do_tin_gio=self.do_tin_gio, lich=self.lich, quy_uoc=self.quy_uoc_duong_doi)


class GoiYCheoInput(_HoSoInput):
    mang_hien_tai: Literal[gy.MANG_TRANG]  # type: ignore[valid-type]


@router.post("/goi-y-cheo")
def api_goi_y_cheo(inp: GoiYCheoInput) -> dict:
    """Thẻ "Đọc tiếp về bạn": mỗi mảng khác một luận giải nhỏ + câu hỏi mở + nhãn CTA + đường dẫn. Chưa có hồ sơ → câu
    chung mời nhập. Không lưu."""
    return {"engine_version": ENGINE_VERSION,
            **gy.goi_y(inp.ho_so(bat_buoc=False), inp.mang_hien_tai, inp.ngay_xem or _hom_nay_vn())}


@router.post("/ban-do-5-mang")
def api_ban_do(inp: _HoSoInput) -> dict:
    """Năm mảnh cho thẻ chia sẻ "Bản đồ 5 mảng" — chỉ nhãn đã tính (không ngày sinh / can chi năm / giờ sinh)."""
    return {"engine_version": ENGINE_VERSION, **gy.ban_do_5_mang(inp.ho_so(bat_buoc=True), inp.ngay_xem or _hom_nay_vn())}
