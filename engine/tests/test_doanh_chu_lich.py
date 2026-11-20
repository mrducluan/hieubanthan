# -*- coding: utf-8 -*-
"""Kiểm định Lịch Quyết Định 12 Tháng (POST /v1/doanh-chu/lich-12-thang): tất định, 12 tháng đủ ngày đẹp, VI/EN parity."""
from __future__ import annotations

import re

from fastapi.testclient import TestClient

from app import ngon_ngu
from app.calc import doanh_chu_lich
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


def test_lich_12_thang_tat_dinh_va_du_12_thang():
    kq1 = doanh_chu_lich.lich_quyet_dinh_12_thang(15, 8, 1986, "nam", 2026, "chu_dn", "tang_truong")
    kq2 = doanh_chu_lich.lich_quyet_dinh_12_thang(15, 8, 1986, "nam", 2026, "chu_dn", "tang_truong")
    assert kq1 == kq2
    assert len(kq1["muoi_hai_thang"]) == 12
    for idx, t in enumerate(kq1["muoi_hai_thang"], start=1):
        assert t["thang"] == idx
        assert t["nhip_thang"] in ("day_manh", "can_bang", "phong_thu")
        assert len(t["nen_lam"]) > 20
        assert len(t["nen_chu_y"]) > 20
        assert 1 <= len(t["ngay_dep"]) <= 3
        for nd in t["ngay_dep"]:
            assert nd["ngay"].startswith(f"2026-{idx:02d}-")


def test_lich_12_thang_en_khong_ro_chu_viet():
    with ngon_ngu.dung("en"):
        kq = doanh_chu_lich.lich_quyet_dinh_12_thang(15, 8, 1986, "nam", 2026, "giam_doc", "ky_ket")
    # Chỉ bỏ qua can_chi_thang và ngay_dep (tên Can Chi / Trực gốc Hán-Việt)
    leaks = [s for s in _walk_en_strings(kq, {"can_chi_thang", "can_chi", "truc", "luu_y_ngay"}) if _VIET.search(s)]
    assert leaks == [], f"Vietnamese text leaked in EN mode: {leaks[:3]}"


def test_lich_12_thang_api_http_va_422():
    client = TestClient(app)
    r = client.post("/v1/doanh-chu/lich-12-thang", json={
        "ngay": 15, "thang": 8, "nam": 1986, "gioi_tinh": "nam",
        "nam_xem": 2026, "cap_quan_ly": "truong_nhom", "muc_tieu": "ra_mat",
    })
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["khong_luu_du_lieu"] is True
    assert d["muc_tieu"]["ma"] == "ra_mat"
    assert len(d["muoi_hai_thang"]) == 12

    r_bad = client.post("/v1/doanh-chu/lich-12-thang", json={
        "ngay": 31, "thang": 2, "nam": 1986, "gioi_tinh": "nam", "nam_xem": 2026,
    })
    assert r_bad.status_code == 422
