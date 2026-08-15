# -*- coding: utf-8 -*-
"""SPEC-004a — endpoint /v1/tuvi/tuan-triet.

Ba nhóm test bắt buộc theo spec:
  1. 5 ca golden trong fixtures/golden/ phải ra đúng 100%
  2. Sinh 23:30 → kiểm tra quy ước giờ Tý (chưa chốt → phải có cờ, không đoán)
  3. Sinh 1970 tại Sài Gòn → kiểm tra múi giờ UTC+8
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

GOLDEN = json.loads(
    (Path(__file__).parents[1] / "fixtures" / "golden" / "tuvi_tuan_triet.json")
    .read_text("utf-8")
)

# Input đồng hồ tương ứng từng ca golden (golden lưu ngày ĐÃ quy đổi UTC+7;
# API nhận giờ đồng hồ gốc nên phải khai lại ở đây).
CLOCK_INPUT = {
    "nen_1988": {"birth_date": "1988-12-02", "birth_time": "10:00", "vung": "north"},
    "truoc_tet_1988": {"birth_date": "1988-02-05", "birth_time": "08:00", "vung": "north"},
    # 02/12/1970 00:30 đồng hồ Sài Gòn (UTC+8) → 01/12 23:30 UTC+7 → golden dùng 01/12
    "saigon_1970": {"birth_date": "1970-12-02", "birth_time": "00:30", "vung": "south"},
    "bien_gio_ty": {"birth_date": "1990-06-15", "birth_time": "23:30", "vung": "north"},
    "xung_dot_cau_hinh": {"birth_date": "2000-02-05", "birth_time": "12:00", "vung": "north"},
}


def goi(case_id: str) -> dict:
    ca = GOLDEN["cases"][case_id]
    inp = ca["input"]
    body = {
        **CLOCK_INPUT[case_id],
        "gender": "nam",
        "calendar_type": "duong",
        "truong_phai": inp["truong_phai"],
        "che_do": inp["che_do"],
    }
    r = client.post("/v1/tuvi/tuan-triet", json=body)
    assert r.status_code == 200, r.text
    return r.json()


# ------------------------------------------------------------------ #
# 1. Golden 100%
# ------------------------------------------------------------------ #
@pytest.mark.parametrize("case_id", sorted(GOLDEN["cases"]))
def test_golden_100_phan_tram(case_id: str) -> None:
    body = goi(case_id)
    e = GOLDEN["cases"][case_id]["expect"]
    assert body["am_lich"] == e["am_lich"], case_id
    assert [body["can_chi_nam"]["can"], body["can_chi_nam"]["chi"]] == e["can_chi_nam"]
    assert body["tuan_triet"] == e["tuan_triet"], case_id


def test_truoc_tet_ra_nam_cu() -> None:
    """Chốt riêng cái bẫy quan trọng nhất: sinh 05/02/1988 → Đinh Mão 1987."""
    body = goi("truoc_tet_1988")
    assert body["can_chi_nam"] == {"can": "Đinh", "chi": "Mão"}
    assert body["am_lich"]["nam"] == 1987


# ------------------------------------------------------------------ #
# 2. Giờ Tý 23:30
# ------------------------------------------------------------------ #
def test_sinh_2330_theo_chinh_sach_0000() -> None:
    body = goi("bien_gio_ty")
    loai = {f["loai"] for f in body["co_canh_bao"]}
    assert "ty_edge" in loai                       # cờ nhạy cảm vẫn phải bật
    # SWITCH_AT_0000 (đã chốt 2026-08-15): 23:30 vẫn thuộc ngày hôm đó
    assert body["ngay_can_chi"] == "1990-06-15"
    assert body["ty_boundary_policy"] == "switch_at_0000"


# ------------------------------------------------------------------ #
# 3. Sài Gòn 1970 — UTC+8
# ------------------------------------------------------------------ #
def test_saigon_1970_quy_doi_mui_gio() -> None:
    body = goi("saigon_1970")
    assert body["mui_gio_dong_ho"] == 8.0
    assert body["duong_lich_kinh_tuyen"] == "1970-12-01"      # lùi một ngày
    loai = {f["loai"] for f in body["co_canh_bao"]}
    assert "tz_adjusted" in loai
    assert "ty_edge" in loai                                   # 23:30 sau quy đổi


# ------------------------------------------------------------------ #
# Ràng buộc đầu vào
# ------------------------------------------------------------------ #
def test_sinh_truoc_1975_bat_buoc_khai_vung() -> None:
    r = client.post("/v1/tuvi/tuan-triet", json={
        "birth_date": "1970-12-02", "birth_time": "00:30",
        "gender": "nam", "calendar_type": "duong",
    })
    assert r.status_code == 422
    assert "vùng" in r.json()["detail"].lower() or "vung" in r.json()["detail"].lower()


def test_sinh_sau_1975_khong_can_vung() -> None:
    r = client.post("/v1/tuvi/tuan-triet", json={
        "birth_date": "1995-06-15", "birth_time": "10:00",
        "gender": "nu", "calendar_type": "duong",
    })
    assert r.status_code == 200


def test_nhap_am_lich_duoc_doi_nguoc() -> None:
    """calendar_type=am: 24/10 âm Mậu Thìn → 02/12/1988 dương."""
    r = client.post("/v1/tuvi/tuan-triet", json={
        "birth_date": "1988-10-24", "birth_time": "10:00",
        "gender": "nam", "calendar_type": "am",
    })
    assert r.status_code == 200
    assert r.json()["duong_lich_goc"] == "1988-12-02"
    assert r.json()["can_chi_nam"] == {"can": "Mậu", "chi": "Thìn"}


def test_am_lich_thang_nhuan_bay_bi_tu_choi() -> None:
    r = client.post("/v1/tuvi/tuan-triet", json={
        "birth_date": "2024-04-01", "birth_time": "10:00",
        "gender": "nam", "calendar_type": "am", "am_nhuan": True,
    })
    assert r.status_code == 422


def test_gan_tet_co_co_canh_bao() -> None:
    """Sinh 16/02/1988 (một ngày trước Tết Mậu Thìn) → cờ tet_edge."""
    r = client.post("/v1/tuvi/tuan-triet", json={
        "birth_date": "1988-02-16", "birth_time": "12:00",
        "gender": "nam", "calendar_type": "duong",
    })
    loai = {f["loai"] for f in r.json()["co_canh_bao"]}
    assert "tet_edge" in loai
