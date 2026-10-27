# -*- coding: utf-8 -*-
"""Trục 2 UX (2026-10-26) — nguyên liệu cho "Lá bài đầu ngày" trên /hom-nay. Viết TRƯỚC hàm.

Lá bài không được lặp điều thẻ ngay phía trên đã in (câu tự soi, nghĩa ngày cá nhân), nên engine trả thêm hai thứ rút
từ KB có sẵn mà trang chưa hiện:
  · `viec_nho` — một "việc nhỏ nên thử" (cach_lam của MỘT ý định trong KB thanso_hom_nay theo số ngày cá nhân), chọn tất
    định theo (ngày sinh, ngày xem) — KHÔNG đổi theo ý định người dùng chọn trong ngày (lá đã lật giữ nguyên);
  · `cau_hoi_them` — câu thứ tư của kho "câu hỏi nổi bật" (trang chỉ hiện ba câu), hoặc None khi kho ≤ 3 câu.
Không câu mới nào được viết ở đây: mọi chữ đều là chuỗi KB có sẵn.
"""
import datetime as dt

from app.kb import thanso_v2 as kb
from app.luangiai import hom_nay

SINH = (17, 5, 1990)
NGAY = dt.date(2026, 10, 26)


def test_viec_nho_la_chuoi_kb_co_san():
    kq = hom_nay.the_hom_nay(*SINH, NGAY)
    v = kq["viec_nho"]
    so = kq["ngay_ca_nhan"]["so"]
    m = kb.y_dinh_theo_ngay(so, v["ma"])
    assert m is not None
    assert v["cach_lam"] == m["cach_lam"] and v["nhan"] == m["nhan"] and v["tu_soi"] == m["tu_soi"]
    assert v["ten"] == kb.y_dinh_hom_nay()[v["ma"]]["ten"]
    # Không trùng điều thẻ đã in
    assert v["cach_lam"] not in (kq["ngay_ca_nhan"]["tu_soi"], kq["ngay_ca_nhan"]["nghia"])


def test_viec_nho_tat_dinh_khong_doi_theo_y_dinh_da_chon():
    a = hom_nay.the_hom_nay(*SINH, NGAY)["viec_nho"]
    b = hom_nay.the_hom_nay(*SINH, NGAY)["viec_nho"]
    c = hom_nay.the_hom_nay(*SINH, NGAY, y_dinh=["cong_viec", "tinh_cam", "hoc_tap"])["viec_nho"]
    d = hom_nay.the_hom_nay(*SINH, NGAY, du_dinh="chiều nay đi phỏng vấn")["viec_nho"]
    assert a == b == c == d


def test_viec_nho_xoay_theo_ngay_va_nguoi():
    ma_ngay = {hom_nay.the_hom_nay(*SINH, NGAY + dt.timedelta(days=i))["viec_nho"]["ma"] for i in range(11)}
    assert len(ma_ngay) >= 6          # 11 ngày liền không lặp mãi một ý định
    khac_nguoi = {hom_nay.the_hom_nay(d, 5, 1990, NGAY)["viec_nho"]["ma"] for d in range(1, 12)}
    assert len(khac_nguoi) >= 6


def test_cau_hoi_them_khong_trung_ba_cau_noi_bat():
    for i in range(9):
        ngay = NGAY + dt.timedelta(days=i)
        kq = hom_nay.the_hom_nay(*SINH, ngay)
        kho = kb.cau_hoi_noi_bat(kq["ngay_ca_nhan"]["so"])
        if len(kho) > 3:
            assert kq["cau_hoi_them"] in kho
            assert kq["cau_hoi_them"] not in kq["cau_hoi_noi_bat"]
            assert kq["cau_hoi_them"] != kq["ngay_ca_nhan"]["tu_soi"]
        else:
            assert kq["cau_hoi_them"] is None
