# -*- coding: utf-8 -*-
"""AUD-P0 (kiểm toán SEO/GEO 2026-11): dữ kiện riêng cho trang "sao X ở cung Y" — khi sao đứng ở cung Y (cách Mệnh
k cung), cung Mệnh (hoặc tam phương khi Y là Mệnh) có chính tinh nào. Tính từ khẩu quyết an chính tinh (CALC thuần),
xét đủ 12 vị trí của Tử Vi. Golden độc lập: 60 lá lasotuvi — mọi chính tinh ở cung k → chính tinh Mệnh thật khớp."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.calc import tuvi_vi_tri as vt

_G = json.loads((Path(__file__).parents[1] / "fixtures/golden/lasotuvi_60.json").read_text("utf-8"))["cases"]
_TEN = {s.lower(): s for s in vt.CHINH_TINH}


def _vi_tri(c: dict) -> dict[str, str]:
    return {_TEN[v["ten"].lower()]: v["chi"][0] for v in c["sao"].values() if v["ten"].lower() in _TEN}


@pytest.mark.parametrize("i", range(len(_G)))
def test_khop_lasotuvi_60(i):
    c = _G[i]
    g, menh = _vi_tri(c), c["menh"]
    sao_menh = sorted(t for t, ch in g.items() if ch == menh)
    for sao, ch in g.items():
        k = (vt.CHI.index(menh) - vt.CHI.index(ch)) % 12          # cung thứ k tính nghịch từ Mệnh
        dong = next(x for x in vt.sao_o_cung_cach_menh(sao, k) if x["chi_sao"] == ch)
        assert dong["chi_menh"] == menh and sorted(dong["menh"]) == sao_menh


def test_moi_sao_moi_cung_du_12_vi_tri():
    for sao in vt.CHINH_TINH:
        for k in range(12):
            ds = vt.sao_o_cung_cach_menh(sao, k)
            assert len(ds) == 12 and len({x["chi_sao"] for x in ds}) == 12
            tt = vt.tom_tat_cung_khac(sao, k, k)
            assert sum(x["so_vi_tri"] for x in tt["to_hop"]) + tt["vo_chinh_dieu"] == 12


def test_vi_du_co_dinh():
    # k: 0 Mệnh, 2 Phu Thê, 4 Tài Bạch, 8 Quan Lộc (thứ tự KB, đi nghịch); lech = 0 → cung Mệnh
    assert vt.tom_tat_cung_khac("Thái Dương", 2, 0)["luon_co"] == ["Thiên Cơ"]
    assert vt.tom_tat_cung_khac("Tham Lang", 4, 0)["luon_co"] == ["Thất Sát"]
    assert vt.tom_tat_cung_khac("Tử Vi", 0, 8)["luon_co"] == ["Liêm Trinh"]       # Tử Vi toạ Mệnh: Quan Lộc luôn có Liêm Trinh
