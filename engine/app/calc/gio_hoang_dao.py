# -*- coding: utf-8 -*-
"""HN-3 — giờ hoàng đạo theo lịch cổ truyền (12 thần trực giờ).

Quy tắc: mỗi ngày, giờ Thanh Long khởi tại một chi theo CHI NGÀY (Tý/Ngọ → Thân, Sửu/Mùi → Tuất, Dần/Thân → Tý,
Mão/Dậu → Dần, Thìn/Tuất → Thìn, Tỵ/Hợi → Ngọ), rồi 12 thần đi thuận theo 12 giờ. Sáu thần Thanh Long, Minh Đường,
Kim Quỹ, Bảo Quang (Thiên Đức), Ngọc Đường, Tư Mệnh là hoàng đạo. Đối chiếu oracle lunar-typescript
(fixtures/golden/gio_hoang_dao.json). Chi ngày theo ngày dương — không phụ thuộc lịch âm Việt hay Trung.

Tầng CALC: thuần, tất định, không LLM, không DB. Không chứa lời khuyên — tầng hiển thị trình bày là tham khảo văn hoá.
"""
from __future__ import annotations

import datetime as dt

from app.calc import lunar

CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
THAN = ["Thanh Long", "Minh Đường", "Thiên Hình", "Chu Tước", "Kim Quỹ", "Bảo Quang",
        "Bạch Hổ", "Ngọc Đường", "Thiên Lao", "Huyền Vũ", "Tư Mệnh", "Câu Trận"]
HOANG_DAO = frozenset({"Thanh Long", "Minh Đường", "Kim Quỹ", "Bảo Quang", "Ngọc Đường", "Tư Mệnh"})
# Chi ngày (chỉ số) → chi giờ khởi Thanh Long (chỉ số). Ngày xung nhau (cách 6) dùng chung điểm khởi.
KHOI_THANH_LONG = {0: 8, 1: 10, 2: 0, 3: 2, 4: 4, 5: 6}


def chi_ngay(ngay: dt.date) -> str:
    return lunar.can_chi_ngay(ngay)[1]


def _khung(i: int) -> tuple[str, str]:
    """Giờ Tý 23:00–01:00, Sửu 01:00–03:00, …"""
    tu = (i * 2 - 1) % 24
    return f"{tu:02d}:00", f"{(tu + 2) % 24:02d}:00"


def bang_gio(ngay: dt.date) -> list[dict]:
    """12 giờ của ngày (Tý → Hợi): chi, khung giờ, thần trực, có phải hoàng đạo."""
    khoi = KHOI_THANH_LONG[CHI.index(chi_ngay(ngay)) % 6]
    kq = []
    for i, chi in enumerate(CHI):
        than = THAN[(i - khoi) % 12]
        tu, den = _khung(i)
        kq.append({"chi": chi, "tu": tu, "den": den, "than": than, "hoang_dao": than in HOANG_DAO})
    return kq


def gio_hoang_dao(ngay: dt.date) -> list[dict]:
    return [x for x in bang_gio(ngay) if x["hoang_dao"]]
