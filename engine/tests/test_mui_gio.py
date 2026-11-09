# -*- coding: utf-8 -*-
"""QTE-2 giai đoạn 0 (tuần 1) — múi giờ nơi sinh theo NƯỚC + THÀNH PHỐ bằng `zoneinfo` (tzdata IANA, không thư viện mới).

Viết TRƯỚC `app/calc/mui_gio.py`. Người sinh ở nước ngoài chọn thành phố → engine tự suy múi giờ CHUẨN (`utc_noi_sinh`,
bội 0,25) và giờ mùa hè (`gio_mua_he`) đúng ngày giờ sinh, kể cả lịch sử (Moskva 1990 UTC+3 +1 hè; Anh 1968–71 giờ
chuẩn +1 quanh năm; LMT đầu thế kỷ làm tròn + cờ). Thay cho việc người dùng tự khai hai ô như EN-6 BI-3."""
from __future__ import annotations

import json
from pathlib import Path
from zoneinfo import ZoneInfo, available_timezones

import pytest
from fastapi.testclient import TestClient

from app.calc import battu, mui_gio
from app.main import app

client = TestClient(app)
DATA = json.loads((Path(__file__).resolve().parents[1] / "app" / "calc" / "data" / "mui_gio.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("zone,nam,thang,ngay,gio,chuan,dst,lech", [
    ("America/Los_Angeles", 1990, 7, 15, 10, -8.0, True, -7.0),
    ("America/Los_Angeles", 1990, 1, 15, 10, -8.0, False, -8.0),
    ("America/New_York", 2000, 11, 20, 8, -5.0, False, -5.0),
    ("America/Phoenix", 2005, 7, 1, 12, -7.0, False, -7.0),          # Arizona không giờ mùa hè
    ("Pacific/Honolulu", 1995, 6, 1, 12, -10.0, False, -10.0),
    ("Asia/Tokyo", 1988, 8, 1, 12, 9.0, False, 9.0),
    ("Asia/Seoul", 1988, 7, 1, 12, 9.0, True, 10.0),                 # Hàn Quốc có giờ mùa hè 1987–1988
    ("Australia/Sydney", 2000, 1, 1, 12, 10.0, True, 11.0),
    ("Australia/Sydney", 2000, 7, 1, 12, 10.0, False, 10.0),
    ("Australia/Adelaide", 1999, 12, 25, 12, 9.5, True, 10.5),
    ("Europe/Paris", 1985, 6, 10, 12, 1.0, True, 2.0),
    ("Europe/Paris", 1985, 12, 10, 12, 1.0, False, 1.0),
    ("Europe/London", 1970, 1, 15, 12, 1.0, False, 1.0),             # British Standard Time 1968–1971: +1 quanh năm
    ("Europe/London", 1990, 7, 15, 12, 0.0, True, 1.0),
    ("Europe/Moscow", 1990, 6, 15, 12, 3.0, True, 4.0),
    ("Europe/Moscow", 2012, 6, 15, 12, 4.0, False, 4.0),             # 2011–2014 Nga giữ UTC+4 quanh năm
    ("Asia/Kolkata", 1980, 3, 3, 3, 5.5, False, 5.5),
    ("Asia/Kathmandu", 2000, 3, 3, 3, 5.75, False, 5.75),
    ("Asia/Singapore", 1975, 3, 3, 3, 7.5, False, 7.5),              # Singapore UTC+7:30 tới 1981
    ("Asia/Singapore", 1990, 3, 3, 3, 8.0, False, 8.0),
    ("Asia/Shanghai", 1988, 7, 1, 12, 8.0, True, 9.0),               # Trung Quốc giờ mùa hè 1986–1991
    ("Asia/Taipei", 1990, 7, 1, 12, 8.0, False, 8.0),
    ("Pacific/Auckland", 2001, 1, 1, 12, 12.0, True, 13.0),
    ("America/Sao_Paulo", 1998, 1, 10, 12, -3.0, True, -2.0),
])
def test_offset_lich_su(zone, nam, thang, ngay, gio, chuan, dst, lech):
    kq = mui_gio.tai(zone, nam, thang, ngay, gio, 30)
    assert (kq["utc_chuan"], kq["gio_mua_he"], kq["lech"]) == (chuan, dst, lech), kq
    assert kq["lam_tron"] is False and kq["zone"] == zone


