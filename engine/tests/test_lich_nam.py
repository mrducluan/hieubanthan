# -*- coding: utf-8 -*-
"""SEO-L5 (chủ dự án duyệt 2026-10-22) — "lịch âm năm X": các tháng âm của một năm âm lịch Việt (ngày mùng 1 dương
lịch, đủ/thiếu, tháng nhuận), Tết, can chi. Dùng đúng `lunar` Hồ Ngọc Đức (UTC+7), không phép tính mới.
Đối chiếu tay: năm Bính Ngọ 2026 không nhuận, Tết 17/02/2026; năm Đinh Mùi 2027 Tết 06/02/2027 (lịch Việt);
năm 2025 nhuận tháng 6 (Ất Tỵ)."""
from fastapi.testclient import TestClient

from app.luangiai import lich_nam as L
from app.main import app

client = TestClient(app)


def test_2026():
    kq = L.lich_nam(2026)
    assert kq["can_chi"] == "Bính Ngọ" and kq["tet"] == "2026-02-17" and kq["thang_nhuan"] is None
    assert len(kq["thang"]) == 12 and kq["thang"][0]["mung_mot"] == "2026-02-17"
    assert all(x["so_ngay"] in (29, 30) for x in kq["thang"])
    assert kq["tet_sau"] == "2027-02-06"
    assert sum(x["so_ngay"] for x in kq["thang"]) == 354 or sum(x["so_ngay"] for x in kq["thang"]) == 355


def test_2025_nhuan_6():
    kq = L.lich_nam(2025)
    assert kq["thang_nhuan"] == 6 and len(kq["thang"]) == 13
    nhuan = [x for x in kq["thang"] if x["nhuan"]]
    assert len(nhuan) == 1 and nhuan[0]["thang"] == 6
    # các tháng nối liền: mùng 1 tháng sau = mùng 1 tháng trước + số ngày
    import datetime as dt
    for a, b in zip(kq["thang"], kq["thang"][1:]):
        assert dt.date.fromisoformat(a["mung_mot"]) + dt.timedelta(days=a["so_ngay"]) == dt.date.fromisoformat(b["mung_mot"])


def test_api():
    assert client.get("/v1/lich/nam/2027").json()["tet"] == "2027-02-06"
    assert client.get("/v1/lich/nam/1800").status_code == 422
