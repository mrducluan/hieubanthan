# -*- coding: utf-8 -*-
"""Chặng 4.3 — Tầng CALC Trạch Nhật cổ điển theo *Khâm Định Hiệp Kỷ Biện Phương Thư* (`calc/trach_nhat_hiep_ky.py`).

MỘT BỘ TÍNH: mọi giá trị trang "Xem ngày tốt" đã có (ngày âm, can chi ngày, chi tháng theo tiết, ngày Dương Công kỵ,
thần sát Tứ Ly, bảng Tam Sát) đều ĐỌC từ `calc.hoang_lich.ngay()` / `calc.tuoi_dan_gian` — không tính lại theo cách
khác (trước đây khối này lệch thẻ ngày ở 15 ngày Dương Công, 26 ngày Tứ Ly, 35 ngày chi tháng giai đoạn 2020–2025).

Phần chỉ có ở khối này:
  1. Ngũ loại nhật theo sinh khắc Can – Chi của ngày: Bảo · Nghĩa · Chế · Chuyên · Phạt (Hiệp Kỷ quyển 5 dẫn Độn Giáp kinh).
  2. Tứ Tuyệt (1 ngày trước Lập xuân, Lập hạ, Lập thu, Lập đông — Hiệp Kỷ quyển 9); bảng thần sát của trang không có
     Tứ Tuyệt nên tính theo định nghĩa sách, ngày giao tiết theo giờ Việt Nam như `hoang_lich`.
  3. Thập Ác Đại Bại (10 ngày Lộc rơi Tuần Không) kèm phép "điền thực" của lời án quyển 5: chi Lộc trùng Thái Tuế
     (chi năm, đổi ở Lập xuân), Nguyệt Kiến (chi tháng theo tiết) hoặc Thái Dương (nguyệt tướng — cung Mặt Trời) thì
     không còn rỗng.
  4. Năm theo Lập xuân (Hiệp Kỷ xét năm từ Lập xuân, không từ Tết).

`tu_ly` = cờ thần sát 四离 của bảng thẻ ngày (giá trị trang đang hiện). Định nghĩa của sách (một ngày trước Xuân phân,
Hạ chí, Thu phân, Đông chí) trả riêng ở `tu_ly_theo_sach` — hai cách lệch nhau, ghi trong
`docs/GHI-CHU-HIEP-KY-TU-LY.md` để chủ dự án quyết; hệ thống không tự chọn.
"""
from __future__ import annotations

import datetime as dt

from app.calc import hoang_lich as hl, huyen_khong, lunar, tietkhi
from app.calc import tuoi_dan_gian as tdg
from app.config import CALENDAR_MERIDIAN_TZ

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

# 10 ngày Thập Ác Đại Bại -> chi Lộc bị Tuần Không (Hiệp Kỷ q.5 dẫn Thông Thư: 甲辰乙巳庚辰辛巳丙申戊戌丁亥己丑壬申癸亥).
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

