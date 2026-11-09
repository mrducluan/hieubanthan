# -*- coding: utf-8 -*-
"""Tầng KB — Tarot (TR-1). Chỉ TRA `tarot_kb.json`; thiếu khoá → None / rỗng. Không sinh nghĩa mới."""
from __future__ import annotations

from pathlib import Path
from app.kb import nap

_F = Path(__file__).parent / "data" / "tarot_kb.json"
# Tên hiển thị của nguồn (BM-1: sách / trường phái, không nêu nơi lưu hay nhãn nội bộ).
TEN_NGUON = {
    "waite_1910": "The Pictorial Key to the Tarot (A. E. Waite, 1910)", "book_t": "Book T (Golden Dawn)",
    "mathers_1888": "The Tarot (S. L. MacGregor Mathers, 1888)", "papus_1889": "Le Tarot des Bohémiens (Papus, 1889)",
    "crowley_1944": "The Book of Thoth (Aleister Crowley, 1944)", "case_1947": "The Tarot (Paul Foster Case, 1947)",
    "tdm_conver": "Tarot de Marseille (Nicolas Conver, 1760)", "jodorowsky_2004": "La Voie du Tarot (Jodorowsky & Costa, 2004)",
    "dan_gian_tarot": "cách đọc phổ biến trong cộng đồng tarot",
}
TEN_NGUYEN_TO = {"hoa": "Lửa", "thuy": "Nước", "khi": "Khí", "dat": "Đất"}


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(_F.name)
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
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "source_id": d.get("source_id", "waite_1910"),
            "school_id": d.get("school_id", "tarot_tong_hop"), "can_doi_chieu": bool(d.get("can_doi_chieu", True))}


def ten_nguon(ma: str | None) -> str:
    return TEN_NGUON.get(ma or "", ma or "")


def truong_phai() -> dict:
    return _lay("truong_phai") or {}


def bo() -> dict:
    return _lay("bo") or {}


def nguyen_to() -> dict:
    return _lay("nguyen_to") or {}


def pham_gia() -> dict:
    return _lay("pham_gia") or {}


def cung_hoang_dao() -> dict:
    return _lay("cung_hoang_dao") or {}


def hanh_tinh() -> dict:
    return _lay("hanh_tinh") or {}


def sephirah(so: int) -> str | None:
    return _lay("sephirah", so)


def so_hoc(so: int) -> str | None:
    return _lay("so_hoc", so)


def la() -> dict:
    return _lay("la") or {}


def mot_la(ma: str) -> dict | None:
    x = _lay("la", ma)
    return x if isinstance(x, dict) else None


def trai_bai() -> dict:
    return _lay("trai_bai") or {}


def chu_de() -> dict:
    return _lay("chu_de") or {}


def chuong() -> dict:
    return _lay("chuong") or {}


def thu_tu_chuong() -> list[str]:
    return list(_lay("thu_tu_chuong") or [])


def mau(*khoa):
    return _lay("mau", *khoa)


def tu_khoa(*khoa) -> dict | list:
    x = _lay("tu_khoa", *khoa)
    return x if x is not None else {}


def cum_cam() -> list[str]:
    return list(_lay("cum_cam") or [])


def dai_dien() -> dict:
    return _lay("dai_dien") or {}


def viec_truoc_khi_quyet() -> dict:
    """TR-2: việc nên làm trước khi quyết, theo loại việc đang hỏi (+ `_linh_vuc` dự phòng)."""
    return _d().get("viec_truoc_khi_quyet", {"_linh_vuc": {"_chung": []}})
