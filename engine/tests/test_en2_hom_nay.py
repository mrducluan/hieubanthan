# -*- coding: utf-8 -*-
"""EN-2 (P2-15) — "Hôm nay" có câu ghép các tín hiệu đã tính (ngày cá nhân · tháng cá nhân · lịch: hoàng đạo/hắc đạo,
trực) thành MỘT lời khuyên ngày, không thêm dữ kiện mới, không phán."""
import datetime as dt

from app.luangiai import hom_nay as hn


def test_cau_tong_hop():
    t = hn.the_hom_nay(15, 5, 1990, dt.date(2026, 11, 1))
    s = t["tom_lai"]
    assert s.startswith("Hôm nay là ngày cá nhân")
    assert str(t["ngay_ca_nhan"]["so"]) in s
    # Review EN-2 (#11): không thuật ngữ lịch (tên trực, "hoàng đạo") trong câu tóm lại — chỉ nghĩa đời thường
    assert t["hoang_lich"]["truc"] not in s and "hoàng đạo" not in s
    assert ("ngày tốt" in s) == bool(t["hoang_lich"]["hoang_dao"])
    assert s.count(". ") <= 2
    for cam in ("xui", "đại hung", "tai hoạ", "chắc chắn"):
        assert cam not in s.lower()


def test_cau_tong_hop_moi_ngay_khac():
    a = hn.the_hom_nay(15, 5, 1990, dt.date(2026, 11, 1))["tom_lai"]
    b = hn.the_hom_nay(15, 5, 1990, dt.date(2026, 11, 2))["tom_lai"]
    assert a != b
