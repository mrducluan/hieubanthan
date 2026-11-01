# -*- coding: utf-8 -*-
"""EN-2 (P2-17) — không biết giờ sinh: lá số an tạm 12:00 nhưng bài đọc từng nói như chắc chắn. Nay chương đầu nói rõ
"đang đọc theo giờ tạm" và mời bổ sung / dùng Định giờ sinh; biết giờ thì không có câu này."""
from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)
LS = {"birth_date": "1995-12-02", "birth_time": "12:00", "gender": "nu", "noi_sinh": "ha-noi"}
CAU = "giờ tạm"


def _tq(path, la_so):
    r = c.post(path, json={"la_so": la_so, "ngay_xem": "2026-11-01", "dien_dat_toi_da": 0}).json()
    return " ".join(r["chuong"][0]["doan"])


def test_tuvi_khong_biet_gio_noi_ro():
    assert CAU in _tq("/v1/tuvi/luan-giai", {**LS, "do_tin_gio": "unknown"})
    assert CAU not in _tq("/v1/tuvi/luan-giai", LS)


def test_battu_khong_biet_gio_noi_ro():
    assert CAU in _tq("/v1/battu/luan-giai", {**LS, "do_tin_gio": "unknown"})
    assert CAU not in _tq("/v1/battu/luan-giai", LS)
