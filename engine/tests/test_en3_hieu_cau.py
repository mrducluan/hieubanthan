# -*- coding: utf-8 -*-
"""EN-3 (mục 1–4) — module "Hiểu câu hỏi" dùng chung 5 mảng (RULES, tất định, không LLM): kiểu câu, thời gian được hỏi,
người thứ hai. Câu viết riêng cho test."""
import datetime as dt

import pytest

from app.hoidap import hieu_cau as hc
from app.luangiai.hoi import chuan_hoa_cau as ch

XEM = dt.date(2026, 11, 1)


@pytest.mark.parametrize("cau", [
    "Đại vận là gì", "Sinh Khí và Diên Niên khác gì nhau", "Số sứ mệnh được tính như thế nào?",
    "Hào động đọc ra sao", "Lưu niên với tiểu hạn khác nhau chỗ nào", "Kinh Dịch có thật sự bói được không",
])
def test_kien_thuc(cau):
    assert hc.kieu(ch(cau)) == "kien_thuc", cau


@pytest.mark.parametrize("cau", [
    "Nhật chủ của tôi là gì", "Số sứ mệnh của em là mấy", "Tôi có Kiếp Tài nhiều, có sao không",
    "Năm sau tôi có nên đổi việc không", "Hướng nhà tôi là hướng gì thì hợp",
])
def test_khong_phai_kien_thuc(cau):
    assert hc.kieu(ch(cau)) != "kien_thuc", cau


@pytest.mark.parametrize("cau, ra", [
    ("Năm 2027 hay 2028 thì nên cưới", [{"nam": 2027}, {"nam": 2028}]),
    ("năm sau có nên mua nhà", [{"nam": 2027, "tuong_doi": "nam_sau"}]),
    ("Tháng 3 năm sau ký hợp đồng được không", [{"nam": 2027, "thang": 3}]),
    ("tháng tới có nên đi xa", [{"nam": 2026, "thang": 12}]),
    ("Nên mở cửa hàng tháng 2 hay tháng 3 năm sau", [{"nam": 2027, "thang": 2}, {"nam": 2027, "thang": 3}]),
    ("Tôi sinh năm 1990, tính cách thế nào", []),
])
def test_thoi_gian(cau, ra):
    assert hc.thoi_gian(ch(cau), XEM) == ra, cau


def test_so_sanh():
    assert hc.kieu(ch("Năm 2027 hay 2028 năm nào tốt hơn để khởi nghiệp")) == "so_sanh"
    assert hc.kieu(ch("Nên học tiếng Nhật hay tiếng Hàn")) == "so_sanh"


@pytest.mark.parametrize("cau, qh, ns", [
    ("ck sn 1989 vk sn 1993, nhà hướng Tây theo ai", "vo_chong", 1989),
    ("Chồng tôi sinh năm 1988 giờ Thìn, xem giúp", "vo_chong", 1988),
    ("Con trai tôi sinh 2018 có hợp học hành không", "con", 2018),
    ("Tôi với sếp tuổi Dần có hợp không", "sep", None),
])
def test_nguoi_thu_hai(cau, qh, ns):
    n = hc.nguoi_thu_hai(ch(cau))
    assert n and n["quan_he"] == qh and n.get("nam_sinh") == ns, (cau, n)


def test_hai_vo_chong_hai_nam_sinh():
    n = hc.nguoi_thu_hai(ch("ck sn 1989 vk sn 1993, nhà hướng Tây theo ai"))
    assert n["cac_nam_sinh"] == [1989, 1993]


def test_khong_co_nguoi_thu_hai():
    assert hc.nguoi_thu_hai(ch("Tôi sinh năm 1990 có hợp nghề kế toán không")) is None


