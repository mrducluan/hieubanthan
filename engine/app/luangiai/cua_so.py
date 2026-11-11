# -*- coding: utf-8 -*-
"""EN-5.4 — CỬA SỔ THÁNG cho một quyết định có khung thời gian ("có nên đổi việc trong 6 tháng tới"). RULES tất định:
dùng đúng các hàm tháng của Thời gian tới (Tử vi: nhịp tháng âm `tuvi_nhip_3_thang`; Bát tự: tháng theo tiết) — một bộ
tính, không chấm lại. Không trả lời có/không: chỉ nói tháng nào thuận hơn để làm phần chính, tháng nào nên đi chậm."""
from __future__ import annotations

import datetime as dt
import math
import re

from app import ngon_ngu
from app.kb.loi import L

from app.luangiai import doi_song_khuon as kh
from app.luangiai import thoi_gian_toi as tgt


def lap(mo_dun: str, sinh: dict, tu: dt.date, so_thang: int, ls: dict | None = None) -> dict:
    so_thang = max(1, min(so_thang, 12))
    if mo_dun == "tuvi":
        # tháng âm đầu có thể bắt đầu trước `tu` gần một tháng → chạy thêm một lượt 3 tháng để phủ hết cửa sổ
        ds = tgt._tv_thang(sinh, tu, math.ceil(so_thang / 3) + 1, ls)
    elif mo_dun == "battu":
        ds = tgt._bt_thang(sinh, tu, so_thang + 1, ls)
    else:
        raise ValueError(mo_dun)
    het = (tu + dt.timedelta(days=round(so_thang * 30.44))).isoformat()
    thang = [{"ten": ten_thang(x["tieu_de"]), "tu": x["tu"], "den": x["den"], "muc": x.get("muc") or "can_bang",
              "nhan_muc": kh.nhan_muc(x.get("muc") or "can_bang"), "loi": x.get("loi") or x["noi_dung"]}
             for x in ds if x["den"] >= tu.isoformat() and x["tu"] < het]
    return {"mo_dun": mo_dun, "so_thang": so_thang, "tu": tu.isoformat(), "thang": thang,
            "thuan": [x for x in thang if x["muc"] == "thuan"], "cham": [x for x in thang if x["muc"] == "can_chu_dong"]}


_THANG_TIET = re.compile(r"^Tháng (\S+) \((\d+)/(\d+)–(\d+)/(\d+)\)$")
_THANG_AM = re.compile(r"^Tháng (\d+)( nhuận)? âm lịch$")


def ten_thang(ten: str) -> str:
    """Tên tháng của Thời gian tới ("Tháng Hợi (7/11–6/12)", "Tháng 3 âm lịch") theo ngôn ngữ lượt gọi."""
    if ngon_ngu.la_viet():
        return ten
    from app.hoidap.chung import ngay_ngan  # noqa: PLC0415
    from app.kb import ten as _ten  # noqa: PLC0415
    m = _THANG_TIET.match(ten)
    if m:
        return L("hoi.cs.thang_tiet", "Tháng {chi} ({tu}–{den})", chi=_ten.ten("chi", m.group(1)),
                 tu=ngay_ngan(int(m.group(2)), int(m.group(3))), den=ngay_ngan(int(m.group(4)), int(m.group(5))))
    m = _THANG_AM.match(ten)
    if m:
        return (L("hoi.cs.thang_am_nhuan", "Tháng {n} nhuận âm lịch", n=m.group(1)) if m.group(2)
                else L("hoi.cs.thang_am", "Tháng {n} âm lịch", n=m.group(1)))
    return ten
