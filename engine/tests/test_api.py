# -*- coding: utf-8 -*-
"""API là lớp vỏ mỏng — test rằng nó gọi đúng hàm thuần và phơi đúng cờ."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["ty_boundary_set"] is True         # đã chốt SWITCH_AT_0000


def test_do_nhay_khop_ham_thuan() -> None:
    r = client.post("/v1/thanso/do-nhay", json={
        "ho_ten": ["Nguyen Duc Luan", "Nguyễn Đức Luân"],
        "ngay": 2, "thang": 12, "nam": 1988,
    })
    assert r.status_code == 200
    body = r.json()
    # Đối chiếu với golden đã khoá: khoảng kết quả phải y hệt
    assert body["khoang_ket_qua_co_the"]["duong_doi"] == [4]
    assert body["khoang_ket_qua_co_the"]["linh_hon"] == [4, 6, 22]
    assert body["engine_version"]
    assert any("KHÔNG xác định" in c for c in body["canh_bao"])


def test_do_nhay_tu_choi_ngay_khong_ton_tai() -> None:
    r = client.post("/v1/thanso/do-nhay", json={
        "ho_ten": ["Test"], "ngay": 31, "thang": 2, "nam": 2000,
    })
    assert r.status_code == 422


def test_do_nhay_tu_choi_ten_rong() -> None:
    r = client.post("/v1/thanso/do-nhay", json={
        "ho_ten": ["   "], "ngay": 1, "thang": 1, "nam": 2000,
    })
    assert r.status_code == 422


def test_chu_ky_tu_choi_khoang_qua_dai() -> None:
    r = client.post("/v1/thanso/chu-ky", json={
        "ngay": 1, "thang": 1, "nam": 1990, "tu_nam": 1990, "den_nam": 2090,
    })
    assert r.status_code == 422


def test_timebase_saigon_1970_phoi_du_co() -> None:
    """Ca kinh điển: 00:30 ngày 02/12/1970 tại Sài Gòn (đồng hồ UTC+8).
    Phải trả về 23:30 ngày 01/12 theo kinh tuyến lịch, kèm cờ tz_adjusted
    VÀ cờ ty_edge (23:30 sát biên giờ Tý)."""
    r = client.post("/v1/timebase/resolve", json={
        "ngay": 2, "thang": 12, "nam": 1970,
        "gio": 0, "phut": 30, "vung": "south",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["gio_kinh_tuyen_lich"] == "1970-12-01T23:30:00"
    assert body["mui_gio_dong_ho"] == 8.0
    loai = {f["loai"] for f in body["co_canh_bao"]}
    assert "tz_adjusted" in loai
    assert "ty_edge" in loai
    # Chính sách SWITCH_AT_0000: 23:30 vẫn thuộc ngày hôm đó (01/12)
    assert body["ngay_can_chi"] == "1970-12-01"


def test_timebase_hien_dai_khong_co_thua() -> None:
    r = client.post("/v1/timebase/resolve", json={
        "ngay": 15, "thang": 6, "nam": 1995,
        "gio": 10, "phut": 0, "vung": "north",
    })
    body = r.json()
    assert body["co_canh_bao"] == []
    assert body["gio_kinh_tuyen_lich"] == "1995-06-15T10:00:00"


def test_timebase_gio_ang_chung_bao_co() -> None:
    r = client.post("/v1/timebase/resolve", json={
        "ngay": 15, "thang": 6, "nam": 1995,
        "gio": 10, "phut": 0, "vung": "north", "do_tin_gio": "approx",
    })
    loai = {f["loai"] for f in r.json()["co_canh_bao"]}
    assert "hour_confidence" in loai
