# -*- coding: utf-8 -*-
"""QA-RV — bộ câu hỏi chuyên gia viết SAU router (holdout), kiểm NỘI DUNG câu trả lời khớp dữ liệu đã tính.

Kho 2.000+ câu cũ chỉ chấm "có căn cứ / đúng lĩnh vực" và đã bão hoà; bộ này bắt các lỗi kiểu
"hỏi Hoá Kỵ ở đâu mà trả lời về cung Mệnh", "hỏi quẻ Ký Tế mà gieo ra quẻ khác".
Ca mẫu: nam 17/05/1990 giờ Ngọ (Canh Ngọ; Mệnh Hợi Cự Môn, Thân cư Mệnh) · Thần số: Nguyễn Đức Luân 24/10/1988.
Các giá trị kỳ vọng đã đối chiếu tay (tứ hoá Canh, Tuần/Triệt Canh Ngọ, cung phi Khảm/Đoài, ngày cá nhân).
"""
import datetime as dt

import pytest

from app.hoidap import battu as bt, kinhdich as kd, phongthuy as pt, tuvi as tv
from app.narrative import hoi_van

NX = dt.date(2026, 10, 7)
SINH_TV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
SINH_BT = {"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"}
SINH_PT = {"nam": 1990, "gioi_tinh": "nam", "ngay": dt.date(1990, 5, 17)}
NGUOI = {"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988}
HAO = [7, 7, 8, 7, 7, 9]          # nếu engine gieo nhầm sẽ ra quẻ 10 Lý


def _tv(q):
    return tv.tra_loi(q, "chi_tiet", sinh=SINH_TV, ngay_xem=NX)


TUVI = [
    ("Hoá Kỵ của tôi nằm ở cung nào?", ["Hoá Kỵ nằm ở cung Quan Lộc", "Thiên Đồng hoá Kỵ"], []),
    ("Sao Thiên Mã của tôi ở đâu?", ["Thiên Mã nằm ở cung Tử Nữ"], []),
    ("Tuần Triệt nằm ở đâu trong lá số tôi?", ["Tuần Không nằm ở cung Huynh Đệ và Mệnh",
                                               "Triệt Lộ nằm ở cung Tật Ách và Tài Bạch"], []),
    ("Thân tôi cư cung nào?", ["Thân cư cung Mệnh"], []),
    ("Thái Âm của tôi ở cung nào, sáng không?", ["Thái Âm nằm ở cung Phu Thê, độ sáng Miếu"], []),
    ("Lá số của tôi có cách cục gì đặc biệt không?", ["Cách cục"], ["Cự Môn (巨門"]),
    ("Tôi có bị sát tinh chiếu mệnh không?", ["tam phương tứ chính của Mệnh", "Địa Không", "Thiên Đồng hoá Kỵ"], []),
    ("Năm sau có nên mua đất không?", ["(cung Điền Trạch)", "Soi vào ba lớp hạn"], []),
    ("Tháng 3 âm năm sau thế nào?", ["Lưu nguyệt tháng 3 âm năm Đinh Mùi", "tháng Giáp Thìn",
                                      "Theo phái Đẩu Quân từ Thái Tuế, Mệnh của tháng rơi vào cung Phụ Mẫu (Tý)",
                                      "Hoá Lộc của tháng (Liêm Trinh) ở cung Phụ Mẫu — đúng cung tháng",
                                      "Các phái khác"], ["chưa luận lưu nguyệt"]),
    ("Tháng 5 dương lịch năm 2026 tôi thế nào?", ["thuộc tháng 3 âm", "rơi vào cung Mệnh (Hợi)",
                                                   "Hoá Kỵ của tháng (Vũ Khúc)"], []),
    ("Tử Vi ở cung Mệnh nghĩa là gì?", ["Tử Vi ở cung Mệnh:"], ["nằm ở cung"]),
]


@pytest.mark.parametrize("q,co,khong", TUVI)
def test_tuvi_tra_dung_du_lieu_la_so(q, co, khong):
    r = _tv(q)
    assert r["do_phu"] == "day_du" and not r["loi_kiem_tra"]
    for c in co:
        assert c in r["cau_tra_loi"], (q, c)
    for c in khong:
        assert c not in r["cau_tra_loi"], (q, c)


def test_tuvi_luu_nguyet_theo_phai_nguoi_dung_chon():
    r = tv.tra_loi("Tháng 3 âm năm sau thế nào?", "chi_tiet", sinh={**SINH_TV, "luu_nguyet": "luu_nien"}, ngay_xem=NX)
    assert "Theo phái Tháng Giêng tại cung lưu niên, Mệnh của tháng rơi vào cung Phu Thê (Dậu)" in r["cau_tra_loi"]
    assert "Đẩu Quân từ Thái Tuế → Phụ Mẫu" in r["cau_tra_loi"]


def test_tuvi_tuan_triet_dong_hai_cung_trong_tom_tat():
    from app.calc import tuvi_an_sao as az
    ls = tv.tom_tat(az.an_sao_tho(dt.date(1990, 5, 17), 6, "nam", "vi-VN"))
    co = {s: sorted(c["chi"] for c in ls["cung"] if s in c["phu_tinh"]) for s in ("Tuần Không", "Triệt Lộ")}
    assert co == {"Tuần Không": ["Hợi", "Tuất"], "Triệt Lộ": ["Mùi", "Ngọ"]}


BATTU = [
    ("Tôi có sao Đào Hoa không?", ["không có Đào Hoa", "Thiên Ất Quý Nhân"]),
    ("Tôi có quý nhân không?", ["Thiên Ất Quý Nhân (cát, ở trụ tháng)"]),
    ("Tứ trụ của tôi có xung hợp gì không?", ["Ngọ–Ngọ tự hình", "Tân–Bính ngũ hợp", "Nhâm–Bính tương xung"]),
    ("Bát tự của tôi có cách cục gì?", ["Thiên Tài cách"]),
]


@pytest.mark.parametrize("q,co", BATTU)
def test_battu_tra_dung_du_lieu_tu_tru(q, co):
    r = bt.tra_loi(q, sinh=SINH_BT, ngay_xem=NX)
    assert r["do_phu"] == "day_du"
    for c in co:
        assert c in r["cau_tra_loi"], (q, c)


def test_battu_hoi_dung_than_tra_loi_dung_than_truoc():
    v = bt.tra_loi("Dụng thần của tôi là gì?", sinh=SINH_BT, ngay_xem=NX)["cau_tra_loi"]
    assert v.index("Dụng thần — hai cách") < v.index("Ngũ hành (thang điểm")


PHONGTHUY = [
    ("Bếp nên đặt hướng nào?", ["toạ hung hướng cát", "Thiên Y (Đông)"]),
    ("Giường ngủ nên quay đầu về hướng nào?", ["Đầu giường", "Thiên Y (Đông)", "Diên Niên (Nam)"]),
    ("Gương đối diện cửa chính có sao không?", ["Gương chiếu thẳng cửa chính"]),
    ("Gương đối diện giường có sao không?", ["Gương đối diện giường"]),
    ("Nhà hướng Đông Bắc vận 9 thế nào?", ["vận 9 (2024–2043)", "hướng Cấn (toạ Khôn)"]),
    ("Vợ tôi sinh 1992 thì chọn hướng nhà theo ai?", ["người kia (sinh 1992): Đoài", "khác nhóm"]),
]


@pytest.mark.parametrize("q,co", PHONGTHUY)
def test_phongthuy_tra_dung_doi_tuong(q, co):
    r = pt.tra_loi(q, sinh=SINH_PT, ngay_xem=NX)
    assert r["do_phu"] == "day_du"
    for c in co:
        assert c in r["cau_tra_loi"], (q, c)
    if "cửa chính" in q:
        assert "Gương đối diện giường" not in r["cau_tra_loi"]


KINHDICH = [
    ("Quẻ Thuỷ Hoả Ký Tế nghĩa là gì?", ["Ký Tế", "quẻ 63"]),
    ("Quẻ số 64 là quẻ gì?", ["Vị Tế", "quẻ 64"]),
    ("Quẻ Càn hào 5 nói gì?", ["Cửu Ngũ", "飛龍在天"]),
    ("Hào cửu ngũ quẻ Càn", ["飛龍在天"]),
    ("Mai hoa dịch số khác gì gieo đồng xu?", ["Mai Hoa"]),
    ("quẻ thủy lôi truân có nên đầu tư không", ["Truân"]),
    ("Tôi gieo được quẻ Thuần Khảm, nên hiểu thế nào?", ["Khảm", "quẻ 29"]),
]


@pytest.mark.parametrize("q,co", KINHDICH)
def test_kinhdich_tra_que_duoc_hoi_khong_gieo_que_khac(q, co):
    r = kd.tra_loi(q, "tu_dong", gia_tri_hao=HAO, thoi_diem=dt.datetime(2026, 10, 7, 10))
    v = r["cau_tra_loi"]
    for c in co:
        assert c in v, (q, c)
    assert "Lý 履" not in v, q


def test_kinhdich_cau_quyet_dinh_khong_neu_que_van_gieo():
    r = kd.tra_loi("Tôi có nên nhận lời mời làm việc mới không?", "tu_dong", gia_tri_hao=HAO)
    assert r["phan_loai"]["loai"] == "quyet_dinh" and "Lý 履" in r["cau_tra_loi"]


def _ts(q, kia=None):
    return hoi_van.tra_loi(q, NGUOI, kia, NX)


@pytest.mark.parametrize("q", ["Tôi có hợp làm sếp không?", "Em là mẹ bỉm hai con, tôi hợp với nghề gì?",
                               "Tôi có hợp với nghề giáo viên không?"])
def test_thanso_hop_nghe_khong_phai_hop_doi(q):
    r = _ts(q)
    assert r["phan_loai"]["linh_vuc"] == "su_nghiep" and not r.get("can_them")


def test_thanso_ngay_cu_the_tinh_ngay_ca_nhan():
    v = _ts("Ngày 15 tháng sau có nên ký hợp đồng không?")["cau_tra_loi"]
    assert "Ngày 15/11/2026 — Ngày cá nhân 7" in v and "Tháng 11 là tháng cá nhân 1" in v


def test_thanso_so_xui():
    r = _ts("Số 13 có phải số xui không?")
    assert "không có số xui" in r["cau_tra_loi"] and r["phan_loai"]["linh_vuc"] == "ky_thuat"


def test_thanso_hai_so_gia_dinh_khong_gan_cho_ban():
    v = _ts("Số 7 và số 4 làm ăn chung được không?")["cau_tra_loi"]
    assert "7 của bạn" not in v and "người thứ nhất" in v and "Với đồng nghiệp" in v


def test_thanso_sep_dung_goc_trong_vai_sep():
    v = _ts("Sếp tôi sinh 13/5/1990, tôi và sếp có hợp nhau không?")["cau_tra_loi"]
    assert "Với sếp, người ấy (số chủ đạo 1)" in v


def test_thanso_bieu_do_dung_truoc_chan_dung():
    v = _ts("Tôi thiếu số 5 trong biểu đồ ngày sinh thì sao?")["cau_tra_loi"]
    assert v.index("Ô số 5") < v.index("số chủ đạo")
