# -*- coding: utf-8 -*-
"""EN-3 (mục 3) — "trả lời trước": đoạn khớp câu hỏi nhất lên đầu thân (chỉ đổi thứ tự, không thêm / bớt chữ); dòng đầu
cố định và phần chân (tự soi, lời tham khảo) giữ chỗ."""
from app.hoidap import chung
from app.luangiai.hoi import chuan_hoa_cau as ch

VAN = "\n\n".join([
    "Tứ trụ (năm Canh Ngọ, tháng Tân Tỵ, ngày Nhâm Thân, giờ Bính Ngọ).",
    "Tính cách của bạn: điềm tĩnh, thích tự mình làm.",
    "Về tình cảm: bạn chậm mở lòng.",
    "Về tiền bạc và đầu tư: năm nay hợp giữ tiền, chưa hợp đầu tư lớn; khoản vay nên tính kỹ.",
    "Câu hỏi để tự soi: điều gì bạn đang trì hoãn?",
    "Đây là góc nhìn tham khảo văn hoá để bạn tự soi, không phải lời tiên đoán.",
])


def test_dua_doan_khop_len_dau():
    ra = chung.tra_loi_truoc(VAN, ch("Năm nay tôi có nên vay tiền để đầu tư không"))
    p = ra.split("\n\n")
    assert p[0].startswith("Tứ trụ") and p[1].startswith("Về tiền bạc")
    assert p[-2].startswith("Câu hỏi để tự soi") and p[-1].startswith("Đây là góc nhìn")
    assert sorted(p) == sorted(VAN.split("\n\n"))          # chỉ đổi thứ tự


def test_khong_doi_khi_doan_dau_da_khop_hoac_khong_ro():
    assert chung.tra_loi_truoc(VAN, ch("Tính cách của tôi thế nào")) == VAN
    assert chung.tra_loi_truoc(VAN, ch("Xem giúp tôi với")) == VAN
    assert chung.tra_loi_truoc("", ch("abc")) == ""
