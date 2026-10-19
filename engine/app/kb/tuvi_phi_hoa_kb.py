# -*- coding: utf-8 -*-
"""Tầng KB — Phi tinh tứ hoá, nhịp 3 tháng, hợp tham, định giờ (TV-V2). Nguồn: app/kb/data/tuvi_phi_hoa_kb.json
(nháp AI, mỗi mục có source_id + school_id). Tệp hoặc khoá chưa có → hàm trả None; RULES rơi về câu mặc định
ngắn, không vỡ. Chỉ TRA, không sinh nghĩa.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "tuvi_phi_hoa_kb.json"


@lru_cache(maxsize=1)
def _d() -> dict:
    try:
        d = json.loads(_F.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


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
    return x if isinstance(x, str) and x.strip() else None


def _muc(x) -> dict | None:
    return x if isinstance(x, dict) else None


def co_kb() -> bool:
    return bool(_d())


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "can_doi_chieu": d.get("can_doi_chieu", True)}


def khai_niem(ma: str) -> dict | None:
    return _muc(_lay("khai_niem", ma))


def hoa(h: str) -> dict | None:
    return _muc(_lay("hoa", h))


def phi_vao_cung(h: str, cung: str) -> str | None:
    return _chuoi(_lay("phi_vao_cung", h, cung))


def tu_hoa_cung(h: str) -> dict | None:
    return _muc(_lay("tu_hoa_cung", h))


def mau_duong_bay() -> list[dict]:
    x = _lay("mau_duong_bay")
    return [m for m in x if isinstance(m, dict)] if isinstance(x, list) else []


def tuan_triet_ghi_chu() -> str | None:
    m = _muc(_lay("tuan_triet_ghi_chu"))
    return _chuoi(m.get("y")) if m else None


def nhip(nhom: str, ma: str) -> str | dict | None:
    """nhip_3_thang.{muc|ly_do|goi_y|cau_tu_soi}.{ma}"""
    x = _lay("nhip_3_thang", nhom, ma)
    return x if isinstance(x, (str, dict)) else None


def hop_tham(nhom: str, ma: str | None = None):
    x = _lay("hop_tham", nhom) if ma is None else _lay("hop_tham", nhom, ma)
    return x


def dinh_gio_cau_hoi(cung: str) -> str | None:
    return _chuoi(_lay("dinh_gio", "cau_hoi", cung))


def dinh_gio(khoa: str):
    return _lay("dinh_gio", khoa)


def vai_tro_sao(ten: str) -> dict | None:
    return _muc(_lay("vai_tro_sao", ten))


def phoi_hop_phai() -> list[dict]:
    x = _lay("phoi_hop_phai")
    return [m for m in x if isinstance(m, dict)] if isinstance(x, list) else []


def y_dinh_hoi() -> list[dict]:
    x = _lay("y_dinh_hoi")
    return [m for m in x if isinstance(m, dict)] if isinstance(x, list) else []


def dien(mau: str | None, **bien: str) -> str | None:
    """Thay {bien} đã biết trong mẫu KB; ngoặc lạ giữ nguyên (không ném lỗi như str.format)."""
    if not mau:
        return None
    for k, v in bien.items():
        mau = mau.replace("{" + k + "}", str(v))
    return mau
