# -*- coding: utf-8 -*-
"""EN-3d — đoạn mở đầu gọi đúng tên điều được hỏi (nhãn rõ từ danh mục cố định) + câu kiến thức Kinh Dịch có lời."""
from __future__ import annotations

import datetime as dt

import pytest

from app.hoidap import kinhdich, mo_dau
from app.luangiai.hoi import chuan_hoa_cau

GIA = [7, 8, 9, 7, 6, 8]
LUC = dt.datetime(2026, 11, 1, 9, 0)


def _kd(q: str) -> str:
    return kinhdich.tra_loi(q, "tu_dong", gia_tri_hao=GIA, thoi_diem=LUC, cach_ra_que="gieo_tay")["cau_tra_loi"]


@pytest.mark.parametrize("q,nhan", [
    ("Lần này đi xin visa Mỹ có được không?", "chuyện xin visa"),
    ("Tôi nên ở lại công ty hay nhảy việc?", "chuyện ở lại hay nhảy việc"),
    ("Mảnh đất tôi định mua có lời không?", "chuyện mua đất"),
    ("Có nên rút cọc căn hộ không?", "chuyện tiền cọc mua nhà"),
])
def test_nhan_ro(q, nhan):
    d = mo_dau.dieu_hoi(chuan_hoa_cau(q), q)
    assert d and d["nhan_ro"] == nhan


def test_nhan_ro_khong_doi_ma_va_chuong():
    """Nhãn rõ chỉ đổi chữ hiển thị — mã và chương (định tuyến) giữ như cũ."""
    d = mo_dau.dieu_hoi(chuan_hoa_cau("Lần này đi xin visa có được không?"), None)
    assert d["ma"] == "kien_tung" and mo_dau.chuong_cua(d) is None


def test_hai_viec_khac_mang_neu_ca_hai():
    q = "mk có nên vay ngân hàng mở shop ko"
    d = mo_dau.dieu_hoi(chuan_hoa_cau(q), q)
    assert "mở quán" in d["nhan_ro"] and "vay ngân hàng" in d["nhan_ro"]


def test_que_mo_dau_goi_ten_dieu_hoi():
    assert _kd("Lần này đi xin visa Mỹ có được không?").startswith("Về chuyện xin visa")


def test_khong_chep_chu_nguoi_dung():
    """Nhãn luôn lấy từ danh mục: câu lạ không sinh nhãn chứa chữ người dùng."""
    q = "Có nên mở quán bún chả Hàng Quạt ở Sài Gòn không?"
    van = _kd(q).split("\n\n")[0]
    assert "Hàng Quạt" not in van and "bún chả" not in van


def test_dong_cam_goi_ten():
    q = "Tôi có nên ly hôn không?"
    van = _kd(q)
    assert van.startswith("Chuyện ly hôn bạn đang trải qua rất nặng lòng")
    assert "Quẻ" not in van.split("\n\n")[0]          # vẫn không nêu mức quẻ ở đoạn đồng cảm


@pytest.mark.parametrize("q,co", [("Dụng thần trong lục hào là gì?", "Dụng thần là gì?"),
                                   ("Quẻ biến khác quẻ hỗ thế nào?", "Quẻ hỗ là gì?")])
def test_kien_thuc_kinh_dich_co_loi(q, co):
    """Trước EN-3d: nhánh thuật ngữ trả lời rỗng (chỉ còn câu miễn trừ)."""
    van = _kd(q)
    assert co in van and len(van.split("\n\n")) >= 2
