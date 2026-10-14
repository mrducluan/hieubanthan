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


def ky_dan_gian(ngay_am: int, thang_am: int) -> list[str]:
    ra = []
    if ngay_am in TAM_NUONG:
        ra.append("tam_nuong")
    if ngay_am in NGUYET_KY:
        ra.append("nguyet_ky")
    if (ngay_am, thang_am) in DUONG_CONG:
        ra.append("duong_cong")
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


def ngay(d: dt.date, tz: float = CALENDAR_MERIDIAN_TZ) -> dict:
    ngay_gz, thang_gz = gz_ngay(d), gz_thang(d, tz)
    can_i, chi = GAN.index(ngay_gz[0]), ngay_gz[1]
    than = than_truc_nhat(thang_gz[1], chi)
    nghi, ky = _nghi_ky(thang_gz, ngay_gz)
    cat, hung = _than_sat(thang_gz[1], ngay_gz)
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
    return {
        "ngay": d.isoformat(), "tz": tz,
        "am": {"ngay": ad, "thang": am, "nam": ay, "nhuan": bool(nhuan)},
        "nam_gz": "".join(GAN[lunar.CAN.index(x)] if i == 0 else ZHI[lunar.CHI.index(x)]
                          for i, x in enumerate(lunar.can_chi_nam(ay))),
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
        "ky_dan_gian": ky_dan_gian(ad, am),
    }
