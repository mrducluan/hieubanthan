# -*- coding: utf-8 -*-
"""Tầng KB — «Tiêu Thị Dịch Lâm»: 64 × 64 bài từ cổ theo quẻ bản → quẻ biến. Chỉ TRA nguyên văn (`kinhdich_dich_lam.json`,
cắt từ kho nguồn bản Tứ khố bằng `scripts/nap_dich_lam.py`). Chưa có bản dịch: bài từ chỉ hiện ở lớp học thuật, kèm lời nói rõ
là thơ cổ để tham khảo. Bài có chữ nặng (chết, bệnh, tai hoạ… — cùng danh mục chữ của bộ kiểm SX-C) KHÔNG trả: lời nặng mà
không có lời Việt nói giảm đi kèm thì không đưa cho người đọc."""
from __future__ import annotations

from app.kb import nap
from app.kb import sach_ghi

TEP = "kinhdich_dich_lam.json"
TEN_SACH = "Tiêu Thị Dịch Lâm"


@nap.nho
def _d() -> dict:
    try:
        d = nap.doc(TEP)
    except (OSError, ValueError):
        return {}
    return d if isinstance(d, dict) else {}


def nguyen_van(ban: int, bien: int | None = None) -> str | None:
    """Bài từ của quẻ `ban` biến sang `bien` (số Văn Vương 1–64); không có quẻ biến → bài của chính quẻ bản."""
    return ((_d().get("tu") or {}).get(str(ban)) or {}).get(str(bien or ban))


def bai(ban: int, bien: int | None = None) -> dict | None:
    """Bài từ cho bài đọc quẻ: {han, tu, den, co_bien} (tên sách do web ghi theo ngôn ngữ). Bài có chữ nặng → None."""
    han = nguyen_van(ban, bien)
    if not han or sach_ghi._HAN_NANG.search(han):
        return None
    ten = _d().get("ten_han") or []
    return {"han": han, "tu": ten[ban - 1], "den": ten[(bien or ban) - 1], "co_bien": bool(bien and bien != ban)}
