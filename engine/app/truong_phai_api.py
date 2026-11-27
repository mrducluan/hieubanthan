# -*- coding: utf-8 -*-
"""TP-1 — GET /v1/truong-phai[?mon=]: sổ các chỗ người dùng được chọn trường phái (mô tả, nguồn, mặc định, ảnh hưởng)."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app import truong_phai
from app.kb.loi import L

router = APIRouter(tags=["truong-phai"])


@router.get("/v1/truong-phai")
def api_truong_phai(mon: str | None = Query(default=None, max_length=20)) -> dict:
    if mon is not None and mon not in truong_phai.cac_mon():
        raise HTTPException(422, detail=L("tp.loi.mon", "Không có môn này"))
    so = truong_phai.so()
    return {"nguyen_tac": so["nguyen_tac"], "mon": list(truong_phai.cac_mon()), "diem": truong_phai.danh_sach(mon)}
