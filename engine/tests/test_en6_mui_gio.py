# -*- coding: utf-8 -*-
"""EN-6 BI-1 — miền Nam 01/04/1947 – 01/07/1955 đồng hồ chạy UTC+8 (tzdata IANA Asia/Ho_Chi_Minh). Lịch âm miền Nam vẫn
chỉ dùng UTC+8 cho 1960 – 13/06/1975 (quyết định đã chốt) → tách hàm kinh tuyến lịch âm khỏi bảng giờ đồng hồ.
Kèm test bảng múi giờ so với tzdata (kế hoạch EN-6)."""
from __future__ import annotations

import datetime as dt
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient

from app import config
from app.config import Region
from app.main import app

client = TestClient(app)


@pytest.mark.parametrize("d,off", [(dt.date(1947, 3, 31), 7.0), (dt.date(1947, 4, 1), 8.0), (dt.date(1950, 6, 1), 8.0),
                                   (dt.date(1955, 6, 30), 8.0), (dt.date(1955, 7, 1), 7.0), (dt.date(1958, 1, 1), 7.0),
                                   (dt.date(1965, 1, 1), 8.0), (dt.date(1980, 1, 1), 7.0)])
def test_dong_ho_mien_nam(d, off):
    assert config.clock_offset(d, Region.SOUTH)[0] == off


@pytest.mark.parametrize("d,off", [(dt.date(1950, 6, 1), 7.0), (dt.date(1958, 1, 1), 7.0), (dt.date(1960, 1, 1), 8.0),
                                   (dt.date(1975, 6, 12), 8.0), (dt.date(1975, 6, 13), 7.0)])
def test_lich_am_mien_nam_chi_1960_1975(d, off):
    assert config.tz_lich_am(d, Region.SOUTH) == off
    assert config.tz_lich_am(d, Region.NORTH) == 7.0
    assert config.tz_lich_am(d, None) == 7.0


def test_bang_mien_nam_khop_tzdata():
    """Giữa mỗi tháng 1912–1990, giờ đồng hồ miền Nam trùng Asia/Ho_Chi_Minh (bỏ ngày giao). Máy không có tzdata
    (Windows chưa cài gói tzdata) → bỏ qua, không làm đỏ cả bộ."""
    try:
        z = ZoneInfo("Asia/Ho_Chi_Minh")
    except Exception:  # noqa: BLE001
        pytest.skip("máy này không có tzdata")
    lech = []
    for y in range(1912, 1991):
        for m in range(1, 13):
            d = dt.date(y, m, 15)
            tz = dt.datetime(y, m, 15, 12, tzinfo=z).utcoffset().total_seconds() / 3600
            if config.clock_offset(d, Region.SOUTH)[0] != tz:
                lech.append((d, tz))
    assert lech == []


def _an(**kw) -> dict:
    r = client.post("/v1/tuvi/an-sao", json={"gender": "nam", "calendar_type": "duong", **kw})
    assert r.status_code == 200, r.text
    return r.json()


def test_sinh_sai_gon_1950_doi_gio():
    """13:30 đồng hồ Sài Gòn 1950 (UTC+8) = 12:30 kinh tuyến 105°Đ → giờ Ngọ, không phải Mùi."""
    a = _an(birth_date="1950-06-01", birth_time="13:30", noi_sinh="tp-ho-chi-minh")
    b = _an(birth_date="1950-06-01", birth_time="12:30", noi_sinh="ha-noi")
    assert a["cung"] == b["cung"]
    assert a["mui_gio_dong_ho"] == 8.0


def test_nhap_am_mien_nam_1950_van_lich_utc7():
    """Ngày âm miền Nam 1950 đổi theo lịch UTC+7 như miền Bắc (lịch UTC+8 chỉ 1960–1975)."""
    a = _an(birth_date="1950-03-15", birth_time="10:00", calendar_type="am", noi_sinh="tp-ho-chi-minh")
    b = _an(birth_date="1950-03-15", birth_time="09:00", calendar_type="am", noi_sinh="ha-noi")
    assert a["duong_lich_kinh_tuyen"] == b["duong_lich_kinh_tuyen"]


# ---- EN-6 BI-2: giờ Tý muộn (23:xx) Tử vi = sinh ngày hôm sau, giờ Tý -------------------------------------------
@pytest.mark.parametrize("ngay", ["1954-05-02", "1978-03-08", "1993-11-13", "1981-06-01",   # ngày cuối tháng âm
                                  "1955-05-08", "1982-06-10",                                 # nửa sau tháng nhuận
                                  "1990-05-17", "2000-02-04"])
def test_ty_muon_bang_ngay_sau_gio_ty(ngay):
    from app.calc import tuvi_an_sao as az
    d = dt.date.fromisoformat(ngay)
    a = az.an_sao_tho(d, 12, "nam", "vi-VN")
    b = az.an_sao_tho(d + dt.timedelta(days=1), 0, "nam", "vi-VN")
    assert [(p["name"], p["earthlyBranch"], [s["name"] for s in p["majorStars"] + p["minorStars"]]) for p in a["palaces"]] \
        == [(p["name"], p["earthlyBranch"], [s["name"] for s in p["majorStars"] + p["minorStars"]]) for p in b["palaces"]]
    va = az.van_han(d, 12, "nam", dt.date(2027, 6, 1))
    vb = az.van_han(d + dt.timedelta(days=1), 0, "nam", dt.date(2027, 6, 1))
    assert va == vb