@pytest.mark.parametrize("mo_dun, cau, ten", [
    ("tuvi", "Lưu niên với tiểu hạn khác nhau chỗ nào", "Lưu niên"),
    ("battu", "Đại vận là gì vậy", "Đại vận"),
    ("phongthuy", "Sinh Khí và Diên Niên khác gì nhau", "Sinh Khí"),
    ("kinhdich", "Hào động là gì, đọc ra sao", "Hào động"),
    ("thanso", "Số sứ mệnh được tính như thế nào", "Số sứ mệnh"),
])
def test_tra_loi_kien_thuc_bang_tu_dien(mo_dun, cau, ten):
    """Câu kiến thức → nhãn ky_thuat, lời trả lời mở bằng mục từ điển (không đọc lá số / không gieo quẻ)."""
    from tests.test_en3_hieu_cau_chay import chay
    kq = chay(mo_dun, cau)
    pl = kq["phan_loai"]
    lab = pl.get("linh_vuc") if mo_dun == "thanso" else pl.get("loai")
    assert lab == "ky_thuat", (cau, lab)
    assert ten in " ".join(kq["cau_tra_loi"].split("\n\n")[:2]), kq["cau_tra_loi"][:160]   # mục kho riêng hoặc từ điển


@pytest.mark.parametrize("cau, ra", [
    ("Con gái tôi sinh ngày 5/2/2015, bé có năng khiếu gì", []),
    ("Bố mẹ tôi sinh 1960 và 1963, nhà quay hướng nào", []),
    ("Căn nhà rao bán ba tháng nay vẫn chưa ai mua", []),
    ("Ba tháng tới công việc có biến động không", [{"nam": 2026, "thang": 12}, {"nam": 2027, "thang": 1},
                                                 {"nam": 2027, "thang": 2}]),
    ("Năm ngoái tôi lỗ nặng, năm nay có gỡ được không", [{"nam": 2026, "tuong_doi": "nam_nay"}]),
])
def test_thoi_gian_khong_nham_nam_sinh(cau, ra):
    assert hc.thoi_gian(ch(cau), XEM) == ra, (cau, hc.thoi_gian(ch(cau), XEM))


def test_nam_sinh_roi_nam_hoi():
    assert hc.thoi_gian(ch("Tôi sinh 1990, năm 2027 có nên cưới không"), XEM) == [{"nam": 2027}]
    assert hc.thoi_gian(ch("Tôi sinh ngày 3/4/1992, tháng 5 năm 2027 có nên đổi việc"), XEM) == [{"nam": 2027, "thang": 5}]


@pytest.mark.parametrize("cau, ra", [
    ("năm 1975 sinh, năm nay tôi ra sao", [{"nam": 2026, "tuong_doi": "nam_nay"}]),
    ("vợ tôi 1993 năm 2028 làm nhà được không", [{"nam": 2028}]),
    ("tháng 3 năm 2027 hay tháng 5 năm 2028", [{"nam": 2027, "thang": 3}, {"nam": 2028, "thang": 5}]),
    ("năm nay hay năm sau nên cưới", [{"nam": 2026, "tuong_doi": "nam_nay"}, {"nam": 2027, "tuong_doi": "nam_sau"}]),
    ("ba năm tới công việc của tôi thế nào", [{"nam": 2026}, {"nam": 2027}, {"nam": 2028}]),
    ("2 năm nữa tôi có nên mua nhà", [{"nam": 2028}]),
    ("năm sau sinh con có hợp không", [{"nam": 2027, "tuong_doi": "nam_sau"}]),
    ("năm sau dự định mua nhà", [{"nam": 2027, "tuong_doi": "nam_sau"}]),
    ("Tháng 10 vừa rồi tôi mất việc, tháng tới có khá hơn", [{"nam": 2026, "thang": 12}]),
    ("tháng Giêng âm lịch nên làm gì", []),
    ("tháng 2 âm có nên khai trương", []),
])
def test_thoi_gian_review(cau, ra):
    assert hc.thoi_gian(ch(cau), XEM) == ra, (cau, hc.thoi_gian(ch(cau), XEM))


def test_nguoi_thu_hai_khong_nham_nam_du_dinh():
    n = hc.nguoi_thu_hai(ch("Chồng tôi định chuyển nhà năm 2027"))
    assert n and n["quan_he"] == "vo_chong" and "nam_sinh" not in n
