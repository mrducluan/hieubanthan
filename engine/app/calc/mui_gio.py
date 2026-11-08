# -*- coding: utf-8 -*-
"""QTE-1 tuần 1 — múi giờ nơi sinh / nơi sống ở NƯỚC NGOÀI (tầng CALC, thuần, tất định).

Người dùng chọn nước + thành phố (không phải gõ UTC hay tự đoán giờ mùa hè). Máy tra cơ sở dữ liệu múi giờ IANA (gói
`tzdata` của hệ điều hành qua `zoneinfo`, có lịch sử đổi giờ từng nước) tại đúng ngày giờ sinh:
- `utc_chuan`: múi giờ CHUẨN (bỏ giờ mùa hè) — Bát tự dùng để so mốc tiết khí (`utc_noi_sinh`, EN-6 BI-3);
- `gio_mua_he`: lúc đó đồng hồ có đang chạy giờ mùa hè không — Tử vi trừ 1 giờ (ABROAD_LOCAL_TIME, quyết định 2026-09-30);
- `doi_gio`: giờ rơi vào lúc đổi giờ ("khong_ton_tai" khi đồng hồ nhảy qua, "lap_lai" khi giờ đó xảy ra hai lần);
- `can_xem_lai`: rơi lúc đổi giờ, hoặc sinh trước 1950 mà đang giờ mùa hè (giờ thời chiến: Anh 1941–1945 cộng 2 giờ, Mỹ
  1942–1945 giờ mùa hè cả năm — dữ liệu IANA báo phần "mùa hè" không chắc chắn, engine chỉ trừ 1 giờ) → báo người dùng.
Web chỉ gọi API rồi điền hai ô `utc_noi_sinh` + `gio_mua_he` sẵn có của hồ sơ (cột tài khoản 0033 không đổi).
Danh mục nước/thành phố: nơi có đông người Việt; nước nhiều múi giờ liệt kê thành phố. Không thấy nơi của mình →
form vẫn cho tự chọn UTC như trước.
"""
from __future__ import annotations

import datetime as dt
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

# (mã nước, tên, [(thành phố, IANA)]) — nước một múi giờ chỉ cần một dòng.
_NUOC: tuple[tuple[str, str, tuple[tuple[str, str], ...]], ...] = (
    ("us", "Hoa Kỳ (Mỹ)", (
        ("California (Los Angeles, Orange County, San Jose, San Francisco, San Diego)", "America/Los_Angeles"),
        ("Washington, Oregon (Seattle, Portland)", "America/Los_Angeles"),
        ("Nevada (Las Vegas)", "America/Los_Angeles"),
        ("Texas (Houston, Dallas, Austin, San Antonio)", "America/Chicago"),
        ("Illinois, Minnesota, Louisiana, Oklahoma (Chicago, New Orleans…)", "America/Chicago"),
        ("Colorado, Utah (Denver, Salt Lake City)", "America/Denver"),
        ("Arizona (Phoenix — không đổi giờ mùa hè)", "America/Phoenix"),
        ("New York, New Jersey, Pennsylvania, Massachusetts", "America/New_York"),
        ("Virginia, Maryland, Washington D.C., North Carolina", "America/New_York"),
        ("Georgia, Florida (Atlanta, Orlando, Miami)", "America/New_York"),
        ("Michigan, Ohio (Detroit, Columbus)", "America/Detroit"),
        ("Hawaii (Honolulu)", "Pacific/Honolulu"),
        ("Alaska (Anchorage)", "America/Anchorage"),
    )),
    ("ca", "Canada", (
        ("Ontario (Toronto, Ottawa)", "America/Toronto"), ("Québec (Montréal)", "America/Toronto"),
        ("British Columbia (Vancouver)", "America/Vancouver"), ("Alberta (Calgary, Edmonton)", "America/Edmonton"),
        ("Manitoba (Winnipeg)", "America/Winnipeg"), ("Nova Scotia (Halifax)", "America/Halifax"),
    )),
    ("au", "Úc (Australia)", (
        ("New South Wales, ACT (Sydney, Canberra)", "Australia/Sydney"), ("Victoria (Melbourne)", "Australia/Melbourne"),
        ("Queensland (Brisbane — không đổi giờ mùa hè)", "Australia/Brisbane"), ("South Australia (Adelaide)", "Australia/Adelaide"),
        ("Western Australia (Perth)", "Australia/Perth"), ("Northern Territory (Darwin)", "Australia/Darwin"),
        ("Tasmania (Hobart)", "Australia/Hobart"),
    )),
    ("nz", "New Zealand", (("Auckland, Wellington", "Pacific/Auckland"),)),
    ("jp", "Nhật Bản", (("Toàn quốc", "Asia/Tokyo"),)),
    ("kr", "Hàn Quốc", (("Toàn quốc", "Asia/Seoul"),)),
    ("tw", "Đài Loan", (("Toàn đảo", "Asia/Taipei"),)),
    ("cn", "Trung Quốc", (("Toàn quốc (giờ Bắc Kinh)", "Asia/Shanghai"),)),
    ("hk", "Hồng Kông", (("Hồng Kông", "Asia/Hong_Kong"),)),
    ("sg", "Singapore", (("Singapore", "Asia/Singapore"),)),
    ("my", "Malaysia", (("Toàn quốc", "Asia/Kuala_Lumpur"),)),
    ("th", "Thái Lan", (("Toàn quốc", "Asia/Bangkok"),)),
    ("kh", "Campuchia", (("Toàn quốc", "Asia/Phnom_Penh"),)),
    ("la", "Lào", (("Toàn quốc", "Asia/Vientiane"),)),
    ("ph", "Philippines", (("Toàn quốc", "Asia/Manila"),)),
    ("id", "Indonesia", (("Jakarta (miền Tây)", "Asia/Jakarta"),)),
    ("ae", "Các Tiểu vương quốc Ả Rập (UAE)", (("Dubai, Abu Dhabi", "Asia/Dubai"),)),
    ("fr", "Pháp", (("Toàn quốc", "Europe/Paris"),)),
    ("de", "Đức", (("Toàn quốc", "Europe/Berlin"),)),
    ("gb", "Anh (Vương quốc Anh)", (("Toàn quốc", "Europe/London"),)),
    ("cz", "Séc", (("Toàn quốc", "Europe/Prague"),)),
    ("pl", "Ba Lan", (("Toàn quốc", "Europe/Warsaw"),)),
    ("nl", "Hà Lan", (("Toàn quốc", "Europe/Amsterdam"),)),
    ("be", "Bỉ", (("Toàn quốc", "Europe/Brussels"),)),
    ("ch", "Thuỵ Sĩ", (("Toàn quốc", "Europe/Zurich"),)),
    ("it", "Ý", (("Toàn quốc", "Europe/Rome"),)),
    ("es", "Tây Ban Nha", (("Lục địa", "Europe/Madrid"),)),
    ("se", "Thuỵ Điển", (("Toàn quốc", "Europe/Stockholm"),)),
    ("no", "Na Uy", (("Toàn quốc", "Europe/Oslo"),)),
    ("dk", "Đan Mạch", (("Toàn quốc", "Europe/Copenhagen"),)),
    ("fi", "Phần Lan", (("Toàn quốc", "Europe/Helsinki"),)),
    ("hu", "Hungary", (("Toàn quốc", "Europe/Budapest"),)),
    ("sk", "Slovakia", (("Toàn quốc", "Europe/Bratislava"),)),
    ("bg", "Bulgaria", (("Toàn quốc", "Europe/Sofia"),)),
    ("ua", "Ukraine", (("Kyiv, Kharkiv, Odesa", "Europe/Kyiv"),)),
    ("ru", "Nga", (("Moskva, Sankt-Peterburg", "Europe/Moscow"), ("Novosibirsk", "Asia/Novosibirsk"),
                   ("Vladivostok", "Asia/Vladivostok"))),
)

