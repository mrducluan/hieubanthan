# -*- coding: utf-8 -*-
"""KB-TT1 — mọi trang kiến thức (trừ Cốt Tuỷ Phú) có 3–5 ý chính ≤ 90 ký tự cho ảnh tóm tắt."""
from app.kb import trang


def test_moi_trang_co_y_chinh_hop_le():
    thieu = []
    for m in trang.danh_sach():
        if m["loai"] == "co_thu":
            continue
        yc = trang.lay(m["loai"], m["slug"]).get("y_chinh") or []
        if not 3 <= len(yc) <= 5 or any(len(y) > 90 for y in yc):
            thieu.append((m["loai"], m["slug"]))
    assert not thieu, thieu[:10]
