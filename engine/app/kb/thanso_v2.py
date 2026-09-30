# -*- coding: utf-8 -*-
"""Tầng KB — kho thần số v2 (số × lĩnh vực, cặp số, biểu đồ, chỉ số phụ,
giải thích kỹ thuật, mẫu xử lý cố định).

Nguồn: file JSON trong app/kb/data (Supabase: migration 0003, chưa bật đọc).
Nguyên tắc như store.py: không có mục trong KB → trả None, tầng trên im lặng.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_DIR = Path(__file__).parent / "data"

FILES = {
    "linh_vuc": "thanso_linh_vuc.json",
    "cap_so": "thanso_cap_so.json",
    "bieu_do": "thanso_bieu_do.json",
    "chi_so_phu": "thanso_chi_so_phu.json",
    "giai_thich": "thanso_giai_thich.json",
    "xu_ly": "thanso_xu_ly.json",
}


@lru_cache(maxsize=None)
def _doc(ten: str) -> dict:
    return json.loads((_DIR / FILES[ten]).read_text(encoding="utf-8"))


def _meta(ten: str) -> dict:
    d = _doc(ten)
    return {"source_id": d["source_id"], "school_id": d["school_id"],
            "trang_thai": d["trang_thai"], "nguon": d["source"]["ten"]}


def ten_linh_vuc(lv: str) -> str:
    return _doc("linh_vuc")["linh_vuc"].get(lv, lv)


def linh_vuc_co_noi_dung() -> set[str]:
    return set(_doc("linh_vuc")["linh_vuc"])


def nghia_linh_vuc(so: int, lv: str) -> dict | None:
    m = _doc("linh_vuc")["noi_dung"].get(str(so), {}).get(lv)
    return {**m, **_meta("linh_vuc")} if m else None


def nghia_cap(cap: str) -> dict | None:
    m = _doc("cap_so")["cap"].get(cap)
    return {**m, **_meta("cap_so")} if m else None


def nghia_o_so(so: int) -> dict | None:
    m = _doc("bieu_do")["o_so"].get(str(so))
    return {**m, **_meta("bieu_do")} if m else None


def nghia_mui_ten(ma: str, trong: bool) -> dict | None:
    m = _doc("bieu_do")["mui_ten_trong" if trong else "mui_ten_du"].get(ma)
    return {**m, **_meta("bieu_do")} if m else None


def nghia_phu(khoi: str, so: int) -> dict | str | None:
    """khoi: ngay_sinh | thai_do | truong_thanh | thang_ca_nhan | ngay_ca_nhan |
    no_nghiep | bai_hoc_nghiep."""
    return _doc("chi_so_phu").get(khoi, {}).get(str(so))


def meta_phu() -> dict:
    return _meta("chi_so_phu")


def muc_giai_thich() -> dict[str, dict]:
    return _doc("giai_thich")["muc"]


def giai_thich(ma: str) -> dict | None:
    m = muc_giai_thich().get(ma)
    return {**m, **_meta("giai_thich")} if m else None


def mau(ma: str) -> str | None:
    return _doc("xu_ly")["mau"].get(ma)


def luu_y(ma: str) -> str | None:
    return _doc("xu_ly")["luu_y"].get(ma)
