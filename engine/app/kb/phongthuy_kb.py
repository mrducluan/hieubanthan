# -*- coding: utf-8 -*-
"""Tầng KB — Phong thuỷ (8 du niên, 8 quái, bố trí / loan đầu, âm trạch, giải thích, mẫu).
Nguồn: app/kb/data/phongthuy_kb.json (nháp AI, `can_doi_chieu`; mục dân gian gắn `nguon=dan_gian`).
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "phongthuy_kb.json"
SOURCE_ID, SCHOOL_ID = "duong_trach_tam_yeu", "bat_trach"


@lru_cache(maxsize=1)
def _d() -> dict:
    return json.loads(_F.read_text(encoding="utf-8"))


def meta() -> dict:
    d = _d()
    return {"trang_thai": d["trang_thai"], "can_doi_chieu": d["can_doi_chieu"],
            "source_id": SOURCE_ID, "school_id": SCHOOL_ID}


def _lay(nhom: str, ma: str) -> dict | None:
    m = _d()[nhom].get(ma)
    return {**m, **meta()} if m else None


def du_nien(ten: str) -> dict | None:
    return _lay("du_nien", ten)


def quai(ten: str) -> dict | None:
    return _lay("quai", ten)


def bo_tri_tat_ca() -> dict:
    return _d()["bo_tri"]


def bo_tri(ma: str) -> dict | None:
    m = _lay("bo_tri", ma)
    if m and m["nguon"] == "dan_gian":
        m["source_id"], m["school_id"] = "dan_gian", "dan_gian"
    return m


def am_trach_tat_ca() -> dict:
    return _d()["am_trach"]


def am_trach(ma: str) -> dict | None:
    m = _lay("am_trach", ma)
    if m:
        m["source_id"], m["school_id"] = "tang_thu", "loan_dau"
    return m


def giai_thich_tat_ca() -> dict:
    return _d()["giai_thich"]


def giai_thich(ma: str) -> dict | None:
    return _lay("giai_thich", ma)


def mau(ma: str) -> str | None:
    return _d()["mau"].get(ma)


def luu_y(ma: str) -> str | None:
    return _d()["luu_y"].get(ma)
