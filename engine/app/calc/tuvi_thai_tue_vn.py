# -*- coding: utf-8 -*-
"""TV-LICH — tên vòng Thái Tuế (12 thần an theo chi năm, đi thuận) theo sách Tử vi Việt.

iztro đặt tên theo phái Trung (岁前十二神: Tuế Kiện, Hối Khí, Tang Môn, Quán Tác, Quan Phù, Tiểu Hao, Đại Hao,
Long Đức, Bạch Hổ, Thiên Đức, Điếu Khách, Bệnh Phù); sách Việt dùng Thái Tuế, Thiếu Dương, Tang Môn, Thiếu Âm,
Quan Phù, Tử Phù, Tuế Phá, Long Đức, Bạch Hổ, Phúc Đức, Điếu Khách, Trực Phù. VỊ TRÍ hai bên trùng nhau (cùng
khởi ở chi năm, cùng chiều) — chỉ khác tên → đổi tên theo thứ tự, không đổi an sao. Đối chiếu 72/72 lá với
lasotuvi (MIT) trong tests/test_tuvi_truong_phai_lich.py. Phát hiện gốc: PR #3 (WS-2).
"""
from __future__ import annotations

TRUNG = ["Tuế Kiện", "Hối Khí", "Tang Môn", "Quán Tác", "Quan Phù", "Tiểu Hao", "Đại Hao", "Long Đức", "Bạch Hổ",
         "Thiên Đức", "Điếu Khách", "Bệnh Phù"]
VIET = ["Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù", "Tuế Phá", "Long Đức", "Bạch Hổ",
        "Phúc Đức", "Điếu Khách", "Trực Phù"]
_MAP = dict(zip(TRUNG, VIET))


def ten_nam_phai(ten_iztro: str) -> str:
    """Tên iztro (vi-VN) → tên sách Việt; tên lạ giữ nguyên."""
    return _MAP.get(ten_iztro, ten_iztro)
