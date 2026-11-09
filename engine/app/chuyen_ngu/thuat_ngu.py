"""Bảng thuật ngữ Việt → Anh cố định (`kb/data/thuat_ngu_en.json`) — một nguồn cho lời nhắc máy chuyển ngữ và bộ kiểm."""
from __future__ import annotations

import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path

_TEP = Path(__file__).resolve().parents[1] / "kb" / "data" / "thuat_ngu_en.json"


@lru_cache(maxsize=1)
def bang() -> dict:
    return json.loads(_TEP.read_text(encoding="utf-8"))


def _nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s)


def muc(mang: list[str] | None = None) -> list[dict]:
    return [m for m in bang()["muc"] if not mang or m["mang"] in mang]


def en(vi: str) -> str | None:
    """Tên Anh của một thuật ngữ (không phân biệt hoa thường); không có → None."""
    k = _nfc(vi).casefold()
    return next((m["en"] for m in bang()["muc"] if _nfc(m["vi"]).casefold() == k), None)


def bien_the_en(ten_en: str) -> list[str]:
    """Các cách viết được chấp nhận: phần chính và phần trong ngoặc ("Hua Ji (Obstacle transformation)" → cả hai)."""
    chinh = re.sub(r"\s*\(.*?\)\s*", " ", ten_en).strip()
    trong = re.findall(r"\((.*?)\)", ten_en)
    return [x for x in [chinh, *trong] if x]


def cum_cam() -> list[re.Pattern]:
    return [re.compile(p, re.I) for p in bang().get("cum_cam_en", [])]


def cam_en(m: dict) -> list[str]:
    """HTT-1: cách dịch sát / sai nghĩa KHÔNG được dùng cho thuật ngữ `m` (trường `cam_en`, có thể thiếu)."""
    return [x for x in m.get("cam_en", []) if isinstance(x, str) and x.strip()]


def cho_loi_nhac(mang: list[str] | None = None) -> str:
    """Danh sách "vi → en" đưa vào lời nhắc máy chuyển ngữ."""
    return "\n".join(f"- {m['vi']} → {m['en']}" for m in muc(mang))
