# -*- coding: utf-8 -*-
"""KD-V2 — Mai Hoa mở rộng: khởi quẻ theo SỐ và theo PHƯƠNG VỊ (Thiệu Ung, 《梅花易數》 số/phương vị khởi quái),
toàn cục thể–dụng–hỗ–biến. Test viết trước, bảng tay."""
from __future__ import annotations

import pytest

from app.calc import kinhdich_maihoa as mh


def test_khoi_que_tu_so():
    # 17 → 17 % 8 = 1 Càn; 23 → 7 Cấn; giờ Thìn (5): (17+23+5) % 6 = 3 → động hào 3
    kq = mh.khoi_que_tu_so(17, 23, "Thìn")
    assert (kq["thuong"], kq["ha"], kq["hao_dong"]) == ("Càn", "Cấn", 3)
    assert kq["gia_tri_hao"][2] in (6, 9) and sum(v in (6, 9) for v in kq["gia_tri_hao"]) == 1
    assert kq["the_dung"]["dung"] == "Cấn" and kq["the_dung"]["the"] == "Càn"
    # bội số 8 / 6 → 8 và 6
    kq2 = mh.khoi_que_tu_so(8, 16, "Tý")      # (8+16+1) % 6 = 1
    assert (kq2["thuong"], kq2["ha"], kq2["hao_dong"]) == ("Khôn", "Khôn", 1)


@pytest.mark.parametrize("huong,so", [("Tây Bắc", 1), ("Tây", 2), ("Nam", 3), ("Đông", 4), ("Đông Nam", 5),
                                      ("Bắc", 6), ("Đông Bắc", 7), ("Tây Nam", 8)])
def test_so_phuong_vi_tien_thien(huong, so):
    assert mh.SO_PHUONG[huong] == so


def test_khoi_que_theo_phuong_vi():
    # Phương Nam (3) làm thượng quái; hạ quái = (3 + giờ Ngọ 7) % 8 = 2 Đoài; động = 10 % 6 = 4
    kq = mh.khoi_que_phuong_vi("Nam", "Ngọ")
    assert (kq["thuong"], kq["ha"], kq["hao_dong"]) == ("Ly", "Đoài", 4)
    with pytest.raises(ValueError):
        mh.khoi_que_phuong_vi("Giữa", "Ngọ")


def test_toan_cuc_the_dung_ho_bien():
    # Thượng Càn (Kim) hạ Cấn (Thổ), động hào 3 → dụng = Cấn (hạ), thể = Càn.
    # Hỗ: hào 2-4 = (1,1,1)? bits Cấn (0,0,1) + Càn (1,1,1) → hào1..6 = 0,0,1,1,1,1 → hỗ hạ = hào 2-4 = 0,1,1 Tốn; hỗ thượng = hào 3-5 = 1,1,1 Càn
    # Biến: hào 3 đổi → hạ = 0,0,0 Khôn.
    tc = mh.toan_cuc("Càn", "Cấn", 3)
    assert tc["the"] == "Càn" and tc["dung"] == "Cấn"
    assert tc["ho"] == {"thuong": "Càn", "ha": "Tốn"} and tc["bien"] == "Khôn"
    qh = {x["vai"]: x["quan_he"] for x in tc["quan_he"]}
    assert qh["dung"] == "dung_sinh_the"            # Thổ sinh Kim
    assert qh["bien"] == "dung_sinh_the"            # Khôn Thổ sinh Kim
    assert qh["ho_ha"] == "the_khac_dung"           # Kim khắc Mộc (Tốn)
    assert qh["ho_thuong"] == "ty_hoa"
    assert tc["sinh_the"] >= 2 and tc["khac_the"] == 0 and tc["muc"] == "thuan"


def test_toan_cuc_muc_can_chu_dong():
    # Thể Chấn (Mộc) bị dụng Đoài (Kim) khắc, biến ra Càn (Kim) cũng khắc → cần chủ động
    tc = mh.toan_cuc("Chấn", "Đoài", 2)          # động hào 2 ở hạ quái → dụng = Đoài, thể = Chấn
    assert tc["the"] == "Chấn" and tc["dung"] == "Đoài"
    assert tc["muc"] == "can_chu_dong" and tc["khac_the"] >= 1


def test_ung_ky_mai_hoa_so_que():
    u = mh.ung_ky_so("Càn", "Cấn", "Thìn")
    assert u["so"] == 1 + 7 + 5 and u["don_vi"] in ("ngày", "tuần", "tháng")
