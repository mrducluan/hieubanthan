# -*- coding: utf-8 -*-
"""HL-1 — Hoàng lịch ngày: trực (kiến trừ thập nhị khách), hoàng/hắc đạo, nghi/kỵ, thần sát, nhị thập bát tú,
xung sát, Bành Tổ bách kỵ, hướng thần, thai thần, giờ hoàng đạo, giờ xuất hành Lý Thuần Phong, ngày kỵ dân gian Việt.

CALC thuần: cùng ngày ra cùng kết quả, không LLM, không DB. Trả MÃ chữ Hán (khoá ổn định) — tên Hán Việt và nghĩa
đời thường nằm ở KB `hoang_lich_kb.json` (tầng luận ghép). Bảng nghi/kỵ, thần sát, tú: `hoang_lich_vendor.py`
(nguyên văn lunar-python, MIT). Tháng theo TIẾT (节) tính bằng `tietkhi` (VSOP87 rút gọn) ở múi giờ `tz`
(mặc định giờ Việt Nam UTC+7 — ngày giao tiết sát nửa đêm có thể đổi tháng sớm hơn lịch Trung Quốc một ngày).
"""
from __future__ import annotations

import datetime as dt
import re
from functools import lru_cache

from app.calc import lunar, tietkhi as tk
from app.calc import hoang_lich_vendor as V
from app.config import CALENDAR_MERIDIAN_TZ

GAN = "甲乙丙丁戊己庚辛壬癸"
ZHI = "子丑寅卯辰巳午未申酉戌亥"
TRUC = "建除满平定执破危成收开闭"
THAN = ("青龙", "明堂", "天刑", "朱雀", "金匮", "天德", "白虎", "玉堂", "天牢", "玄武", "司命", "勾陈")
HOANG_DAO = {"青龙", "明堂", "金匮", "天德", "玉堂", "司命"}
_THAN_OFFSET = {"子": 4, "丑": 2, "寅": 0, "卯": 10, "辰": 8, "巳": 6,
                "午": 4, "未": 2, "申": 0, "酉": 10, "戌": 8, "亥": 6}
_SAT = {"子": "南", "丑": "东", "寅": "北", "卯": "西"}
_XUNG_GAN = "戊己庚辛壬癸甲乙丙丁"
LY_THUAN_PHONG = ("dai_an", "luu_lien", "toc_hy", "xich_khau", "tieu_cat", "khong_vong")
LTP_TOT = {"dai_an", "toc_hy", "tieu_cat"}

# Ngày kỵ dân gian Việt (âm lịch): Tam nương, Nguyệt kỵ, Dương công kỵ nhật (13 ngày cố định theo tháng).
TAM_NUONG = {3, 7, 13, 18, 22, 27}
NGUYET_KY = {5, 14, 23}
DUONG_CONG = {(13, 1), (11, 2), (9, 3), (7, 4), (5, 5), (3, 6), (8, 7), (29, 7), (27, 8), (25, 9), (23, 10),
              (21, 11), (19, 12)}
# TP-1 (chủ dự án duyệt 2026-11-27): hai nguồn nói khác nhau về Dương Công kỵ — người dùng chọn.
#   "lich_viet" (mặc định): lịch dân gian Việt — tháng 7 là mùng 8 và 29, áp cả tháng nhuận (bảng `DUONG_CONG`).
#   "hiep_ky": Hiệp Kỷ Biện Phương Thư q.36 «…以至七月初一二十九而終于十二月十九凡十三日» — tháng 7 là mùng 1 và 29;
#              sách không nói tới tháng nhuận → tháng nhuận không tính.
DUONG_CONG_HIEP_KY = (DUONG_CONG - {(8, 7)}) | {(1, 7)}
DUONG_CONG_PHAI = ("lich_viet", "hiep_ky")

_TAM_HOP = ("申子辰", "寅午戌", "巳酉丑", "亥卯未")
_LUC_HOP = {frozenset(x) for x in ("子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未")}
_LUC_HAI = {frozenset(x) for x in ("子未", "丑午", "寅巳", "卯辰", "申亥", "酉戌")}


