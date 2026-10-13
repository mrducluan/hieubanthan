# -*- coding: utf-8 -*-
"""HL-1 — API xem ngày tốt."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ngay_tot():
    r = client.post("/v1/lich/ngay-tot", json={"ngay": "2026-10-13", "nam_sinh": 1990, "viec": "khai_truong"})
    assert r.status_code == 200
    j = r.json()
    assert j["truc"]["ten"] == "Khai" and j["viec"]["danh_gia"] == "tot" and j["tuoi"]["can_chi"] == "Canh Ngọ"


def test_ngay_tot_mac_dinh_hom_nay_va_kiem_dau_vao():
    assert client.post("/v1/lich/ngay-tot", json={}).status_code == 200
    assert client.post("/v1/lich/ngay-tot", json={"viec": "bay"}).status_code == 422
    assert client.post("/v1/lich/ngay-tot", json={"ngay": "2150-01-01"}).status_code == 422
    assert client.post("/v1/lich/ngay-tot", json={"nam_sinh": 1990, "thang_sinh": 2, "ngay_sinh": 30}).status_code == 422
    assert client.post("/v1/lich/ngay-tot", json={"la": 1}).status_code == 422


def test_thang_va_chon_ngay():
    j = client.post("/v1/lich/thang", json={"nam": 2026, "thang": 2}).json()
    assert len(j["ngay"]) == 28
    r = client.post("/v1/lich/chon-ngay", json={"viec": "nhap_trach", "tu": "2026-11-01", "den": "2026-12-31"})
    assert r.status_code == 200 and r.json()["viec"]["ten"] == "Về nhà mới"
    assert client.post("/v1/lich/chon-ngay", json={"viec": "nhap_trach", "tu": "2026-01-01",
                                                    "den": "2026-12-31"}).status_code == 422
    assert client.post("/v1/lich/chon-ngay", json={"viec": "nhap_trach", "tu": "2026-03-01",
                                                    "den": "2026-01-01"}).status_code == 422
    assert len(client.get("/v1/lich/viec").json()["viec"]) == 12


def test_get_cong_khai():
    j = client.get("/v1/lich/ngay-tot/2026-10-13").json()
    assert j["truc"]["ten"] == "Khai" and j["tuoi"] is None
    assert client.get("/v1/lich/ngay-tot/2026-02-30").status_code == 422
    assert len(client.get("/v1/lich/thang/2026/10").json()["ngay"]) == 31
    assert client.get("/v1/lich/thang/2026/13").status_code == 422
