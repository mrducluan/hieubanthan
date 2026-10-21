# -*- coding: utf-8 -*-
"""KC-3 — /v1/y-dinh: từ điển ý định dùng chung (mã chung, gợi mở chéo giữa các mảng). Chỉ đọc KB, không lưu."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.config import ENGINE_VERSION
from app.kb import y_dinh_chung as kb

router = APIRouter(prefix="/v1/y-dinh", tags=["y_dinh"])


@router.get("")
def api_danh_sach() -> dict:
    return {"engine_version": ENGINE_VERSION, "y_dinh": kb.danh_sach()}


@router.get("/goi-mo")
def api_goi_mo(ma: str = Query(min_length=2, max_length=40, pattern=r"^[a-z_]+$"),
               mo_dun: str | None = Query(default=None, max_length=20, pattern=r"^[a-z_]+$"),
               toi_da: int = Query(default=3, ge=1, le=6)) -> dict:
    """`ma` là mã chung hoặc mã riêng của `mo_dun` (chủ đề Kinh Dịch, ý định Tử vi, trụ nỗi đau…); trả gợi mở sang mảng khác."""
    ma_chung = kb.tu_ma_rieng(mo_dun or "", ma) if mo_dun else (ma if ma in kb.tat_ca() else None)
    if not ma_chung:
        raise HTTPException(404, detail="Không có ý định này")
    return {"engine_version": ENGINE_VERSION, **(kb.goi_mo(ma_chung, mo_dun, toi_da) or {})}
