# -*- coding: utf-8 -*-
"""EN-2 (P2-15) — "Hôm nay" có câu ghép các tín hiệu đã tính (ngày cá nhân · tháng cá nhân · lịch: hoàng đạo/hắc đạo,
trực) thành MỘT lời khuyên ngày, không thêm dữ kiện mới, không phán."""
import datetime as dt

from app.luangiai import hom_nay as hn


def test_cau_tong_hop():
    t = hn.the_hom_nay(15, 5, 1990, dt.date(2026, 11, 1))
    s = t["tom_lai"]
    assert s.startswith("Hôm nay của bạn:")
    assert str(t["ngay_ca_nhan"]["so"]) in s and t["hoang_lich"]["truc"] in s
    assert ("hoàng đạo" in s) == bool(t["hoang_lich"]["hoang_dao"])
    for cam in ("xui", "đại hung", "tai hoạ", "chắc chắn"):
        assert cam not in s.lower()


def test_cau_tong_hop_moi_ngay_khac():
    a = hn.the_hom_nay(15, 5, 1990, dt.date(2026, 11, 1))["tom_lai"]
    b = hn.the_hom_nay(15, 5, 1990, dt.date(2026, 11, 2))["tom_lai"]
    assert a != b
