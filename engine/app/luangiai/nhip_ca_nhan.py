"""NHIP-1 — nhịp cá nhân gọn: ngày, tháng, tháng tới, năm (còn bao nhiêu ngày), năm tới.

Dùng cho thẻ "Chào lại" ở trang chủ, khối nhịp ở /ban-than và thẻ chia sẻ "Hôm nay mình là ngày N".
Cùng phép tính và KB với "Hôm nay của bạn" (mốc năm cá nhân 1/1 dương như trang đọc) nhưng nhẹ hơn: không âm lịch,
không hoàng lịch, không ý định. Không dự báo sự kiện, không gọi LLM.
"""
from __future__ import annotations

import datetime as dt

from app.calc import thanso, thanso_mo_rong as mr
from app.kb import store, thanso_v2


def _thang(d: int, m: int, nam: int, thang: int) -> dict:
    so = mr.thang_ca_nhan(d, m, nam, thang)
    n = thanso_v2.nghia_phu("thang_ca_nhan", so) or {}
    return {"so": so, "thang": thang, "nam": nam, "chu_de": n.get("chu_de"), "nen": n.get("nen")}


def _nam(d: int, m: int, nam: int) -> dict:
    so = int(thanso.nam_ca_nhan(d, m, nam, "duong_lich"))
    n = store.nghia_nam_ca_nhan(so) or {}
    return {"so": so, "nam": nam, "chu_de": n.get("chu_de"), "nen": n.get("nen")}


def nhip_ca_nhan(ngay: int, thang: int, nam: int, ngay_xem: dt.date) -> dict:
    y, m, d = ngay_xem.year, ngay_xem.month, ngay_xem.day
    so_ngay = mr.ngay_ca_nhan(ngay, thang, y, m, d)
    ty, tm = (y + 1, 1) if m == 12 else (y, m + 1)
    meta = thanso_v2.meta_phu()
    return {
        "ngay_xem": ngay_xem.isoformat(),
        "ngay_ca_nhan": {"so": so_ngay, "nghia": thanso_v2.nghia_phu("ngay_ca_nhan", so_ngay),
                         "tu_soi": thanso_v2.nghia_phu("ngay_ca_nhan_tu_soi", so_ngay)},
        "thang_ca_nhan": _thang(ngay, thang, y, m),
        "thang_toi": _thang(ngay, thang, ty, tm),
        "nam_ca_nhan": {**_nam(ngay, thang, y), "con_ngay": (dt.date(y, 12, 31) - ngay_xem).days,
                        "tong_ngay": (dt.date(y, 12, 31) - dt.date(y, 1, 1)).days + 1},
        "nam_toi": _nam(ngay, thang, y + 1),
        "nguon": meta["nguon"], "source_id": meta["source_id"], "school_id": meta["school_id"],
        "trang_thai": meta["trang_thai"],
        "luu_y": "Nhịp theo thần số học để tự soi — gợi chủ đề, không dự báo việc sẽ xảy ra.",
    }