def test_gio_dia_phuong_lmt_lam_tron_va_gan_co():
    """Paris trước 1911 chạy giờ địa phương +0:09:21 → làm tròn bội 0,25 gần nhất (0.25) + cờ `lam_tron` để web nhắc."""
    kq = mui_gio.tai("Europe/Paris", 1905, 5, 5, 12, 0)
    assert kq["lam_tron"] is True and kq["utc_chuan"] == 0.25 and kq["gio_mua_he"] is False
    assert abs(kq["lech_chinh_xac"] - 0.15583) < 0.001


def test_khoang_gio_mo_ho_khi_doi_gio():
    """02:30 ngày đổi giờ mùa hè ở Mỹ (2:00 → 3:00) không tồn tại; 01:30 ngày lùi giờ tồn tại hai lần → engine vẫn trả
    kết quả (lấy nếp đầu, fold=0) và gắn `gio_mo_ho`."""
    a = mui_gio.tai("America/New_York", 2010, 3, 14, 2, 30)
    assert a["gio_mo_ho"] is True
    b = mui_gio.tai("America/New_York", 2010, 11, 7, 1, 30)
    assert b["gio_mo_ho"] is True and b["utc_chuan"] == -5.0
    assert mui_gio.tai("America/New_York", 2010, 6, 1, 12, 0)["gio_mo_ho"] is False


def test_zone_la_bi_tu_choi():
    with pytest.raises(ValueError):
        mui_gio.tai("Mars/Olympus", 2000, 1, 1, 0, 0)
    assert mui_gio.hop_le("Asia/Tokyo") and not mui_gio.hop_le("asia/tokyo") and not mui_gio.hop_le("../etc/passwd")


def test_bang_nuoc_thanh_pho_hop_le():
    co = available_timezones()
    ma_tp: list[str] = []
    for nuoc in DATA["nuoc"]:
        assert len(nuoc["ma"]) == 2 and nuoc["ma"].islower() and nuoc["ten"] and nuoc["ten_en"]
        assert nuoc["thanh_pho"], nuoc["ma"]
        for tp in nuoc["thanh_pho"]:
            assert tp["zone"] in co, tp
            assert tp["ma"].startswith(nuoc["ma"] + "-") and tp["ten"], tp
            ma_tp.append(tp["ma"])
    assert len(ma_tp) == len(set(ma_tp))
    assert len(ma_tp) >= 120
    # Các nước đông người Việt (QTE-1 mục 2) phải có
    assert {"us", "jp", "fr", "au", "kr", "ca", "tw", "de"} <= {n["ma"] for n in DATA["nuoc"]}
    # Mỹ đủ các vùng giờ; thành phố đông người Việt
    us = next(n for n in DATA["nuoc"] if n["ma"] == "us")
    assert {"America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York", "Pacific/Honolulu", "America/Phoenix"} <= {t["zone"] for t in us["thanh_pho"]}
    assert any("San Jose" in t["ten"] for t in us["thanh_pho"]) and any("Houston" in t["ten"] for t in us["thanh_pho"])


def test_tra_thanh_pho():
    tp = mui_gio.thanh_pho("us-san_jose")
    assert tp and tp["zone"] == "America/Los_Angeles" and tp["nuoc"] == "us"
    assert mui_gio.thanh_pho("xx-khong_co") is None
    ds = mui_gio.danh_sach()
    assert ds[0]["ma"] and "thanh_pho" in ds[0]


