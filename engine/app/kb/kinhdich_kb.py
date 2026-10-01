# -*- coding: utf-8 -*-
"""Tầng KB — Kinh Dịch (64 quẻ, bát quái, thể–dụng, dụng thần, giải thích, mẫu).

Nguồn: app/kb/data/kinhdich_kb.json (nháp AI, `can_doi_chieu`). Không có → None.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "kinhdich_kb.json"


@lru_cache(maxsize=1)
def _d() -> dict:
    return json.loads(_F.read_text(encoding="utf-8"))


def meta() -> dict:
    d = _d()
    return {"trang_thai": d["trang_thai"], "can_doi_chieu": d["can_doi_chieu"]}


def que(so: int) -> dict | None:
    q = _d()["que"].get(str(so))
    return {**q, **meta()} if q else None


def ten_que() -> dict[int, str]:
    return {int(k): v["ten"] for k, v in _d()["que"].items()}


def the_dung(quan_he: str) -> dict | None:
    m = _d()["the_dung"].get(quan_he)
    return {**m, **meta()} if m else None


def dung_than(ten: str) -> dict | None:
    m = _d()["dung_than"].get(ten)
    return {**m, **meta()} if m else None


def giai_thich_tat_ca() -> dict:
    return _d()["giai_thich"]


def giai_thich(ma: str) -> dict | None:
    m = _d()["giai_thich"].get(ma)
    return {**m, **meta()} if m else None


def mau(ma: str) -> str | None:
    return _d()["mau"].get(ma)


def luu_y(ma: str) -> str | None:
    return _d()["luu_y"].get(ma)


# --------------------------------------------------------------------------- KB-1: lời kinh
_F_HAO = Path(__file__).parent / "data" / "kinhdich_hao.json"


@lru_cache(maxsize=1)
def _h() -> dict:
    return json.loads(_F_HAO.read_text(encoding="utf-8"))


def _meta_hao() -> dict:
    d = _h()
    return {"trang_thai": d["trang_thai"], "can_doi_chieu": d["can_doi_chieu"],
            "source_id": d["source_id"], "school_id": d["school_id"]}


def que_van(so: int) -> dict | None:
    """Quái từ, Đại tượng, Thoán (nguyên văn + dịch), 6 hào, Dụng Cửu/Dụng Lục (Càn/Khôn)."""
    q = _h()["que"].get(str(so))
    return {**q, **_meta_hao()} if q else None


def hao(so: int, vi_tri: int) -> dict | None:
    q = _h()["que"].get(str(so))
    if not q or not 1 <= vi_tri <= 6:
        return None
    return {**q["hao"][vi_tri - 1], **_meta_hao()}
