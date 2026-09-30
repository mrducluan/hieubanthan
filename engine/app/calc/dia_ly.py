# -*- coding: utf-8 -*-
"""Nơi sinh trong nước: 63 tỉnh/thành (tên như trên giấy khai sinh trước 07/2025).

Mỗi tỉnh mang:
  - `vung`: phía nào của vĩ tuyến 17 — quyết định múi giờ đồng hồ lịch sử
    (config.TZ_TABLE). `None` = tỉnh vắt ngang ranh giới (Quảng Trị: Vĩnh Linh ở
    phía Bắc sông Bến Hải) → sinh trước 13/06/1975 vẫn phải hỏi vùng.
  - `kinh_do`: kinh độ gần đúng của tỉnh lỵ (độ Đông, 2 chữ số thập phân). Chỉ
    dùng để CẢNH BÁO giờ mặt trời thực — không đổi kết quả lá số. Sai 0,1° ≈ 24
    giây, không đáng kể so với độ rộng một tỉnh.

Dùng danh sách 63 tỉnh cũ vì người dùng khai theo giấy tờ lúc sinh; 34 tỉnh sau
sáp nhập 2025 đều mang tên một tỉnh cũ nên vẫn tìm được.

Tầng CALC: dữ liệu tĩnh + tra cứu thuần.
"""
from __future__ import annotations

import unicodedata

NUOC_NGOAI = "nuoc_ngoai"

# (tên, vùng, kinh độ tỉnh lỵ)
_TINH: tuple[tuple[str, str | None, float], ...] = (
    # --- Phía Bắc vĩ tuyến 17 ---
    ("Hà Nội", "north", 105.85), ("Hải Phòng", "north", 106.68), ("Hà Giang", "north", 104.98),
    ("Cao Bằng", "north", 106.26), ("Bắc Kạn", "north", 105.83), ("Tuyên Quang", "north", 105.21),
    ("Lào Cai", "north", 103.97), ("Điện Biên", "north", 103.02), ("Lai Châu", "north", 103.46),
    ("Sơn La", "north", 103.91), ("Yên Bái", "north", 104.87), ("Hoà Bình", "north", 105.34),
    ("Thái Nguyên", "north", 105.84), ("Lạng Sơn", "north", 106.76), ("Quảng Ninh", "north", 107.08),
    ("Bắc Giang", "north", 106.19), ("Phú Thọ", "north", 105.40), ("Vĩnh Phúc", "north", 105.60),
    ("Bắc Ninh", "north", 106.07), ("Hải Dương", "north", 106.33), ("Hưng Yên", "north", 106.05),
    ("Thái Bình", "north", 106.34), ("Hà Nam", "north", 105.92), ("Nam Định", "north", 106.17),
    ("Ninh Bình", "north", 105.97), ("Thanh Hoá", "north", 105.78), ("Nghệ An", "north", 105.68),
    ("Hà Tĩnh", "north", 105.90), ("Quảng Bình", "north", 106.60),
    # --- Vắt ngang vĩ tuyến 17 ---
    ("Quảng Trị", None, 107.10),
    # --- Phía Nam vĩ tuyến 17 ---
    ("Thừa Thiên Huế", "south", 107.59), ("Đà Nẵng", "south", 108.21), ("Quảng Nam", "south", 108.47),
    ("Quảng Ngãi", "south", 108.80), ("Bình Định", "south", 109.22), ("Phú Yên", "south", 109.32),
    ("Khánh Hoà", "south", 109.19), ("Ninh Thuận", "south", 108.99), ("Bình Thuận", "south", 108.10),
    ("Kon Tum", "south", 108.00), ("Gia Lai", "south", 108.00), ("Đắk Lắk", "south", 108.04),
    ("Đắk Nông", "south", 107.69), ("Lâm Đồng", "south", 108.44), ("Bình Phước", "south", 106.89),
    ("Tây Ninh", "south", 106.10), ("Bình Dương", "south", 106.65), ("Đồng Nai", "south", 106.82),
    ("Bà Rịa – Vũng Tàu", "south", 107.17), ("TP Hồ Chí Minh", "south", 106.70), ("Long An", "south", 106.41),
    ("Tiền Giang", "south", 106.36), ("Bến Tre", "south", 106.38), ("Trà Vinh", "south", 106.34),
    ("Vĩnh Long", "south", 105.97), ("Đồng Tháp", "south", 105.63), ("An Giang", "south", 105.44),
    ("Kiên Giang", "south", 105.08), ("Cần Thơ", "south", 105.78), ("Hậu Giang", "south", 105.47),
    ("Sóc Trăng", "south", 105.97), ("Bạc Liêu", "south", 105.72), ("Cà Mau", "south", 105.15),
)


def _ma(ten: str) -> str:
    s = unicodedata.normalize("NFD", ten.replace("Đ", "D").replace("đ", "d"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return "-".join("".join(c if c.isalnum() else " " for c in s).split())


_BANG: dict[str, dict] = {
    _ma(ten): {"ma": _ma(ten), "ten": ten, "vung": vung, "kinh_do": kd} for ten, vung, kd in _TINH
}


def danh_sach() -> list[dict]:
    return [dict(v) for v in _BANG.values()]


def tra(ma: str) -> dict | None:
    t = _BANG.get(ma)
    return dict(t) if t else None
