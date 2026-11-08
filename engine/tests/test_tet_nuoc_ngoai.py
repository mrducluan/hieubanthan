# -*- coding: utf-8 -*-
"""QTE-1 tuần 2 — trang "Tết ở nước ngoài" (Mỹ, Nhật, Úc, Canada): ngày Tết theo âm lịch Việt Nam, so lịch Trung Quốc,
giờ giao thừa Việt Nam quy ra giờ từng vùng (múi giờ IANA, có giờ mùa hè), câu trả lời nhanh + hỏi đáp từ KB.
Viết TRƯỚC `app/luangiai/tet_nuoc_ngoai.py`."""
from __future__ import annotations

import datetime as dt
import json
import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.luangiai import tet_nuoc_ngoai as t
from app.main import app

client = TestClient(app)
KB = Path(__file__).resolve().parents[1] / "app" / "kb" / "data" / "tet_nuoc_ngoai_kb.json"


def test_kb_khung():
    d = json.loads(KB.read_text(encoding="utf-8"))
    assert d["source_id"] and d["school_id"]
    assert set(d["nuoc"]) == {"my", "nhat-ban", "uc", "canada"}


def test_tet_2027_my():
    kq = t.tet("my", 2027)
    assert kq["ngay_tet"] == "2027-02-06" and kq["can_chi"] == "Đinh Mùi"
    assert kq["lich_khac"] is False
    # 0 giờ 06/02/2027 giờ VN = 09:00 05/02 ở Los Angeles (UTC−8), 12:00 05/02 ở New York (UTC−5) — tháng 2 chưa giờ mùa hè.
    vung = {v["mui_gio"]: v for v in kq["gio_giao_thua_vn"]}
    assert vung["America/Los_Angeles"]["gio"] == "09:00" and vung["America/Los_Angeles"]["ngay"] == "2027-02-05"
    assert vung["America/New_York"]["gio"] == "12:00"
    assert all(len(v["thanh_pho"]) >= 1 for v in kq["gio_giao_thua_vn"])
    assert kq["dem_giao_thua"] == "05/02 → 06/02/2027"


def test_tet_uc_mua_he_va_nhat():
    sy = {v["mui_gio"]: v for v in t.tet("uc", 2027)["gio_giao_thua_vn"]}
    assert sy["Australia/Sydney"]["gio"] == "04:00" and sy["Australia/Sydney"]["ngay"] == "2027-02-06"   # UTC+11 mùa hè
    assert sy["Australia/Brisbane"]["gio"] == "03:00"
    jp = t.tet("nhat-ban", 2027)["gio_giao_thua_vn"]
    assert [(v["gio"], v["ngay"]) for v in jp] == [("02:00", "2027-02-06")]


def test_lich_viet_trung_khac_2030():
    kq = t.tet("canada", 2030)
    assert kq["ngay_tet"] == "2030-02-02" and kq["ngay_tet_trung"] == "2030-02-03" and kq["lich_khac"] is True
    assert "khác lịch Việt Nam" in kq["ghi_chu_lich"]


def test_loi_khong_con_bien_va_co_so_lieu():
    for slug in t.CAC_NUOC:
        kq = t.tet(slug, 2027)
        van = json.dumps(kq, ensure_ascii=False)
        assert not re.search(r"\{[a-z_]+\}", van), slug
        assert "06/02/2027" in kq["tra_loi_nhanh"] and len(kq["hoi_dap"]) == 4


def test_nam_tet_sap_toi():
    assert t.nam_tet_sap_toi(dt.date(2026, 11, 8)) == 2027
    assert t.nam_tet_sap_toi(dt.date(2027, 2, 6)) == 2027
    assert t.nam_tet_sap_toi(dt.date(2027, 2, 20)) == 2028


def test_api():
    r = client.get("/v1/tet-nuoc-ngoai")
    assert r.status_code == 200 and {n["slug"] for n in r.json()["nuoc"]} == {"my", "nhat-ban", "uc", "canada"}
    r = client.get("/v1/tet-nuoc-ngoai/my", params={"nam": 2027})
    assert r.status_code == 200 and r.json()["ngay_tet"] == "2027-02-06"
    assert client.get("/v1/tet-nuoc-ngoai/phap").status_code == 404
    assert client.get("/v1/tet-nuoc-ngoai/my", params={"nam": 1800}).status_code == 422
