# -*- coding: utf-8 -*-
"""TV-VONG — vòng Tuế tiền (Thái Tuế) và Tướng tiền theo LỚP HẠN. Tầng CALC: Python thuần, tất định.

Hai vòng 12 thần an theo một chi khởi, cùng đi thuận (chi tăng):
- Tuế tiền (岁前): Tuế Kiện tại chi khởi → Hối Khí → Tang Môn … → Bệnh Phù. Tên theo iztro vi-VN (phái Trung);
  tên sách Việt (Thái Tuế, Thiếu Dương…) qua `tuvi_thai_tue_vn`, vị trí y nguyên.
- Tướng tiền (将前): Tướng Tinh tại cung đế vượng của tam hợp chi khởi — "Dần Ngọ Tuất tướng tinh Ngọ, Thân Tý Thìn
  tướng tinh Tý, Tỵ Dậu Sửu tướng tinh Dậu, Hợi Mão Mùi tướng tinh Mão" — rồi Phan Án, Tuế Dịch … Vong Thần.
Chi khởi: lá số gốc = chi năm sinh (iztro đã an); lưu niên = chi năm xem (iztro `yearlyDecStar`, test đối chiếu khớp
hàm này); đại hạn = chi cung đại hạn (iztro không có → hàm này). Vòng Bác sĩ an từ Lộc Tồn năm sinh, không theo hạn.
Chỉ để hiển thị — không phép chấm mức nào đọc các vòng này. Golden: fixtures/golden/tuvi_vong_han.json.
Mảng trả về theo thứ tự 12 cung của iztro (chỉ số 0 = cung Dần), như `luu_nien.vong_thai_tue`.
"""
from __future__ import annotations

from app.calc import lunar, tuvi_thai_tue_vn

TUE_TIEN = list(tuvi_thai_tue_vn.TRUNG)
TUONG_TIEN = ["Tướng Tinh", "Phan Án", "Tuế Dịch", "Tức Thần", "Hoa Cái", "Kiếp Sát", "Tai Sát", "Thiên Sát",
              "Chỉ Bối", "Hàm Trì", "Nguyệt Sát", "Vong Thần"]
_CHI = list(lunar.CHI)                      # 0 = Tý … 11 = Hợi
_TUONG_TINH = ("Tý", "Dậu", "Ngọ", "Mão")   # theo chi % 4: Thân Tý Thìn · Tỵ Dậu Sửu · Dần Ngọ Tuất · Hợi Mão Mùi


def _i(chi: str) -> int:
    if chi not in _CHI:
        raise ValueError(f"Chi không hợp lệ: {chi!r}")
    return _CHI.index(chi)


def tuong_tinh(chi: str) -> str:
    """Cung Tướng Tinh của chi khởi `chi` (cung đế vượng của tam hợp)."""
    return _TUONG_TINH[_i(chi) % 4]


def _vong(khoi: int, ten: list[str]) -> list[str]:
    # chỉ số iztro 0 = Dần ↔ chi 2; thần thứ k ở chi (khoi + k)
    return [ten[(i + 2 - khoi) % 12] for i in range(12)]


def vong_tue_tien(chi: str, nam_phai: bool = False) -> list[str]:
    """Vòng Tuế tiền khởi tại `chi`, theo thứ tự 12 cung iztro (0 = Dần). `nam_phai` → tên sách Việt."""
    ra = _vong(_i(chi), TUE_TIEN)
    return [tuvi_thai_tue_vn.ten_nam_phai(t) for t in ra] if nam_phai else ra


def vong_tuong_tien(chi: str) -> list[str]:
    """Vòng Tướng tiền của chi khởi `chi`, theo thứ tự 12 cung iztro (0 = Dần)."""
    return _vong(_i(tuong_tinh(chi)), TUONG_TIEN)
