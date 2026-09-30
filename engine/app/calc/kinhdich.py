# -*- coding: utf-8 -*-
"""Kinh Dịch — tầng CALC. Hàm thuần, tất định.

Nhận 6 giá trị hào ĐÃ GIEO (6/7/8/9, hào 1 → hào 6), trả cấu trúc quẻ: quẻ bản,
hào động, quẻ biến, hỗ/thác/tống quái, bát cung, thế ứng, nạp giáp, lục thân,
và quy tắc biến chiếm (Chu Hy) cho biết phải đọc lời nào.

Toàn bộ logic lấy từ kinhdich_vendor (bản sao nguyên văn gieoque.py) — ở đây
chỉ ghép lại đúng như main() của bản gốc, bỏ phần ngẫu nhiên và đồng hồ. Việc
gieo (ngẫu nhiên) nằm ở tầng API, không nằm trong hàm tính.
"""
from __future__ import annotations

from app.calc import kinhdich_vendor as _v

GIA_TRI_HOP_LE = (6, 7, 8, 9)


def khoi_que(gia_tri_hao: list[int]) -> dict:
    vals = list(gia_tri_hao)
    if len(vals) != 6 or any(v not in GIA_TRI_HOP_LE for v in vals):
        raise ValueError("Cần đúng 6 giá trị hào thuộc {6, 7, 8, 9}, từ hào 1 lên hào 6")

    ban = tuple(1 if v in (7, 9) else 0 for v in vals)
    dong = [i + 1 for i, v in enumerate(vals) if v in (6, 9)]
    bien = tuple((1 - b) if (i + 1) in dong else b for i, b in enumerate(ban))

    return {
        "quai_ban": _v.info(ban),
        "hao_dong": dong,
        "quai_bien": _v.info(bien) if dong else None,
        "quai_ho": _v.info(_v.ho_quai(ban)),
        "quai_thac": _v.info(_v.thac_quai(ban)),
        "quai_tong": _v.info(_v.tong_quai(ban)),
        "quy_tac_doc": _v.quy_tac_doc(len(dong), ban, bien, dong),
    }


def gieo(phuong_phap: str) -> list[int]:
    """Gieo 6 hào bằng CSPRNG của bản gốc. KHÔNG tất định — chỉ tầng API gọi."""
    return _v.cast(phuong_phap)