def test_api_danh_sach_va_tai():
    r = client.get("/v1/dia-ly/mui-gio")
    assert r.status_code == 200 and len(r.json()["nuoc"]) >= 30
    r = client.post("/v1/dia-ly/mui-gio/tai", json={"mui_gio": "America/Los_Angeles", "ngay": "1990-07-15", "gio": "10:30"})
    assert r.status_code == 200 and r.json()["utc_chuan"] == -8.0 and r.json()["gio_mua_he"] is True
    r = client.post("/v1/dia-ly/mui-gio/tai", json={"mui_gio": "us-san_jose", "ngay": "1990-01-15", "gio": "10:30"})
    assert r.status_code == 200 and r.json()["zone"] == "America/Los_Angeles" and r.json()["gio_mua_he"] is False
    assert client.post("/v1/dia-ly/mui-gio/tai", json={"mui_gio": "Mars/X", "ngay": "1990-01-15", "gio": "10:30"}).status_code == 422


def _la_so(**them):
    goc = {"birth_date": "1990-07-15", "birth_time": "10:30", "gender": "nam", "noi_sinh": "nuoc_ngoai"}
    return client.post("/v1/battu/la-so", json={**goc, **them})


def test_la_so_voi_mui_gio_bang_khai_tay():
    """`mui_gio` (IANA) cho cùng tứ trụ với cách khai tay EN-6 (utc_noi_sinh=-8, gio_mua_he=True) và không còn cờ nhắc khai."""
    a = _la_so(mui_gio="America/Los_Angeles").json()
    b = _la_so(utc_noi_sinh=-8, gio_mua_he=True).json()
    assert a["tru"] == b["tru"], (a["tru"], b["tru"])
    assert not any(f["loai"] == "mui_gio_nuoc_ngoai" for f in a["co_canh_bao"])
    c = _la_so().json()
    assert any(f["loai"] == "mui_gio_nuoc_ngoai" for f in c["co_canh_bao"])
    # mã thành phố cũng nhận
    d = _la_so(mui_gio="us-san_jose").json()
    assert d["tru"] == a["tru"]
    # múi giờ không rõ → 422, không 500
    assert _la_so(mui_gio="Mars/X").status_code == 422
    # sinh trong nước mà gửi mui_gio → 422 (chỉ dành cho nước ngoài)
    assert client.post("/v1/battu/la-so", json={"birth_date": "1990-07-15", "birth_time": "10:30", "gender": "nam",
                                                "noi_sinh": "ha-noi", "mui_gio": "Asia/Tokyo"}).status_code == 422


def test_dst_doi_tru_ngay_gio():
    """Giờ mùa hè tự suy: 00:30 giờ mùa hè = 23:30 giờ chuẩn hôm trước → trụ ngày lùi một ngày (dạ Tý) như khai tay."""
    a = _la_so(birth_date="1990-07-15", birth_time="00:30", mui_gio="America/Los_Angeles").json()
    b = _la_so(birth_date="1990-07-15", birth_time="00:30", utc_noi_sinh=-8, gio_mua_he=True).json()
    assert a["tru"] == b["tru"]
    assert a["gio_lich"].startswith("1990-07-14T23:30")


def test_co_canh_bao_gio_doi_mui_va_lam_tron():
    a = _la_so(birth_date="2010-03-14", birth_time="02:30", mui_gio="America/New_York").json()
    assert any(f["loai"] == "gio_doi_mui" for f in a["co_canh_bao"])
    b = _la_so(birth_date="1905-05-05", birth_time="12:00", mui_gio="Europe/Paris").json()
    assert any(f["loai"] == "mui_gio_lam_tron" for f in b["co_canh_bao"])
    c = _la_so(mui_gio="Asia/Tokyo").json()
    assert not any(f["loai"] in ("gio_doi_mui", "mui_gio_lam_tron") for f in c["co_canh_bao"])


def test_dockerfile_kiem_tzdata():
    """python:*-slim thiếu tzdata thì mọi lượt tra múi giờ lỗi — bước build phải nạp thử một vùng."""
    s = (Path(__file__).resolve().parents[1] / "Dockerfile").read_text(encoding="utf-8")
    assert "ZoneInfo(" in s and "America/Los_Angeles" in s
