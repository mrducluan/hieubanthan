# -*- coding: utf-8 -*-
"""QTE-1 tuần 1 — người Việt ở nước ngoài: chọn nước + thành phố → máy tự tính múi giờ CHUẨN nơi sinh (Bát tự so mốc tiết)
và có đang giờ mùa hè không (Tử vi trừ 1 giờ) theo đúng ngày giờ sinh, từ cơ sở dữ liệu múi giờ IANA (zoneinfo).
Hôm nay / nhịp theo ngày ở nơi đang sống. Viết TRƯỚC `app/calc/mui_gio.py`."""
from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient

from app.calc import mui_gio
from app.main import app

client = TestClient(app)


@pytest.mark.parametrize("zone,ngay,gio,utc,mua_he", [
    ("America/Los_Angeles", dt.date(1990, 7, 15), "10:00", -8.0, True),
    ("America/Los_Angeles", dt.date(1990, 1, 15), "10:00", -8.0, False),
    ("America/New_York", dt.date(1985, 6, 1), "08:30", -5.0, True),
    ("America/Phoenix", dt.date(1990, 7, 15), "10:00", -7.0, False),       # Arizona không đổi giờ
    ("Australia/Sydney", dt.date(1995, 1, 10), "09:00", 10.0, True),       # Nam bán cầu: hè tháng 1
    ("Australia/Brisbane", dt.date(1995, 1, 10), "09:00", 10.0, False),
    ("Asia/Tokyo", dt.date(2000, 8, 1), "12:00", 9.0, False),
    ("Europe/Paris", dt.date(1988, 8, 1), "12:00", 1.0, True),
    ("Europe/Berlin", dt.date(1978, 8, 1), "12:00", 1.0, False),           # Tây Đức chưa dùng giờ mùa hè trước 1980
    ("America/Toronto", dt.date(1999, 12, 24), "23:30", -5.0, False),
])
def test_tinh_mui_gio(zone, ngay, gio, utc, mua_he):
    kq = mui_gio.tinh(zone, ngay, gio)
    assert kq["utc_chuan"] == utc and kq["gio_mua_he"] is mua_he
    assert kq["chenh_mua_he"] == (1.0 if mua_he else 0.0)


def test_gio_luc_doi_gio_gan_co():
    # 02:30 sáng 08/03/2026 ở Los Angeles không tồn tại (đồng hồ nhảy 2:00 → 3:00); 01:30 sáng 01/11/2026 xảy ra hai lần.
    assert mui_gio.tinh("America/Los_Angeles", dt.date(2026, 3, 8), "02:30")["doi_gio"] == "khong_ton_tai"
    assert mui_gio.tinh("America/Los_Angeles", dt.date(2026, 11, 1), "01:30")["doi_gio"] == "lap_lai"
    assert mui_gio.tinh("America/Los_Angeles", dt.date(2026, 7, 1), "01:30")["doi_gio"] is None


def test_gio_mua_he_thoi_chien_gan_co():
    # Anh 1941–1945 "giờ mùa hè kép" (+2), Mỹ 1942–1945 "giờ chiến tranh" cả năm: dữ liệu múi giờ báo phần mùa hè không
    # chắc chắn → sinh trước 1950 mà đang giờ mùa hè thì gắn cờ xem lại, không âm thầm tính.
    kq = mui_gio.tinh("Europe/London", dt.date(1943, 6, 15), "12:00")
    assert kq["gio_mua_he"] is True and kq["can_xem_lai"]
    assert mui_gio.tinh("America/Los_Angeles", dt.date(1943, 1, 1), "12:00")["can_xem_lai"]
    assert not mui_gio.tinh("America/Los_Angeles", dt.date(1990, 7, 1), "12:00")["can_xem_lai"]


def test_danh_muc():
    ds = mui_gio.danh_muc()
    ma = {n["ma"] for n in ds}
    assert {"us", "jp", "au", "ca", "fr", "de", "kr", "tw"} <= ma
    us = next(n for n in ds if n["ma"] == "us")
    assert len(us["thanh_pho"]) >= 8 and all(t["mui_gio"].startswith(("America/", "Pacific/")) for t in us["thanh_pho"])
    jp = next(n for n in ds if n["ma"] == "jp")
    assert [t["mui_gio"] for t in jp["thanh_pho"]] == ["Asia/Tokyo"]
    for n in ds:                                     # mọi múi giờ đều mở được
        for t in n["thanh_pho"]:
            mui_gio.tinh(t["mui_gio"], dt.date(2000, 1, 1), "12:00")


def test_mui_gio_la_bi_tu_choi():
    with pytest.raises(ValueError):
        mui_gio.tinh("Mars/Olympus", dt.date(2000, 1, 1), "12:00")
    with pytest.raises(ValueError):
        mui_gio.tinh("Asia/Ho_Chi_Minh", dt.date(2000, 1, 1), "12:00")   # không trong danh mục nước ngoài


def test_hom_nay_noi_o():
    # 23:30 ngày 10 giờ Los Angeles = 14:30 ngày 11 giờ Việt Nam.
    lucnay = dt.datetime(2026, 11, 11, 7, 30, tzinfo=dt.timezone.utc)
    assert mui_gio.hom_nay("America/Los_Angeles", lucnay) == dt.date(2026, 11, 10)
    assert mui_gio.hom_nay(None, lucnay) == dt.date(2026, 11, 11)


def test_api_danh_muc_va_tinh():
    r = client.get("/v1/dia-ly/nuoc-ngoai")
    assert r.status_code == 200 and any(n["ma"] == "us" for n in r.json()["nuoc"])
    r = client.get("/v1/dia-ly/mui-gio", params={"mui_gio": "America/Los_Angeles", "ngay": "1990-07-15", "gio": "10:00"})
    assert r.status_code == 200 and r.json()["utc_chuan"] == -8.0 and r.json()["gio_mua_he"] is True
    assert client.get("/v1/dia-ly/mui-gio", params={"mui_gio": "Mars/X", "ngay": "1990-07-15", "gio": "10:00"}).status_code == 422


def test_api_hom_nay_theo_noi_o():
    base = {"ngay": 24, "thang": 10, "nam": 1988}
    r1 = client.post("/v1/thanso/hom-nay", json={**base, "ngay_xem": "2026-11-10"}).json()
    r2 = client.post("/v1/thanso/hom-nay", json={**base, "mui_gio_noi_o": "America/Los_Angeles"})
    assert r2.status_code == 200 and "ngay_ca_nhan" in str(r2.json())
    assert client.post("/v1/thanso/hom-nay", json={**base, "mui_gio_noi_o": "Mars/X"}).status_code == 422
    assert r1


def test_danh_muc_tieng_anh_cung_khung():
    vi, en = mui_gio.danh_muc(), mui_gio.danh_muc("en")
    assert [n["ma"] for n in vi] == [n["ma"] for n in en]
    for a, b in zip(vi, en):
        assert [t["mui_gio"] for t in a["thanh_pho"]] == [t["mui_gio"] for t in b["thanh_pho"]]
        assert b["ten"].isascii() and all(t["ten"].replace("—", "-").replace("…", "...").isascii() for t in b["thanh_pho"])
    assert client.get("/v1/dia-ly/nuoc-ngoai", params={"ngon_ngu": "en"}).json()["nuoc"][0]["ten"] == "United States"
