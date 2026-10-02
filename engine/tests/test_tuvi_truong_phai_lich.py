# -*- coding: utf-8 -*-
"""TV-LICH — người dùng chọn trường phái: âm lịch Việt Nam (mặc định, UTC+7) ↔ lịch Trung Quốc (UTC+8, cách
iztro tự đổi lịch); vòng Thái Tuế đặt tên theo sách Việt (đối chiếu lasotuvi, MIT). Test viết TRƯỚC."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import tuvi_an_sao as az, tuvi_thai_tue_vn as tt
from app.main import app

client = TestClient(app)
_D = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "lasotuvi_60.json").read_text("utf-8"))
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]


def _menh(la: dict) -> str:
    return next(p["earthlyBranch"] for p in la["palaces"] if p["name"] == "Mệnh")


@pytest.mark.parametrize("c", _D["lich_lech"], ids=lambda c: c["ngay"])
def test_lich_trung_bang_iztro_goc(c):
    """lich='trung' = để iztro đổi lịch theo Trung Quốc (không thay kết quả đổi lịch)."""
    d = dt.date.fromisoformat(c["ngay"])
    goc = json.loads(az._chay(az._d(d), c["ti"], c["gioi_tinh"], "vi-VN"))
    trung = az.an_sao_tho(d, c["ti"], c["gioi_tinh"], hoa_linh="trung", lich="trung")
    assert [p["majorStars"] for p in trung["palaces"]] == [p["majorStars"] for p in goc["palaces"]]
    assert _menh(trung) == _menh(goc) and trung["fiveElementsClass"] == goc["fiveElementsClass"]


def test_doi_lich_lam_khac_la_so_o_ngay_lech():
    khac = 0
    for c in _D["lich_lech"]:
        d = dt.date.fromisoformat(c["ngay"])
        v = az.an_sao_tho(d, c["ti"], c["gioi_tinh"], lich="viet")
        t = az.an_sao_tho(d, c["ti"], c["gioi_tinh"], lich="trung")
        khac += (_menh(v), v["fiveElementsClass"], v["lunarDate"]) != (_menh(t), t["fiveElementsClass"], t["lunarDate"])
    assert khac >= 8                                  # đa số ngày lệch cho ra lá khác thật


def test_ngay_thuong_hai_lich_nhu_nhau():
    d = dt.date(1990, 5, 17)
    assert az.an_sao_tho(d, 6, "nam", lich="viet")["palaces"] == az.an_sao_tho(d, 6, "nam", lich="trung")["palaces"]


@pytest.mark.parametrize("c", _D["cases"] + _D["lich_lech"], ids=lambda c: c["ngay"])
def test_vong_thai_tue_nam_phai_khop_lasotuvi(c):
    d = dt.date.fromisoformat(c["ngay"])
    la = az.an_sao_tho(d, c["ti"], c["gioi_tinh"])
    ky_vong = {s["chi"][0]: s["ten"].lower() for k, s in c["sao"].items() if 15 <= int(k) <= 26}
    thuc = {p["earthlyBranch"]: tt.ten_nam_phai(p["suiqian12"]).lower() for p in la["palaces"]}
    assert thuc == ky_vong


def test_api_lich_trung_va_co_lich_khac():
    body = {"birth_date": "1985-01-30", "birth_time": "10:00", "gender": "nam", "noi_sinh": "ha-noi"}
    v = client.post("/v1/tuvi/an-sao", json=body).json()
    t = client.post("/v1/tuvi/an-sao", json={**body, "lich": "trung"}).json()
    assert v["phai"]["lich"] == "viet" and t["phai"]["lich"] == "trung"
    assert v["phai"]["lich_khac"] is True and v["am_lich"] != t["am_lich"]
    assert v["cung"][0]["thai_tue_nam_phai"]
    thuong = client.post("/v1/tuvi/an-sao", json={**body, "birth_date": "1990-05-17"}).json()
    assert thuong["phai"]["lich_khac"] is False


def test_doi_lich_bao_lech_lich_trung():
    r = client.post("/v1/lich/doi", json={"ngay": 30, "thang": 1, "nam": 1985, "chieu": "duong_sang_am"}).json()
    assert r["lech_lich_trung"] is True and r["am_trung_quoc"] != r["am"]
    r = client.post("/v1/lich/doi", json={"ngay": 17, "thang": 5, "nam": 1990, "chieu": "duong_sang_am"}).json()
    assert r["lech_lich_trung"] is False and r["am_trung_quoc"] == r["am"]
