# -*- coding: utf-8 -*-
"""QTE-1 tuần 6 — Phong thuỷ tiếng Anh: `/v1/phongthuy/menh-quai-en` = CÙNG mệnh quái `/menh-quai` (năm theo Lập xuân), nhãn
tiếng Anh (Kua number, quái, nhóm Đông/Tây, 8 hướng, 8 du niên + ý nghĩa). Viết TRƯỚC `app/chuyen_ngu/phongthuy_en.py`."""
from __future__ import annotations

import json
import re

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
DAU = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)


def test_menh_quai_en_cung_phep_tinh():
    vi = client.post("/v1/phongthuy/menh-quai", json={"birth_date": "1990-07-15", "gender": "nam"}).json()
    en = client.post("/v1/phongthuy/menh-quai-en", json={"birth_date": "1990-07-15", "gender": "nam"}).json()
    assert en["kua"] == vi["so"] == 1 and en["trigram"] == {"pinyin": "Kan", "han": "坎", "vi": "Khảm"}
    assert en["group"] == "East group" and en["year_used"] == 1990
    d = {x["direction"]: x for x in en["directions"]}
    assert d["Southeast"]["star"].startswith("Sheng Qi") and d["Southeast"]["good"] is True
    assert d["Southwest"]["star"].startswith("Jue Ming") and d["Southwest"]["good"] is False
    assert [x["direction"] for x in en["directions"] if x["good"]] == ["North", "East", "Southeast", "South"]
    assert all(x["meaning"] and x["best_use"] for x in en["directions"])


def test_nu_va_dau_nam():
    # Sinh 01/02/1990 (trước Lập xuân 04/02) → năm tính 1989.
    en = client.post("/v1/phongthuy/menh-quai-en", json={"birth_date": "1990-02-01", "gender": "nu"}).json()
    assert en["year_used"] == 1989 and en["before_start_of_spring"] is True


def test_khong_con_chu_viet():
    en = client.post("/v1/phongthuy/menh-quai-en", json={"birth_date": "1985-03-10", "gender": "nu"}).json()
    van = re.sub(r'"vi": "[^"]*"', "", json.dumps(en, ensure_ascii=False))
    assert not DAU.search(van)


def test_bang_kua():
    r = client.get("/v1/phongthuy/en/kua-table").json()
    assert {k["kua"] for k in r["kua"]} == {1, 2, 3, 4, 6, 7, 8, 9}
    k1 = next(k for k in r["kua"] if k["kua"] == 1)
    assert k1["best_directions"][0] == "Southeast"
