# -*- coding: utf-8 -*-
"""HTT-1 — bộ hiện thực bề mặt nhẹ trong `kb/loi.py` (ý "MorphologicalASTAssembler" của tài liệu Drive, thu về hai ngôn
ngữ đang có): nối danh sách theo ngôn ngữ, mạo từ a/an, viết hoa đầu câu. Viết trước hàm."""
from __future__ import annotations

from app import ngon_ngu
from app.kb import loi


def test_danh_sach_theo_ngon_ngu():
    assert loi.danh_sach(["Tử vi"], ngon_ngu_="vi") == "Tử vi"
    assert loi.danh_sach(["Tử vi", "Bát tự"], ngon_ngu_="vi") == "Tử vi và Bát tự"
    assert loi.danh_sach(["Tử vi", "Bát tự", "Nhân tướng"], ngon_ngu_="vi") == "Tử vi, Bát tự và Nhân tướng"
    assert loi.danh_sach(["Tarot", "Numerology"], ngon_ngu_="en") == "Tarot and Numerology"
    assert loi.danh_sach(["A", "B", "C"], ngon_ngu_="en") == "A, B and C"
    assert loi.danh_sach([], ngon_ngu_="en") == "" and loi.danh_sach(["", None, " A "], ngon_ngu_="en") == "A"  # type: ignore[list-item]


def test_danh_sach_theo_ngu_canh_luot_goi():
    with ngon_ngu.dung("en"):
        assert loi.danh_sach(["work", "money"]) == "work and money"
    assert loi.danh_sach(["việc", "tiền"]) == "việc và tiền"


def test_mao_tu_tieng_anh():
    assert loi.mao_tu("obstacle", ngon_ngu_="en") == "an obstacle"
    assert loi.mao_tu("reversed card", ngon_ngu_="en") == "a reversed card"
    assert loi.mao_tu("hour", ngon_ngu_="en") == "an hour"
    assert loi.mao_tu("one-card draw", ngon_ngu_="en") == "a one-card draw"
    assert loi.mao_tu("university", ngon_ngu_="en") == "a university"
    assert loi.mao_tu("Empress", ngon_ngu_="en") == "an Empress"
    # Tiếng Việt không có mạo từ → nguyên văn.
    assert loi.mao_tu("lá bài", ngon_ngu_="vi") == "lá bài"
    assert loi.mao_tu("", ngon_ngu_="en") == ""


def test_hoa_dau_giu_nguyen_phan_con_lai():
    assert loi.hoa_dau("the Hermit asks for quiet") == "The Hermit asks for quiet"
    assert loi.hoa_dau("  năm 2027 nên đi chậm") == "Năm 2027 nên đi chậm"
    assert loi.hoa_dau("") == ""
