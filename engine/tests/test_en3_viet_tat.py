# -*- coding: utf-8 -*-
"""EN-3 (mục 1): mở viết tắt / teencode trong CÂU HỎI trước khi định tuyến (ck, vk, cv, sk, bh, ko, dc, j, mik, 27t…).
Chỉ mở từ đứng riêng; từ dễ nhầm nghĩa ("bn" bạn/bao nhiêu, "hn" hôm nay/Hà Nội, "hong" hồng/không, "a", "t", "s") KHÔNG
mở. `chuan_hoa` (dùng cho mã kiểm chứng, khoá KB) không đổi."""
import pytest

from app.luangiai import hoi


@pytest.mark.parametrize("vao, ra", [
    ("ck e sn 1990 cv có ổn ko", "chong em sn 1990 cong viec co on khong"),
    ("vk mik bh mới có bầu dc", "vo minh bao gio moi co bau duoc"),
    ("Em 27t lm văn phòng", "em 27 tuoi lam van phong"),
    ("năm nay sk của t thế nào", "nam nay suc khoe cua t the nao"),
    ("ny e ntn", "nguoi yeu em nhu the nao"),
    ("hnay có nên ký hđ k", "hom nay co nen ky hop dong khong"),
    ("mua xe j hợp", "mua xe gi hop"),
])
def test_mo_viet_tat(vao, ra):
    assert hoi.chuan_hoa_cau(vao) == ra


@pytest.mark.parametrize("cau", ["Màu hồng có hợp không", "Đi HN có nên không", "bn tuổi thì lấy chồng", "Ông A tuổi Tý"])
def test_khong_mo_tu_de_nham(cau):
    assert hoi.chuan_hoa_cau(cau) == hoi.chuan_hoa(cau)


def test_chuan_hoa_goc_khong_doi():
    assert hoi.chuan_hoa("ck ko") == "ck ko"
