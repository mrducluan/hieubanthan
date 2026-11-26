# -*- coding: utf-8 -*-
"""TV-V2 — Phi tinh tứ hoá (飛星四化). Tầng CALC: Python thuần, tất định, không LLM, không DB.

- Ngũ Hổ Độn: can của 12 cung theo can năm sinh (khởi tháng Dần). Tý, Sửu nối tiếp sau Hợi (cùng can Dần, Mão).
- Lai nhân cung: cung (Dần…Hợi) có can trùng can năm sinh — Tý/Sửu trùng can Dần/Mão nên bỏ.
- Phi hoá: can mỗi cung hoá bốn sao (bảng `calc.tuvi_luu_nguyet.TU_HOA` — bảng DUY NHẤT của dự án) → sao nằm ở
  cung nào là cung đích ("bay vào"), cung đối diện cung đích bị "xung". Can cung hoá chính sao trong cung = tự hoá.

Đầu vào `cung` = danh sách 12 cung dạng `hoidap.tuvi.tom_tat(...)["cung"]`
({ten, chi, can, chinh_tinh: [{ten}], phu_tinh: [tên]}); Tuần/Triệt đã được tom_tat bổ sung cho cả hai cung.
Đối chứng: golden iztro `fixtures/golden/tuvi_phi_hoa_golden.json` (tests/test_tuvi_phi_hoa.py).
"""
from __future__ import annotations

from app.calc.lunar import CAN, CHI
from app.calc.tuvi_luu_nguyet import TU_HOA

HOA = ("Lộc", "Quyền", "Khoa", "Kỵ")
TUAN_TRIET = ("Tuần Không", "Triệt Lộ")
# Can cung Dần theo can năm (Ngũ Hổ Độn): Giáp/Kỷ → Bính, Ất/Canh → Mậu, Bính/Tân → Canh, Đinh/Nhâm → Nhâm, Mậu/Quý → Giáp
_CAN_DAN = {0: 2, 1: 4, 2: 6, 3: 8, 4: 0}


def _i_can(can: str) -> int:
    if can not in CAN:
        raise ValueError(f"Thiên can không hợp lệ: {can}")
    return CAN.index(can)


def _i_chi(chi: str) -> int:
    if chi not in CHI:
        raise ValueError(f"Địa chi không hợp lệ: {chi}")
    return CHI.index(chi)


def ngu_ho_don(can_nam: str, chi: str) -> str:
    """Can của cung mang địa chi `chi` (Ngũ Hổ Độn theo can năm sinh)."""
    buoc = (_i_chi(chi) - 2) % 12                      # Dần = 0 … Sửu = 11
    return CAN[(_CAN_DAN[_i_can(can_nam) % 5] + buoc) % 10]


def lai_nhan(can_nam: str) -> str:
    """Chi cung Lai nhân: cung trong Dần…Hợi có can trùng can năm sinh."""
    buoc = (_i_can(can_nam) - _CAN_DAN[_i_can(can_nam) % 5]) % 10
    return CHI[(2 + buoc) % 12]


def _ten_sao(c: dict) -> list[str]:
    return [s["ten"] if isinstance(s, dict) else s for s in c.get("chinh_tinh", [])] + list(c.get("phu_tinh", []))


def _chi_xung(chi: str) -> str:
    return CHI[(_i_chi(chi) + 6) % 12]


def _noi(sao: str, cung: list[dict]) -> dict | None:
    return next((c for c in cung if sao in _ten_sao(c)), None)


def _bay(can: str, cung: list[dict]) -> list[dict]:
    if can not in TU_HOA:
        raise ValueError(f"Thiên can không hợp lệ: {can}")
    theo_chi = {c["chi"]: c for c in cung}
    ra = []
    for hoa, sao in zip(HOA, TU_HOA[can]):
        den = _noi(sao, cung)
        xung = theo_chi.get(_chi_xung(den["chi"])) if den else None
        ra.append({"hoa": hoa, "sao": sao, "den_cung": den["ten"] if den else None,
                   "xung_cung": xung["ten"] if xung else None,
                   "den_tuan_triet": [s for s in TUAN_TRIET if den and s in den.get("phu_tinh", [])]})
    return ra


