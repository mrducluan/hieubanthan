# -*- coding: utf-8 -*-
"""EN-3 — Thần số: lĩnh vực của câu hỏi (câu tự viết, không lấy từ holdout)."""
import pytest

from app.luangiai import hoi


@pytest.mark.parametrize("cau, lv", [
    ("Đỉnh cao thứ hai của tôi bắt đầu từ năm bao nhiêu tuổi", "thoi_van"),
    ("Tôi nên đi làm thuê hay tự làm chủ", "su_nghiep"),
    ("mình định mở tiệm nail, số của mình có hợp không", "su_nghiep"),
    ("Tôi hay tiêu xài hoang phí, làm sao giữ của", "tai_chinh"),
    ("Kiểu người yêu nào hợp với tôi", "tinh_yeu"),
    ("Mẫu người yêu lý tưởng của tôi theo thần số", "tinh_yeu"),
    ("Tôi có nên đầu tư chứng khoán năm nay", "tai_chinh"),
])
def test_linh_vuc(cau, lv):
    p = hoi.phan_loai(cau)
    assert p["linh_vuc"] == lv, (cau, p["linh_vuc"])
