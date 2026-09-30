# -*- coding: utf-8 -*-
"""Nhật ký hỏi đáp: không được lọt ngày sinh, SĐT, email, họ tên."""
from __future__ import annotations

import datetime as dt

import pytest

from app import nhat_ky
from app.narrative import hoi_van


@pytest.mark.parametrize("vao,khong_con", [
    ("Anh ấy sinh 8/7/1993, tính cách thế nào?", "1993"),
    ("Số của tôi 0912345678 có hợp không?", "0912345678"),
    ("Mail tôi a.b@gmail.com, xem giúp", "gmail"),
    ("Tên con tôi là Nguyễn Minh An có tốt không?", "Minh An"),
])
def test_loc_thong_tin_ca_nhan(vao, khong_con):
    assert khong_con not in nhat_ky.loc_cau_hoi(vao)


def test_ban_ghi_khong_co_ho_ten_ngay_sinh():
    nguoi = {"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988}
    kq = hoi_van.tra_loi("Tôi hợp với nghề gì?", nguoi, None, dt.date(2026, 9, 30), dung_llm=False)
    bg = nhat_ky.ban_ghi("Tôi hợp với nghề gì?", kq)
    s = str(bg)
    assert "Luân" not in s and "1988" not in s and "user_id" not in s


def test_tat_mac_dinh(monkeypatch):
    monkeypatch.delenv("NHAT_KY_HOI", raising=False)
    assert nhat_ky.bat() is False
