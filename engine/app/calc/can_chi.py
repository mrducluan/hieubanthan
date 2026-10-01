# -*- coding: utf-8 -*-
"""Can chi dùng chung: nạp âm 60 hoa giáp, âm dương lý, sinh khắc ngũ hành, Mệnh–Cục.

Tính thuần, tất định. Nạp âm đối chiếu ORACLE lunar-typescript (fixtures/golden/can_chi.json).
"""
from __future__ import annotations

CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
HANH = ["Kim", "Thủy", "Mộc", "Hỏa", "Thổ"]

# 30 cặp nạp âm theo thứ tự hoa giáp: (tên Việt, hành, chữ Hán)
_NAP_AM = [
    ("Hải Trung Kim", "Kim", "海中金"), ("Lô Trung Hỏa", "Hỏa", "炉中火"),
    ("Đại Lâm Mộc", "Mộc", "大林木"), ("Lộ Bàng Thổ", "Thổ", "路旁土"),
    ("Kiếm Phong Kim", "Kim", "剑锋金"), ("Sơn Đầu Hỏa", "Hỏa", "山头火"),
    ("Giản Hạ Thủy", "Thủy", "涧下水"), ("Thành Đầu Thổ", "Thổ", "城头土"),
    ("Bạch Lạp Kim", "Kim", "白蜡金"), ("Dương Liễu Mộc", "Mộc", "杨柳木"),
    ("Tuyền Trung Thủy", "Thủy", "泉中水"), ("Ốc Thượng Thổ", "Thổ", "屋上土"),
    ("Tích Lịch Hỏa", "Hỏa", "霹雳火"), ("Tùng Bách Mộc", "Mộc", "松柏木"),
    ("Trường Lưu Thủy", "Thủy", "长流水"), ("Sa Trung Kim", "Kim", "沙中金"),
    ("Sơn Hạ Hỏa", "Hỏa", "山下火"), ("Bình Địa Mộc", "Mộc", "平地木"),
    ("Bích Thượng Thổ", "Thổ", "壁上土"), ("Kim Bạch Kim", "Kim", "金箔金"),
    ("Phú Đăng Hỏa", "Hỏa", "覆灯火"), ("Thiên Hà Thủy", "Thủy", "天河水"),
    ("Đại Dịch Thổ", "Thổ", "大驿土"), ("Thoa Xuyến Kim", "Kim", "钗钏金"),
    ("Tang Đố Mộc", "Mộc", "桑柘木"), ("Đại Khê Thủy", "Thủy", "大溪水"),
    ("Sa Trung Thổ", "Thổ", "沙中土"), ("Thiên Thượng Hỏa", "Hỏa", "天上火"),
    ("Thạch Lựu Mộc", "Mộc", "石榴木"), ("Đại Hải Thủy", "Thủy", "大海水"),
]

# Vòng tương sinh: Kim → Thủy → Mộc → Hỏa → Thổ → Kim
_SINH = {"Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim"}
# Tương khắc: Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim
_KHAC = {"Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim"}


def chi_so_hoa_giap(can: str, chi: str) -> int:
    """Vị trí 0..59 trong 60 hoa giáp; ValueError nếu can chi không cùng âm dương."""
    i_can, i_chi = CAN.index(can), CHI.index(chi)
    if i_can % 2 != i_chi % 2:
        raise ValueError(f"{can} {chi} không phải cặp can chi hợp lệ")
    return next(i for i in range(60) if i % 10 == i_can and i % 12 == i_chi)


def nap_am(can: str, chi: str) -> dict:
    ten, hanh, han = _NAP_AM[chi_so_hoa_giap(can, chi) // 2]
    return {"ten": ten, "hanh": hanh, "han": han}


def la_duong_can(can: str) -> bool:
    return CAN.index(can) % 2 == 0


def am_duong_ly(can_nam: str, chi_cung_menh: str) -> str:
    """Tuổi dương Mệnh đóng cung dương (hoặc âm–âm) = thuận lý; lệch nhau = nghịch lý."""
    return "thuận" if la_duong_can(can_nam) == (CHI.index(chi_cung_menh) % 2 == 0) else "nghịch"


def sinh_khac(a: str, b: str) -> str:
    """Quan hệ của hành a đối với hành b: 'sinh' | 'khắc' | 'bị sinh' | 'bị khắc' | 'bình hoà'."""
    if a == b:
        return "bình hoà"
    if _SINH[a] == b:
        return "sinh"
    if _SINH[b] == a:
        return "bị sinh"
    if _KHAC[a] == b:
        return "khắc"
    return "bị khắc"


def menh_cuc(hanh_menh: str, hanh_cuc: str) -> str:
    return {
        "bình hoà": "Mệnh Cục bình hoà",
        "sinh": "Mệnh sinh Cục",
        "bị sinh": "Cục sinh Mệnh",
        "khắc": "Mệnh khắc Cục",
        "bị khắc": "Cục khắc Mệnh",
    }[sinh_khac(hanh_menh, hanh_cuc)]


def hanh_cuc(ten_cuc: str) -> str:
    """'Kim tứ cục' → 'Kim' (tên cục iztro tiếng Việt, có/không dấu hoa)."""
    dau = ten_cuc.strip().split()[0].capitalize()
    dau = {"Thuỷ": "Thủy", "Hoả": "Hỏa"}.get(dau, dau)
    if dau not in HANH:
        raise ValueError(f"Không nhận ra hành của cục: {ten_cuc}")
    return dau
