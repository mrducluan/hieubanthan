# -*- coding: utf-8 -*-
"""Tầng KB — đọc quẻ Kinh Dịch "đời thường" (KD-ĐS).

Nguồn: app/kb/data/kinhdich_doi_song.json (nháp AI; khung dụng thần Tăng San Bốc Dịch, thể–dụng Mai Hoa, lời quẻ
Chu Dịch). Chỉ TRA, không sinh nghĩa. Thiếu khoá → None / rỗng (RULES rơi về câu chung, không vỡ).
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "kinhdich_doi_song.json"
MUC = ("thuan", "can_bang", "can_chu_dong")
NHAN_MAC_DINH = {"thuan": "Thuận lợi", "can_bang": "Cân bằng", "can_chu_dong": "Cần lưu ý"}


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
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "source_id": d.get("source_id", "kd_doi_song_vn"),
            "school_id": d.get("school_id", "tong_hop_kd")}


def muc(ma: str) -> dict:
    m = _lay("muc", ma)
    return m if isinstance(m, dict) else {"nhan": NHAN_MAC_DINH.get(ma, ma), "mo_ta": "", "ket_luan": ""}


def nhan_muc(ma: str) -> str:
    return muc(ma).get("nhan") or NHAN_MAC_DINH.get(ma, ma)


def nhom_hanh_dong(ma: str) -> str:
    return _lay("nhom_hanh_dong", ma) or ma


def chu_de_tat_ca() -> dict[str, dict]:
    x = _lay("chu_de")
    return x if isinstance(x, dict) else {}


def chu_de(ma: str) -> dict | None:
    m = _lay("chu_de", ma)
    return {"ma": ma, **m} if isinstance(m, dict) else None


def luc_thu(ten: str) -> dict | None:
    m = _lay("luc_thu", ten)
    return m if isinstance(m, dict) else None


def hoa(loai: str) -> dict | None:
    m = _lay("hoa", loai)
    return m if isinstance(m, dict) else None


def trang_thai(ma: str) -> str | None:
    return _lay("trang_thai", ma)


def vi_tri_hao(n: int) -> str | None:
    return _lay("vi_tri_hao", n)


def the_ung() -> str:
    return _lay("the_ung") or ""


def lam_ro(ma: str) -> dict | None:
    m = _lay("lam_ro", ma)
    return json.loads(json.dumps(m)) if isinstance(m, dict) else None


def mau(ma: str) -> str | None:
    return _lay("mau", ma)


def cum_cam() -> list[str]:
    x = _lay("cum_cam")
    return [s for s in x if isinstance(s, str) and s.strip()] if isinstance(x, list) else []


def tim_cum_cam(van: str) -> list[str]:
    """Cụm 'giọng AI' / doạ nạt có trong lớp đời thường — dùng lại bộ so khớp theo ranh giới âm tiết của Tử vi."""
    from app.kb.tuvi_doi_song_kb import tim_cum_cam as _tim  # noqa: PLC0415
    return _tim(van, cum_cam())
