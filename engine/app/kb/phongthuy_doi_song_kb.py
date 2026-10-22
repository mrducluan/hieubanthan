# -*- coding: utf-8 -*-
"""Tầng KB — báo cáo Phong thuỷ "Nhà của bạn" (PT-ĐS). Chỉ TRA; thiếu khoá → None / rỗng."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "phongthuy_doi_song.json"
MUC = ("thuan", "can_bang", "can_chu_dong")
NHAN_MAC_DINH = {"thuan": "Thuận lợi", "can_bang": "Cân bằng", "can_chu_dong": "Cần lưu ý"}


@lru_cache(maxsize=1)
def _d() -> dict:
    try:
        d = json.loads(_F.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def _lay(*khoa):
    x = _d()
    for k in khoa:
        if not isinstance(x, dict):
            return None
        x = x.get(str(k))
        if x is None:
            return None
    return x


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "source_id": d.get("source_id", "pt_doi_song_vn"),
            "school_id": d.get("school_id", "bat_trach_huyen_khong")}


def chuong(ma: str) -> dict:
    return _lay("chuong", ma) or {"tieu_de": ma, "cau_hoi": ""}


def nhan_muc(ma: str) -> str:
    return (_lay("muc", ma) or {}).get("nhan") or NHAN_MAC_DINH.get(ma, ma)


def nhom(ten: str) -> str:
    return _lay("nhom", ten) or ""


def du_nien(ten: str) -> dict:
    return _lay("du_nien_doi_thuong", ten) or {"mot_cau": ten.lower(), "dung": ""}


def vai(ma: str) -> str:
    return _lay("vai", ma) or ma


def mau(ma: str) -> str:
    return _lay("mau", ma) or ""


def thang_sao() -> dict:
    return _lay("thang_sao") or {"thuan": [1, 4, 6, 8, 9], "can_chu_dong": [2, 5], "can_bang": [3, 7], "y": {}}


def cum_cam() -> list[str]:
    x = _lay("cum_cam")
    return [s for s in x if isinstance(s, str) and s.strip()] if isinstance(x, list) else []


def tim_cum_cam(van: str) -> list[str]:
    from app.kb.tuvi_doi_song_kb import tim_cum_cam as _tim  # noqa: PLC0415
    return _tim(van, cum_cam())
