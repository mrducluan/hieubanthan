# -*- coding: utf-8 -*-
"""EN-ALL GĐ 2 — slug tiếng Anh của trang kiến thức: đủ, duy nhất trong từng loại, chỉ a–z 0–9 -, ổn định (golden),
không phụ thuộc ngôn ngữ lượt gọi; bản Anh tìm được trang bằng cả slug Anh lẫn slug Việt; bản Việt không mang `slug_en`."""
import json
import re
from pathlib import Path

import pytest

from app import ngon_ngu
from app.kb import slug_en as se
from app.kb import trang as t

GOLDEN = Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "slug_en.json"


def _bang() -> dict:
    return {l: se.bang(l) for l in t.LOAI}


def test_du_va_duy_nhat():
    for loai, b in _bang().items():
        assert b, loai
        v = list(b.values())
        assert len(set(v)) == len(v), (loai, sorted({x for x in v if v.count(x) > 1}))
        for s in v:
            assert re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", s), (loai, s)
            assert len(s) <= 70, (loai, s)


def test_on_dinh_theo_golden():
    g = {k: v for k, v in json.loads(GOLDEN.read_text(encoding="utf-8")).items() if not k.startswith("_")}
    assert _bang() == g, "slug tiếng Anh đã đổi — slug đã công bố cần 308; sinh lại golden chỉ khi CỐ Ý"


def test_khong_phu_thuoc_ngon_ngu():
    se._NHO.clear()
    with ngon_ngu.dung("en"):
        a = _bang()
    se._NHO.clear()
    assert a == _bang()


@pytest.mark.parametrize("loai", ["la_bai", "sao_cung", "que", "dau_hieu", "so"])
def test_tim_trang_bang_ca_hai_slug(loai):
    vi, en = next(iter(se.bang(loai).items()))
    with ngon_ngu.dung("en"):
        a, b = t.lay(loai, en), t.lay(loai, vi)
    assert a and b and a["slug"] == b["slug"] == vi and a["slug_en"] == en
    assert t.lay(loai, vi) and "slug_en" not in t.lay(loai, vi)
    if en != vi:
        assert t.lay(loai, en) is None      # bản Việt không nhận slug Anh


def test_muc_luc_ban_anh_co_slug_en():
    with ngon_ngu.dung("en"):
        ds = t.danh_sach()
    assert all(x["slug_en"] == se.cua(x["loai"], x["slug"]) for x in ds)
    assert all("slug_en" not in x for x in t.danh_sach())
