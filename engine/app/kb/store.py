# -*- coding: utf-8 -*-
"""Tầng KB (tầng 2) — kho quy tắc luận giải thần số (số cơ bản + chiều sâu).

Một cache hợp nhất, hai nguồn cùng giao diện:
  - Supabase REST (khi có env SUPABASE_URL + SUPABASE_ANON_KEY): nội dung sống,
    sửa trong Table Editor là web đổi theo (sau TTL cache).
  - File JSON bundled (mặc định / dự phòng): chạy ngay không cần mạng, và là
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

_DIR = Path(__file__).parent / "data"
_MEANINGS_FILE = _DIR / "thanso_meanings.json"
_DEPTH_FILE = _DIR / "thanso_depth.json"

_CACHE_TTL = 60
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


# --------------------------------------------------------------------------- #
# Nguồn: file
# --------------------------------------------------------------------------- #
def _from_files() -> dict:
    m = json.loads(_MEANINGS_FILE.read_text(encoding="utf-8"))
    d = json.loads(_DEPTH_FILE.read_text(encoding="utf-8"))
    return {
        "sources": m["sources"],
        "schools": m["schools"],
        "so_meanings": m["so_meanings"],
        "vi_tri": m["vi_tri"],
        "dinh_cao": d["dinh_cao"],
        "thu_thach": d["thu_thach"],
        "nam_ca_nhan": d["nam_ca_nhan"],
    }


# --------------------------------------------------------------------------- #
# Nguồn: Supabase REST
# --------------------------------------------------------------------------- #
def _from_supabase(url: str, key: str) -> dict:
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    base = url.rstrip("/") + "/rest/v1"
    with httpx.Client(timeout=8, headers=headers) as c:
        def get(table: str) -> list:
            r = c.get(f"{base}/{table}", params={"select": "*"})
            r.raise_for_status()
            return r.json()

        # Lõi: nếu hỏng → cả _from_supabase hỏng → fallback file (an toàn).
        sources = get("sources")
        schools = get("schools")
        meanings = get("thanso_so_meanings")
        vi_tri = get("thanso_vi_tri")

        # Chiều sâu: chịu lỗi RIÊNG. Bảng chưa tạo (chưa chạy seed 0002) → dùng
        # file cho phần chiều sâu, KHÔNG kéo cả lõi rơi về file.
        try:
            dinh_cao = get("thanso_dinh_cao")
            thu_thach = get("thanso_thu_thach")
            nam_ca_nhan = get("thanso_nam_ca_nhan")
        except Exception:
            _fd = json.loads(_DEPTH_FILE.read_text(encoding="utf-8"))
            return {
                "sources": sources, "schools": schools,
                "so_meanings": {str(m["gia_tri"]): {
                    "tu_khoa": m["tu_khoa"], "mat_toi": m["mat_toi"],
                    "phan_chung": m["phan_chung"], "so_cai": m.get("so_cai", False),
                    "source_id": m["source_id"], "school_id": m["school_id"],
                } for m in meanings},
                "vi_tri": {v["id"]: {"ten": v["ten"], "khung": v["khung"]} for v in vi_tri},
                "dinh_cao": _fd["dinh_cao"], "thu_thach": _fd["thu_thach"],
                "nam_ca_nhan": _fd["nam_ca_nhan"],
                "_chieu_sau_tu": "file",
            }

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
        "dinh_cao": {
            str(r["gia_tri"]): {
                "chu_de": r["chu_de"], "y_nghia": r["y_nghia"],
                "bong_toi": r["bong_toi"], "phan_chung": r["phan_chung"],
                "so_cai": r.get("so_cai", False),
            } for r in dinh_cao
        },
        "thu_thach": {
            str(r["gia_tri"]): {
                "mo_ta": r["mo_ta"], "y_nghia": r["y_nghia"], "cach_vuot": r["cach_vuot"],
            } for r in thu_thach
        },
        "nam_ca_nhan": {
            str(r["gia_tri"]): {
                "chu_de": r["chu_de"], "y_nghia": r["y_nghia"],
                "nen": r["nen"], "tranh": r["tranh"],
            } for r in nam_ca_nhan
        },
    }


def _load() -> dict:
    global _cache, _cache_at
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")

    if not url or not key:
        if _cache is None:
            _cache = _from_files()
        return _cache

    if _cache is not None and time.time() - _cache_at < _CACHE_TTL:
        return _cache
    try:
        _cache = _from_supabase(url, key)
        _cache_at = time.time()
    except Exception:
        _cache = _from_files()   # lưới an toàn
        _cache_at = time.time()
    return _cache


# --------------------------------------------------------------------------- #
# Số cơ bản
# --------------------------------------------------------------------------- #
def nghia_so(gia_tri: int) -> SoMeaning | None:
    raw = _load()["so_meanings"].get(str(gia_tri))
    if raw is None:
        return None
    return {
        "gia_tri": gia_tri, "tu_khoa": raw["tu_khoa"], "mat_toi": raw["mat_toi"],
        "phan_chung": raw["phan_chung"], "so_cai": raw.get("so_cai", False),
        "source_id": raw["source_id"], "school_id": raw["school_id"],
    }


def khung_vi_tri(vi_tri: str) -> dict | None:
    return _load()["vi_tri"].get(vi_tri)


def nguon(source_id: str) -> dict | None:
    for s in _load()["sources"]:
        if s["id"] == source_id:
            return s
    return None


# --------------------------------------------------------------------------- #
# Chiều sâu
# --------------------------------------------------------------------------- #
def nghia_dinh_cao(so: int) -> dict | None:
    return _load()["dinh_cao"].get(str(so))


def nghia_thu_thach(so: int) -> dict | None:
    return _load()["thu_thach"].get(str(so))


def nghia_nam_ca_nhan(so: int) -> dict | None:
    return _load()["nam_ca_nhan"].get(str(so))


def trich_nguon_depth() -> str:
    return "Dòng Balliett → Jordan"


# --------------------------------------------------------------------------- #
# Chẩn đoán nguồn
# --------------------------------------------------------------------------- #
def chan_doan() -> dict:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        return {"da_cau_hinh_supabase": False, "nguon": "file",
                "so_nghia": len(_from_files()["so_meanings"])}
    try:
        data = _from_supabase(url, key)
        return {
            "da_cau_hinh_supabase": True, "nguon": "supabase",
            "so_nghia": len(data["so_meanings"]),
            "so_dinh_cao": len(data["dinh_cao"]),
            "so_thu_thach": len(data["thu_thach"]),
            "so_nam_ca_nhan": len(data["nam_ca_nhan"]),
            "supabase_host": url.split("//")[-1].split(".")[0][:12] + "…",
        }
    except Exception as e:
        return {
            "da_cau_hinh_supabase": True, "nguon": "file_fallback",
            "canh_bao": "Có env Supabase nhưng đọc THẤT BẠI → đang rơi về file.",
            "loi": str(e)[:300], "so_nghia": len(_from_files()["so_meanings"]),
        }
