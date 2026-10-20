"""TS-V3b — "Thẻ hôm nay": ngày cá nhân (Pitago) + số nổi bật của bạn qua ba phái + chữ Hebrew của ngày (Qabalah).

Ghép từ các phần đã có: `nhip_ca_nhan` (ngày cá nhân, cùng mốc và KB với Hôm nay), `tong_hop.so_noi_bat` (số lặp ở
nhiều nguồn tính độc lập — cần họ tên) và `calc/thanso_kabbalah.chu_cua_ngay`. Dùng cho thẻ chia sẻ. Không dự báo sự
kiện, không gọi LLM, không lưu.
"""
from __future__ import annotations

import datetime as dt

from app.calc import thanso_kabbalah as kc
from app.kb import thanso_v2 as kb
from app.luangiai import nhip_ca_nhan, tong_hop


def the_ngay(ho_ten: list[str] | None, ngay: int, thang: int, nam: int, ngay_xem: dt.date,
             quy_uoc: str = "tong_het") -> dict:
    nhip = nhip_ca_nhan.nhip_ca_nhan(ngay, thang, nam, ngay_xem)
    chu = kc.chu_cua_ngay(ngay, thang, ngay_xem.day, ngay_xem.month, ngay_xem.year)
    van = kb.kabbalah_chu_ngay()
    noi_bat = None
    if ho_ten:
        nb = tong_hop.so_noi_bat(tong_hop.ho_so(ho_ten, ngay, thang, nam, quy_uoc))
        if nb:
            noi_bat = {k: nb[0][k] for k in ("goc", "lan", "phai", "tu_khoa")}
    meta = kb.meta_kabbalah()
    return {
        "ngay_xem": nhip["ngay_xem"],
        "ngay_ca_nhan": nhip["ngay_ca_nhan"],
        "so_noi_bat": noi_bat,
        "chu_ngay": {**chu, "nghia": kb.kabbalah_chu(chu["chu"]), "cach_tinh": van["cach_tinh"]},
        "nguon": [nhip["nguon"], meta["nguon"]],
        "source_id": [nhip["source_id"], meta["source_id"]],
        "school_id": [nhip["school_id"], meta["school_id"]],
        "trang_thai": meta["trang_thai"],
        "luu_y": van["luu_y"],
    }
