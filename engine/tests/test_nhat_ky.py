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


# ----------------------------------------------------------------- Huyền học (migration 0005)
def test_huyenhoc_loc_nam_gio():
    s = nhat_ky.loc_cau_hoi_huyenhoc("Tôi sinh năm 1988 lúc 9 giờ 30, nam, hợp hướng gì?")
    assert "1988" not in s and "9 giờ" not in s


def test_huyenhoc_khong_luu_tra_loi_khi_co_du_lieu_sinh():
    from app.hoidap import battu as bh, kinhdich as kd, phongthuy as ph  # noqa: PLC0415
    kq = bh.tra_loi("Tôi thân vượng hay thân nhược?", {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"},
                    dt.date(2026, 9, 30))
    bg = nhat_ky.ban_ghi_huyenhoc("battu", "Tôi thân vượng hay thân nhược?", kq, True)
    assert bg["cau_tra_loi"] is None and "Nhâm Ngọ" not in str(bg) and "1990" not in str(bg)
    # năm sinh nêu ngay trong câu → vẫn coi là dữ liệu sinh
    kq = ph.tra_loi("Tôi sinh năm 1988, nam, hợp hướng gì?", None, dt.date(2026, 9, 30))
    bg = nhat_ky.ban_ghi_huyenhoc("phongthuy", "Tôi sinh năm 1988, nam, hợp hướng gì?", kq, False)
    assert bg["cau_tra_loi"] is None and bg["co_du_lieu_sinh"] is True and "1988" not in str(bg)
    # Kinh Dịch không dùng ngày sinh → lưu câu trả lời
    kq = kd.tra_loi("Tôi có nên nghỉ việc không?", "tu_dong", gia_tri_hao=[7, 7, 8, 7, 7, 9])
    bg = nhat_ky.ban_ghi_huyenhoc("kinhdich", "Tôi có nên nghỉ việc không?", kq, False)
    assert bg["cau_tra_loi"] and bg["mo_dun"] == "kinhdich" and "user_id" not in bg
