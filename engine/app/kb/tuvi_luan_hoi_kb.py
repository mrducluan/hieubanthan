# -*- coding: utf-8 -*-
"""Tầng KB — lớp "Luận theo câu hỏi" của Luận giải Tử vi đời sống (LH-1).

Nguồn: app/kb/data/tuvi_luan_hoi_kb.json (nháp ban biên tập; `source_id` + `school_id` ở gốc tệp). Chỉ TRA, không sinh nghĩa.
"""
from __future__ import annotations

from app.kb import nap

_TEP = "tuvi_luan_hoi_kb.json"


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(_TEP)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def lay(*khoa: str):
    """Tra theo đường khoá; thiếu → None."""
    x = _d()
    for k in khoa:
        if not isinstance(x, dict):
            return None
        x = x.get(k)
        if x is None:
            return None
    return x


def chuoi(*khoa: str) -> str:
    x = lay(*khoa)
    return x.strip() if isinstance(x, str) else ""


def cau(chuong: str) -> list[dict]:
    x = lay("cau", chuong)
    return [c for c in x if isinstance(c, dict)] if isinstance(x, list) else []


def tra_loi(ma: str, nhan: str) -> dict:
    x = lay("tra_loi", ma, nhan)
    return x if isinstance(x, dict) else {}


def tin_hieu(chuong: str, ma: str) -> dict:
    x = lay("tin_hieu", chuong, ma)
    return x if isinstance(x, dict) else {}


def dan_gian(chuong: str) -> list[dict]:
    x = lay("dan_gian", chuong)
    return [c for c in x if isinstance(c, dict)] if isinstance(x, list) else []


def vai() -> dict:
    x = lay("vai")
    return x if isinstance(x, dict) else {}


def anh_xa_hoi_dap() -> list[dict]:
    """Bảng ánh xạ (chủ đề định tuyến + vai được hỏi + cụm nhận diện) -> `(chuong, ma)` của 27 câu `luan_hoi`."""
    x = lay("anh_xa_hoi_dap")
    return [m for m in x if isinstance(m, dict)] if isinstance(x, list) else []
