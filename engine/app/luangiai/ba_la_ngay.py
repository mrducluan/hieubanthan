# -*- coding: utf-8 -*-
"""BT-UI — "Ba lá của ngày" (RULES, tất định): Lá Tarot · Lá Con số · Lá Thời khắc cho trang Hôm nay.

Chỉ GHÉP dữ liệu thẻ hôm nay đã tính + lá Tarot riêng của ngày (calc.tarot.la_ngay, KB tarot) — không câu mới, không
random, không LLM, không đổi theo ý định người dùng chọn trong ngày (lá đã lật giữ nguyên). Bản hợp pháp thay gacha
(docs/CO-CHE-RUI-RO-VA-THAY-THE.md §1): miễn phí, không giải thưởng, cùng người cùng ngày luôn cùng ba lá. Lá Tarot luôn
đọc xuôi (không doạ đầu ngày). Web chỉ hiển thị; "giờ tốt sắp tới" là web CHỌN trong danh sách này theo đồng hồ máy.
"""
from __future__ import annotations

import datetime as dt
import re

from app import config
from app.calc import tarot as calc_tarot
from app.kb import tarot_kb

_KHUNG = re.compile(r"(\d\d):(\d\d)–(\d\d):(\d\d)")

CACH_CHON = ("Ba lá chọn theo ngày sinh và ngày xem — cùng người, cùng ngày thì luôn cùng ba lá; ngày mai là ba lá khác. "
             "Lá Tarot luôn đọc xuôi. Đây là gợi ý để tự soi, không phải dự báo.")


def _phut(khung: str) -> tuple[int, int]:
    """'11:00–12:59' → (660, 780): phút bắt đầu, phút kết thúc (không gồm) tính từ 0 giờ."""
    m = _KHUNG.fullmatch(khung)
    if not m:
        return 0, 0
    a, b, c, d = (int(x) for x in m.groups())
    return a * 60 + b, c * 60 + d + 1


def _la_tarot(ngay_sinh: dt.date, ngay_xem: dt.date) -> dict:
    from app.kb import trang_tarot  # noqa: PLC0415 — tránh vòng import lúc nạp KB trang
    from app.luangiai import tarot as tr  # noqa: PLC0415
    x = calc_tarot.la_ngay(ngay_xem, ngay_sinh, muoi=config.LA_NGAY_MUOI)
    l = tarot_kb.la()[x["id"]]
    slug = dict(trang_tarot.ds_la_bai()).get(l["id"])
    return {**tr._tom_la(l, False), "tu_khoa": tr._tu_khoa(l, False)[:3], "y": l["y_xuoi"], "viec": l["viec"],
            "cau_tu_soi": l["cau_tu_soi"], "duong": f"{trang_tarot.DUONG_CUM}/{slug}" if slug else None}


def lap(ngay: int, thang: int, nam: int, ngay_xem: dt.date, *, ngay_ca_nhan: dict, viec_nho: dict | None,
        cau_hoi_them: str | None, hoang_lich: dict, que_ngay: dict | None, tom_lai: str) -> dict:
    gio = []
    for g in hoang_lich.get("gio_hoang_dao") or []:
        tu, den = _phut(g["khung"])
        gio.append({"chi": g["chi"], "khung": g["khung"], "than": g["than"], "tu": tu, "den": den})
    gio.sort(key=lambda g: g["tu"])
    q = que_ngay or None
    return {
        "tarot": _la_tarot(dt.date(nam, thang, ngay), ngay_xem),
        "so": {"so": ngay_ca_nhan["so"], "nghia": ngay_ca_nhan["nghia"], "viec": viec_nho, "cau_hoi": cau_hoi_them},
        "thoi_khac": {"gio": gio, "hoang_dao": bool(hoang_lich.get("hoang_dao")),
                      "nen": list(hoang_lich.get("nghi") or [])[:2], "kieng": list(hoang_lich.get("ky") or [])[:1],
                      "que": {"so": q["so"], "ten": q["ten"], "y": q.get("y_chinh"), "duong": q.get("duong")} if q else None},
        # Riêng tư: lá Tarot riêng chỉ được lên thẻ chia sẻ / lời nhắn soạn sẵn khi phép băm có muối bí mật (config.LA_NGAY_MUOI);
        # không muối thì lá + ngày xem đủ để quét ngược ngày sinh → web phải giấu lá trên thẻ.
        "chia_se_tarot": bool(config.LA_NGAY_MUOI),
        "cau_cua_ngay": tom_lai,
        "cach_chon": CACH_CHON,
    }
