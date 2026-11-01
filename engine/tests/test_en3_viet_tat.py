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
    ("hnay có nên ký hđ k", "hom nay co nen ky hd khong"),      # "hd" mơ hồ (hợp đồng / hướng dẫn) — giữ nguyên
    ("mua xe j hợp", "mua xe gi hop"),
])
def test_mo_viet_tat(vao, ra):
    assert hoi.chuan_hoa_cau(vao) == ra


@pytest.mark.parametrize("cau", ["Màu hồng có hợp không", "Đi HN có nên không", "bn tuổi thì lấy chồng", "Ông A tuổi Tý"])
def test_khong_mo_tu_de_nham(cau):
    assert hoi.chuan_hoa_cau(cau) == hoi.chuan_hoa(cau)


def test_chuan_hoa_goc_khong_doi():
    assert hoi.chuan_hoa("ck ko") == "ck ko"


@pytest.mark.parametrize("cau, ra", [
    ("Bao giờ tôi hết ế", "bao gio toi het e"),
    ("Mình bị ế lâu rồi", "minh bi e lau roi"),
    ("Túi xách màu gì hợp mệnh", "tui xach mau gi hop menh"),
    ("tui sn 1995", "toi sn 1995"),
    ("e sn 1995", "em sn 1995"),
])
def test_chu_co_dau_khong_mo(cau, ra):
    """"ế", "túi" (có dấu) không bị mở thành "em", "tôi" — chỉ mở khi gõ đúng chữ không dấu."""
    assert hoi.chuan_hoa_cau(cau) == ra


@pytest.mark.parametrize("cau", ["toi e lau vay co phai do so khong", "bao gio minh het e", "con gai toi bi e mai"])
def test_e_khong_dau_la_e(cau):
    """"e" gõ không dấu sau "tôi / hết / bị…" hoặc trước "lâu / mãi…" là "ế", không mở thành "em"."""
    assert " em " not in f" {hoi.chuan_hoa_cau(cau)} ", hoi.chuan_hoa_cau(cau)


def test_e_dau_cau_van_la_em():
    assert hoi.chuan_hoa_cau("e sn 1998 hoi ve cv") == "em sn 1998 hoi ve cong viec"


@pytest.mark.parametrize("cau", ["Nghe K-pop có hợp mệnh không", "Uống vitamin K/E", "Làm E-commerce có hợp không",
                                 "Mua cái áo 15 k", "ck tiền cho bạn có nên không", "Ms Lan hỏi", "hd cách tính",
                                 "Bit Coin có nên mua", "kh của tôi"])
def test_khong_mo_tu_nham_review(cau):
    t = hoi.chuan_hoa_cau(cau)
    for x in ("khong-pop", "khong/em", "em-commerce", "15 khong", "chong tien", "moi lan", "hop dong", "biet coin",
              "khong cua"):
        assert x not in t, (cau, t)


@pytest.mark.parametrize("cau, ra", [("ck 1985 vk 1991 nen chon huong nao", "chong 1985 vo 1991 nen chon huong nao"),
                                     ("ny 1995", "nguoi yeu 1995")])
def test_mo_truoc_con_so(cau, ra):
    assert hoi.chuan_hoa_cau(cau) == ra


@pytest.mark.parametrize("cau", ["vitamin K", "Uống vitamin E mỗi ngày"])
def test_vitamin(cau):
    t = hoi.chuan_hoa_cau(cau)
    assert "vitamin khong" not in t and "vitamin em" not in t, t