def _gz60(i: int) -> str:
    return GAN[i % 10] + ZHI[i % 12]


def _chi_so_60(gz: str) -> int:
    return V.JIA_ZI.index(gz)


def gz_ngay(d: dt.date) -> str:
    can, chi = lunar.can_chi_ngay(d)
    return GAN[lunar.CAN.index(can)] + ZHI[lunar.CHI.index(chi)]


@lru_cache(maxsize=4096)
def gz_thang(d: dt.date, tz: float = CALENDAR_MERIDIAN_TZ) -> str:
    """Can chi tháng theo tiết: tháng đổi TỪ NGÀY giao tiết (ngày địa phương theo `tz`), năm đổi từ ngày Lập xuân."""
    cuoi_ngay = dt.datetime(d.year, d.month, d.day, 23, 59, 59) - dt.timedelta(hours=tz)
    (_, kinh_do), _ = tk.tiet_bao_quanh(cuoi_ngay)
    k = ((kinh_do - 315) // 30) % 12                       # 0 = tháng Dần (Lập xuân)
    nam = d.year if cuoi_ngay >= tk.thoi_diem(d.year, 315) else d.year - 1
    can_nam = (nam - 4) % 10
    return GAN[(can_nam % 5 * 2 + 2 + k) % 10] + ZHI[(2 + k) % 12]


def _hex2(n: int) -> str:
    return f"{n:02X}"


def _nghi_ky(thang: str, ngay_gz: str) -> tuple[list[str], list[str]]:
    """Giải mã bảng DAY_YI_JI (cùng thuật toán LunarUtil.getDayYi/getDayJi, MIT)."""
    day, month = _hex2(_chi_so_60(ngay_gz)), _hex2(_chi_so_60(thang))
    right = V.DAY_YI_JI
    i = right.find(day + "=")
    while i > -1:
        right = right[i + 3:]
        left = right
        if "=" in left:
            left = left[:right.find("=") - 2]
        months = left[:left.find(":")]
        if any(months[j:j + 2] == month for j in range(0, len(months), 2)):
            ys = left[left.find(":") + 1:left.find(",")]
            js = left[left.find(",") + 1:]
            ma = lambda s: [V.YI_JI[int(s[j:j + 2], 16)] for j in range(0, len(s), 2)]  # noqa: E731
            return [x for x in ma(ys) if x != "无"], [x for x in ma(js) if x != "无"]
        i = right.find(day + "=")
    return [], []


def _than_sat(chi_thang: str, ngay_gz: str) -> tuple[list[str], list[str]]:
    m = (ZHI.index(chi_thang) - 2) % 12
    hit = re.search(f";{_chi_so_60(ngay_gz):02X}(.[^;]*)", V.DAY_SHEN_SHA[m])
    cat, hung = [], []
    if hit:
        data = hit.group(1)
        for j in range(0, len(data), 2):
            k = int(data[j:j + 2], 16)
            (cat if k < 60 else hung).append(V.SHEN_SHA[k])
    return cat, hung


def than_truc_nhat(chi_moc: str, chi: str) -> str:
    """Thần trực (12 thần hoàng/hắc đạo): ngày theo chi tháng, giờ theo chi ngày."""
    return THAN[(ZHI.index(chi) + _THAN_OFFSET[chi_moc]) % 12]


def ly_thuan_phong(thang_am: int, ngay_am: int) -> list[str]:
    """Giờ xuất hành Lý Thuần Phong (tiểu lục nhâm) cho 12 canh giờ Tý → Hợi: Đại an khởi tháng Giêng,
    đếm thuận tháng → ngày → giờ."""
    return [LY_THUAN_PHONG[(thang_am - 1 + ngay_am - 1 + h) % 6] for h in range(12)]


def la_duong_cong(ngay_am: int, thang_am: int, nhuan: bool = False, duong_cong: str = "lich_viet") -> bool:
    """Ngày Dương Công kỵ theo phái `duong_cong` (xem `DUONG_CONG_PHAI`)."""
    if duong_cong == "hiep_ky":
        return not nhuan and (ngay_am, thang_am) in DUONG_CONG_HIEP_KY
    if duong_cong != "lich_viet":
        raise ValueError(duong_cong)
    return (ngay_am, thang_am) in DUONG_CONG


def ky_dan_gian(ngay_am: int, thang_am: int, nhuan: bool = False, duong_cong: str = "lich_viet") -> list[str]:
    ra = []
    if ngay_am in TAM_NUONG:
        ra.append("tam_nuong")
    if ngay_am in NGUYET_KY:
        ra.append("nguyet_ky")
    if la_duong_cong(ngay_am, thang_am, nhuan, duong_cong):
        ra.append("duong_cong")
    return ra


# ---- Tứ Ly / Tứ Tuyệt theo định nghĩa sách (TP-1 sửa lỗi, chủ dự án duyệt 2026-11-27) --------------------------------
# Hiệp Kỷ q.9 «四離冬至夏至春分秋分各前一日»: Tứ Ly = một ngày trước Xuân phân (0°), Hạ chí (90°), Thu phân (180°),
# Đông chí (270°); Tứ Tuyệt = một ngày trước Lập xuân (315°), Lập hạ (45°), Lập thu (135°), Lập đông (225°). Ngày giao
# tiết lấy theo NGÀY ĐỊA PHƯƠNG (`tz`, mặc định giờ Việt Nam) — cùng quy ước tháng tiết của thẻ ngày. Cờ 四离 trong bảng
# thần sát (`hoang_lich_vendor.DAY_SHEN_SHA`) gần như không bao giờ trúng nghĩa sách (đo 2020–2025: 2 ngày, không ngày nào
# đúng) → thẻ ngày bỏ cờ của bảng, dùng hàm dưới đây. Một hàm dùng chung với `calc.trach_nhat_hiep_ky`.
_GOC_TU_LY = (0, 90, 180, 270)
_GOC_TU_TUYET = (315, 45, 135, 225)


@lru_cache(maxsize=1024)
def _ngay_tiet(nam: int, kinh_do: int, tz: float) -> dt.date:
    return (tk.thoi_diem(nam, kinh_do) + dt.timedelta(hours=tz)).date()


def _truoc_tiet(d: dt.date, cac_goc: tuple[int, ...], tz: float) -> bool:
    sau = d + dt.timedelta(days=1)
    return any(sau == _ngay_tiet(nam, g, tz) for nam in (d.year, d.year + 1) for g in cac_goc)


def la_tu_ly(d: dt.date, tz: float = CALENDAR_MERIDIAN_TZ) -> bool:
    return _truoc_tiet(d, _GOC_TU_LY, tz)


def la_tu_tuyet(d: dt.date, tz: float = CALENDAR_MERIDIAN_TZ) -> bool:
    return _truoc_tiet(d, _GOC_TU_TUYET, tz)


def sua_tu_ly(hung: list[str], d: dt.date, tz: float = CALENDAR_MERIDIAN_TZ) -> list[str]:
    """Danh sách hung sát của bảng, thay cờ 四离 của bảng bằng định nghĩa sách (`la_tu_ly`)."""
    ra = [x for x in hung if x != "四离"]
    if la_tu_ly(d, tz):
        ra.append("四离")
    return ra


# PT-NG5: nhãn tập quán của thông thư dân gian — CHỈ là nhãn, không vào luật chọn ngày.
# Thụ Tử: Hiệp Kỷ Biện Phương Thư q.6 ghi lịch cũ có thần này (tháng Dần khởi ở Tuất, sáu dương sáu âm xoay vòng) và đã bỏ.
THU_TU = dict(zip("寅卯辰巳午未申酉戌亥子丑", "戌辰亥巳子午丑未寅申卯酉"))


def nhan_tap_quan(chi_ngay: str, chi_thang: str, chi_nam: str) -> list[str]:
    """Ngày Tuế Phá (chi ngày xung chi năm — Hiệp Kỷ q.3 chỉ nói Tuế Phá là PHƯƠNG; gọi theo ngày là thói quen
    của thông thư) và ngày Thụ Tử (theo chi tháng tiết)."""
    ra = []
    if (ZHI.index(chi_ngay) - ZHI.index(chi_nam)) % 12 == 6:
        ra.append("tue_pha")
    if THU_TU[chi_thang] == chi_ngay:
        ra.append("thu_tu")
    return ra


def quan_he_tuoi(chi_ngay: str, chi_tuoi: str) -> str | None:
    """Quan hệ địa chi ngày ↔ tuổi: xung > tam_hop > luc_hop > hai > trung (cùng chi); không có → None."""
    if (ZHI.index(chi_ngay) - ZHI.index(chi_tuoi)) % 12 == 6:
        return "xung"
    if chi_ngay == chi_tuoi:
        return "trung"
    if any(chi_ngay in t and chi_tuoi in t for t in _TAM_HOP):
        return "tam_hop"
    cap = frozenset((chi_ngay, chi_tuoi))
    if cap in _LUC_HOP:
        return "luc_hop"
    if cap in _LUC_HAI:
        return "hai"
    return None


def ngay(d: dt.date, tz: float = CALENDAR_MERIDIAN_TZ, duong_cong: str = "lich_viet") -> dict:
    """Thẻ một ngày. `duong_cong`: phái Dương Công kỵ (TP-1, `DUONG_CONG_PHAI`; mặc định lịch dân gian Việt)."""
    ngay_gz, thang_gz = gz_ngay(d), gz_thang(d, tz)
    can_i, chi = GAN.index(ngay_gz[0]), ngay_gz[1]
    than = than_truc_nhat(thang_gz[1], chi)
    nghi, ky = _nghi_ky(thang_gz, ngay_gz)
    cat, hung = _than_sat(thang_gz[1], ngay_gz)
    hung = sua_tu_ly(hung, d, tz)
    tuan = (d.weekday() + 1) % 7                         # 0 = Chủ nhật (như bảng XIU)
    tu = V.XIU[chi + str(tuan)]
    ad, am, ay, nhuan = lunar.solar_to_lunar(d.day, d.month, d.year, tz)
    gio = []
    ltp = ly_thuan_phong(am, ad)
    for h in range(12):
        t = than_truc_nhat(chi, ZHI[h])
        gio.append({"chi": ZHI[h], "can": GAN[(can_i % 5 * 2 + h) % 10], "than": t, "hoang_dao": t in HOANG_DAO,
                    "ly_thuan_phong": ltp[h]})
    xung_chi = ZHI[(ZHI.index(chi) + 6) % 12]
    nam_gz = "".join(GAN[lunar.CAN.index(x)] if i == 0 else ZHI[lunar.CHI.index(x)]
                     for i, x in enumerate(lunar.can_chi_nam(ay)))
    return {
        "ngay": d.isoformat(), "tz": tz,
        "am": {"ngay": ad, "thang": am, "nam": ay, "nhuan": bool(nhuan)},
        "nam_gz": nam_gz,
        "thang_gz": thang_gz, "ngay_gz": ngay_gz,
        "truc": TRUC[(ZHI.index(chi) - ZHI.index(thang_gz[1])) % 12],
        "than": than, "hoang_dao": than in HOANG_DAO,
        "nghi": nghi, "ky": ky, "cat_than": cat, "hung_sat": hung,
        "tu": tu, "tu_cat": V.XIU_LUCK[tu] == "吉",
        "xung": {"can": _XUNG_GAN[can_i], "chi": xung_chi},
        "sat_phuong": _SAT[ZHI[ZHI.index(chi) % 4]],
        "banh_to": [V.PENG_ZU_GAN[can_i + 1], V.PENG_ZU_ZHI[ZHI.index(chi) + 1]],
        "huong": {"hy_than": V.POSITION_XI[can_i + 1], "tai_than": V.POSITION_CAI[can_i + 1],
                  "phuc_than": V.POSITION_FU_2[can_i + 1]},
        "thai_than": V.POSITION_TAI_DAY[_chi_so_60(ngay_gz)],
        "gio": gio,
        "ky_dan_gian": ky_dan_gian(ad, am, bool(nhuan), duong_cong),
        "nhan_tap_quan": nhan_tap_quan(chi, thang_gz[1], nam_gz[1]),
    }
