"""TV-YBS — bộ đọc DUY NHẤT của KB `tuvi_y_bo_sung.json` (ý Tử vi bổ sung, viết lại ở mức quy tắc).

`hien_thi`: "hop" = ý chung (gộp vào hộp luận / trang / hỏi đáp) · "goc_nhin_khac" = ý riêng trường phái (chỉ khung gập
"Góc nhìn khác", có kiểm chứng) · "khong" = không hiện. RULES gọi `theo_loai` / `lay`; KB không tự sinh nghĩa mới.
"""
from __future__ import annotations

from pathlib import Path
from app.kb import nap

TEP = Path(__file__).parent / "data" / "tuvi_y_bo_sung.json"


@nap.nho
def _kb() -> dict:
    return nap.doc(TEP.name)


def tat_ca() -> list[dict]:
    return [m for m in _kb()["muc"] if m["hien_thi"] != "khong"]


def lay(ma: str) -> dict | None:
    return next((m for m in _kb()["muc"] if m["id"] == ma and m["hien_thi"] != "khong"), None)


def theo_loai(*loai: str, hien_thi: str | None = None) -> list[dict]:
    return [m for m in tat_ca() if m["loai"] in loai and (hien_thi is None or m["hien_thi"] == hien_thi)]
