# -*- coding: utf-8 -*-
"""SEO-K (chủ dự án duyệt 2026-10-21) — đo "phần riêng" của trang kiến thức lập trình.

Phần riêng = tỉ lệ cụm 6 từ (shingle) chỉ xuất hiện ở MỘT trang trong cùng họ trang (cùng `loai`). Trang dưới
NGUONG mà chưa thẩm định thì tạm không index (vẫn có link, vẫn có bản .md) cho tới khi KB viết thêm phần riêng.
Tất định: cùng KB ra cùng kết quả; tính một lần mỗi tiến trình. Không gọi LLM, không đổi phép tính.
"""
from __future__ import annotations

from collections import Counter
from functools import lru_cache

NGUONG = 0.20
_N = 6


def chu_trang(t: dict) -> list[str]:
    """Chữ người đọc thấy (tiêu đề, trả lời nhanh, mục, hỏi đáp) — bỏ link, nguồn, khối điều hướng."""
    p = [t["tieu_de"], t["tra_loi_nhanh"]]
    for m in t["muc"]:
        p += [m["tieu_de"], m.get("doan") or "", *(m.get("danh_sach") or [])]
        p += [o for d in (m.get("bang") or {}).get("dong", []) for o in d]          # SEO-M: ô bảng
        p += [x.get("nghia") or "" for x in m.get("trich_dan") or []]
    for h in t["hoi_dap"]:
        p += [h["hoi"], h["dap"]]
    return " ".join(p).lower().split()


def _cum(tu: list[str]) -> set[tuple[str, ...]]:
    return {tuple(tu[i:i + _N]) for i in range(len(tu) - _N + 1)}


@lru_cache(maxsize=1)
def ty_le() -> dict[tuple[str, str], float]:
    from app.kb import trang
    ra: dict[tuple[str, str], float] = {}
    for loai, (ds, dung) in trang._TRANG.items():
        cum = [(slug, _cum(chu_trang(dung(k, slug)))) for k, slug in ds()]
        dem = Counter(x for _, c in cum for x in c)
        for slug, c in cum:
            ra[(loai, slug)] = round(sum(1 for x in c if dem[x] == 1) / max(1, len(c)), 3)
    return ra


def thap(loai: str, slug: str) -> bool:
    return ty_le().get((loai, slug), 1.0) < NGUONG
