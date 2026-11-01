# -*- coding: utf-8 -*-
"""EN-2 (P2-17) — không biết giờ sinh: lá số an tạm 12:00 nhưng bài đọc từng nói như chắc chắn. Nay báo cáo mang trường
`gio_tam` (web hiện thành dải riêng đầu bài, không phụ thuộc bản diễn đạt AI); lời riêng Tử vi (có Định giờ sinh) / Bát tự
(trụ giờ). Thời gian tới không đọc Tử vi / Bát tự theo giờ tạm. Biết giờ thì không có gì."""
from fastapi.testclient import TestClient

from app.main import app

c = TestClient(app)
LS = {"birth_date": "1995-12-02", "birth_time": "12:00", "gender": "nu", "noi_sinh": "ha-noi"}


def _bc(path, la_so):
    return c.post(path, json={"la_so": la_so, "ngay_xem": "2026-11-01", "dien_dat_toi_da": 0}).json()


def test_tuvi_khong_biet_gio_noi_ro():
    r = _bc("/v1/tuvi/luan-giai", {**LS, "do_tin_gio": "unknown"})
    assert "giờ tạm" in r["gio_tam"] and "Định giờ sinh" in r["gio_tam"]
    assert "gio_tam" not in _bc("/v1/tuvi/luan-giai", LS)


def test_battu_khong_biet_gio_noi_ro():
    r = _bc("/v1/battu/luan-giai", {**LS, "do_tin_gio": "unknown"})
    assert "giờ tạm" in r["gio_tam"] and "Định giờ sinh" not in r["gio_tam"]
    assert "gio_tam" not in _bc("/v1/battu/luan-giai", LS)


def test_thoi_gian_toi_khong_doc_la_so_theo_gio_tam():
    body = {"ngay_sinh": "1995-12-02", "ngay_xem": "2026-11-01", "la_so": {**LS, "do_tin_gio": "unknown"}}
    r = c.post("/v1/thoi-gian-toi", json=body).json()
    nguon = {h.get("nguon") for ch in r["chuong"] for h in ch.get("hop", [])}
    assert not nguon & {"tuvi", "battu"}, nguon
    r2 = c.post("/v1/thoi-gian-toi", json={**body, "la_so": LS}).json()
    assert {"tuvi", "battu"} <= {h.get("nguon") for ch in r2["chuong"] for h in ch.get("hop", [])}
