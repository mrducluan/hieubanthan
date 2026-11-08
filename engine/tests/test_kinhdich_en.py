# -*- coding: utf-8 -*-
"""QTE-1 tuần 7 — Kinh Dịch tiếng Anh: `/v1/kinhdich/gieo-en` gieo bằng CÙNG hàm `calc.kinhdich` (CSPRNG, hoặc 6 giá trị
người dùng gieo tay), nhãn tiếng Anh (quẻ bản / quẻ biến / quẻ hỗ, quái trên dưới, hào động) + 64 quẻ từ KB tiếng Anh.
Câu hỏi KHÔNG gửi lên. Viết TRƯỚC `app/chuyen_ngu/kinhdich_en.py`."""
from __future__ import annotations

import json
import re

from fastapi.testclient import TestClient

from app.chuyen_ngu import kinhdich_en
from app.main import app

client = TestClient(app)
DAU = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)


def test_gieo_tay_cung_cau_truc_ban_viet():
    vi = client.post("/v1/kinhdich/khoi-que", json={"cau_hoi": "abc", "truong_phai": "nghia_ly",
                                                     "gia_tri_hao": [7, 8, 9, 7, 6, 8]}).json()
    en = client.post("/v1/kinhdich/gieo-en", json={"gia_tri_hao": [7, 8, 9, 7, 6, 8]}).json()
    assert en["primary"]["number"] == vi["quai_ban"]["so_king_wen"] == 55
    assert en["primary"]["name"] == "Abundance" and en["primary"]["pinyin"] == "Feng"
    assert en["primary"]["upper"]["image"] == "Thunder" and en["primary"]["lower"]["image"] == "Fire"
    assert en["changing_lines"] == [3, 5]
    assert en["changed"]["number"] == vi["quai_bien"]["so_king_wen"]
    assert [l["yang"] for l in en["lines"]] == [True, False, True, True, False, False]


def test_gieo_may_va_khong_dau():
    en = client.post("/v1/kinhdich/gieo-en", json={}).json()
    assert 1 <= en["primary"]["number"] <= 64 and len(en["values"]) == 6
    assert not DAU.search(re.sub(r'"vi": "[^"]*"', "", json.dumps(en, ensure_ascii=False)))
    assert client.post("/v1/kinhdich/gieo-en", json={"cau_hoi": "x"}).status_code == 422   # câu hỏi không được gửi


def test_64_que():
    ds = kinhdich_en.hexagrams()
    assert len(ds) == 64 and ds[0]["name"] == "The Creative" and ds[63]["name"] == "Before Completion"
    assert len({h["slug"] for h in ds}) == 64
    assert client.get("/v1/kinhdich/en/hexagram/1-qian").json()["number"] == 1
    assert client.get("/v1/kinhdich/en/hexagram/khong-co").status_code == 404
