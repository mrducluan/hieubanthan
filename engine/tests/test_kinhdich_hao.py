# -*- coding: utf-8 -*-
"""KB-1 — 384 hào từ Chu Dịch + quy tắc chọn lời đọc theo số hào động (Chu Hy, Dịch Học Khải Mông).
Test viết TRƯỚC phần RULES.
"""
from __future__ import annotations

import pytest

from app.hoidap import kinhdich as hd
from app.kb import kinhdich_kb as kb


def test_du_64_que_384_hao():
    tong = 0
    for so in range(1, 65):
        q = kb.que_van(so)
        assert q and q["que_tu"]["han"] and q["que_tu"]["dich"] and q["dai_tuong"]["dich"]
        assert [h["vi_tri"] for h in q["hao"]] == [1, 2, 3, 4, 5, 6]
        for h in q["hao"]:
            assert h["han"] and h["dich"] and h["y"] and h["ten"]
        tong += len(q["hao"])
    assert tong == 384


def test_nguyen_van_mau():
    assert kb.hao(1, 1)["han"] == "潛龍，勿用。"
    assert kb.hao(1, 1)["ten"] == "Sơ Cửu"
    assert kb.hao(2, 6)["ten"] == "Thượng Lục"
    assert kb.hao(15, 3)["han"].startswith("勞謙")
    assert kb.hao(64, 6)["ten"] == "Thượng Cửu"
    assert kb.que_van(1)["dung"]["han"].startswith("用九")
    assert kb.que_van(2)["dung"]["han"].startswith("用六")
    assert "dung" not in kb.que_van(3)


def test_kb_hao_ngoai_khoang():
    assert kb.hao(65, 1) is None and kb.hao(1, 7) is None


# Quy tắc Chu Hy: (số quẻ bản, số quẻ biến, hào động) → lời cần đọc
@pytest.mark.parametrize("ban,bien,dong,ky_vong", [
    (11, None, [], [("que_tu", 11, None, True)]),
    (11, 46, [3], [("hao", 11, 3, True)]),
    (11, 2, [2, 5], [("hao", 11, 2, False), ("hao", 11, 5, True)]),
    (11, 16, [1, 2, 3], [("que_tu", 11, None, True), ("que_tu", 16, None, False)]),
    (11, 20, [1, 2, 3, 4], [("hao", 20, 5, True), ("hao", 20, 6, False)]),
    (11, 23, [1, 2, 3, 4, 5], [("hao", 23, 6, True)]),
    (1, 2, [1, 2, 3, 4, 5, 6], [("dung", 1, None, True)]),
    (2, 1, [1, 2, 3, 4, 5, 6], [("dung", 2, None, True)]),
    (11, 12, [1, 2, 3, 4, 5, 6], [("que_tu", 12, None, True)]),
])
def test_chon_loi_doc(ban, bien, dong, ky_vong):
    kq = hd.chon_loi_doc(ban, bien, dong)
    assert [(x["loai"], x["que"], x["vi_tri"], x["chu"]) for x in kq] == ky_vong


def test_tra_loi_co_hao_tu_khi_mot_hao_dong():
    # gieo tay: hào 1 là 9 (dương động), còn lại 7 (dương tĩnh) → Càn, hào 1 động
    kq = hd.tra_loi("Có nên nhận lời làm quản lý không?", "nghia_ly", gia_tri_hao=[9, 7, 7, 7, 7, 7])
    assert "潛龍" in kq["cau_tra_loi"] and "Sơ Cửu" in kq["cau_tra_loi"]
