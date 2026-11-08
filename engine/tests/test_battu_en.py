# -*- coding: utf-8 -*-
"""QTE-1 tuần 3–4 — Bát tự tiếng Anh: `/v1/battu/la-so-en` trả cùng phép tính với `/v1/battu/la-so` nhưng nhãn tiếng Anh
(can chi pinyin + chữ Hán, ngũ hành, thập thần, sức Day Master, đại vận, cảnh báo) và mô tả Day Master từ KB tiếng Anh.
Không chữ có dấu tiếng Việt trong đầu ra; KB tiếng Anh qua bộ kiểm chuyển ngữ. Viết TRƯỚC `app/chuyen_ngu/battu_en.py`."""
from __future__ import annotations

import json
import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.chuyen_ngu import battu_en, kiem
from app.main import app

client = TestClient(app)
DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"
VAO = {"birth_date": "1990-07-15", "birth_time": "10:00", "gender": "nam", "noi_sinh": "nuoc_ngoai",
       "utc_noi_sinh": -8, "gio_mua_he": True}
DAU = re.compile(r"[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]", re.I)


def test_kb_en_du_10_nhat_chu_va_qua_kiem():
    vi = json.loads((DATA / "battu_kb.json").read_text(encoding="utf-8"))["nhat_chu"]
    en = json.loads((DATA / "battu_kb.en.json").read_text(encoding="utf-8"))
    assert en["source_id"] and en["school_id"] and en["_trang_thai"] == "nhap_may"
    assert set(en["nhat_chu"]) == set(vi)
    for k, e in en["nhat_chu"].items():
        for truong in ("tinh_chat", "diem_manh", "mat_toi", "cau_tu_soi"):
            loi = [l for l in kiem.kiem(vi[k][truong], e[truong], mang=["bat_tu"]) if l["ma"] != "do_dai"]
            assert loi == [], (k, truong, loi)
    assert len({e["slug"] for e in en["nhat_chu"].values()}) == 10


def test_la_so_en_cung_phep_tinh():
    vi = client.post("/v1/battu/la-so", json=VAO).json()
    r = client.post("/v1/battu/la-so-en", json=VAO)
    assert r.status_code == 200
    en = r.json()
    assert [p["stem"]["vi"] for p in en["pillars"]] == [t["can"] for t in vi["tru"]]
    assert en["pillars"][2]["stem"] == {"vi": "Tân", "pinyin": "Xin", "han": "辛", "element": "Metal", "yin_yang": "Yin"}
    assert en["pillars"][0]["branch"]["animal"] == "Horse"
    assert en["day_master"]["slug"] == "xin-metal" and en["day_master"]["image"] == "polished jewellery"
    assert en["strength"]["label"] == "Balanced" and en["strength"]["ratio"] == vi["than"]["ti_le"]
    assert set(en["elements"]) == {"Wood", "Fire", "Earth", "Metal", "Water"}
    assert en["ten_gods_stems"][2] == "Day Master" and en["ten_gods_stems"][1] == "Eating God"
    assert en["luck_pillars"][0]["from_year"] == vi["dai_van"]["ds"][0]["tu_nam"]
    assert any(w["type"] == "daylight_saving" for w in en["warnings"])


def test_khong_con_chu_viet():
    en = client.post("/v1/battu/la-so-en", json=VAO).json()
    van = json.dumps({k: v for k, v in en.items()}, ensure_ascii=False)
    # trường "vi" giữ tên gốc để đối chiếu — bỏ ra trước khi quét
    van = re.sub(r'"vi": "[^"]*"', "", van)
    assert not DAU.search(van), DAU.search(van)


def test_nhat_chu_trang():
    ds = battu_en.day_masters()
    assert len(ds) == 10 and ds[0]["slug"] == "jia-wood"
    one = battu_en.day_master("ren-water")
    assert one["element"] == "Water" and one["yin_yang"] == "Yang"
    assert battu_en.day_master("khong-co") is None


def test_api_day_master():
    assert len(client.get("/v1/battu/en/day-masters").json()["day_masters"]) == 10
    assert client.get("/v1/battu/en/day-master/jia-wood").json()["han"] == "甲"
    assert client.get("/v1/battu/en/day-master/khong-co").status_code == 404
