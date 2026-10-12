# -*- coding: utf-8 -*-
"""HN-1 — "Hôm nay của bạn": thẻ mỗi ngày cho khâu QUAY LẠI (docs/MUC-TIEU-TANG-TRUONG.md).

Chỉ ghép: số đã tính (ngày/tháng/năm cá nhân — CALC thần số, mốc 1/1 dương lịch như trang đọc) + âm lịch và can chi
của ngày xem (CALC lịch, âm lịch Việt Nam UTC+7) + nghĩa trong KB (`thanso_chi_so_phu`, nháp AI có nhãn). Không gọi
LLM, không dự báo sự kiện. Có "ngày mai" để người dùng có lý do mở lại hôm sau.
"""
from __future__ import annotations

import datetime as dt

from app.calc import lunar, thanso, thanso_mo_rong as mr
from app.config import CALENDAR_MERIDIAN_TZ
from app.kb import store, thanso_v2


def _ngay(so: int) -> dict:
    return {"so": so, "nghia": thanso_v2.nghia_phu("ngay_ca_nhan", so),
            "tu_soi": thanso_v2.nghia_phu("ngay_ca_nhan_tu_soi", so)}


def the_hom_nay(ngay: int, thang: int, nam: int, ngay_xem: dt.date) -> dict:
    y, m, d = ngay_xem.year, ngay_xem.month, ngay_xem.day
    so_ngay = mr.ngay_ca_nhan(ngay, thang, y, m, d)
    so_thang = mr.thang_ca_nhan(ngay, thang, y, m)
    so_nam = int(thanso.nam_ca_nhan(ngay, thang, y, "duong_lich"))
    nghia_thang = thanso_v2.nghia_phu("thang_ca_nhan", so_thang) or {}
    nghia_nam = store.nghia_nam_ca_nhan(so_nam) or {}

    ad, am, ay, nhuan = lunar.solar_to_lunar(d, m, y, CALENDAR_MERIDIAN_TZ)
    mai = ngay_xem + dt.timedelta(days=1)
    so_mai = mr.ngay_ca_nhan(ngay, thang, mai.year, mai.month, mai.day)
    meta = thanso_v2.meta_phu()
    return {
        "ngay_xem": ngay_xem.isoformat(),
        "am_lich": {
            "ngay": ad, "thang": am, "nam": ay, "nhuan": bool(nhuan),
            "can_chi_ngay": " ".join(lunar.can_chi_ngay(ngay_xem)),
            "can_chi_thang": " ".join(lunar.can_chi_thang(am, ay)),
            "can_chi_nam": " ".join(lunar.can_chi_nam(ay)),
        },
        "ngay_ca_nhan": _ngay(so_ngay),
        "thang_ca_nhan": {"so": so_thang, "thang": m, "chu_de": nghia_thang.get("chu_de"),
                          "nen": nghia_thang.get("nen"), "tranh": nghia_thang.get("tranh")},
        "nam_ca_nhan": {"so": so_nam, "nam": y, "chu_de": nghia_nam.get("chu_de"),
                        "nen": nghia_nam.get("nen"), "tranh": nghia_nam.get("tranh")},
        "ngay_mai": {"ngay": mai.isoformat(), **_ngay(so_mai)},
        "nguon": meta["nguon"], "source_id": meta["source_id"], "school_id": meta["school_id"],
        "trang_thai": meta["trang_thai"],
        "luu_y": "Nhịp theo thần số học để tự soi — gợi chủ đề, không dự báo việc sẽ xảy ra.",
    }
