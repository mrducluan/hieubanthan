# -*- coding: utf-8 -*-
"""Tầng KB — Bát tự (10 nhật chủ × 4 mùa, 10 thập thần, 4 trụ, ngũ hành, cách cục, giải thích,
mẫu). Nguồn: app/kb/data/battu_kb.json (nháp AI, `can_doi_chieu`). Không có → None.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "battu_kb.json"
SOURCE_ID, SCHOOL_ID = "tu_binh_chan_thuyen", "tu_binh"


@lru_cache(maxsize=1)
def _d() -> dict:
    return json.loads(_F.read_text(encoding="utf-8"))


def meta() -> dict:
    d = _d()
    return {"trang_thai": d["trang_thai"], "can_doi_chieu": d["can_doi_chieu"],
            "source_id": SOURCE_ID, "school_id": SCHOOL_ID}


def _lay(nhom: str, ma: str) -> dict | None:
    m = _d()[nhom].get(ma)
    if m is None:
        return None
    return {**(m if isinstance(m, dict) else {"noi_dung": m}), **meta()}


def nhat_chu(can: str) -> dict | None:
    return _lay("nhat_chu", can)


def thap_than(ten: str) -> dict | None:
    return _lay("thap_than", ten)


def ten_thap_than() -> list[str]:
    return list(_d()["thap_than"])


def tru(ten: str) -> str | None:
    return _d()["tru"].get(ten)


def ngu_hanh(hanh: str) -> dict | None:
    return _lay("ngu_hanh", hanh)


def cach_cuc(ten: str) -> str | None:
    return _d()["cach_cuc"].get(ten)


def giai_thich_tat_ca() -> dict:
    return _d()["giai_thich"]


def giai_thich(ma: str) -> dict | None:
    return _lay("giai_thich", ma)


def mau(ma: str) -> str | None:
    return _d()["mau"].get(ma)


def luu_y(ma: str) -> str | None:
    return _d()["luu_y"].get(ma)
