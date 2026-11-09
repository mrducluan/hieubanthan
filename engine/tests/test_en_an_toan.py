# -*- coding: utf-8 -*-
"""QTE-2 (bản /en) — MỘT bộ chặn an toàn nay nhận cả câu TIẾNG ANH: khủng hoảng → lời hỗ trợ, triệu chứng cấp → đi khám
ngay, chẩn đoán / sống chết / bỏ thuốc / xổ số / tuyển người → từ chối; câu thường (kể cả có chữ dễ nhầm) không bị chặn.
Viết TRƯỚC phần tiếng Anh của `luangiai/an_toan.py`."""
from __future__ import annotations

import pytest

from app.luangiai import an_toan as at

KHUNG_HOANG = [
    "I want to kill myself", "Sometimes I just want to die", "I don't want to wake up anymore", "I'm a burden to everyone",
    "I've been thinking about ending it all", "My husband hits me when he drinks", "I wish I were dead",
    "I am being abused by my partner", "Everyone would be better off without me", "I keep hurting myself",
]
TU_CHOI = {
    "Will I get cancer this year?": "suc_khoe_the_chat", "Should I stop taking my medication?": "suc_khoe_the_chat",
    "When will I die?": "du_doan_cu_the", "How long do I live?": "du_doan_cu_the",
    "Give me the lottery numbers for tonight": "may_rui", "Which numbers should I play this week?": "may_rui",
    "Will I win the lottery?": "may_rui", "Which candidate should I hire?": "ngoai_pham_vi",
    "Is my baby healthy?": "suc_khoe_the_chat", "Will I get pregnant this year?": "suc_khoe_the_chat",
}
CAP_CUU = ["I have chest pain and can't breathe", "I fainted twice today", "I think I overdosed"]
BINH_THUONG = [
    "Should I change jobs this year?", "Is this the right time to start my business?", "Will my relationship last?",
    "What does the Tower card mean?", "What is my life path number?", "I work at a cancer research hospital, is this job right for me?",
    "My mother is a doctor, should I follow her path?", "The die is cast, what now?", "I want to live abroad next year",
    "How do I stop procrastinating?", "Is my friend trustworthy?", "I feel stuck in my career",
    "Should I take the lottery job offer or stay?",   # "lottery" không đi với numbers / win
]


@pytest.mark.parametrize("cau", KHUNG_HOANG)
def test_khung_hoang_en(cau):
    assert at.khung_hoang(cau), cau


@pytest.mark.parametrize("cau,loai", list(TU_CHOI.items()))
def test_tu_choi_en(cau, loai):
    assert at.tu_choi(cau) == loai, cau


@pytest.mark.parametrize("cau", CAP_CUU)
def test_cap_cuu_en(cau):
    assert at.cap_cuu(cau) and at.nhom_suc_khoe(cau) == "cap_cuu", cau


@pytest.mark.parametrize("cau", BINH_THUONG)
def test_binh_thuong_khong_chan(cau):
    assert not at.khung_hoang(cau), cau
    assert at.tu_choi(cau) is None, (cau, at.tu_choi(cau))


def test_nguoi_than_en():
    assert at.nguoi_than("My mother has cancer, will she recover?")
    assert at.tu_choi("My mother has cancer, will she recover?") == "suc_khoe_the_chat"


def test_khong_anh_huong_tieng_viet():
    assert at.khung_hoang("Tôi muốn chết đi cho xong") and not at.khung_hoang("Tôi muốn đổi việc năm nay")
    assert at.tu_choi("Tôi có bị ung thư không") == "suc_khoe_the_chat" and at.tu_choi("Năm nay tôi nên làm gì") is None
