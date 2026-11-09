# -*- coding: utf-8 -*-
"""Ý3 — route công khai cụm trang "Sinh ở nước ngoài" (không dữ liệu cá nhân → web cache được)."""
from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query

from app.luangiai import sinh_nuoc_ngoai as S

router = APIRouter(tags=["sinh-nuoc-ngoai"])
_Nam = Annotated[int | None, Query(ge=1901, le=2098)]


@router.get("/v1/sinh-nuoc-ngoai")
def api_muc_luc(nam: _Nam = None) -> dict:
    return {"nuoc": S.muc_luc(nam)}


@router.get("/v1/sinh-nuoc-ngoai/{ma}")
def api_nuoc(ma: Annotated[str, Path(pattern=r"^[a-z]{2}$")], nam: _Nam = None) -> dict:
    kq = S.nuoc(ma, nam)
    if not kq:
        raise HTTPException(404, detail="Không có trang cho nước này")
    return kq
