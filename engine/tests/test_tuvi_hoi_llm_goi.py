# -*- coding: utf-8 -*-
"""Gói gửi tầng diễn đạt AI cho hỏi đáp Tử vi về lá của CHÍNH người hỏi: chỉ mang lời đời thường (`doi_thuong`),
không mang đoạn kỹ thuật (tên độ sáng, "Mặt tối", định nghĩa cung) — để lời AI viết ra không quay lại dáng học thuật.
Viết TRƯỚC khi sửa `hoidap/tuvi.py`."""
from __future__ import annotations

import datetime as dt
import json
import re

from app.hoidap import tuvi as hd
from app.narrative import hoi_van

SINH = {"ngay": dt.date(1990, 5, 17), "ti": 6, "gioi_tinh": "nam"}
KY_THUAT = re.compile(r"\((Miếu|Vượng|Đắc|Bình|Hãm)\b|Mặt tối|Cung [A-ZĐ]\w+( \w+)?: ")


def test_goi_llm_chi_mang_loi_doi_thuong(monkeypatch):
    bat = {}

    def gia(goi, cau):
        bat["goi"] = goi
        return "Lời thử."

    monkeypatch.setattr(hoi_van, "_goi_llm", gia)
    for cau in ("Cung Quan Lộc của tôi nói gì?", "Mệnh của tôi thế nào?", "Tình duyên của tôi ra sao?"):
        bat.clear()
        hd.tra_loi(cau, sinh=SINH, ngay_xem=dt.date(2026, 10, 21), dung_llm=True)
        if "goi" not in bat:
            continue
        muc = bat["goi"]["muc"]
        assert muc, cau
        chu = json.dumps(muc, ensure_ascii=False)
        assert not KY_THUAT.search(chu), (cau, KY_THUAT.search(chu).group(0))
        assert all(m.get("noi_dung") for m in muc), cau
    assert bat, "phải có ít nhất một câu đi qua tầng diễn đạt AI"