def test_giao_thua_ty_muon_sang_nam_moi():
    """23:30 đêm giao thừa (30 Tết Đinh Mão, 16/02/1988) → lá năm Mậu Thìn (mùng 1 Tết)."""
    from app.calc import tuvi_an_sao as az
    a = az.an_sao_tho(dt.date(1988, 2, 16), 12, "nam", "vi-VN")
    assert a["chineseDate"].startswith(("戊辰", "Mậu Thìn")), a["chineseDate"]


# ---- EN-6 BI-3: sinh ở nước ngoài — Bát tự so mốc tiết khí theo múi giờ nơi sinh -----------------------------------
def test_bat_tu_nuoc_ngoai_dung_mui_gio_noi_sinh():
    """New York 03/02/1990 23:00 EST (UTC−5) = 04/02 04:00 UTC, SAU Lập xuân (04/02 02:14 UTC) → năm Canh Ngọ.
    Coi giờ địa phương là UTC+7 (cách cũ) thì thành 03/02 16:00 UTC, TRƯỚC Lập xuân → Kỷ Tỵ (sai)."""
    from app.calc import battu as bt
    cu = bt.la_so(dt.datetime(1990, 2, 3, 23, 0), "nam")
    moi = bt.la_so(dt.datetime(1990, 2, 3, 23, 0), "nam", utc_lich=-5.0)
    assert cu["tru"][0] == {"can": "Kỷ", "chi": "Tỵ"}
    assert moi["tru"][0] == {"can": "Canh", "chi": "Ngọ"}
    assert moi["tru"][2] == cu["tru"][2]                     # trụ ngày theo ngày địa phương, không đổi


def _bt_api(**kw) -> dict:
    r = client.post("/v1/battu/la-so", json={"gender": "nam", "calendar_type": "duong", **kw})
    assert r.status_code == 200, r.text
    return r.json()


def test_api_bat_tu_nuoc_ngoai():
    a = _bt_api(birth_date="1990-02-03", birth_time="23:00", noi_sinh="nuoc_ngoai", utc_noi_sinh=-5)
    assert a["tru"][0] == {"can": "Canh", "chi": "Ngọ"}
    b = _bt_api(birth_date="1990-02-03", birth_time="23:00", noi_sinh="nuoc_ngoai")
    assert b["tru"][0] == {"can": "Kỷ", "chi": "Tỵ"}             # chưa khai múi giờ → như cũ, có cờ nhắc
    assert any(c["loai"] == "mui_gio_nuoc_ngoai" for c in b["co_canh_bao"])
    assert not any(c["loai"] == "mui_gio_nuoc_ngoai" for c in a["co_canh_bao"])


def test_trong_nuoc_bo_qua_utc_noi_sinh():
    a = _bt_api(birth_date="1990-05-17", birth_time="12:30", noi_sinh="ha-noi", utc_noi_sinh=-5)
    b = _bt_api(birth_date="1990-05-17", birth_time="12:30", noi_sinh="ha-noi")
    assert a["tru"] == b["tru"]



def test_moc_1955_doi_luc_01_gio():
    assert config.clock_offset(dt.date(1955, 7, 1), Region.SOUTH, 0)[0] == 8.0      # 00:30 vẫn UTC+8 (tzdata)
    assert config.clock_offset(dt.date(1955, 7, 1), Region.SOUTH, 1)[0] == 7.0


# ---- review EN-6: giờ Tý muộn nhất quán ở MỌI phép tính quanh lá số --------------------------------------------
def test_giao_thua_can_chi_nam_khop_la_so():
    """23:30 đêm 09/02/2024 (30 Tết Quý Mão): lá số, can chi năm, âm dương nam/nữ cùng năm Giáp Thìn."""
    a = _an(birth_date="2024-02-09", birth_time="23:30", noi_sinh="ha-noi")
    b = _an(birth_date="2024-02-10", birth_time="00:30", noi_sinh="ha-noi")
    for k in ("cung", "can_chi_nam", "menh_nap_am", "am_duong", "tuan_triet"):
        if k in a or k in b:
            assert a.get(k) == b.get(k), k


def test_luu_nguyet_ty_muon_cuoi_thang():
    from app.luangiai import tuvi_luu_nguyet as lnl
    s12 = {"ngay": dt.date(1978, 3, 8), "ti": 12, "gioi_tinh": "nam"}
    s0 = {"ngay": dt.date(1978, 3, 9), "ti": 0, "gioi_tinh": "nam"}
    a, b = lnl.lap_nam(s12, 2027), lnl.lap_nam(s0, 2027)
    assert [x["cung_goc"] for x in a["thang"]] == [x["cung_goc"] for x in b["thang"]]


def test_ty_muon_qua_moc_lich_mien_nam():
    """Sài Gòn 31/12/1959 23:30 (đồng hồ UTC+7): lá lập cho 01/01/1960 → lịch âm miền Nam UTC+8 của ngày lập lá.
    (Sài Gòn 12/06/1975 23:30 đồng hồ UTC+8 chỉ là 22:30 giờ lịch — không phải Tý muộn.)"""
    from app.tuvi_api import TuanTrietInput, _DauVao
    dv = _DauVao(TuanTrietInput(birth_date="1959-12-31", birth_time="23:30", gender="nam", noi_sinh="tp-ho-chi-minh"))
    assert dv.ngay_lap == dt.date(1960, 1, 1) and dv.tz_lich == 8.0
    dv = _DauVao(TuanTrietInput(birth_date="1975-06-12", birth_time="23:30", gender="nam", noi_sinh="tp-ho-chi-minh"))
    assert dv.ngay_lap == dt.date(1975, 6, 12) and dv.tb.calendar_dt.hour == 22
