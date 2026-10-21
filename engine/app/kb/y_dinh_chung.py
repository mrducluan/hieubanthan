# -*- coding: utf-8 -*-
"""KC-3 — Từ điển ý định dùng chung giữa các mảng (KB `y_dinh_chung.json`): mã chung ↔ mã riêng từng mảng, link gợi mở
sang mảng khác cùng một nỗi băn khoăn. Chỉ TRA, tất định."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

_F = Path(__file__).parent / "data" / "y_dinh_chung.json"
MO_DUN = ("kinhdich", "tuvi", "thanso", "battu", "phongthuy", "hom_nay")


@lru_cache(maxsize=1)
def _d() -> dict:
    try:
        return json.loads(_F.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {"y_dinh": {}, "ten_mo_dun": {}}


def tat_ca() -> dict[str, dict]:
    return _d().get("y_dinh", {})


def ten_mo_dun(ma: str) -> str:
    return _d().get("ten_mo_dun", {}).get(ma, ma)


def tu_ma_rieng(mo_dun: str, ma_rieng: str | None) -> str | None:
    """Mã riêng của một mảng (chủ đề Kinh Dịch, ý định Tử vi, trụ nỗi đau thần số, ý định Hôm nay, phòng phong thuỷ,
    chương Bát tự) → mã chung; không có → None."""
    if not ma_rieng:
        return None
    for ma, y in tat_ca().items():
        if ma_rieng in (y.get("rieng") or {}).get(mo_dun, []):
            return ma
    return ma_rieng if ma_rieng in tat_ca() else None


def goi_mo(ma_chung: str, tru_mo_dun: str | None = None, toi_da: int = 3) -> dict | None:
    """→ {ma, ten, mo_ta, lien_ket: [{mo_dun, ten_mo_dun, duong, nhan}]} bỏ mảng đang đứng; None nếu mã lạ."""
    y = tat_ca().get(ma_chung)
    if not y:
        return None
    lk = [{**x, "ten_mo_dun": ten_mo_dun(x["mo_dun"])} for x in y.get("lien_ket", []) if x["mo_dun"] != tru_mo_dun]
    return {"ma": ma_chung, "ten": y["ten"], "mo_ta": y.get("mo_ta", ""), "lien_ket": lk[:toi_da],
            "tuvi_cung": (y.get("rieng") or {}).get("tuvi_cung"), "thanso_linh_vuc": (y.get("rieng") or {}).get("thanso_linh_vuc")}


def danh_sach() -> list[dict]:
    return [{"ma": ma, "ten": y["ten"], "mo_ta": y.get("mo_ta", "")} for ma, y in tat_ca().items()]
