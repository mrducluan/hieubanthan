# -*- coding: utf-8 -*-
"""Mai Hoa Dịch Số (Thiệu Ung) — khởi quẻ theo thời gian và thể/dụng. Tầng CALC.

Phép niên–nguyệt–nhật–thời (《梅花易數》, các ví dụ 觀梅占, 牡丹占):
  thượng quái = (số chi năm + tháng âm + ngày âm) mod 8      (dư 0 → 8)
  hạ quái     = (số chi năm + tháng âm + ngày âm + số chi giờ) mod 8
  hào động    = (cùng tổng đó) mod 6                           (dư 0 → 6)
Số Tiên thiên: Càn1 Đoài2 Ly3 Chấn4 Tốn5 Khảm6 Cấn7 Khôn8. Chi: Tý1 … Hợi12.
Thể/dụng: quái CHỨA hào động là Dụng, quái còn lại là Thể.

Hàm thuần, tất định. Đổi dương → âm dùng app.calc.lunar (Hồ Ngọc Đức, UTC+7);
ranh giới ngày giữ SWITCH_AT_0000 (Kinh Dịch không phải tử vi).
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import lunar
from app.calc.kinhdich_vendor import TRI_BITS, TRI_NGU_HANH

TIEN_THIEN = ["Càn", "Đoài", "Ly", "Chấn", "Tốn", "Khảm", "Cấn", "Khôn"]   # số 1..8
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]
SINH = {"Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim", "Kim": "Thủy", "Thủy": "Mộc"}
KHAC = {"Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim", "Kim": "Mộc"}


def _quai(n: int) -> str:
    return TIEN_THIEN[(n % 8 or 8) - 1]


def khoi_que_thoi_gian(chi_nam: str, thang_am: int, ngay_am: int, chi_gio: str) -> dict:
    y, h = CHI.index(chi_nam) + 1, CHI.index(chi_gio) + 1
    if not (1 <= thang_am <= 12 and 1 <= ngay_am <= 30):
        raise ValueError("tháng/ngày âm không hợp lệ")
    tren = y + thang_am + ngay_am
    duoi = tren + h
    thuong, ha, dong = _quai(tren), _quai(duoi), duoi % 6 or 6
    bits = list(TRI_BITS[ha]) + list(TRI_BITS[thuong])          # hào 1 → 6
    gia_tri = [(9 if b else 6) if i + 1 == dong else (7 if b else 8) for i, b in enumerate(bits)]
    return {"thuong": thuong, "ha": ha, "hao_dong": dong, "gia_tri_hao": gia_tri,
            "tong_thuong": tren, "tong_ha": duoi}


def quan_he(the: str, dung: str) -> str:
    a, b = TRI_NGU_HANH[the], TRI_NGU_HANH[dung]
    if a == b:
        return "ty_hoa"
    if SINH[b] == a:
        return "dung_sinh_the"
    if KHAC[a] == b:
        return "the_khac_dung"
    if SINH[a] == b:
        return "the_sinh_dung"
    return "dung_khac_the"


def the_dung(thuong: str, ha: str, hao_dong: int) -> dict:
    dung, the = (ha, thuong) if hao_dong <= 3 else (thuong, ha)
    return {"the": the, "dung": dung, "the_ngu_hanh": TRI_NGU_HANH[the],
            "dung_ngu_hanh": TRI_NGU_HANH[dung], "quan_he": quan_he(the, dung)}


def chi_gio(gio: int) -> str:
    """Giờ đồng hồ (UTC+7) → chi giờ. 23:00–00:59 là Tý."""
    return CHI[((gio + 1) // 2) % 12]


def khoi_que_tu_thoi_diem(thoi_diem: dt.datetime, lich: str = "viet") -> dict:
    """Thời điểm theo giờ Việt Nam (UTC+7) → quẻ Mai Hoa. 23:xx vẫn thuộc ngày đó.
    `lich`: âm lịch dùng để lấy năm/tháng/ngày âm — "viet" (mặc định) hoặc "trung" (TP-LICH)."""
    d, m, y = thoi_diem.day, thoi_diem.month, thoi_diem.year
    ngay_am, thang_am, nam_am, _nhuan = lunar.solar_to_lunar(d, m, y, config.TZ_LICH_AM[lich])
    chi_nam = lunar.can_chi_nam(nam_am)[1]
    cg = chi_gio(thoi_diem.hour)
    kq = khoi_que_thoi_gian(chi_nam, thang_am, ngay_am, cg)
    kq["dau_vao"] = {"chi_nam": chi_nam, "thang_am": thang_am, "ngay_am": ngay_am, "chi_gio": cg, "lich": lich,
                     "nam_am": nam_am, "thoi_diem": thoi_diem.isoformat(timespec="minutes")}
    kq["the_dung"] = the_dung(kq["thuong"], kq["ha"], kq["hao_dong"])
    return kq
