# -*- coding: utf-8 -*-
"""EN-3c — định tuyến hỏi đáp 5 mảng + các điểm review độc lập của đoạn mở đầu "trả lời trước" (`hoidap/mo_dau.py`).

Câu trong tệp này là câu của review / câu đại diện cho từng nhóm luật (không lấy từ holdout_v2 đóng băng)."""
import datetime as dt

import pytest

from app.hoidap import battu, chung, kinhdich, mo_dau, phongthuy, tuvi
from app.luangiai import an_toan, hoi
from app.narrative import hoi_van

XEM = dt.date(2026, 11, 1)
NGUOI = {"ho_ten": ["Nguyễn Thị Mai Anh"], "ngay": 17, "thang": 5, "nam": 1990, "quy_uoc": "tung_phan"}
SV = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nu"}
SB = {"lich": dt.datetime(1990, 5, 17, 12, 0), "gioi_tinh": "nu", "gio_ty": "da_ty"}
SP = {"nam": 1990, "gioi_tinh": "nu", "ngay": dt.date(1990, 5, 17), "moc_nam": "lap_xuan"}


def _tl(md: str, cau: str) -> dict:
    if md == "thanso":
        return hoi_van.tra_loi(cau, NGUOI, None, XEM, dung_llm=False)
    if md == "tuvi":
        return tuvi.tra_loi(cau, "tham_khao", sinh=SV, ngay_xem=XEM)
    if md == "battu":
        return battu.tra_loi(cau, sinh=SB, ngay_xem=XEM)
    if md == "phongthuy":
        return phongthuy.tra_loi(cau, sinh=SP, ngay_xem=XEM)
    return kinhdich.tra_loi(cau, "tu_dong", gia_tri_hao=[7, 8, 9, 7, 6, 8], thoi_diem=dt.datetime(2026, 11, 1, 9, 0),
                            cach_ra_que="gieo_tay")


def _dau(md: str, cau: str) -> str:
    return (_tl(md, cau).get("cau_tra_loi") or "").split("\n\n")[0]


# ------------------------------------------------------------------ (2) khủng hoảng quan hệ: không đoạn mở đầu nêu mức
@pytest.mark.parametrize("md", ["tuvi", "battu", "thanso", "kinhdich"])
def test_khung_hoang_quan_he_khong_mo_dau_neu_muc(md):
    d = _dau(md, "Chồng tôi ngoại tình, tôi có nên ly hôn không?")
    assert not d.startswith("Về "), d
    assert "thuận lợi" not in d and "Việc nên làm" not in d, d
    assert "nặng lòng" in d, d          # câu đồng cảm trung tính đứng đầu


# ------------------------------------------------------------------ (2) việc nên làm đúng người được hỏi
@pytest.mark.parametrize("md, cau", [("tuvi", "Con tôi học hành thế nào"), ("battu", "Con tôi có học đường tốt không")])
def test_viec_nen_lam_khong_muon_hop_cha_me(md, cau):
    d = _dau(md, cau)
    for sai in ("cha mẹ hay sếp", "sếp cũ", "thầy cũ", "người đã che chở mình"):
        assert sai not in d, d


# ------------------------------------------------------------------ (3) ngũ hành: dân gian không thành việc nên làm
def test_ngu_hanh_dan_gian_khong_thanh_viec_nen_lam():
    d = _dau("battu", "Màu sắc nào hợp với tôi theo bát tự?")
    assert "Việc nên làm: bù hành" not in d, d
    assert "tham khảo" in d, d


# ------------------------------------------------------------------ (4) đầu tư: ranh giới tài chính trong đoạn mở đầu
@pytest.mark.parametrize("md", ["battu", "tuvi"])
def test_dau_tu_co_ranh_gioi(md):
    d = _dau(md, "Tôi có nên đầu tư vàng tháng 3 năm 2027")
    assert "không phải lời khuyên đầu tư" in d, d


# ------------------------------------------------------------------ (5) đại vận không mở bằng "Về năm nay"
def test_dai_van_khong_mo_bang_nam_nay():
    d = _dau("battu", "Đại vận hiện tại của tôi thế nào")
    assert not d.startswith("Về năm nay"), d
    assert "đại vận" in d, d


# ------------------------------------------------------------------ (6) vế sau chỉ là "có nên không"
def test_dieu_hoi_o_ve_truoc_khi_ve_sau_la_duoi_hoi():
    t = chung.chuan_hoa_cau("Tôi đang tính đổi việc, có nên không?")
    assert (mo_dau.dieu_hoi(t, "Tôi đang tính đổi việc, có nên không?") or {}).get("ma") == "doi_viec"
    pl = battu.phan_loai("Tôi đang tính đổi việc, có nên không?")
    assert pl["chu_de"] == "nghe_tien", pl
    assert not _dau("battu", "Tôi đang tính đổi việc, có nên không?").startswith("Tứ trụ (năm")


