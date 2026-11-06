# -*- coding: utf-8 -*-
"""Tầng KB — Nhân tướng học (NT-1). Chỉ TRA `nhan_tuong_kb.json`; thiếu khoá → None / rỗng. Không sinh nghĩa mới."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "nhan_tuong_kb.json"
# Tên hiển thị của nguồn (BM-1: không nêu tên nội bộ / nơi lưu — "seed" của chủ dự án hiện là ban biên tập).
TEN_NGUON = {
    "ma_y": "Ma Y Thần Tướng", "than_tuong_toan_bien": "Thần Tướng Toàn Biên", "lieu_trang": "Liễu Trang Thần Tướng",
    "bang_giam": "Băng Giám", "thuy_kinh": "Thuỷ Kính Tập", "noi_kinh": "Hoàng Đế Nội Kinh (Linh Khu, Tố Vấn)",
    "tam_tuong_thien": "Tâm Tướng Thiên", "dan_gian_vn": "quan niệm dân gian Việt Nam", "seed_chu_du_an": "Ban biên tập Hiểu Bản Thân",
}


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
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "source_id": d.get("source_id", "ma_y"),
            "school_id": d.get("school_id", "tam_dinh_ngu_quan"), "can_doi_chieu": bool(d.get("can_doi_chieu", True))}


def truong_phai() -> dict:
    return _lay("truong_phai") or {}


def bo_vi() -> dict:
    return _lay("bo_vi") or {}


def cung() -> dict:
    return _lay("cung") or {}


def luu_nien() -> list[dict]:
    return _lay("luu_nien") or []


def ngu_hinh() -> dict:
    return _lay("ngu_hinh") or {}


def ngu_hinh_luat() -> dict:
    return _lay("ngu_hinh_luat") or {}


def ngu_hanh_sinh() -> dict:
    return _lay("ngu_hanh_sinh") or {}


def khi_sac() -> dict:
    return _lay("khi_sac") or {}


def not_ruoi() -> dict:
    return _lay("not_ruoi") or {}


def buoc() -> list[dict]:
    return _lay("buoc") or []


def cau_hoi() -> list[dict]:
    return _lay("cau_hoi") or []


@lru_cache(maxsize=1)
def cau_hoi_theo_ma() -> dict[str, dict]:
    return {c["ma"]: c for c in cau_hoi()}


def dac_diem() -> dict:
    return _lay("dac_diem") or {}


def chuong() -> dict:
    return _lay("chuong") or {}


def thu_tu_chuong() -> list[str]:
    return _lay("thu_tu_chuong") or list(chuong().keys())


def mau(*khoa) -> str | dict:
    x = _lay("mau", *khoa)
    return x if x is not None else ""


def tu_khoa(nhom: str) -> dict | list:
    return _lay("tu_khoa", nhom) or ({} if nhom in ("bo_vi", "cung", "not_ruoi") else [])


def cum_cam() -> list[str]:
    return _lay("cum_cam") or []


def ten_nguon(ma: str | None) -> str:
    return TEN_NGUON.get(ma or "", TEN_NGUON["ma_y"])
