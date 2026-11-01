# -*- coding: utf-8 -*-
"""EN-2 (ND-6) — Kinh Dịch không kết luận ngược lời quẻ: "无攸利" (không có chỗ lợi) là lời xấu, không phải "利";
quẻ biến nói ngược hẳn quẻ bản → mức hạ về cân bằng; "Điểm đang có lợi" dùng lời "Hiểu đơn giản", không chép văn cổ."""
from app.luangiai import kinhdich_doi_song as kd


def test_vo_du_loi_la_loi_xau():
    assert kd.muc_loi_kinh("萃如嗟如，无攸利") == "can_chu_dong"
    assert kd.muc_loi_kinh("無攸利") == "can_chu_dong"
    assert kd.muc_loi_kinh("勿用") == "can_chu_dong"
    assert kd.muc_loi_kinh("利見大人") == "thuan"
    assert kd.muc_loi_kinh("无咎") == "thuan"


def test_dung_hoa_que_bien():
    assert kd.dung_hoa_bien("thuan", "can_chu_dong") == "can_bang"
    assert kd.dung_hoa_bien("thuan", "thuan") == "thuan"
    assert kd.dung_hoa_bien("can_chu_dong", "thuan") == "can_chu_dong"
    assert kd.dung_hoa_bien("thuan", None) == "thuan"


def test_diem_loi_hieu_don_gian():
    s = kd.hieu_don_gian(45)
    assert s and "binh khí" not in s and "tông miếu" not in s
