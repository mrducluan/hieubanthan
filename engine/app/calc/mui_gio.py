# -*- coding: utf-8 -*-
"""QTE-2 giai đoạn 0 — múi giờ nơi sinh ở NƯỚC NGOÀI theo nước + thành phố (tzdata IANA qua `zoneinfo`, không thư viện mới).

Trước đây (EN-6 BI-3) người dùng tự khai hai ô "múi giờ chuẩn" + "đang giờ mùa hè" — ít ai nhớ. Nay chọn thành phố (hoặc
gửi thẳng mã vùng IANA) → `tai()` trả:
  - `utc_chuan`: múi giờ CHUẨN (không giờ mùa hè) tại ngày giờ sinh, bội 0,25 — đúng nghĩa `utc_noi_sinh` cũ;
  - `gio_mua_he`: đồng hồ lúc đó đang chạy giờ mùa hè (→ `_DauVao` trừ 1 giờ như khai tay);
  - `lech`: tổng lệch UTC đang dùng; `lech_chinh_xac` khi múi giờ địa phương lẻ (LMT đầu thế kỷ) → `lam_tron` True;
  - `gio_mo_ho`: giờ không tồn tại / tồn tại hai lần quanh mốc đổi giờ (lấy nếp đầu, fold = 0).
Lịch sử múi giờ (Nga 1990 vs 2012, Anh 1968–71, Singapore +7:30, Trung Quốc giờ hè 1986–91…) là của tzdata — engine
không tự chép bảng. Tầng CALC: dữ liệu tĩnh + tra cứu thuần, không gọi mạng.
"""
from __future__ import annotations

import datetime as _dt
import json
import re
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError, available_timezones

_F = Path(__file__).parent / "data" / "mui_gio.json"
_ZONE = re.compile(r"^[A-Z][A-Za-z_]+(?:/[A-Za-z0-9_+\-]+){1,2}$")
_MA_TP = re.compile(r"^[a-z]{2}-[a-z0-9_]{2,40}$")
# Ý6/H1: mùa chỉ đảo rõ ngoài chí tuyến Nam (cùng số với `battu_api.CHI_TUYEN_NAM` — test khoá hai nơi bằng nhau);
# lệch giờ mặt trời trung bình ≥ 30 phút (nửa canh giờ) → đáng nhắc công tắc "Giờ mặt trời thực".
CHI_TUYEN_NAM = -23.44
NGUONG_CANH_BAO_PHUT = 30


@lru_cache(maxsize=1)
def _d() -> dict:
    return json.loads(_F.read_text(encoding="utf-8"))


def danh_sach() -> list[dict]:
    """[{ma, ten, ten_en, thanh_pho: [{ma, ten, ten_en, zone}]}] — thứ tự như tệp (nước đông người Việt trước)."""
    return _d()["nuoc"]


@lru_cache(maxsize=1)
def _tp() -> dict[str, dict]:
    ra = {}
    for n in _d()["nuoc"]:
        for t in n["thanh_pho"]:
            ra[t["ma"]] = {**t, "nuoc": n["ma"], "ten_nuoc": n["ten"]}
    return ra


def thanh_pho(ma: str) -> dict | None:
    return _tp().get(ma)


def nam_ban_cau_kha_dung(vi_do: float | None) -> bool:
    return vi_do is not None and vi_do <= CHI_TUYEN_NAM


def lech_mat_troi_phut(kinh_do: float | None, utc_chuan: float) -> int | None:
    """Lệch giờ mặt trời TRUNG BÌNH so với giờ chuẩn của múi (4 phút/độ kinh so với kinh tuyến múi); phương trình thời gian
    (±16 phút theo ngày) không tính ở đây — đó là việc của `timebase` khi lập lá số."""
    if kinh_do is None:
        return None
    return int(round(kinh_do * 4.0 - utc_chuan * 60.0))


