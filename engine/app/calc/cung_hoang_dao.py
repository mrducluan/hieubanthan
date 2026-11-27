# -*- coding: utf-8 -*-
"""CHT-1 — cung hoàng đạo (cung Mặt Trời) theo ngày sinh, tầng CALC, tất định.

Mốc vào cung = thời điểm Mặt Trời đạt kinh độ hoàng đạo biểu kiến 30°·k (hoàng đạo chí tuyến của chiêm tinh phương Tây):
MỘT bộ tính với tiết khí (`calc.tietkhi.thoi_diem` — cùng hàm dựng Lập xuân, xuân phân của Bát tự, Hoàng lịch) và với vị trí
Mặt Trời của bản đồ sao (`chiem_tinh_lich` dùng chung `tietkhi`). Không viết lại phép tính thiên văn.

Giờ đồng hồ Việt Nam theo bảng múi giờ lịch sử `config.clock_offset` (miền Bắc trước 1968, miền Nam 1960–1975 chạy UTC+8).
Ranh giới ngày = 00:00 giờ đồng hồ nơi sinh. Sai số mốc ≤ ~1 phút (giới hạn của `tietkhi`): sinh cách mốc dưới 5 phút được
gắn cờ `sat_moc`.
"""
from __future__ import annotations

import datetime as dt
from collections import Counter

from app import config
from app.calc import tietkhi
from app.calc.chiem_tinh_lich import CUNG_HOANG_DAO as CUNG

NAM_TU, NAM_DEN = 1900, 2100          # khoảng tra cứu (bảng múi giờ + chuỗi Mặt Trời đã kiểm)
SAT_MOC_PHUT = 5


def _i(ma: str) -> int:
    if ma not in CUNG:
        raise ValueError(f"mã cung lạ: {ma}")
    return CUNG.index(ma)


def vao_cung_utc(nam: int, ma: str) -> dt.datetime:
    """Thời điểm (UTC, naive) Mặt Trời vào cung `ma` trong năm dương lịch `nam` (Bảo Bình, Song Ngư: tháng 1, 2)."""
    return tietkhi.thoi_diem(nam, 30 * _i(ma))


def khoang_cung(nam: int, ma: str) -> dict:
    """Khoảng thời gian Mặt Trời ở cung `ma`, bắt đầu trong năm `nam` (Ma Kết: tháng 12 năm `nam` → tháng 1 năm sau)."""
    i = _i(ma)
    sau = CUNG[(i + 1) % 12]
    return {"ma": ma, "bat_dau_utc": vao_cung_utc(nam, ma),
            "ket_thuc_utc": vao_cung_utc(nam + (1 if ma == "ma_ket" else 0), sau)}


def khoang_nam(nam: int) -> list[dict]:
    """12 cung theo thứ tự hoàng đạo (Bạch Dương → Song Ngư), mỗi cung khoảng bắt đầu trong năm `nam`."""
    return [khoang_cung(nam, ma) for ma in CUNG]


def cung_luc(t_utc: dt.datetime) -> str:
    """Cung Mặt Trời tại thời điểm UTC (naive)."""
    return CUNG[int(tietkhi.kinh_do_mat_troi(t_utc) // 30) % 12]


def lech_gio(ngay: dt.date, vung: str = "north") -> float:
    """Múi giờ đồng hồ Việt Nam (giờ) tại ngày `ngay`, theo vùng nơi sinh."""
    return config.clock_offset(ngay, config.Region(vung))[0]


def gio_dia_phuong(t_utc: dt.datetime, vung: str = "north") -> dt.datetime:
    """Đổi một thời điểm UTC sang giờ đồng hồ Việt Nam lúc ấy (thử offset theo ngày UTC và ngày đã đổi)."""
    off = lech_gio(t_utc.date(), vung)
    t = t_utc + dt.timedelta(hours=off)
    off2 = lech_gio(t.date(), vung)
    return t_utc + dt.timedelta(hours=off2) if off2 != off else t


def _phut(s: str) -> int:
    try:
        h, m = (int(x) for x in s.split(":"))
    except (AttributeError, ValueError):
        raise ValueError("giờ sinh phải có dạng HH:MM") from None
    if not (0 <= h < 24 and 0 <= m < 60):
        raise ValueError("giờ sinh phải có dạng HH:MM")
    return h * 60 + m


def tra_ngay(ngay: dt.date, gio: str | None = None, vung: str = "north") -> dict:
    """Cung Mặt Trời của người sinh ngày `ngay` (giờ đồng hồ Việt Nam).

    → {ngay, utc_lech, cung (mã | None khi ngày giáp ranh mà chưa có giờ), giap_ranh, cung_truoc, cung_sau,
       moc: {gio "HH:MM", utc ISO} | None, sat_moc}. Không lưu gì."""
    if not (NAM_TU <= ngay.year <= NAM_DEN):
        raise ValueError(f"chỉ tra năm {NAM_TU}–{NAM_DEN}")
    if vung not in ("north", "south"):
        raise ValueError("vùng phải là north hoặc south")
    p = _phut(gio) if gio is not None else None
    off = lech_gio(ngay, vung)
    dau = dt.datetime(ngay.year, ngay.month, ngay.day) - dt.timedelta(hours=off)
    cuoi = dau + dt.timedelta(days=1) - dt.timedelta(seconds=1)
    c0, c1 = cung_luc(dau), cung_luc(cuoi)
    kq = {"ngay": ngay.isoformat(), "utc_lech": off, "giap_ranh": c0 != c1, "cung_truoc": c0, "cung_sau": c1,
          "moc": None, "sat_moc": False, "cung": c0 if c0 == c1 else None}
    if c0 != c1:
        moc = vao_cung_utc(ngay.year, c1)
        dp = gio_dia_phuong(moc, vung)
        kq["moc"] = {"gio": dp.strftime("%H:%M"), "utc": moc.isoformat() + "Z"}
        if p is not None:
            pm = dp.hour * 60 + dp.minute
            kq["cung"] = c0 if p < pm else c1
            kq["sat_moc"] = abs(p - pm) < SAT_MOC_PHUT
    return kq


def thong_ke_bat_dau(ma: str, tu: int, den: int, vung: str = "north") -> Counter:
    """{(tháng, ngày): số năm} — ngày (giờ đồng hồ Việt Nam) Mặt Trời vào cung `ma`, trong các năm `tu`…`den`."""
    dem: Counter = Counter()
    for nam in range(tu, den + 1):
        t = gio_dia_phuong(vao_cung_utc(nam, ma), vung)
        dem[(t.month, t.day)] += 1
    return dem
