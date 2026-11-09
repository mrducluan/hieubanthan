# -*- coding: utf-8 -*-
"""QTE-2 — bảng tên tiếng Anh `kb/data/ten_en.json` + `kb/ten.py`: phủ ĐỦ mọi tên tiếng Việt engine có thể trả (iztro
vi-VN liệt kê bằng `ziwei/_generate_ten_vi.mjs` → `fixtures/golden/iztro_ten_vi.json`; can chi, thập thần, quái, du niên,
hướng, 64 quẻ từ hằng số CALC), tên Anh thuần ASCII, không trùng trong một nhóm; tiếng Việt trả nguyên chữ."""
from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

from app import ngon_ngu
from app.calc import battu_mo_rong, can_chi, huyen_khong, kinhdich_vendor, phongthuy
from app.kb import ten

GOLD = json.loads((Path(__file__).resolve().parents[1] / "fixtures" / "golden" / "iztro_ten_vi.json").read_text(encoding="utf-8"))
BANG = json.loads((Path(__file__).resolve().parents[1] / "app" / "kb" / "data" / "ten_en.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("nhom_gold,nhom", [("chinh_tinh", "chinh_tinh"), ("phu_tinh", "phu_tinh"), ("tap_dieu", "tap_dieu"),
                                             ("truong_sinh", "truong_sinh"), ("bac_si", "sao"), ("tuong_tien", "sao"), ("tue_tien", "sao"),
                                             ("cung", "cung"), ("do_sang", "do_sang"), ("hoa", "hoa"), ("cuc", "cuc")])
def test_phu_du_ten_iztro(nhom_gold, nhom):
    thieu = [t for t in GOLD[nhom_gold] if ten.muc(nhom, t) is None]
    assert not thieu, thieu


def test_sao_luu_iztro():
    with ngon_ngu.dung("en"):
        for t in GOLD["sao_luu"]:
            en = ten.sao_luu(t)
            assert en.isascii() and en != t, (t, en)
        assert ten.sao_luu("Lưu Lộc") == "Annual Lu Cun" and ten.sao_luu("Vận Mã") == "Decade Tian Ma"
    assert ten.sao_luu("Lưu Lộc") == "Lưu Lộc"


def test_phu_du_hang_so_calc():
    assert all(ten.muc("can", c) for c in can_chi.CAN) and all(ten.muc("chi", c) for c in can_chi.CHI)
    assert all(ten.muc("hanh", h) for h in can_chi.HANH)
    assert all(ten.muc("truong_sinh", t) for t in battu_mo_rong.TRUONG_SINH)
    for nc in can_chi.CAN:
        for c in can_chi.CAN:
            from app.calc import battu
            assert ten.muc("thap_than", battu.thap_than(nc, c)), (nc, c)
    assert all(ten.muc("quai", q) for q in phongthuy.QUAI) and all(ten.muc("huong", h) for h in phongthuy.HUONG)
    assert all(ten.muc("du_nien", d) for d in phongthuy.CAT) and all(ten.muc("du_nien", d) for d, _ in phongthuy._LAT)  # noqa: SLF001
    assert all(ten.muc("sao_bay", s) for s in huyen_khong.SAO.values())
    assert all(ten.muc("que", n) for n in range(1, 65)) and len(kinhdich_vendor.TEN) == 64


def test_ten_anh_ascii_khong_trung_trong_nhom():
    for mang, nhoms in BANG.items():
        if not isinstance(nhoms, dict):
            continue
        for nhom, bang in nhoms.items():
            if not isinstance(bang, dict) or nhom == "sao_luu_tien_to":
                continue
            vals = []
            for vi, m in bang.items():
                assert isinstance(m, dict), (mang, nhom, vi)
                x = m.get("en") or m.get("pinyin")
                assert x and x.isascii() and not re.search(r"[đĐ]", x), (mang, nhom, vi, x)
                vals.append(x)
            assert len(vals) == len(set(vals)), (mang, nhom, [v for v in vals if vals.count(v) > 1])


def test_tra_ten_theo_ngon_ngu():
    assert ten.ten("sao", "Tử Vi") == "Tử Vi" and ten.ten("que", 1) == "1"
    with ngon_ngu.dung("en"):
        assert ten.ten("sao", "Tử Vi") == "Zi Wei" and ten.ten("cung", "Mệnh") == "Life Palace"
        assert ten.ten("can", "Giáp") == "Jia" and ten.nghia("can", "Giáp") == "Yang Wood"
        assert ten.ten("que", 1) == "Qian" and ten.ten("que", "64") == "Wei Ji"
        assert ten.ten("thap_than", "Chính Quan") == "Direct Officer"
        assert ten.ten("sao", "Tên Lạ") == "Tên Lạ"           # chưa có → chữ Việt, không bịa
    with ngon_ngu.dung("zh-hant"):
        assert ten.ten("sao", "Tử Vi") == "紫微" and ten.ten("que", 2) == "坤"
    assert ten.ten("sao", "Tử Vi", "en") == "Zi Wei"