def phi_tu_can(can: str, cung: list[dict]) -> list[dict]:
    """Bốn hoá của một can bất kỳ (can năm xem, can năm người kia, can cung…) rơi vào cung nào của lá số `cung`.
    → [{hoa, sao, den_cung, xung_cung, den_tuan_triet}] theo thứ tự Lộc, Quyền, Khoa, Kỵ."""
    return _bay(can, cung)


def phi_hoa(cung: list[dict]) -> list[dict]:
    """48 đường bay: mỗi cung (theo thứ tự đầu vào) phi 4 hoá theo can của cung.
    → [{tu_cung, can, hoa, sao, den_cung, xung_cung, tu_hoa, den_tuan_triet}]."""
    ra = []
    for c in cung:
        for x in _bay(c["can"], cung):
            ra.append({"tu_cung": c["ten"], "can": c["can"], "hoa": x["hoa"], "sao": x["sao"],
                       "den_cung": x["den_cung"], "xung_cung": x["xung_cung"],
                       "tu_hoa": x["den_cung"] == c["ten"], "den_tuan_triet": x["den_tuan_triet"]})
    return ra


CUNG_CHUOI_MAC_DINH = ("Mệnh", "Tài Bạch", "Quan Lộc", "Phu Thê", "Điền Trạch")


def chuoi_chuyen_ky(cung: list[dict], cung_goc: tuple[str, ...] = CUNG_CHUOI_MAC_DINH, toi_da: int = 6) -> list[dict]:
    """Chặng 1 — Chuỗi Phi Hoá bậc 2 theo phái Lương Nhược Du (`luong_phai_phi_tinh`):
      * `ky_chuyen_ky`: cung A hoá Kỵ bay vào cung B (B ≠ A), lấy can của cung B tìm sao hoá Kỵ tiếp sang cung C (`den_cung`)
        — cho thấy bận tâm từ mảng A qua B rồi dồn điểm rơi thực tế sang mảng C (xung cung đối C').
      * `loc_chuyen_ky`: cung A hoá Lộc bay vào cung B (B ≠ A), lấy can của cung B tìm sao hoá Kỵ sang cung C — cho thấy
        thuận lợi ở B dễ kéo theo chỗ hao sức hoặc ràng buộc ở C nếu không giữ nhịp.
    Tất định 100%, không đổi `phi_hoa()`."""
    theo_ten = {c["ten"]: c for c in cung}
    ra: list[dict] = []
    for loai, hoa_dau in (("ky_chuyen_ky", "Kỵ"), ("loc_chuyen_ky", "Lộc")):
        for ten_a in cung_goc:
            ca = theo_ten.get(ten_a)
            if not ca:
                continue
            b1 = next((x for x in _bay(ca["can"], cung) if x["hoa"] == hoa_dau), None)
            if not b1 or not b1["den_cung"] or b1["den_cung"] == ten_a:
                continue
            cb = theo_ten.get(b1["den_cung"])
            if not cb:
                continue
            b2 = next((x for x in _bay(cb["can"], cung) if x["hoa"] == "Kỵ"), None)
            if not b2 or not b2["den_cung"] or b2["den_cung"] == cb["ten"]:
                continue
            ra.append({
                "loai": loai,
                "phai": "luong_phai_phi_tinh",
                "tu_cung": ten_a,
                "can_dau": ca["can"],
                "hoa_dau": hoa_dau,
                "sao_dau": b1["sao"],
                "qua_cung": cb["ten"],
                "can_chuyen": cb["can"],
                "sao_chuyen": b2["sao"],
                "den_cung": b2["den_cung"],
                "xung_cung": b2["xung_cung"],
            })
            if len(ra) >= toi_da:
                return ra
    return ra

