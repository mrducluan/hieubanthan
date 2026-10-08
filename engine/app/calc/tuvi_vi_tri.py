# -*- coding: utf-8 -*-
"""SEO-H — vị trí 14 chính tinh suy từ cung của Tử Vi (tầng CALC, thuần, không LLM).

Khi đã biết Tử Vi đứng ở chi nào, 13 chính tinh còn lại có vị trí cố định (khẩu quyết an chính tinh):
- Nhóm Tử Vi đi NGHỊCH: Tử Vi, Thiên Cơ (−1), [trống], Thái Dương (−3), Vũ Khúc (−4), Thiên Đồng (−5),
  [trống, trống], Liêm Trinh (−8).
- Thiên Phủ đối xứng Tử Vi qua trục Dần–Thân; nhóm Thiên Phủ đi THUẬN: Thiên Phủ, Thái Âm (+1), Tham Lang (+2),
  Cự Môn (+3), Thiên Tướng (+4), Thiên Lương (+5), Thất Sát (+6), [ba cung trống], Phá Quân (+10).
Đối chứng 60/60 lá `lasotuvi` (MIT) — tests/test_tuvi_vi_tri_chinh_tinh.py. Không thay an sao của iztro: chỉ
dùng cho trang kiến thức (sao nào đồng cung / xung chiếu khi một sao đứng ở một chi).
"""
from __future__ import annotations

CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]

_NHOM_TU_VI = (("Tử Vi", 0), ("Thiên Cơ", -1), ("Thái Dương", -3), ("Vũ Khúc", -4), ("Thiên Đồng", -5),
               ("Liêm Trinh", -8))
_NHOM_THIEN_PHU = (("Thiên Phủ", 0), ("Thái Âm", 1), ("Tham Lang", 2), ("Cự Môn", 3), ("Thiên Tướng", 4),
                   ("Thiên Lương", 5), ("Thất Sát", 6), ("Phá Quân", 10))
CHINH_TINH = [t for t, _ in _NHOM_TU_VI] + [t for t, _ in _NHOM_THIEN_PHU]


def vi_tri_chinh_tinh(chi_tu_vi: str) -> dict[str, str]:
    """Chi của 14 chính tinh khi Tử Vi ở `chi_tu_vi`."""
    z = CHI.index(chi_tu_vi)
    f = (4 - z) % 12                      # Dần (2) và Thân (8) là trục đối xứng: z + f ≡ 4 (mod 12)
    ra = {ten: CHI[(z + d) % 12] for ten, d in _NHOM_TU_VI}
    ra.update({ten: CHI[(f + d) % 12] for ten, d in _NHOM_THIEN_PHU})
    return ra


def bo_cuc_theo_sao(sao: str) -> dict[str, dict]:
    """Với mỗi chi `sao` có thể đứng: chính tinh đồng cung và chính tinh ở cung xung chiếu (đối diện).

    Thứ tự sao trong danh sách theo CHINH_TINH (ổn định để trang hiển thị giống nhau mỗi lần).
    """
    ra: dict[str, dict] = {}
    for chi_tv in CHI:
        v = vi_tri_chinh_tinh(chi_tv)
        chi = v[sao]
        doi = CHI[(CHI.index(chi) + 6) % 12]
        ra[chi] = {"dong_cung": [t for t in CHINH_TINH if t != sao and v[t] == chi],
                   "xung_chieu_chi": doi,
                   "xung_chieu": [t for t in CHINH_TINH if v[t] == doi]}
    return {c: ra[c] for c in CHI}
