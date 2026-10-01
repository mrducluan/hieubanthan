# -*- coding: utf-8 -*-
"""SPEC-005 — an sao tử vi đầy đủ qua iztro (Node subprocess). Test viết TRƯỚC.

Golden: fixtures/golden/ziwei_golden.json (8 lá, iztro cục bộ, đối chiếu aov.cc).
Không skip khi thiếu Node: CI phải cài (`npm ci --prefix engine/ziwei`) — thiếu là lỗi thật.
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import tuvi_an_sao as az
from app.main import app

client = TestClient(app)
G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "ziwei_golden.json")
               .read_text(encoding="utf-8"))["cases"]


def _dang_golden(la: dict) -> dict:
    """Đưa output thô về đúng dạng generator golden (_generate_ziwei_golden.mjs)."""
    return {
        "solar": la["solarDate"], "lunar": la["lunarDate"], "chineseDate": la["chineseDate"],
        "timeRange": la["time"], "fiveElements": la["fiveElementsClass"],
        "soul": la["soul"], "body": la["body"],
        "soulPalaceBranch": la["earthlyBranchOfSoulPalace"],
        "bodyPalaceBranch": la["earthlyBranchOfBodyPalace"],
        "palaces": [{
            "ten_cung": p["name"], "chi": p["earthlyBranch"], "can": p["heavenlyStem"],
            "la_than": p["isBodyPalace"], "la_menh": p["isOriginalPalace"],
            "major": sorted(s["name"] + (f"({s['mutagen']})" if s.get("mutagen") else "")
                            for s in p["majorStars"]),
            "minor": sorted(s["name"] for s in p["minorStars"]),
            "adj": sorted(s["name"] for s in p["adjectiveStars"]),
        } for p in la["palaces"]],
    }


@pytest.mark.parametrize("ma", sorted(G))
def test_khop_golden(ma):
    c = G[ma]["input"]
    y, m, d = (int(x) for x in c["d"].split("-"))
    la = az.an_sao_tho(dt.date(y, m, d), c["ti"], "nam" if c["g"] == "male" else "nu", "zh-CN")
    assert _dang_golden(la) == G[ma]["expect"]


def test_ghim_phien_ban_iztro():
    assert az.phien_ban_iztro() == "2.6.0"


@pytest.mark.parametrize("gio,phut,ti", [(0, 0, 0), (0, 59, 0), (1, 0, 1), (2, 59, 1), (3, 0, 2),
                                         (12, 30, 6), (21, 0, 11), (22, 59, 11), (23, 0, 12),
                                         (23, 59, 12)])
def test_chi_so_gio(gio, phut, ti):
    assert az.time_index(gio, phut) == ti


def test_tat_dinh():
    a = az.an_sao_tho(dt.date(1990, 5, 15), 1, "nam", "vi-VN")
    b = az.an_sao_tho(dt.date(1990, 5, 15), 1, "nam", "vi-VN")
    assert a == b and len(a["palaces"]) == 12


def test_api_an_sao_co_ban():
    r = client.post("/v1/tuvi/an-sao", json={"birth_date": "1990-05-15", "birth_time": "01:30",
                                              "gender": "nam"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["pham_vi"] == "an_sao_day_du" and d["iztro"] == "2.6.0"
    assert d["ngu_hanh_cuc"] == "Kim Tứ Cục"
    assert len(d["cung"]) == 12
    menh = [c for c in d["cung"] if c["la_menh"]]
    assert len(menh) == 1
    assert menh[0]["ten"] == "Mệnh" and menh[0]["chi"] == d["chi_cung_menh"]
    assert sum(c["la_lai_nhan"] for c in d["cung"]) == 1
    chinh = {s["ten"] for c in d["cung"] for s in c["chinh_tinh"]}
    assert len(chinh) == 14                 # đủ 14 chính tinh
    assert any(f["loai"] == "nam_phai" for f in d["co_canh_bao"])


def test_api_muon_ty_gan_co_xung_dot():
    r = client.post("/v1/tuvi/an-sao", json={"birth_date": "1995-06-15", "birth_time": "23:30",
                                              "gender": "nam"})
    d = r.json()
    assert d["gio_chi_so"] == 12
    assert any(f["loai"] == "ty_conflict" for f in d["co_canh_bao"])
    # iztro coi 23:xx là giờ Tý của ngày hôm sau → trụ ngày khác ca Tý sớm cùng ngày
    som = client.post("/v1/tuvi/an-sao", json={"birth_date": "1995-06-15", "birth_time": "00:30",
                                                "gender": "nam"}).json()
    assert d["tu_tru"] != som["tu_tru"]


def test_api_mien_nam_truoc_1975_quy_doi_mui_gio():
    """00:30 ngày 02/12/1970 ở Sài Gòn (UTC+8) = 23:30 ngày 01/12 giờ kinh tuyến UTC+7."""
    r = client.post("/v1/tuvi/an-sao", json={"birth_date": "1970-12-02", "birth_time": "00:30",
                                              "gender": "nu", "vung": "south"})
    d = r.json()
    assert d["duong_lich_kinh_tuyen"] == "1970-12-01" and d["gio_chi_so"] == 12
    assert any(f["loai"] == "tz_adjusted" for f in d["co_canh_bao"])


def test_api_truoc_1975_thieu_vung_422():
    r = client.post("/v1/tuvi/an-sao", json={"birth_date": "1970-12-02", "birth_time": "08:00",
                                              "gender": "nu"})
    assert r.status_code == 422


def test_api_am_lich_dau_vao():
    """Ngày âm 21/4/1990 (không nhuận) = dương 15/5/1990 → cùng lá với đầu vào dương."""
    a = client.post("/v1/tuvi/an-sao", json={"birth_date": "1990-05-15", "birth_time": "01:30",
                                              "gender": "nam"}).json()
    b = client.post("/v1/tuvi/an-sao", json={"birth_date": "1990-04-21", "birth_time": "01:30",
                                              "gender": "nam", "calendar_type": "am"}).json()
    assert a["cung"] == b["cung"]
