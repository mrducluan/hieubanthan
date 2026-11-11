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


# SEO-O (2026-11-10): ngày lễ âm lịch của năm + bảng Tết nhiều năm (cho /lich-am, /lich-am/{năm}).
# Đối chiếu tay (lịch Việt): Giỗ Tổ 10/3 Bính Ngọ = 26/04/2026, Vu Lan 15/7 = 27/08/2026, Trung thu 15/8 = 25/09/2026.
def test_le_2026():
    le = {x["ma"]: x for x in L.lich_nam(2026)["le"]}
    assert le["tet"]["duong"] == "2026-02-17" and le["tet"]["am"] == "1/1"
    assert le["gio_to"]["duong"] == "2026-04-26"
    assert le["vu_lan"]["duong"] == "2026-08-27"
    assert le["trung_thu"]["duong"] == "2026-09-25"
    # giao thừa = ngày cuối tháng Chạp = ngay trước Tết năm sau
    assert le["giao_thua"]["duong"] == "2027-02-05"
    assert all(x["thu"] for x in le.values())
    ngay = [x["duong"] for x in L.lich_nam(2026)["le"]]
    assert ngay == sorted(ngay)


def test_le_nam_nhuan_lay_thang_thuong():
    # 2025 nhuận tháng 6 → Vu Lan (15/7) vẫn là tháng 7 thường, sau tháng 6 nhuận
    kq = L.lich_nam(2025)
    le = {x["ma"]: x for x in kq["le"]}
    th7 = next(t for t in kq["thang"] if t["thang"] == 7 and not t["nhuan"])
    assert le["vu_lan"]["duong"] == th7["ram"]


def test_cac_nam():
    ds = L.cac_nam(2025, 2028)
    assert [x["nam"] for x in ds] == [2025, 2026, 2027, 2028]
    assert ds[1] == {"nam": 2026, "can_chi": "Bính Ngọ", "con_giap": "Ngọ", "tet": "2026-02-17", "thang_nhuan": None,
                     "so_ngay": ds[1]["so_ngay"]}
    assert ds[0]["thang_nhuan"] == 6 and ds[0]["so_ngay"] in (383, 384, 385)
    assert client.get("/v1/lich/cac-nam?tu=2025&den=2028").json()[2]["tet"] == "2027-02-06"
    assert client.get("/v1/lich/cac-nam?tu=2000&den=2060").status_code == 422
