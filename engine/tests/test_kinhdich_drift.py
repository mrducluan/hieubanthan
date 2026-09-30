# -*- coding: utf-8 -*-
"""Chống trôi: bản vendor trong engine phải cho kết quả Y HỆT bản gốc
source-skills/kinh-dich/gieoque.py trên TOÀN BỘ 4096 tổ hợp giá trị hào.

Bản gốc nằm ngay trong repo nên test này chạy được ở cả CI/cloud.
"""
from __future__ import annotations

import importlib.util
import itertools
from pathlib import Path

import pytest

from app.calc import kinhdich

BAN_GOC = Path(__file__).parents[2] / "source-skills" / "kinh-dich" / "gieoque.py"


def _nap_ban_goc():
    spec = importlib.util.spec_from_file_location("gieoque_goc", BAN_GOC)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.mark.skipif(not BAN_GOC.exists(), reason="khong co ban goc")
def test_vendor_khop_ban_goc_4096_to_hop() -> None:
    g = _nap_ban_goc()
    n = 0
    for vals in itertools.product((6, 7, 8, 9), repeat=6):
        out = kinhdich.khoi_que(list(vals))
        ban = tuple(1 if v in (7, 9) else 0 for v in vals)
        dong = [i + 1 for i, v in enumerate(vals) if v in (6, 9)]
        bien = tuple((1 - b) if (i + 1) in dong else b for i, b in enumerate(ban))
        assert out["quai_ban"] == g.info(ban)
        assert out["hao_dong"] == dong
        assert out["quai_bien"] == (g.info(bien) if dong else None)
        assert out["quai_ho"] == g.info(g.ho_quai(ban))
        assert out["quai_thac"] == g.info(g.thac_quai(ban))
        assert out["quai_tong"] == g.info(g.tong_quai(ban))
        assert out["quy_tac_doc"] == g.quy_tac_doc(len(dong), ban, bien, dong)
        n += 1
    assert n == 4096


@pytest.mark.skipif(not BAN_GOC.exists(), reason="khong co ban goc")
def test_bang_hang_so_khop_ban_goc() -> None:
    from app.calc import kinhdich_vendor as v
    g = _nap_ban_goc()
    for ten in ("TRI", "TRI_NGU_HANH", "KW", "TEN", "NAPGIAP", "CHI_NH", "SINH", "KHAC",
                "BAT_CUNG"):
        assert getattr(v, ten) == getattr(g, ten), ten
