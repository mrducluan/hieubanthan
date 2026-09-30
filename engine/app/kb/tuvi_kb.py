# -*- coding: utf-8 -*-
"""Tầng KB — Tử vi (12 cung, 14 chính tinh, 14×12 sao-cung, độ sáng, tứ hoá × cung,
phụ tinh, chủ đề hạn, giải thích, mẫu). Nguồn: app/kb/data/tuvi_kb.json (nháp AI,
`can_doi_chieu`). Không có → None.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "tuvi_kb.json"
SOURCE_ID, SCHOOL_ID = "tuvi_vn", "nam_phai"


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


def cung(ten: str) -> dict | None:
    return _lay("cung", ten)


def ten_cung() -> list[str]:
    return list(_d()["cung"])


def chinh_tinh(ten: str) -> dict | None:
    return _lay("chinh_tinh", ten)


def ten_chinh_tinh() -> list[str]:
    return list(_d()["chinh_tinh"])


def sao_cung(sao: str, ten_cung_: str) -> str | None:
    return _d()["sao_cung"].get(sao, {}).get(ten_cung_)


def do_sang(muc: str) -> str | None:
    return _d()["do_sang"].get(muc)


def tu_hoa(hoa: str) -> dict | None:
    return _lay("tu_hoa", hoa)


def tu_hoa_cung(hoa: str, ten_cung_: str) -> str | None:
    return _d()["tu_hoa_cung"].get(hoa, {}).get(ten_cung_)


def phu_tinh(ten: str) -> dict | None:
    return _lay("phu_tinh", ten)


def ten_phu_tinh() -> list[str]:
    return list(_d()["phu_tinh"])


def nhom_cach(nhom: str) -> str | None:
    return _d()["nhom_cach"].get(nhom)


def chu_de_han(ten_cung_: str) -> str | None:
    return _d()["chu_de_han"].get(ten_cung_)


def giai_thich_tat_ca() -> dict:
    return _d()["giai_thich"]


def giai_thich(ma: str) -> dict | None:
    return _lay("giai_thich", ma)


def mau(ma: str) -> str | None:
    return _d()["mau"].get(ma)


def luu_y(ma: str) -> str | None:
    return _d()["luu_y"].get(ma)
