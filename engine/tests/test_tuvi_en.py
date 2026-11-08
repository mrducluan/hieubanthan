# -*- coding: utf-8 -*-
"""QTE-1 tuần 5 — Tử vi tiếng Anh: `/v1/tuvi/an-sao-en` = CÙNG lá số `/v1/tuvi/an-sao` (iztro, âm lịch theo `lich`), nhãn tiếng
Anh (cung, chính tinh, độ sáng Nam phái, tứ hoá, can chi cung, cục, đại hạn) + 14 chính tinh từ KB tiếng Anh.
Viết TRƯỚC `app/chuyen_ngu/tuvi_en.py`."""
from __future__ import annotations

import json
import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.chuyen_ngu import kiem, tuvi_en
from app.main import app

client = TestClient(app)
DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
VAO = {"birth_date": "1990-07-15", "birth_time": "10:00", "gender": "nam", "noi_sinh": "nuoc_ngoai",
       "utc_noi_sinh": -8, "gio_mua_he": True}
DAU = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)


def test_kb_en_14_chinh_tinh_qua_kiem():
    vi = json.loads((DATA / "tuvi_kb.json").read_text(encoding="utf-8"))["chinh_tinh"]
    en = json.loads((DATA / "tuvi_kb.en.json").read_text(encoding="utf-8"))
    assert en["source_id"] and en["school_id"] and set(en["chinh_tinh"]) == set(vi)
    for k, e in en["chinh_tinh"].items():
        for t in ("diem_manh", "mat_toi", "cau_tu_soi"):
            assert [l for l in kiem.kiem(vi[k][t], e[t], mang=["tu_vi"]) if l["ma"] != "do_dai"] == [], (k, t)


def test_an_sao_en_cung_la_so():
    vi = client.post("/v1/tuvi/an-sao", json=VAO).json()
    en = client.post("/v1/tuvi/an-sao-en", json=VAO).json()
    assert [p["branch"]["vi"] for p in en["palaces"]] == [c["chi"] for c in vi["cung"]]
    menh = next(p for p in en["palaces"] if p["is_life"])
    assert menh["name"] == "Life Palace" and menh["major_stars"][0]["name"].startswith("Qi Sha")
    assert menh["major_stars"][0]["brightness"] == "Temple (brightest)"
    assert next(p for p in en["palaces"] if p["is_body"])["name"] == "Spouse Palace"
    tu_hoa = {s["transformation"] for p in en["palaces"] for s in p["major_stars"] if s["transformation"]}
    assert tu_hoa == {"Hua Lu", "Hua Quan", "Hua Ke", "Hua Ji"}
    assert en["element_bureau"] == "Earth 5 Bureau" and en["life_master"].startswith("Lu Cun")
    assert menh["major_period"] == {"from_age": 5, "to_age": 14, "from_year": 1994, "to_year": 2003}


def test_khong_con_chu_viet():
    en = client.post("/v1/tuvi/an-sao-en", json=VAO).json()
    van = re.sub(r'"vi": "[^"]*"', "", json.dumps(en, ensure_ascii=False))
    assert not DAU.search(van), van[max(0, DAU.search(van).start() - 80):DAU.search(van).start() + 20] if DAU.search(van) else ""


def test_sao_api():
    ds = client.get("/v1/tuvi/en/stars").json()["stars"]
    assert len(ds) == 14 and ds[0]["slug"] == "zi-wei" and ds[0]["han"] == "紫微"
    assert client.get("/v1/tuvi/en/star/qi-sha").json()["element"] == "Metal"
    assert client.get("/v1/tuvi/en/star/khong-co").status_code == 404
    assert tuvi_en.star("po-jun")["name"].startswith("Po Jun")
