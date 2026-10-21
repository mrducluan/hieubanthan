# -*- coding: utf-8 -*-
"""Tầng KB — HN-2N "Xem lá số 2 người": lời đời thường cho điểm tham khảo hợp – khắc. Nguồn:
app/kb/data/tuvi_hai_nguoi_kb.json (nháp AI, mỗi tiêu chí có source_id + school_id). Tệp hoặc khoá chưa có → hàm trả
None / rỗng; RULES rơi về câu mặc định ngắn, không vỡ. Chỉ TRA, không sinh nghĩa.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "tuvi_hai_nguoi_kb.json"


@lru_cache(maxsize=1)
def _doc() -> dict:
    try:
        d = json.loads(_F.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def _d() -> dict:
    return _doc()


def _lay(*khoa: str):
    x = _d()
    for k in khoa:
        if not isinstance(x, dict):
            return None
        x = x.get(k)
        if x is None:
            return None
    return x


def _chuoi(x) -> str | None:
    return x.strip() if isinstance(x, str) and x.strip() else None


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "can_doi_chieu": d.get("can_doi_chieu", True),
            "source_id": d.get("source_id"), "school_id": d.get("school_id")}


def tieu_chi(ma: str) -> dict | None:
    x = _lay("tieu_chi", ma)
    return x if isinstance(x, dict) else None


def ket_luan(muc: str) -> str | None:
    return _chuoi(_lay("ket_luan", muc))


def tieu_de(ma: str, muc: str) -> str | None:
    return _chuoi(_lay("tieu_de", ma, muc))


def cau(ma: str, muc: str, quan_he: str) -> dict | None:
    """{"y": điều hai người hay gặp, "nen": việc cụ thể nên làm} cho tiêu chí × mức × quan hệ."""
    x = _lay("cau", ma, muc, quan_he)
    if not isinstance(x, dict):
        return None
    y, nen = _chuoi(x.get("y")), _chuoi(x.get("nen"))
    return {"y": y, "nen": nen} if y and nen else None


def tu_vi_chi_tiet(loai: str) -> str | None:
    return _chuoi(_lay("tu_vi_chi_tiet", loai))


def chua_tinh_cung_phi() -> str | None:
    return _chuoi(_lay("chua_tinh_cung_phi"))


def muc_tong(muc: str) -> dict:
    x = _lay("muc_tong", muc)
    return x if isinstance(x, dict) else {}


def goi_y(quan_he: str) -> list[str]:
    x = _lay("goi_y", quan_he)
    return [s.strip() for s in x if isinstance(s, str) and s.strip()] if isinstance(x, list) else []


def loi_dan() -> str | None:
    return _chuoi(_lay("loi_dan"))