# ------------------------------------------------------------------ (7) trầm cảm → lời hỗ trợ ở mọi mảng
@pytest.mark.parametrize("cau", ["Tôi bị trầm cảm, mất ngủ, công việc thì bế tắc", "toi dang bi tram cam, xem giup toi",
                                 "Em mắc trầm cảm nặng mấy tháng nay"])
def test_tram_cam_di_nhanh_ho_tro(cau):
    assert an_toan.khung_hoang(cau)
    assert hoi.phan_loai(cau)["xu_ly"] == "an_toan"
    for mod in (tuvi, battu, phongthuy, kinhdich):
        assert mod.phan_loai(cau)["xu_ly"] == "an_toan", mod.__name__


@pytest.mark.parametrize("cau", ["Có nên dừng thuốc chống trầm cảm không", "Trầm cảm là gì, khác buồn thường thế nào?"])
def test_tram_cam_cau_thuoc_khong_thanh_khung_hoang(cau):
    assert not an_toan.khung_hoang(cau)


@pytest.mark.parametrize("cau", ["Bát tự có cho biết tôi chết năm nào không?", "Gieo quẻ xem đề hôm nay về con gì?"])
def test_tu_choi_moi(cau):
    assert chung.dac_biet(chung.chuan_hoa(cau), cau) in ("tu_choi_nhe", "an_toan")


# ------------------------------------------------------------------ định tuyến (nhóm luật EN-3c)
@pytest.mark.parametrize("cau, loai", [
    ("Người yêu cũ có quay lại với tôi không?", "du_doan"),
    ("Đối tác này có ký hợp đồng với tôi không?", "du_doan"),
    ("Có nên nhận lời làm trưởng nhóm không?", "quyet_dinh"),
    ("Quẻ chủ khác quẻ biến thế nào?", "ky_thuat"),
])
def test_kinhdich_loai(cau, loai):
    assert kinhdich.phan_loai(cau)["loai"] == loai


@pytest.mark.parametrize("cau, lv", [
    ("Có nên cho bạn mượn tiền không?", "tien_bac"),
    ("Nên mua xe bây giờ hay chờ cuối năm?", "tien_bac"),
])
def test_kinhdich_linh_vuc(cau, lv):
    assert kinhdich.phan_loai(cau)["linh_vuc"] == lv


@pytest.mark.parametrize("cau, loai", [
    ("Hướng nhà Tây Nam, bếp hướng Đông Bắc, cửa và bếp có hợp không?", "cua_bep"),
    ("Năm sau sửa phòng ở phía Bắc có được không?", "nam"),
    ("Mua căn hướng Nam hay hướng Bắc thì hợp tôi hơn?", "huong_ca_nhan"),
])
def test_phongthuy_loai(cau, loai):
    assert phongthuy.phan_loai(cau)["loai"] == loai


@pytest.mark.parametrize("cau, loai, cung", [
    ("Lá số tôi có hợp làm ngành y không?", "la_so", "Quan Lộc"),
    ("Lá số cho con trai tôi sinh 2016, bé học hành ra sao?", "la_so_con", None),
    ("Xem tử vi cho vợ tôi tuổi Dần năm nay làm ăn thế nào?", "nguoi_khac", None),
    ("Thiên Khôi là sao gì?", "phu_tinh", None),
    ("Tôi với bố mẹ có hợp nhau không theo lá số?", "la_so", "Phụ Mẫu"),
])
def test_tuvi_loai(cau, loai, cung):
    pl = tuvi.phan_loai(cau)
    assert pl["loai"] == loai, pl
    if cung:
        assert cung in pl["cung"], pl


@pytest.mark.parametrize("cau, loai, chu_de", [
    ("Tứ trụ của tôi có trụ nào hình nhau không?", "la_so", None),
    ("Tôi hợp làm chủ hay làm nhân viên theo bát tự?", "la_so", "nghe_tien"),
    ("Màu gì hợp với tôi theo bát tự?", "la_so", "ngu_hanh"),
    ("Tôi thiếu hành gì, bổ sung bằng cách nào?", "la_so", "ngu_hanh"),
    ("Mình cưới 5 năm rồi. Bát tự có nói gì về đường con cái không?", "la_so", "con_cai"),
])
def test_battu_loai(cau, loai, chu_de):
    pl = battu.phan_loai(cau)
    assert pl["loai"] == loai, pl
    if chu_de:
        assert pl["chu_de"] == chu_de, pl


@pytest.mark.parametrize("cau, lv", [
    ("Tuần sau có tốt để tôi phỏng vấn không?", "thoi_van"),
    ("Tôi có hợp nuôi mèo không?", "cuoc_song"),
    ("Số linh hồn khác số sứ mệnh ở điểm nào?", "ky_thuat"),
    ("Thần số học có thực sự chính xác không?", "ky_thuat"),
])
def test_thanso_linh_vuc(cau, lv):
    assert hoi.phan_loai(cau)["linh_vuc"] == lv