def utc_chuan_nam(zone: str, nam: int) -> float:
    """Múi giờ CHUẨN (không giờ mùa hè) của vùng trong năm `nam` — lấy tại 15/01 và 15/07, giá trị nhỏ hơn là giờ chuẩn
    (Nam bán cầu giờ mùa hè rơi vào tháng 1)."""
    a = tai(zone, nam, 1, 15, 12)
    b = tai(zone, nam, 7, 15, 12)
    return min(a["utc_chuan"], b["utc_chuan"])


@lru_cache(maxsize=4)
def danh_sach_day_du(nam: int) -> list[dict]:
    """Ý6 — danh sách nước + thành phố kèm cờ cho form hồ sơ: `utc_chuan` (năm `nam`), `lech_mat_troi_phut`,
    `canh_bao_mat_troi` (|lệch| ≥ 30 phút), `nam_ban_cau_kha_dung` — web chỉ hiển thị, không tự tính."""
    ra = []
    for n in _d()["nuoc"]:
        tp = []
        for t in n["thanh_pho"]:
            chuan = utc_chuan_nam(t["zone"], nam)
            lech = lech_mat_troi_phut(t.get("kinh_do"), chuan)
            tp.append({**t, "utc_chuan": chuan, "lech_mat_troi_phut": lech,
                       "canh_bao_mat_troi": lech is not None and abs(lech) >= NGUONG_CANH_BAO_PHUT,
                       "nam_ban_cau_kha_dung": nam_ban_cau_kha_dung(t.get("vi_do"))})
        ra.append({**n, "thanh_pho": tp})
    return ra


@lru_cache(maxsize=1)
def _co() -> frozenset[str]:
    return frozenset(available_timezones())


def hop_le(zone: str) -> bool:
    """Mã vùng IANA có trong tzdata của máy (phân biệt hoa thường, chặn chuỗi lạ / đường dẫn)."""
    return bool(zone) and bool(_ZONE.match(zone)) and zone in _co()


def zone_tu(ma_hoac_zone: str) -> str:
    """Mã thành phố ("us-san_jose") hoặc mã vùng IANA → mã vùng IANA; không hợp lệ → ValueError."""
    if _MA_TP.match(ma_hoac_zone or ""):
        t = thanh_pho(ma_hoac_zone)
        if t:
            return t["zone"]
    if hop_le(ma_hoac_zone):
        return ma_hoac_zone
    raise ValueError("Múi giờ / thành phố không có trong danh sách")


def _gio(td: _dt.timedelta | None) -> float:
    return (td or _dt.timedelta(0)).total_seconds() / 3600


def tai(zone: str, nam: int, thang: int, ngay: int, gio: int, phut: int = 0) -> dict:
    z = zone_tu(zone)
    try:
        tz = ZoneInfo(z)
    except ZoneInfoNotFoundError as e:   # tzdata máy chủ thiếu (ảnh Docker) → lỗi rõ, không 500 mờ
        raise ValueError("Máy chủ thiếu dữ liệu múi giờ") from e
    t0 = _dt.datetime(nam, thang, ngay, gio, phut, tzinfo=tz)
    lech = _gio(t0.utcoffset())
    dst = _gio(t0.dst())
    chuan = lech - dst
    # Giờ mơ hồ: nếp 1 cho lệch khác nếp 0 (giờ tồn tại hai lần), hoặc đổi sang UTC rồi quay lại không ra giờ cũ (không tồn tại).
    t1 = t0.replace(fold=1)
    mo_ho = t1.utcoffset() != t0.utcoffset() or t0.astimezone(_dt.timezone.utc).astimezone(tz).replace(tzinfo=None) != t0.replace(tzinfo=None)
    chuan_tron = round(chuan * 4) / 4
    return {
        "zone": z,
        "utc_chuan": chuan_tron,
        "gio_mua_he": dst > 0,
        "lech": round(lech * 4) / 4,
        "lech_chinh_xac": round(lech, 5),
        "lam_tron": abs(chuan - chuan_tron) > 1e-9,
        "gio_mo_ho": bool(mo_ho),
    }
