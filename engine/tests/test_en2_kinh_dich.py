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


def test_diem_loi_khong_lap_doan_dau_khong_mo_bang_nhu():
    """Review EN-2: hộp "Điểm đang có lợi" không mở bằng "như/giống" (mẩu câu), không chép nguyên câu ở đoạn đầu; quẻ chỉ
    thuận nhờ thời điểm thì không mượn lời quẻ."""
    import datetime as dt
    import random
    from app.hoidap import kinhdich as hd
    rnd = random.Random(7)
    thoi = dt.datetime(2026, 5, 20, 10, 0)
    for _ in range(40):
        hao = [rnd.choice([6, 7, 8, 9]) for _ in range(6)]
        dq = hd.tra_loi("Tôi có nên chuyển việc sang công ty mới không?", "tu_dong", gia_tri_hao=hao,
                        thoi_diem=thoi)["doc_que"]
        h = next((x for x in dq["hop"] if x["tieu_de"] == "Điểm đang có lợi"), None)
        if not h:
            continue
        nd = h["noi_dung"]
        assert not nd.lower().startswith(("như ", "giống ")), nd
        assert nd[:40] not in dq["doan"][0], (nd, dq["doan"][0])
