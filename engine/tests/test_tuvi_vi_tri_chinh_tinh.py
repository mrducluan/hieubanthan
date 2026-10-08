# -*- coding: utf-8 -*-
"""SEO-H — vị trí 14 chính tinh suy từ cung của Tử Vi (an sao chính tinh, phần không phụ thuộc giờ/cục).

Golden: 60 lá `lasotuvi_60.json` (MIT, oracle độc lập với iztro) — với MỌI lá, biết chi của Tử Vi thì chi của
13 chính tinh còn lại phải khớp. Dùng cho trang kiến thức "sao X ở cung Y": sao đồng cung, sao xung chiếu.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.calc import tuvi_vi_tri as vt

_G = json.loads((Path(__file__).parents[1] / "fixtures/golden/lasotuvi_60.json").read_text("utf-8"))["cases"]
_TEN = {s.lower(): s for s in vt.CHINH_TINH}


def _vi_tri_golden(c: dict) -> dict[str, str]:
    ra = {}
    for v in c["sao"].values():
        if v["ten"].lower() in _TEN:
            ra[_TEN[v["ten"].lower()]] = v["chi"][0]
    return ra


def test_du_14_sao_trong_golden():
    assert all(len(_vi_tri_golden(c)) == 14 for c in _G)


@pytest.mark.parametrize("i", range(len(_G)))
def test_khop_lasotuvi(i):
    g = _vi_tri_golden(_G[i])
    assert vt.vi_tri_chinh_tinh(g["Tử Vi"]) == g


def test_du_12_vi_tri_tu_vi_trong_golden():
    # golden phủ đủ 12 vị trí Tử Vi → bảng 12 bố cục được đối chứng toàn bộ
    assert {_vi_tri_golden(c)["Tử Vi"] for c in _G} == set(vt.CHI)


def test_tinh_tay_tu_vi_ty():
    # Tính tay: Tử Vi ở Tý → nhóm Tử Vi lùi (Cơ Hợi, Dương Dậu, Vũ Thân, Đồng Mùi, Liêm Thìn);
    # Thiên Phủ đối xứng trục Dần–Thân → Thìn, nhóm Thiên Phủ tiến (Âm Tỵ … Sát Tuất, Phá Dần).
    v = vt.vi_tri_chinh_tinh("Tý")
    assert v["Thiên Phủ"] == "Thìn" and v["Thiên Cơ"] == "Hợi" and v["Liêm Trinh"] == "Thìn"
    assert v["Thất Sát"] == "Tuất" and v["Phá Quân"] == "Dần"


def test_cac_vi_tri_cua_mot_sao():
    # Mỗi chi một bố cục duy nhất cho một sao. Tính tay: Thất Sát ở Tý → Thiên Phủ Ngọ, Tử Vi Tuất →
    # Thất Sát đứng một mình, xung chiếu Vũ Khúc + Thiên Phủ (câu quen "Thất Sát Tý Ngọ, đối Vũ Phủ").
    bo = vt.bo_cuc_theo_sao("Thất Sát")
    assert set(bo) == set(vt.CHI)
    assert bo["Tý"]["dong_cung"] == [] and sorted(bo["Tý"]["xung_chieu"]) == ["Thiên Phủ", "Vũ Khúc"]
    for chi, o in bo.items():
        assert o["xung_chieu_chi"] == vt.CHI[(vt.CHI.index(chi) + 6) % 12]
        assert "Thất Sát" not in o["dong_cung"]


def test_tu_vi_dan_than_dong_cung_thien_phu():
    assert vt.bo_cuc_theo_sao("Tử Vi")["Dần"]["dong_cung"] == ["Thiên Phủ"]
    assert vt.bo_cuc_theo_sao("Tử Vi")["Thân"]["dong_cung"] == ["Thiên Phủ"]
