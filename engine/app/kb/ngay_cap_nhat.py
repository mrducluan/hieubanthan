# -*- coding: utf-8 -*-
"""SEO-L4 (chủ dự án duyệt 2026-10-22) — ngày đăng / cập nhật THẬT của từng trang kiến thức.

Sổ `data/ngay_cap_nhat.json` ghi cho mỗi trang: băm nội dung (`bam`), ngày đăng (`dang`), ngày sửa nội dung gần nhất
(`sua`). Lệnh `python scripts/ngay_cap_nhat.py` dựng lại trang, so băm: trang đổi chữ → `sua` = hôm nay; trang mới →
`dang` = `sua` = hôm nay. Test `test_ngay_cap_nhat.py` bắt quên chạy lệnh (trừ nhánh `quan-tri/…` sửa KB từ trang quản
trị — khi đó trang giữ ngày cũ cho tới lần chạy lệnh kế tiếp). Không đổi phép tính, chỉ đọc sổ.
"""
from __future__ import annotations

import hashlib
import json
from functools import lru_cache
from pathlib import Path

SO = Path(__file__).parent / "data" / "ngay_cap_nhat.json"
# Không đưa vào băm: trường do chính sổ này đặt, và trường biên tập (thẩm định / chủ biên / góc nhìn / trạng thái) —
# ngày thẩm định đã tự thành ngày cập nhật (trang.py lấy max), duyệt bài không cần chạy lại lệnh.
_BO_QUA = ("cap_nhat", "ngay_dang", "chu_bien", "duyet_xuat_ban", "tac_gia", "tham_dinh", "goc_nhin", "bien_soan",
           "trang_thai", "index")


def bam(t: dict) -> str:
    goc = {k: v for k, v in t.items() if k not in _BO_QUA}
    return hashlib.sha1(json.dumps(goc, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:16]


@lru_cache(maxsize=1)
def doc_so() -> dict:
    return json.loads(SO.read_text("utf-8")).get("trang", {}) if SO.exists() else {}


def ngay(loai: str, slug: str, mac_dinh: str) -> tuple[str, str]:
    """(ngày đăng, ngày sửa) theo sổ; trang chưa có trong sổ → ngày mặc định."""
    m = doc_so().get(f"{loai}/{slug}")
    return (m["dang"], m["sua"]) if m else (mac_dinh, mac_dinh)
