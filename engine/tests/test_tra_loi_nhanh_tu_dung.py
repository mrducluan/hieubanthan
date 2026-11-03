# -*- coding: utf-8 -*-
"""AUD-P0 (GEO, kiểm toán 2026-11): câu đầu "Trả lời nhanh" của các họ trang AI hay trích phải TỰ ĐỨNG — trong
~100 ký tự đầu nêu đối tượng + bộ môn, để khi bị cắt ra khỏi trang câu vẫn đúng nghĩa ("Trong Tử vi, Tử Vi ở cung
Mệnh…", không phải "Đây là…")."""
from __future__ import annotations

import pytest

from app.kb import trang


def _ds(loai: str) -> list[str]:
    ds, _ = trang._TRANG[loai]
    return [s for _, s in ds()]


@pytest.mark.parametrize("loai,mon", [("sao_cung", "Tử vi"), ("dau_hieu", "phong thuỷ"), ("cap_so", "thần số học"),
                                      ("nghe", "thần số học"), ("tinh_yeu", "thần số học")])
def test_cau_dau_neu_bo_mon(loai, mon):
    for slug in _ds(loai):
        tl = trang.lay(loai, slug)["tra_loi_nhanh"]
        assert mon.lower() in tl[:110].lower(), (slug, tl[:110])
        assert not tl.startswith("Đây là"), slug


def test_vi_du():
    assert trang.lay("sao_cung", "tu-vi-cung-menh")["tra_loi_nhanh"].startswith("Trong Tử vi, Tử Vi ở cung Mệnh")
    assert trang.lay("cap_so", _ds("cap_so")[0])["tra_loi_nhanh"].startswith("Trong thần số học, cặp số chủ đạo")
