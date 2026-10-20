"""TS-V3b — "Thẻ hôm nay": ngày cá nhân (Pitago) + số nổi bật của bạn qua hai phái (Pitago · Chaldea).

Ghép từ các phần đã có: `nhip_ca_nhan` (ngày cá nhân, cùng mốc và KB với Hôm nay) và `tong_hop.so_noi_bat` (số lặp ở
nhiều nguồn tính độc lập — cần họ tên). Dùng cho thẻ chia sẻ. Không dự báo sự kiện, không gọi LLM, không lưu.
"""
from __future__ import annotations

import datetime as dt

from app.luangiai import nhip_ca_nhan, tong_hop


def the_ngay(ho_ten: list[str] | None, ngay: int, thang: int, nam: int, ngay_xem: dt.date,
             quy_uoc: str = "tong_het") -> dict:
    nhip = nhip_ca_nhan.nhip_ca_nhan(ngay, thang, nam, ngay_xem)
    noi_bat = None
    if ho_ten:
        nb = tong_hop.so_noi_bat(tong_hop.ho_so(ho_ten, ngay, thang, nam, quy_uoc))
        if nb:
            noi_bat = {k: nb[0][k] for k in ("goc", "lan", "phai", "tu_khoa")}
    return {
        "ngay_xem": nhip["ngay_xem"],
        "ngay_ca_nhan": nhip["ngay_ca_nhan"],
        "so_noi_bat": noi_bat,
        "nguon": nhip["nguon"], "source_id": nhip["source_id"], "school_id": nhip["school_id"],
        "trang_thai": nhip["trang_thai"],
        "luu_y": "Nhịp theo thần số học để tự soi — gợi chủ đề, không dự báo việc sẽ xảy ra.",
    }
