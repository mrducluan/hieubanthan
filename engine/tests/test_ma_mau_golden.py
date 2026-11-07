# -*- coding: utf-8 -*-
"""EN-6 — golden TOÀN BỘ mã kiểm chứng báo cáo đời sống (Tử vi, Bát tự, Bản đồ con số, Nhà của bạn, đọc quẻ, Thời gian
tới) trên đầu vào cố định (tests/_ma_mau_dau_vao.py). Điều kiện trước khi gom khuôn `doi_song_1` hay sửa lời hàng loạt:
mã là khoá phiếu "Đúng với mình" — mã đổi âm thầm thì phiếu cũ của người dùng mất liên kết. Cố ý đổi mã → chạy
scripts/sinh_ma_mau_golden.py và nói rõ trong PR."""
from __future__ import annotations

import json

from tests._ma_mau_dau_vao import GOLDEN, chup


def test_ma_mau_khong_doi():
    g = json.loads((GOLDEN / "ma_mau_doi_song.json").read_text(encoding="utf-8"))
    hien = chup()
    for mang, ds in hien.items():
        cu = set(g[mang])
        mat, moi = sorted(cu - set(ds)), sorted(set(ds) - cu)
        assert not mat and not moi, f"{mang}: mất {len(mat)} mã {mat[:5]} · thêm {len(moi)} mã {moi[:5]}"


def test_moi_mang_deu_co_ma():
    g = json.loads((GOLDEN / "ma_mau_doi_song.json").read_text(encoding="utf-8"))
    for mang in ("tuvi", "battu", "thanso", "phongthuy", "kinhdich", "thoi_gian", "nhantuong", "chan_dung", "tarot"):
        assert len(g[mang]) >= 5, mang