_HOP_LE = {z for _, _, tp in _NUOC for _, z in tp}


def danh_muc() -> list[dict]:
    return [{"ma": ma, "ten": ten, "thanh_pho": [{"ten": t, "mui_gio": z} for t, z in tp]} for ma, ten, tp in _NUOC]


def _zone(ten: str) -> ZoneInfo:
    if ten not in _HOP_LE:
        raise ValueError("Múi giờ không có trong danh mục nơi ở nước ngoài")
    try:
        return ZoneInfo(ten)
    except (ZoneInfoNotFoundError, ValueError) as e:   # máy chủ thiếu tzdata
        raise ValueError("Máy chủ chưa có dữ liệu múi giờ") from e


def _gio(off: dt.timedelta | None) -> float:
    return round((off or dt.timedelta()).total_seconds() / 3600, 2)


def tinh(ten_mui_gio: str, ngay: dt.date, gio: str) -> dict:
    """Ngày giờ đồng hồ tại nơi sinh → {utc_chuan, gio_mua_he, chenh_mua_he, doi_gio, can_xem_lai}."""
    z = _zone(ten_mui_gio)
    h, m = int(gio[:2]), int(gio[3:5])
    if not (0 <= h <= 23 and 0 <= m <= 59):
        raise ValueError("Giờ sinh không hợp lệ")
    t0 = dt.datetime(ngay.year, ngay.month, ngay.day, h, m, tzinfo=z, fold=0)
    t1 = t0.replace(fold=1)
    doi_gio = None
    if t0.utcoffset() != t1.utcoffset():
        # Hai cách hiểu cho cùng một giờ đồng hồ. Đi một vòng UTC → nếu không về đúng giờ đã nhập thì giờ đó không tồn tại.
        quay_lai = t0.astimezone(dt.timezone.utc).astimezone(z)
        doi_gio = "lap_lai" if (quay_lai.hour, quay_lai.minute) == (h, m) else "khong_ton_tai"
    dst = _gio(t0.dst())
    return {"mui_gio": ten_mui_gio, "utc_chuan": _gio(t0.utcoffset()) - dst, "utc_dong_ho": _gio(t0.utcoffset()),
            "gio_mua_he": dst != 0, "chenh_mua_he": dst, "doi_gio": doi_gio,
            "can_xem_lai": dst not in (0.0, 1.0) or doi_gio is not None or (dst != 0 and ngay.year < 1950)}


def hom_nay(ten_mui_gio: str | None, luc_nay: dt.datetime | None = None) -> dt.date:
    """Ngày hôm nay ở nơi đang sống; không khai → giờ Việt Nam (như cũ)."""
    luc_nay = luc_nay or dt.datetime.now(dt.timezone.utc)
    if not ten_mui_gio:
        return luc_nay.astimezone(dt.timezone(dt.timedelta(hours=7))).date()
    return luc_nay.astimezone(_zone(ten_mui_gio)).date()
