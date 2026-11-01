# -*- coding: utf-8 -*-
"""EN-5.4 — CỬA SỔ THÁNG cho một quyết định có khung thời gian ("có nên đổi việc trong 6 tháng tới"). RULES tất định:
dùng đúng các hàm tháng của Thời gian tới (Tử vi: nhịp tháng âm `tuvi_nhip_3_thang`; Bát tự: tháng theo tiết) — một bộ
tính, không chấm lại. Không trả lời có/không: chỉ nói tháng nào thuận hơn để làm phần chính, tháng nào nên đi chậm."""
from __future__ import annotations

import datetime as dt
import math

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
    thang = [{"ten": x["tieu_de"], "tu": x["tu"], "den": x["den"], "muc": x.get("muc") or "can_bang",
              "nhan_muc": kh.NHAN_MUC.get(x.get("muc") or "can_bang"), "loi": x.get("loi") or x["noi_dung"]}
             for x in ds if x["den"] >= tu.isoformat() and x["tu"] < het]
    return {"mo_dun": mo_dun, "so_thang": so_thang, "tu": tu.isoformat(), "thang": thang,
            "thuan": [x for x in thang if x["muc"] == "thuan"], "cham": [x for x in thang if x["muc"] == "can_chu_dong"]}