# 8 hướng: mã (web gửi) ↔ tên Việt (khoá MÃ chữ của engine).
HUONG_MA: dict[str, str] = {
    "bac": "Bắc", "dong_bac": "Đông Bắc", "dong": "Đông", "dong_nam": "Đông Nam",
    "nam": "Nam", "tay_nam": "Tây Nam", "tay": "Tây", "tay_bac": "Tây Bắc",
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


def _ngay_tiet(nam: int, kinh_do: int) -> dt.date:
    """Ngày địa phương (kinh tuyến lịch, như `hoang_lich`) của thời điểm giao tiết `kinh_do`."""
    return (tietkhi.thoi_diem(nam, kinh_do) + dt.timedelta(hours=CALENDAR_MERIDIAN_TZ)).date()


def _truoc_tiet(d: dt.date, cac_goc: tuple[int, ...]) -> bool:
    return any(d == _ngay_tiet(nam, g) - dt.timedelta(days=1) for nam in (d.year, d.year + 1) for g in cac_goc)


def la_tu_tuyet(d: dt.date) -> bool:
    """Một ngày trước Lập xuân 315°, Lập hạ 45°, Lập thu 135°, Lập đông 225° (Hiệp Kỷ quyển 9)."""
    return _truoc_tiet(d, (315, 45, 135, 225))


def la_tu_ly_theo_sach(d: dt.date) -> bool:
    """Định nghĩa của sách: một ngày trước Xuân phân 0°, Hạ chí 90°, Thu phân 180°, Đông chí 270° (quyển 9)."""
    return _truoc_tiet(d, (0, 90, 180, 270))


def _cuoi_ngay_utc(d: dt.date) -> dt.datetime:
    """Cùng quy ước `hoang_lich.gz_thang`: xét ở cuối ngày địa phương (tháng, năm đổi TỪ NGÀY giao tiết)."""
    return dt.datetime(d.year, d.month, d.day, 23, 59, 59) - dt.timedelta(hours=CALENDAR_MERIDIAN_TZ)


def nam_lap_xuan(d: dt.date) -> int:
    """Năm can chi theo Lập xuân (cùng mốc với chi tháng của thẻ ngày)."""
    return huyen_khong.nam_theo_lap_xuan(_cuoi_ngay_utc(d))


def chi_thai_duong(d: dt.date) -> str:
    """Thái Dương (nguyệt tướng) = cung địa chi Mặt Trời đang ở: từ Vũ thủy (330°) ở Hợi, Xuân phân (0°) ở Tuất…
    đi nghịch mỗi trung khí một cung. Kinh độ Mặt Trời đọc từ `tietkhi` (cùng bộ tính tiết khí)."""
    kinh_do = tietkhi.kinh_do_mat_troi(_cuoi_ngay_utc(d))
    s = int(((kinh_do - 330.0) % 360.0) // 30)          # 0 = từ Vũ thủy
    return lunar.CHI[(11 - s) % 12]


def _viet_chi(chi_han: str) -> str:
    return lunar.CHI[hl.ZHI.index(chi_han)]


def phan_tich_ngay_hiep_ky(d: dt.date, huong_tu_tao: str | None = None) -> dict:
    """Chẩn đoán Hiệp Kỷ Biện Phương Thư cho một ngày dương lịch `d` (`huong_tu_tao`: tên Việt trong `HUONG_MA`)."""
    the = hl.ngay(d)                                    # đúng giá trị thẻ ngày của trang đang hiện
    can_n = lunar.CAN[hl.GAN.index(the["ngay_gz"][0])]
    chi_n = _viet_chi(the["ngay_gz"][1])
    chi_thang = _viet_chi(the["thang_gz"][1])
    nam_lx = nam_lap_xuan(d)
    chi_nam = lunar.can_chi_nam(nam_lx)[1]
    am = the["am"]

    thap_ac = None
    loc_khong = THAP_AC_LOC_KHONG.get((can_n, chi_n))
    if loc_khong is not None:
        thai_duong = chi_thai_duong(d)
        dien = [ma for ma, chi in (("thai_tue", chi_nam), ("nguyet_kien", chi_thang), ("thai_duong", thai_duong))
                if chi == loc_khong]
        thap_ac = {"co": True, "chi_loc": loc_khong, "chi_thai_duong": thai_duong,
                   "dien_thuc_boi": dien, "da_dien_thuc": bool(dien)}

    phuong_chinh, chi_sat = tdg._TAM_SAT[tdg._nhom(chi_nam)]
    vung = [tdg.PHUONG_CHI[c] for c in chi_sat]

    return {
        "ngay": d.isoformat(),
        "am": {"ngay": am["ngay"], "thang": am["thang"], "nam": am["nam"], "nhuan": am["nhuan"]},
        "can_ngay": can_n,
        "chi_ngay": chi_n,
        "nam_lap_xuan": nam_lx,
        "chi_nam": chi_nam,
        "chi_thang": chi_thang,
        "ngu_loai_ma": ngu_loai_nhat(can_n, chi_n),
        "tu_ly": "四离" in the["hung_sat"],
        "tu_ly_theo_sach": la_tu_ly_theo_sach(d),
        "tu_tuyet": la_tu_tuyet(d),
        "thap_ac_dai_bai": thap_ac,
        "duong_cong_ky": "duong_cong" in the["ky_dan_gian"],
        "tam_sat_nam": {
            "phuong_chinh": phuong_chinh,
            "chi": list(chi_sat),
            "vung_lien_quan": vung,
            "cham_huong_dang_xet": bool(huong_tu_tao and huong_tu_tao in vung),
        },
    }
