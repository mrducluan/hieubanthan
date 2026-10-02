# -*- coding: utf-8 -*-
"""TV-PHAI — vị trí Hoả Tinh, Linh Tinh theo lối Việt (Nam phái).

Quy tắc chuyển thể từ `lasotuvi` (MIT, © 2016 doanguyen — AmDuong.timHoaLinh), đối chứng 72 lá số mẫu
(tests/test_tuvi_lich_viet.py). Khác iztro (Trung Châu) ở cung khởi của hai nhóm tam hợp và ở CHIỀU an:

- Cung khởi theo tam hợp chi năm sinh: Dần Ngọ Tuất → Hoả Sửu, Linh Mão · Thân Tý Thìn → Hoả Dần, Linh Tuất ·
  Tỵ Dậu Sửu → Hoả Tuất, Linh Mão · Hợi Mão Mùi → Hoả Dậu, Linh Tuất.
- Từ cung khởi là giờ Tý, đếm đến giờ sinh: dương nam / âm nữ → Hoả thuận, Linh nghịch;
  âm nam / dương nữ → Hoả nghịch, Linh thuận.
"""
from __future__ import annotations

CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
_KHOI = {("Dần", "Ngọ", "Tuất"): ("Sửu", "Mão"), ("Thân", "Tý", "Thìn"): ("Dần", "Tuất"),
         ("Tỵ", "Dậu", "Sửu"): ("Tuất", "Mão"), ("Hợi", "Mão", "Mùi"): ("Dậu", "Tuất")}


def vi_tri(can_nam: str, chi_nam: str, chi_gio: int, gioi_tinh: str) -> tuple[str, str]:
    """(cung Hoả Tinh, cung Linh Tinh). `chi_gio`: 0 = Tý … 11 = Hợi."""
    hoa, linh = next(v for k, v in _KHOI.items() if chi_nam in k)
    duong_nam_am_nu = (CAN.index(can_nam) % 2 == 0) == (gioi_tinh == "nam")
    h, l_ = CHI.index(hoa), CHI.index(linh)
    if duong_nam_am_nu:
        return CHI[(h + chi_gio) % 12], CHI[(l_ - chi_gio) % 12]
    return CHI[(h - chi_gio) % 12], CHI[(l_ + chi_gio) % 12]
