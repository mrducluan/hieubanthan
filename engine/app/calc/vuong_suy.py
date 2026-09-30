# -*- coding: utf-8 -*-
"""Lục Hào — vượng suy của một hào theo nguyệt kiến, nhật thần và tuần không (tầng CALC).

Nguồn luật: Tăng San Bốc Dịch (Dã Hạc Lão Nhân) — bản rút gọn, công bố rõ:
  - nguyệt lệnh: cùng hành tháng → vượng · tháng sinh → tướng · sinh tháng → hưu ·
    khắc tháng → tù · bị tháng khắc → tử (tháng theo TIẾT, không theo mùng 1);
  - nhật thần: lâm nhật / nhật sinh / nhật hợp (lục hợp) / nhật xung / nhật khắc;
  - tuần không: hai chi không vong của tuần chứa ngày can chi.
Tổng hợp `tong` là thang đơn giản (vượng tướng hoặc lâm/sinh nhật → +, tù tử hoặc nhật khắc → −,
không vong → ghi riêng). Không tính ám động, nhật phá, hồi đầu sinh khắc, ứng kỳ.
"""
from __future__ import annotations

import datetime as dt

from app import config
from app.calc import battu, tietkhi as tk
from app.calc.kinhdich_vendor import KHAC, SINH
from app.calc.lunar import CAN, CHI

CHI_NH = dict(zip(CHI, battu.CHI_NH))


def nguyet_lenh(hanh: str, chi_thang: str) -> str:
    t = CHI_NH[chi_thang]
    if hanh == t:
        return "vượng"
    if SINH[t] == hanh:
        return "tướng"
    if SINH[hanh] == t:
        return "hưu"
    if KHAC[hanh] == t:
        return "tù"
    return "tử"


def tuan_khong(can: str, chi: str) -> list[str]:
    i = (6 * CAN.index(can) - 5 * CHI.index(chi)) % 60
    dau = i - i % 10                                   # can Giáp đầu tuần
    return [CHI[(dau + 10) % 12], CHI[(dau + 11) % 12]]


def nhat_than(chi_hao: str, chi_ngay: str) -> str:
    if chi_hao == chi_ngay:
        return "lâm nhật"
    q = battu.quan_he_chi(chi_hao, chi_ngay)
    if q == "lục xung":
        return "nhật xung"
    if q == "lục hợp":
        return "nhật hợp"
    a, b = CHI_NH[chi_hao], CHI_NH[chi_ngay]
    if SINH[b] == a:
        return "nhật sinh"
    if KHAC[b] == a:
        return "nhật khắc"
    return "không"


def thoi_gian(lich: dt.datetime) -> dict:
    """Tháng (theo tiết) và ngày can chi tại `lich` (giờ theo kinh tuyến lịch UTC+7)."""
    t_utc = lich - dt.timedelta(hours=config.CALENDAR_MERIDIAN_TZ)
    (_, g), _ = tk.tiet_bao_quanh(t_utc)
    chi_thang = CHI[(2 + ((g - 315) % 360) // 30) % 12]
    ls = battu.la_so(lich, "nam")
    can_ngay, chi_ngay = ls["tru"][2]["can"], ls["tru"][2]["chi"]
    return {"chi_thang": chi_thang, "can_ngay": can_ngay, "chi_ngay": chi_ngay,
            "tuan_khong": tuan_khong(can_ngay, chi_ngay)}


def danh_gia(chi_hao: str, hanh_hao: str, tg: dict) -> dict:
    nl = nguyet_lenh(hanh_hao, tg["chi_thang"])
    nt = nhat_than(chi_hao, tg["chi_ngay"])
    diem = (1 if nl in ("vượng", "tướng") else -1 if nl in ("tù", "tử") else 0) + \
           (1 if nt in ("lâm nhật", "nhật sinh", "nhật hợp") else -1 if nt == "nhật khắc" else 0)
    return {"nguyet_lenh": nl, "nhat_than": nt, "tuan_khong": chi_hao in tg["tuan_khong"],
            "tong": "vượng" if diem > 0 else "suy" if diem < 0 else "bình"}
