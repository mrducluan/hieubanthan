# -*- coding: utf-8 -*-
"""NS-QT (2026-11-16) — tìm nơi sinh ngoài Việt Nam theo chữ gõ (GeoNames cities15000, CC BY 4.0). Viết TRƯỚC `calc/dia_danh`.

Đối chiếu tay: San Jose (California) 37,34°B 121,89°T, America/Los_Angeles; Melbourne (Úc) đông dân hơn Melbourne
(Florida); Praha = Prague; Mát-xcơ-va = Moscow; mã `gn-<geonameid>` dùng được mọi nơi đang nhận mã thành phố cũ."""
import datetime as dt

import pytest
from fastapi.testclient import TestClient
from zoneinfo import available_timezones

from app.calc import dia_danh as D
from app.calc import mui_gio
from app.main import app

client = TestClient(app)


def _dau(q: str) -> dict:
    kq = D.tim(q)
    assert kq, q
    return kq[0]


@pytest.mark.parametrize(("q", "ten", "nuoc"), [
    ("san jose", "San Jose", "US"), ("San José", "San Jose", "US"), ("melbourne", "Melbourne", "AU"),
    ("praha", "Prague", "CZ"), ("prague", "Prague", "CZ"), ("mat xco va", "Moscow", "RU"), ("Mát-xcơ-va", "Moscow", "RU"),
    ("paris", "Paris", "FR"), ("houston", "Houston", "US"), ("toronto", "Toronto", "CA"), ("sydney", "Sydney", "AU"),
    ("berlin", "Berlin", "DE"), ("tokyo", "Tokyo", "JP"), ("seoul", "Seoul", "KR"), ("taipei", "Taipei", "TW"),
    ("westminster", "Westminster", "US"), ("garden grove", "Garden Grove", "US"), ("frankfurt", "Frankfurt am Main", "DE"),
])
def test_tim_dung_noi_dau(q, ten, nuoc):
    x = _dau(q)
    assert (x["ten"], x["nuoc"]) == (ten, nuoc)


def test_tim_them_bang_hoac_nuoc_de_chon_noi_trung_ten():
    assert _dau("melbourne florida")["nuoc"] == "US"
    assert _dau("san jose costa rica")["nuoc"] == "CR"
    assert _dau("springfield illinois")["phu"] == "Illinois, Hoa Kỳ"
    assert _dau("westminster california")["phu"] == "California, Hoa Kỳ"   # Little Saigon


def test_dong_phu_toa_do_mui_gio():
    x = _dau("san jose")
    assert x["ma"] == "gn-5392171" and x["phu"] == "California, Hoa Kỳ"
    assert (x["vi_do"], x["kinh_do"], x["zone"]) == (37.34, -121.89, "America/Los_Angeles")
    assert x["utc_chuan"] == -8 and x["canh_bao_mat_troi"] is False and x["nam_ban_cau_kha_dung"] is False
    assert _dau("melbourne")["nam_ban_cau_kha_dung"] is True


def test_khong_ra_viet_nam_khong_ra_chu_ngan_gioi_han():
    assert all(x["nuoc"] != "VN" for x in D.tim("ho chi minh") + D.tim("hanoi") + D.tim("sai gon"))
    assert D.tim("a") == [] and D.tim("") == [] and D.tim("  ") == []
    assert 1 <= len(D.tim("san", 5)) <= 5
    assert D.tim("zzzzqqqq") == []


def test_moi_vung_gio_co_trong_tzdata():
    co = available_timezones()
    assert all(z in co for z in D.du_lieu()["zone"])


def test_ma_gn_dung_nhu_ma_thanh_pho_cu():
    t = mui_gio.thanh_pho("gn-5392171")
    assert t and t["zone"] == "America/Los_Angeles" and t["kinh_do"] == -121.89 and t["vi_do"] == 37.34
    assert mui_gio.zone_tu("gn-5392171") == "America/Los_Angeles"
    a = mui_gio.tai("gn-5392171", 1990, 7, 1, 10)
    b = mui_gio.tai("us-san_jose", 1990, 7, 1, 10)
    assert a == b and a["gio_mua_he"] is True and a["utc_chuan"] == -8
    assert mui_gio.thanh_pho("gn-999999999") is None
    with pytest.raises(ValueError):
        mui_gio.zone_tu("gn-999999999")


def test_thanh_pho_cu_khop_geonames():
    """134 thành phố cũ có toạ độ: nơi GeoNames trùng tên gần nhất lệch < 0,5° và cùng vùng giờ (bắt nhập sai dữ liệu)."""
    lech = []
    for n in mui_gio.danh_sach():
        for t in n["thanh_pho"]:
            if t.get("vi_do") is None:
                continue
            gan = D.gan_nhat(t["vi_do"], t["kinh_do"])
            if gan is None or gan["d"] > 0.5 or gan["zone"] != t["zone"]:
                lech.append((t["ma"], gan and gan["ten"], gan and round(gan["d"], 2), gan and gan["zone"]))
    assert len(lech) <= 3, lech       # vài vùng gộp (Orange County…) cho phép lệch, không được nhiều


def test_la_so_nhan_ma_gn_ket_qua_trung_ma_cu():
    sinh = {"birth_date": "1990-07-01", "birth_time": "10:00", "gender": "nam", "noi_sinh": "nuoc_ngoai"}
    a = client.post("/v1/tuvi/an-sao", json={**sinh, "mui_gio": "gn-5392171"})
    b = client.post("/v1/tuvi/an-sao", json={**sinh, "mui_gio": "us-san_jose"})
    assert a.status_code == 200 and b.status_code == 200, a.text
    assert a.json()["cung"] == b.json()["cung"]


def test_api():
    r = client.get("/v1/dia-ly/tim", params={"q": "praha"})
    assert r.status_code == 200 and r.json()["ket_qua"][0]["ma"].startswith("gn-")
    assert client.get("/v1/dia-ly/tim", params={"q": "x" * 41}).status_code == 422
    r = client.get("/v1/dia-ly/noi/gn-5392171")
    assert r.status_code == 200 and r.json()["ten"] == "San Jose"
    assert client.get("/v1/dia-ly/noi/us-san_jose").json()["zone"] == "America/Los_Angeles"
    assert client.get("/v1/dia-ly/noi/gn-1").status_code == 404
    en = client.get("/v1/dia-ly/tim", params={"q": "san jose"}, headers={"x-ngon-ngu": "en"}).json()
    assert en["ket_qua"][0]["phu"] == "California, United States"


def test_nhanh():
    t = dt.datetime.now()
    for q in ("san", "melb", "par", "new york", "los"):
        D.tim(q)
    assert (dt.datetime.now() - t).total_seconds() < 1.5
