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


# --------------------------------------------------------------------------- KD-V2: khởi quẻ theo số / phương vị, toàn cục
# Số phương vị Tiên thiên (Hậu thiên phương → Tiên thiên quái): Nam Ly 3 · Bắc Khảm 6 · Đông Chấn 4 · Tây Đoài 2 ·
# Tây Bắc Càn 1 · Tây Nam Khôn 8 · Đông Nam Tốn 5 · Đông Bắc Cấn 7 (《梅花易數》 phương vị khởi quái).
SO_PHUONG = {"Tây Bắc": 1, "Tây": 2, "Nam": 3, "Đông": 4, "Đông Nam": 5, "Bắc": 6, "Đông Bắc": 7, "Tây Nam": 8}
HO_QUAI_BITS = {v: k for k, v in TRI_BITS.items()}
_NHOM_HAO = {"Khảm": "trong", "Ly": "trong", "Chấn": "trong", "Tốn": "trong", "Càn": "ngoài", "Khôn": "ngoài",
             "Cấn": "ngoài", "Đoài": "ngoài"}


def _gia_tri(thuong: str, ha: str, dong: int) -> list[int]:
    bits = list(TRI_BITS[ha]) + list(TRI_BITS[thuong])
    return [(9 if b else 6) if i + 1 == dong else (7 if b else 8) for i, b in enumerate(bits)]


def khoi_que_tu_so(so_tren: int, so_duoi: int, chi_gio: str) -> dict:
    """Mai Hoa theo số: số thứ nhất → thượng quái, số thứ hai → hạ quái (mod 8, dư 0 → 8); hào động =
    (số 1 + số 2 + số giờ) mod 6 (dư 0 → 6). Người dùng tự chọn số (vd số nhà, số đồ vật đếm được)."""
    if so_tren <= 0 or so_duoi <= 0:
        raise ValueError("số khởi quẻ phải là số nguyên dương")
    h = CHI.index(chi_gio) + 1
    thuong, ha = _quai(so_tren), _quai(so_duoi)
    dong = (so_tren + so_duoi + h) % 6 or 6
    return {"thuong": thuong, "ha": ha, "hao_dong": dong, "gia_tri_hao": _gia_tri(thuong, ha, dong),
            "tong_thuong": so_tren, "tong_ha": so_duoi, "the_dung": the_dung(thuong, ha, dong),
            "dau_vao": {"cach": "so", "so": [so_tren, so_duoi], "chi_gio": chi_gio}}


def khoi_que_phuong_vi(huong: str, chi_gio: str) -> dict:
    """Mai Hoa theo phương vị: số phương làm thượng quái; (số phương + số giờ) mod 8 làm hạ quái; hào động =
    (số phương + số giờ) mod 6."""
    if huong not in SO_PHUONG:
        raise ValueError(f"phương vị phải là một trong {list(SO_PHUONG)}")
    p, h = SO_PHUONG[huong], CHI.index(chi_gio) + 1
    thuong, ha = _quai(p), _quai(p + h)
    dong = (p + h) % 6 or 6
    return {"thuong": thuong, "ha": ha, "hao_dong": dong, "gia_tri_hao": _gia_tri(thuong, ha, dong),
            "tong_thuong": p, "tong_ha": p + h, "the_dung": the_dung(thuong, ha, dong),
            "dau_vao": {"cach": "phuong_vi", "huong": huong, "chi_gio": chi_gio}}


def toan_cuc(thuong: str, ha: str, hao_dong: int) -> dict:
    """Toàn cục Mai Hoa: thể – dụng – hỗ (hai quái giữa) – biến (quái có hào động sau khi biến) so với THỂ.
    `muc`: thuan (không gì khắc thể, có sinh thể hoặc tỷ hoà) · can_chu_dong (dụng hoặc biến khắc thể) · can_bang."""
    bits = list(TRI_BITS[ha]) + list(TRI_BITS[thuong])
    td = the_dung(thuong, ha, hao_dong)
    ho_ha, ho_thuong = HO_QUAI_BITS[tuple(bits[1:4])], HO_QUAI_BITS[tuple(bits[2:5])]
    b2 = list(bits)
    b2[hao_dong - 1] ^= 1
    bien = HO_QUAI_BITS[tuple(b2[:3])] if hao_dong <= 3 else HO_QUAI_BITS[tuple(b2[3:])]
    the = td["the"]
    qh = [{"vai": "dung", "quai": td["dung"], "quan_he": quan_he(the, td["dung"])},
          {"vai": "ho_thuong", "quai": ho_thuong, "quan_he": quan_he(the, ho_thuong)},
          {"vai": "ho_ha", "quai": ho_ha, "quan_he": quan_he(the, ho_ha)},
          {"vai": "bien", "quai": bien, "quan_he": quan_he(the, bien)}]
    sinh = sum(1 for x in qh if x["quan_he"] == "dung_sinh_the")
    khac = sum(1 for x in qh if x["quan_he"] == "dung_khac_the")
    chinh = {qh[0]["quan_he"], qh[3]["quan_he"]}
    if "dung_khac_the" in chinh:
        muc = "can_chu_dong"
    elif khac == 0 and (sinh >= 1 or "ty_hoa" in chinh):
        muc = "thuan"
    elif "the_sinh_dung" in chinh and sinh == 0:
        muc = "can_chu_dong" if khac else "can_bang"
    else:
        muc = "can_bang"
    return {"the": the, "dung": td["dung"], "the_ngu_hanh": TRI_NGU_HANH[the], "ho": {"thuong": ho_thuong, "ha": ho_ha},
            "bien": bien, "quan_he": qh, "sinh_the": sinh, "khac_the": khac, "muc": muc}


def ung_ky_so(thuong: str, ha: str, chi_gio: str) -> dict:
    """Ứng kỳ theo số quẻ (Mai Hoa): số thượng + số hạ + số giờ. Đơn vị tuỳ việc nhanh/chậm — hệ thống chỉ nêu con số
    và nói rõ là nhịp gợi ý."""
    so = TIEN_THIEN.index(thuong) + 1 + TIEN_THIEN.index(ha) + 1 + CHI.index(chi_gio) + 1
    don_vi = "ngày" if so <= 10 else "tuần" if so <= 20 else "tháng"
    return {"so": so, "don_vi": don_vi,
            "y": f"Số quẻ là {so}: việc gần thì tính bằng ngày, việc xa tính bằng tuần hay tháng — đây là nhịp gợi ý."}
