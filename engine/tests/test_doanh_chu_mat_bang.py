# -*- coding: utf-8 -*-
"""Kiểm định Mặt Bằng & Khai Trương (POST /v1/doanh-chu/mat-bang): Huyền Không + Mệnh Quái + Hoàng Lịch, VI/EN parity."""
from __future__ import annotations

import datetime as dt
import re

from fastapi.testclient import TestClient

from app import ngon_ngu
from app.calc import doanh_chu_mat_bang
from app.main import app

_VIET = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.IGNORECASE)


def _walk_en_strings(obj, skip_keys: set[str]):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in skip_keys:
                continue
            yield from _walk_en_strings(v, skip_keys)
    elif isinstance(obj, list):
        for item in obj:
            yield from _walk_en_strings(item, skip_keys)
    elif isinstance(obj, str):
        yield obj


def test_mat_bang_tat_dinh_va_du_5_khu_vuc():
    d0 = dt.date(2026, 6, 1)
    kq1 = doanh_chu_mat_bang.kiem_tra_mat_bang(180.0, 2024, 15, 8, 1986, "nam", "cua_hang", d0)
    kq2 = doanh_chu_mat_bang.kiem_tra_mat_bang(180.0, 2024, 15, 8, 1986, "nam", "cua_hang", d0)
    assert kq1 == kq2
    assert kq1["mat_bang"]["phuong_huong"] == "Nam"
    assert kq1["mat_bang"]["son_huong"] == "Ngọ"
    assert kq1["mat_bang"]["son_toa"] == "Tý"
    assert kq1["mat_bang"]["canh_bao_kiem_huong"] is None
    assert len(kq1["danh_sach_khu_vuc"]) == 5
    for kv in kq1["danh_sach_khu_vuc"]:
        assert kv["thuan_loi"] and kv["nen_chu_y"]
    assert 1 <= len(kq1["ngay_khai_truong"]) <= 5


def test_mat_bang_canh_bao_kiem_huong_vi_en():
    d0 = dt.date(2026, 6, 1)
    vi_kq = doanh_chu_mat_bang.kiem_tra_mat_bang(22.5, 2024, 15, 8, 1986, "nam", "cua_hang", d0)
    assert vi_kq["mat_bang"]["canh_bao_kiem_huong"]
    assert "Kiêm hướng" in vi_kq["mat_bang"]["canh_bao_kiem_huong"]
    with ngon_ngu.dung("en"):
        en_kq = doanh_chu_mat_bang.kiem_tra_mat_bang(22.5, 2024, 15, 8, 1986, "nam", "cua_hang", d0)
    assert en_kq["mat_bang"]["canh_bao_kiem_huong"]
    assert not _VIET.search(en_kq["mat_bang"]["canh_bao_kiem_huong"])


def test_mat_bang_en_khong_ro_chu_viet():
    with ngon_ngu.dung("en"):
        kq = doanh_chu_mat_bang.kiem_tra_mat_bang(135.0, 2024, 15, 8, 1986, "nu", "van_phong", dt.date(2026, 6, 1))
    leaks = [s for s in _walk_en_strings(kq, {"can_chi", "truc", "luu_y_ngay", "son_toa", "son_huong"}) if _VIET.search(s)]
    assert leaks == [], f"Vietnamese text leaked in EN mode: {leaks[:3]}"


def test_mat_bang_api_http_va_422():
    client = TestClient(app)
    r = client.post("/v1/doanh-chu/mat-bang", json={
        "do_huong": 180.0, "nam_xay": 2024, "ngay_sinh": 15, "thang_sinh": 8, "nam_sinh": 1986,
        "gioi_tinh": "nam", "loai_hinh": "quan_ca_phe",
    })
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["khong_luu_du_lieu"] is True
    assert d["loai_hinh"]["ma"] == "quan_ca_phe"
    assert len(d["danh_sach_khu_vuc"]) == 5

    r_bad = client.post("/v1/doanh-chu/mat-bang", json={
        "do_huong": 400.0, "nam_xay": 2024, "ngay_sinh": 15, "thang_sinh": 8, "nam_sinh": 1986,
    })
    assert r_bad.status_code == 422
