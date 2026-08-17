# -*- coding: utf-8 -*-
"""Tầng KB (tầng 2) — kho quy tắc luận giải thần số.

Hiện đọc từ file JSON (không phụ thuộc ngoài, không cần Supabase). Giao diện
được thiết kế để sau này thay ruột bằng truy vấn Supabase mà tầng RULES/NARRATIVE
phía trên không phải đổi.

Nguyên tắc: KB CHỈ trả về nội dung ĐÃ CÓ nguồn. Không có thì trả None — tầng
trên phải im lặng, không được bịa.
"""
from __future__ import annotations

import functools
import json
from pathlib import Path
from typing import TypedDict

_DATA = Path(__file__).parent / "data" / "thanso_meanings.json"


class SoMeaning(TypedDict):
    gia_tri: int
    tu_khoa: str
    mat_toi: str
    phan_chung: str
    so_cai: bool
    source_id: str
    school_id: str


@functools.lru_cache(maxsize=1)
def _load() -> dict:
    return json.loads(_DATA.read_text(encoding="utf-8"))


def nghia_so(gia_tri: int) -> SoMeaning | None:
    """Nghĩa của một con số. None nếu KB chưa có (tầng trên phải im lặng)."""
    raw = _load()["so_meanings"].get(str(gia_tri))
    if raw is None:
        return None
    return {
        "gia_tri": gia_tri,
        "tu_khoa": raw["tu_khoa"],
        "mat_toi": raw["mat_toi"],
        "phan_chung": raw["phan_chung"],
        "so_cai": raw.get("so_cai", False),
        "source_id": raw["source_id"],
        "school_id": raw["school_id"],
    }


def khung_vi_tri(vi_tri: str) -> dict | None:
    """Khung của một vị trí chỉ số (duong_doi/su_menh/linh_hon/nhan_cach)."""
    return _load()["vi_tri"].get(vi_tri)


def nguon(source_id: str) -> dict | None:
    for s in _load()["sources"]:
        if s["id"] == source_id:
            return s
    return None
