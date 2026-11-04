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


def sao_o_cung_cach_menh(sao: str, k: int) -> list[dict]:
    """AUD-P0: `sao` đứng ở cung thứ `k` tính NGHỊCH từ Mệnh (0 Mệnh, 1 Huynh Đệ, …, 11 Phụ Mẫu — cung thứ k nằm ở chi
    Mệnh − k) → với mỗi trong 12 vị trí của Tử Vi: chi của sao, chi của Mệnh, chính tinh ở Mệnh."""
    ra = []
    for chi_tv in CHI:
        v = vi_tri_chinh_tinh(chi_tv)
        c = CHI.index(v[sao])
        m = CHI[(c + k) % 12]
        ra.append({"chi_sao": v[sao], "chi_menh": m, "menh": [t for t in CHINH_TINH if v[t] == m]})
    return ra


def tom_tat_cung_khac(sao: str, k: int, lech: int) -> dict:
    """Khi `sao` ở cung thứ `k`, cung thứ `lech` (cùng thứ tự) có chính tinh nào, gom trên 12 vị trí của Tử Vi:
    `luon_co` (có ở cả 12), `to_hop` (mỗi tổ hợp + số vị trí, nhiều trước), `vo_chinh_dieu` (số vị trí không có chính tinh).
    Đếm VỊ TRÍ trên bàn sao (mỗi vị trí một lần) — không phải tỉ lệ người."""
    bo: list[tuple[str, ...]] = []
    for chi_tv in CHI:
        v = vi_tri_chinh_tinh(chi_tv)
        dich = CHI[(CHI.index(v[sao]) + k - lech) % 12]
        bo.append(tuple(t for t in CHINH_TINH if v[t] == dich))
    dem: dict[tuple[str, ...], int] = {}
    for b in bo:
        if b:
            dem[b] = dem.get(b, 0) + 1
    luon = [t for t in CHINH_TINH if all(t in b for b in bo)]
    to_hop = [{"sao": list(b), "so_vi_tri": n} for b, n in sorted(dem.items(), key=lambda x: (-x[1], [CHINH_TINH.index(t) for t in x[0]]))]
    return {"luon_co": luon, "to_hop": to_hop, "vo_chinh_dieu": sum(1 for b in bo if not b)}
