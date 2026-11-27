# -*- coding: utf-8 -*-
"""Chặng 4.3 — Tầng CALC Trạch Nhật cổ điển theo *Khâm Định Hiệp Kỷ Biện Phương Thư* (`calc/trach_nhat_hiep_ky.py`).

Tính tất định, tái sử dụng `calc.lunar` và `calc.tietkhi` (không nhân bản phép tính lịch):
  1. Ngũ loại nhật theo sinh khắc Can – Chi của ngày: Bảo · Nghĩa · Chế · Chuyên · Phạt.
  2. Tứ Ly (1 ngày trước Xuân phân 0°, Hạ chí 90°, Thu phân 180°, Đông chí 270°) &
     Tứ Tuyệt (1 ngày trước Lập xuân 315°, Lập hạ 45°, Lập thu 135°, Lập đông 225°).
  3. Thập Ác Đại Bại (10 ngày Lộc hãm Tuần Không — kèm kiểm tra Năm/Tháng có điền thực hay không đúng theo Biện Ngoa quyển 5!).
  4. Dương Công Kỵ (13 ngày truyền thống theo tháng/ngày âm lịch — kèm ghi chú Biện Ngoa quyển 36).
  5. Phương Tam Sát & Tuế Phá của năm theo Tam Hợp địa chi năm.
"""
from __future__ import annotations

import datetime as dt

from app.calc import lunar, tietkhi

_CAN_HANH = {
    "Giáp": "Mộc", "Ất": "Mộc", "Bính": "Hỏa", "Đinh": "Hỏa", "Mậu": "Thổ",
    "Kỷ": "Thổ", "Canh": "Kim", "Tân": "Kim", "Nhâm": "Thủy", "Quý": "Thủy",
}
_CHI_HANH = {
    "Tý": "Thủy", "Sửu": "Thổ", "Dần": "Mộc", "Mão": "Mộc", "Thìn": "Thổ", "Tỵ": "Hỏa",
    "Ngọ": "Hỏa", "Mùi": "Thổ", "Thân": "Kim", "Dậu": "Kim", "Tuất": "Thổ", "Hợi": "Thủy",
}
_SINH = {"Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim", "Kim": "Thủy", "Thủy": "Mộc"}
_KHAC = {"Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim", "Kim": "Mộc"}

# 10 ngày Thập Ác Đại Bại -> chi Lộc bị Tuần Không của tuần Giáp đó (Hiệp Kỷ quyển 5: điền thực bởi chi Năm/Tháng thì hết Không)
THAP_AC_LOC_KHONG: dict[tuple[str, str], str] = {
    ("Giáp", "Thìn"): "Dần",
    ("Ất", "Tỵ"): "Mão",
    ("Bính", "Thân"): "Tỵ",
    ("Đinh", "Hợi"): "Ngọ",
    ("Mậu", "Tuất"): "Tỵ",
    ("Kỷ", "Sửu"): "Ngọ",
    ("Canh", "Thìn"): "Thân",
    ("Tân", "Tỵ"): "Dậu",
    ("Nhâm", "Thân"): "Hợi",
    ("Quý", "Hợi"): "Tý",
}

# 13 ngày Dương Công Kỵ theo (tháng âm, ngày âm)
DUONG_CONG_KY: frozenset[tuple[int, int]] = frozenset({
    (1, 13), (2, 11), (3, 9), (4, 7), (5, 5), (6, 3),
    (7, 1), (7, 29), (8, 27), (9, 25), (10, 23), (11, 21), (12, 19),
})

# Tam Sát phương vị theo Tam Hợp chi năm:
# Thân Tý Thìn (Thuỷ) -> sát Nam (Tỵ Ngọ Mùi); Dần Ngọ Tuất (Hoả) -> sát Bắc (Hợi Tý Sửu);
# Tỵ Dậu Sửu (Kim) -> sát Đông (Dần Mão Thìn); Hợi Mão Mùi (Mộc) -> sát Tây (Thân Dậu Tuất).
_TAM_SAT_THEO_CHI_NAM: dict[str, tuple[str, tuple[str, str, str]]] = {
    **{c: ("Nam", ("Đông Nam", "Nam", "Tây Nam")) for c in ("Thân", "Tý", "Thìn")},
    **{c: ("Bắc", ("Đông Bắc", "Bắc", "Tây Bắc")) for c in ("Dần", "Ngọ", "Tuất")},
    **{c: ("Đông", ("Đông Bắc", "Đông", "Đông Nam")) for c in ("Tỵ", "Dậu", "Sửu")},
    **{c: ("Tây", ("Tây Nam", "Tây", "Tây Bắc")) for c in ("Hợi", "Mão", "Mùi")},
}


