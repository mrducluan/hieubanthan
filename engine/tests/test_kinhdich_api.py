# -*- coding: utf-8 -*-
"""Endpoint /v1/kinhdich/khoi-que.

Kỷ luật từ skill kinh-dich (mục 3–4) được ép ở tầng API:
  - chốt MỘT trường phái trước khi gieo;
  - Lục Hào bắt buộc chốt dụng thần trước (thiếu → 422, không cho gieo);
  - quẻ do engine gieo (CSPRNG) hoặc người dùng gieo tay — không có đường nào
    để LLM/web tự "chọn" quẻ theo số King Wen.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
URL = "/v1/kinhdich/khoi-que"
GOLDEN = json.loads(
    (Path(__file__).parents[1] / "fixtures" / "golden" / "kinhdich.json").read_text("utf-8")
)
BASE = {"cau_hoi": "Có nên nhận dự án X trong quý 4 không?", "truong_phai": "nghia_ly"}


@pytest.mark.parametrize("ca_id", list(GOLDEN["bien_chiem"]))
def test_gieo_tay_khop_golden(ca_id: str) -> None:
    ca = GOLDEN["bien_chiem"][ca_id]
    r = client.post(URL, json={**BASE, "gia_tri_hao": ca["gia_tri_hao"]})
    assert r.status_code == 200, r.text
    d = r.json()
    for k, v in ca["expect"].items():
        assert d[k] == v, k
    assert d["meta"]["nguon_ngau_nhien"] == "gieo tay (người dùng nhập)"
    assert d["engine_version"]


@pytest.mark.parametrize("pp", ["thi", "tien", "thi-vatly"])
def test_engine_tu_gieo(pp: str) -> None:
    r = client.post(URL, json={**BASE, "phuong_phap": pp})
    assert r.status_code == 200, r.text
    d = r.json()
    vals = d["meta"]["gia_tri_hao_1_den_6"]
    assert len(vals) == 6 and set(vals) <= {6, 7, 8, 9}
    assert d["meta"]["phuong_phap"] == pp
    assert 1 <= d["quai_ban"]["so_king_wen"] <= 64


def test_luc_hao_thieu_dung_than_bi_chan() -> None:
    r = client.post(URL, json={**BASE, "truong_phai": "luc_hao"})
    assert r.status_code == 422
    assert "dụng thần" in r.text


def test_luc_hao_co_dung_than() -> None:
    r = client.post(URL, json={**BASE, "truong_phai": "luc_hao", "dung_than": "Thê Tài",
                               "tieu_chi_sai": "Sau 6 tháng doanh thu dưới hoà vốn"})
    assert r.status_code == 200, r.text
    m = r.json()["meta"]
    assert m["dung_than_chot_truoc"] == "Thê Tài"
    assert m["truong_phai"] == "luc_hao"


def test_dung_than_ngoai_luc_than_bi_tu_choi() -> None:
    r = client.post(URL, json={**BASE, "truong_phai": "luc_hao", "dung_than": "Tài Lộc"})
    assert r.status_code == 422


def test_thieu_tieu_chi_sai_gan_co() -> None:
    d = client.post(URL, json={**BASE, "gia_tri_hao": [7, 8, 7, 8, 7, 8]}).json()
    assert any(c["loai"] == "chua_chot_tieu_chi_sai" for c in d["co_canh_bao"])


@pytest.mark.parametrize("body", [
    {"truong_phai": "nghia_ly"},                                   # thiếu câu hỏi
    {**BASE, "truong_phai": "tu_chon"},                            # phái lạ
    {**BASE, "gia_tri_hao": [7, 8, 7, 8, 7]},                      # thiếu hào
    {**BASE, "gia_tri_hao": [7, 8, 7, 8, 7, 5]},                   # giá trị lạ
    {**BASE, "phuong_phap": "chon_tay"},
    {**BASE, "so_king_wen": 1},                                    # không cho chọn quẻ
])
def test_dau_vao_sai(body: dict) -> None:
    assert client.post(URL, json=body).status_code == 422
