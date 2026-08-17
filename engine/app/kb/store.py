# -*- coding: utf-8 -*-
"""Tầng KB (tầng 2) — kho quy tắc luận giải thần số.

Hai nguồn, cùng một giao diện:
  - Supabase REST (khi có env SUPABASE_URL + SUPABASE_ANON_KEY): nội dung sống,
    bạn sửa trong Supabase Table Editor là web đổi theo (sau TTL cache).
  - File JSON (mặc định / dự phòng): chạy được ngay không cần Supabase, và là
    lưới an toàn nếu Supabase trục trặc.

Nguyên tắc: KB CHỈ trả về nội dung ĐÃ CÓ nguồn. Không có thì trả None — tầng
trên phải im lặng, không được bịa.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from typing import TypedDict

import httpx

_DATA = Path(__file__).parent / "data" / "thanso_meanings.json"
_CACHE_TTL = 60           # giây — sửa trong Supabase phản ánh trong vòng 1 phút
_cache: dict | None = None
_cache_at: float = 0.0


class SoMeaning(TypedDict):
    gia_tri: int
    tu_khoa: str
    mat_toi: str
    phan_chung: str
    so_cai: bool
    source_id: str
    school_id: str


def _from_file() -> dict:
    return json.loads(_DATA.read_text(encoding="utf-8"))


def _from_supabase(url: str, key: str) -> dict:
    """Đọc KB qua REST API của Supabase, dựng lại đúng cấu trúc như file JSON."""
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    base = url.rstrip("/") + "/rest/v1"
    with httpx.Client(timeout=8, headers=headers) as c:
        sources = c.get(f"{base}/sources", params={"select": "*"}).json()
        schools = c.get(f"{base}/schools", params={"select": "*"}).json()
        meanings = c.get(f"{base}/thanso_so_meanings", params={"select": "*"}).json()
        vi_tri = c.get(f"{base}/thanso_vi_tri", params={"select": "*"}).json()
    return {
        "sources": sources,
        "schools": schools,
        "so_meanings": {
            str(m["gia_tri"]): {
                "tu_khoa": m["tu_khoa"], "mat_toi": m["mat_toi"],
                "phan_chung": m["phan_chung"], "so_cai": m.get("so_cai", False),
                "source_id": m["source_id"], "school_id": m["school_id"],
            } for m in meanings
        },
        "vi_tri": {v["id"]: {"ten": v["ten"], "khung": v["khung"]} for v in vi_tri},
    }


def _load() -> dict:
    global _cache, _cache_at
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        # Chưa cấu hình Supabase → luôn dùng file (cache vĩnh viễn trong tiến trình).
        if _cache is None:
            _cache = _from_file()
        return _cache

    # Có Supabase → cache theo TTL, lỗi thì rơi về file.
    if _cache is not None and time.time() - _cache_at < _CACHE_TTL:
        return _cache
    try:
        _cache = _from_supabase(url, key)
        _cache_at = time.time()
    except Exception:
        _cache = _from_file()   # lưới an toàn: web vẫn chạy nếu Supabase hỏng
        _cache_at = time.time()
    return _cache


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
    return _load()["vi_tri"].get(vi_tri)


def nguon(source_id: str) -> dict | None:
    for s in _load()["sources"]:
        if s["id"] == source_id:
            return s
    return None


def chan_doan() -> dict:
    """Xác nhận nguồn KB thật sự đang dùng — để kiểm tra Supabase đã nối chưa.

    THỬ THẬT: nếu có env Supabase, gọi Supabase ngay tại đây và báo trung thực
    (không dùng cache, không giấu lỗi). Nhờ vậy biết chắc đang đọc từ đâu.
    """
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        return {"da_cau_hinh_supabase": False, "nguon": "file",
                "so_nghia": len(_from_file()["so_meanings"])}
    try:
        data = _from_supabase(url, key)
        return {
            "da_cau_hinh_supabase": True,
            "nguon": "supabase",
            "so_nghia": len(data["so_meanings"]),
            "so_nguon": len(data["sources"]),
            "so_vi_tri": len(data["vi_tri"]),
            "supabase_host": url.split("//")[-1].split(".")[0][:12] + "…",
        }
    except Exception as e:
        return {
            "da_cau_hinh_supabase": True,
            "nguon": "file_fallback",
            "canh_bao": "Có env Supabase nhưng đọc THẤT BẠI → đang rơi về file.",
            "loi": str(e)[:300],
            "so_nghia": len(_from_file()["so_meanings"]),
        }