def ngu_loai_nhat(can_ngay: str, chi_ngay: str) -> str:
    """Trả một trong `('bao', 'nghia', 'che', 'chuyen', 'phat')`."""
    hc, hchi = _CAN_HANH[can_ngay], _CHI_HANH[chi_ngay]
    if hc == hchi:
        return "chuyen"
    if _SINH[hc] == hchi:
        return "bao"
    if _SINH[hchi] == hc:
        return "nghia"
    if _KHAC[hc] == hchi:
        return "che"
    return "phat"


def _ngay_tiet_vn(nam: int, kinh_do: int) -> dt.date:
    t_utc = tietkhi.thoi_diem(nam, kinh_do)
    return (t_utc + dt.timedelta(hours=7)).date()


def la_tu_ly_tu_tuyet(d: dt.date) -> str | None:
    """Trả `'tu_ly'` hoặc `'tu_tuyet'` nếu `d` là ngày liền trước 4 phân/chí hoặc 4 lập (theo giờ VN UTC+7)."""
    for nam in (d.year, d.year + 1):
        for g in (0, 90, 180, 270):
            if d == _ngay_tiet_vn(nam, g) - dt.timedelta(days=1):
                return "tu_ly"
        for g in (315, 45, 135, 225):
            if d == _ngay_tiet_vn(nam, g) - dt.timedelta(days=1):
                return "tu_tuyet"
    return None


def phan_tich_ngay_hiep_ky(d: dt.date, huong_tu_tao: str | None = None) -> dict:
    """Chẩn đoán Hiệp Kỷ Biện Phương Thư cho một ngày dương lịch `d`."""
    can_n, chi_n = lunar.can_chi_ngay(d)
    am_ngay, am_thang, am_nam, am_nhuan = lunar.solar_to_lunar(d.day, d.month, d.year, 7.0)
    can_nam, chi_nam = lunar.can_chi_nam(am_nam)
    # Chi tháng kiến theo tiết khí (Lập xuân khởi Dần)
    t_giua = dt.datetime(d.year, d.month, d.day, 5, 0)  # 12:00 VN = 05:00 UTC
    (t_truoc, goc_tiet), _ = tietkhi.tiet_bao_quanh(t_giua)
    idx_thang = ((goc_tiet - 315) % 360) // 30  # 0 = Dần .. 11 = Sửu
    chi_thang = lunar.CHI[(2 + idx_thang) % 12]

    loai_5 = ngu_loai_nhat(can_n, chi_n)
    giao_mua = la_tu_ly_tu_tuyet(d)

    loc_khong = THAP_AC_LOC_KHONG.get((can_n, chi_n))
    thap_ac = None
    if loc_khong is not None:
        dien_thuc = loc_khong in (chi_nam, chi_thang)
        thap_ac = {
            "co": True,
            "chi_loc": loc_khong,
            "da_dien_thuc": dien_thuc,
        }

    duong_cong = (am_thang, am_ngay) in DUONG_CONG_KY and not am_nhuan

    phuong_chinh, ba_goc_sat = _TAM_SAT_THEO_CHI_NAM[chi_nam]
    cham_tam_sat = bool(huong_tu_tao and huong_tu_tao == phuong_chinh)

    return {
        "ngay": d.isoformat(),
        "am_lich": f"{am_ngay:02d}/{am_thang:02d}/{am_nam}" + (" (nhuận)" if am_nhuan else ""),
        "can_ngay": can_n,
        "chi_ngay": chi_n,
        "chi_nam": chi_nam,
        "chi_thang": chi_thang,
        "ngu_loai_ma": loai_5,
        "tu_ly_tu_tuyet": giao_mua,
        "thap_ac_dai_bai": thap_ac,
        "duong_cong_ky": duong_cong,
        "tam_sat_nam": {
            "phuong_chinh": phuong_chinh,
            "vung_lien_quan": list(ba_goc_sat),
            "cham_huong_dang_xet": cham_tam_sat,
        },
    }
