# -*- coding: utf-8 -*-
"""Tầng KB — CY-1 (2026-11-04): MỘT nguồn cho lời "năm nên chú ý {mảng} hơn" của mọi mảng đời (tiền bạc, công việc,
tình cảm, gia đạo, nhà cửa, đi lại, giấy tờ, bạn bè) — mở rộng cách làm SK-1 (`suc_khoe_kb`). Nguồn:
app/kb/data/chu_y_kb.json (nháp ban biên tập, `source_id` + `school_id` ở gốc tệp và từng mục). Chỉ TRA, không sinh nghĩa."""
from __future__ import annotations

from pathlib import Path
from app.kb import nap

_F = Path(__file__).parent / "data" / "chu_y_kb.json"


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(_F.name)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def meta() -> dict:
    d = _d()
    return {"trang_thai": d.get("trang_thai", "nhap_ai"), "source_id": d.get("source_id", "tvds_toan_thu"),
            "school_id": d.get("school_id", "doi_song_chu_y")}


def cac_mang() -> list[str]:
    return [k for k in (_d().get("mang") or {}) if not k.startswith("_")]


def mang(ma: str) -> dict:
    m = (_d().get("mang") or {}).get(ma)
    return m if isinstance(m, dict) else {}


def ten(ma: str) -> str:
    return mang(ma).get("ten") or ma.replace("_", " ")


def viec(ma: str, hien_tai: bool = False) -> str:
    m = mang(ma)
    return (m.get("viec_nay") if hien_tai else None) or m.get("viec") or ""


def ranh_gioi(ma: str) -> str:
    return mang(ma).get("ranh_gioi") or ""


def theo_mon(ma: str, mon: str) -> dict:
    """Phần dữ kiện của mảng theo môn (`tuvi` / `battu` / `thanso` / `phongthuy`); không có → {}."""
    m = mang(ma).get(mon)
    return m if isinstance(m, dict) else {}


def chuong(mon: str) -> dict[str, list[str]]:
    """Chương báo cáo đời sống của môn → các mảng chú ý (mảng đầu đứng trước)."""
    m = (_d().get("chuong") or {}).get(mon)
    return {k: list(v) for k, v in (m or {}).items() if not k.startswith("_") and isinstance(v, list)}


def mau(ma: str) -> str:
    m = (_d().get("mau") or {}).get(ma)
    return m.strip() if isinstance(m, str) else ""


def hoi_tu_khoa() -> dict[str, list[str]]:
    return {k: v for k, v in (_d().get("hoi") or {}).items() if not k.startswith("_") and isinstance(v, list)}


def hoi_lo() -> list[str]:
    return [x for x in (_d().get("hoi_lo") or []) if isinstance(x, str)]


def van_han() -> list[str]:
    return [x for x in (_d().get("van_han") or []) if isinstance(x, str)]


def cum_cam() -> list[str]:
    return [c for c in (_d().get("cum_cam") or []) if isinstance(c, str)]
