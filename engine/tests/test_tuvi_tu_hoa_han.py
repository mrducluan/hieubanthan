# -*- coding: utf-8 -*-
"""TV-HOA-HAN — tứ hoá của đại hạn / lưu niên đặt lên lá số + mốc năm của 12 đại hạn + trang "sao ở cung".
Test viết TRƯỚC.

Không thêm phép tính Tử vi mới: `tu_hoa_sao` chỉ gắn MÃ hoá + vị trí sao (đọc từ chính lá số iztro trả) cho mảng
`tu_hoa` iztro đã có; `tu_nam` của đại hạn = năm âm lập lá + tuổi mụ đầu hạn − 1 (đối chiếu độc lập bằng /van-han:
năm đó tuổi mụ đúng bằng tuổi đầu hạn và đại hạn rơi đúng cung).
"""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import tuvi_an_sao as az
from app.calc.tuvi_luu_nguyet import TU_HOA
from app.kb import trang_tuvi
from app.main import app

client = TestClient(app)
G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "ziwei_van_han.json")
               .read_text(encoding="utf-8"))["cases"]
MA = ["loc", "quyen", "khoa", "ky"]


def _ngay(s: str) -> dt.date:
    y, m, d = (int(x) for x in s.split("-"))
    return dt.date(y, m, d)


@pytest.mark.parametrize("ma", sorted(G))
def test_tu_hoa_sao_khop_mang_tu_hoa_va_vi_tri_tren_la_goc(ma):
    c = G[ma]["input"]
    gt = "nam" if c["g"] == "male" else "nu"
    vh = az.van_han(_ngay(c["d"]), c["ti"], gt, _ngay(c["ngay_xem"]), chi_tiet=True)
    la = az.an_sao_tho(_ngay(c["d"]), c["ti"], gt)
    for lop in ("dai_han", "luu_nien"):
        ds = vh[lop]["tu_hoa_sao"]
        assert [x["hoa"] for x in ds] == MA
        assert [x["sao"] for x in ds] == vh[lop]["tu_hoa"] == TU_HOA[vh[lop]["can"]]
        for x in ds:
            p = la["palaces"][x["chi_so"]]
            assert x["sao"] in [s["name"] for s in p["majorStars"] + p["minorStars"]]
            assert (x["cung"], x["chi"]) == (p["name"], p["earthlyBranch"])
            assert x["chinh_tinh"] == any(s["name"] == x["sao"] for s in p["majorStars"])


def test_khong_chi_tiet_khong_doi():
    """Golden ziwei_van_han.json (không chi_tiet) giữ nguyên dạng — trường mới chỉ ở bản chi tiết."""
    c = next(iter(G.values()))["input"]
    vh = az.van_han(_ngay(c["d"]), c["ti"], "nam" if c["g"] == "male" else "nu", _ngay(c["ngay_xem"]))
    assert "tu_hoa_sao" not in vh["dai_han"] and "tu_hoa_sao" not in vh["luu_nien"]


def test_api_van_han_co_tu_hoa_sao():
    la_so = {"birth_date": "1990-05-17", "birth_time": "11:00", "gender": "nam"}
    d = client.post("/v1/tuvi/van-han", json={"la_so": la_so, "nam_xem": 2027}).json()
    assert d["can_chi_nam_xem"] == "Đinh Mùi"
    assert [x["sao"] for x in d["luu_nien"]["tu_hoa_sao"]] == ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"]
    ls = client.post("/v1/tuvi/an-sao", json=la_so).json()
    for x in d["luu_nien"]["tu_hoa_sao"] + d["dai_han"]["tu_hoa_sao"]:
        cung = ls["cung"][x["chi_so"]]
        assert cung["ten"] == x["cung"]
        assert x["sao"] in [s["ten"] for s in cung["chinh_tinh"] + cung["phu_tinh"]]


@pytest.mark.parametrize("sinh", [
    {"birth_date": "1990-05-17", "birth_time": "11:00", "gender": "nam"},
    {"birth_date": "1985-02-19", "birth_time": "23:30", "gender": "nu"},    # Tý muộn đêm giao thừa Ất Sửu
    {"birth_date": "1968-01-29", "birth_time": "08:00", "gender": "nu", "vung": "south"},
])
def test_dai_han_tu_nam_doi_chieu_van_han(sinh):
    ls = client.post("/v1/tuvi/an-sao", json=sinh)
    assert ls.status_code == 200, ls.text
    cung = ls.json()["cung"]
    nam = sorted(c["dai_han"]["tu_nam"] for c in cung)
    assert [b - a for a, b in zip(nam, nam[1:])] == [10] * 11
    for i, c in enumerate(cung):
        dh = c["dai_han"]
        assert dh["den_nam"] - dh["tu_nam"] == dh["den_tuoi"] - dh["tu_tuoi"]
    for i in (0, 5):          # hai cung bất kỳ: năm đầu hạn → tuổi mụ = tuổi đầu hạn, đại hạn đúng cung
        c = sorted(cung, key=lambda k: k["dai_han"]["tu_nam"])[i]
        vh = client.post("/v1/tuvi/van-han", json={"la_so": sinh, "nam_xem": c["dai_han"]["tu_nam"]}).json()
        assert vh["tuoi_mu"] == c["dai_han"]["tu_tuoi"]
        assert cung[vh["dai_han"]["chi_so"]]["chi"] == c["chi"]


def test_chinh_tinh_co_trang_sao_cung():
    ls = client.post("/v1/tuvi/an-sao", json={"birth_date": "1990-05-17", "birth_time": "11:00", "gender": "nam"}).json()
    co = dict(trang_tuvi.ds_sao_cung())
    so = 0
    for c in ls["cung"]:
        for s in c["chinh_tinh"]:
            assert s["trang_sao_cung"] == co[(s["ten"], c["ten"])]
            so += 1
        for s in c["phu_tinh"]:
            assert "trang_sao_cung" not in s
    assert so == 14
