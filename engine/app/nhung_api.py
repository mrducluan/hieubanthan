# -*- coding: utf-8 -*-
"""LG-ĐS — route nhúng câu hỏi (vectơ tất định `bam512_v1`, app/nhung.py) cho kho ý định pgvector (migration 0017).

Engine không chạm DB: web máy chủ xin vectơ ở đây rồi tự gọi `tim_y_dinh_gan` / `xac_nhan_y_dinh` / `nap_kho_vec`.
Câu luôn được lọc (ngày, năm, giờ, số điện thoại, email, tên riêng) TRƯỚC khi nhúng và trả lại `cau_da_loc` — chỉ câu
đã lọc mới được web lưu. Khoá engine + hạn mức /v1 áp như mọi route khác (middleware trong main.py).
"""
from __future__ import annotations

import functools
import json
from pathlib import Path
from typing import Annotated, Literal

from fastapi import APIRouter, Query
from pydantic import BaseModel, ConfigDict, Field

from app import nhat_ky, nhung
from app.config import ENGINE_VERSION
from app.hoidap.tuvi import Y_DINH_CAU_HINH

router = APIRouter(prefix="/v1/nhung", tags=["nhung"])

KHO = Path(__file__).resolve().parent.parent / "fixtures" / "cau_hoi" / "huyenhoc_cau_hoi.jsonl"


class NhungInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cau: list[Annotated[str, Field(min_length=1, max_length=300)]] = Field(min_length=1, max_length=32)


@router.post("")
def api_nhung(inp: NhungInput) -> dict:
    da_loc = [nhung.loc_them(nhat_ky.loc_cau_hoi_huyenhoc(c.strip()))[:300] for c in inp.cau]
    return {"engine_version": ENGINE_VERSION, "mo_hinh": nhung.MO_HINH, "so_chieu": nhung.SO_CHIEU,
            "cau_da_loc": da_loc, "vec": [nhung.nhung(c) for c in da_loc]}


def nhan_y_dinh(ban_ghi: dict) -> str | None:
    """Nhãn ý định của một câu trong kho: chủ đề `yd_<mã>` với mã thuộc Y_DINH_CAU_HINH (câu khác → None)."""
    cd = ban_ghi.get("chu_de") or ""
    ma = cd[3:] if cd.startswith("yd_") else None
    return ma if ma in Y_DINH_CAU_HINH and ban_ghi.get("xu_ly") not in ("an_toan", "tu_choi_nhe") else None


@functools.lru_cache(maxsize=4)
def kho_co_nhan(mo_dun: str) -> tuple[dict, ...]:
    """Câu có nhãn ý định (đã lọc, bỏ trùng sau lọc) + vectơ. Tất định, cache trong tiến trình."""
    ds, da_co = [], set()
    with KHO.open(encoding="utf-8") as f:
        for dong in f:
            r = json.loads(dong)
            if r.get("mo_dun") != mo_dun or not (yd := nhan_y_dinh(r)):
                continue
            cau = nhung.loc_them(nhat_ky.loc_cau_hoi_huyenhoc(r["cau_hoi"].strip()))[:300]
            if len(cau) < 3 or cau in da_co:
                continue
            da_co.add(cau)
            ds.append({"ma": r["id"], "y_dinh": yd, "cau": cau, "vec": nhung.nhung(cau)})
    return tuple(ds)


@router.get("/kho")
def api_kho(mo_dun: Literal["tuvi"] = "tuvi", trang: int = Query(default=1, ge=1, le=1000),
            co: int = Query(default=100, ge=1, le=200)) -> dict:
    ds = kho_co_nhan(mo_dun)
    dau = (trang - 1) * co
    return {"engine_version": ENGINE_VERSION, "mo_hinh": nhung.MO_HINH, "mo_dun": mo_dun, "tong": len(ds),
            "trang": trang, "co": co, "so_trang": -(-len(ds) // co), "ds": list(ds[dau:dau + co])}
