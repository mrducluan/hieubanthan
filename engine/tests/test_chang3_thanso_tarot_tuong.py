# -*- coding: utf-8 -*-
"""Chặng 3.2 & 3.3 — Kiểm thử Đối chiếu Tướng–Mệnh (Saint-Germain 1897), Thần số 5 phái & Tarot 56 lá Ẩn Phụ ngược."""
from __future__ import annotations

import json
import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from tests import _dau_ra as dr

ROOT = Path(__file__).resolve().parents[1]
NGUON = ROOT / "fixtures" / "nguon"
KB_DIR = ROOT / "app" / "kb" / "data"
_VIET = re.compile(r"[ăâđêôơưàáạảãầấậẩẫằắặẳẵèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]", re.I)
_C = TestClient(app)


def test_saint_germain_va_thanso_co_dien_khop_nguyen_van_kho_nguon():
    sg_doc = json.loads((NGUON / "chi_tay_saint_germain_1897.json").read_text("utf-8"))
    sg_full = "\n".join("\n".join(c.get("doan", [])) for c in sg_doc["chuong"])
    tm_kb = json.loads((KB_DIR / "tuong_menh_doi_chieu_kb.json").read_text("utf-8"))
    for ma, item in tm_kb["saint_germain_1897"]["muc"].items():
        assert len(item["nguyen_van_en"]) >= 30
        assert item["nguyen_van_en"] in sg_full, f"Lệch nguyên văn Saint-Germain ở {ma}"

    wc_full = "\n".join("\n".join(c.get("doan", [])) for c in json.loads((NGUON / "thanso_westcott_numbers_1911.json").read_text("utf-8"))["chuong"])
    sp_full = "\n".join("\n".join(c.get("doan", [])) for c in json.loads((NGUON / "thanso_sepharial_kabala.json").read_text("utf-8"))["chuong"])
    bl_full = "\n".join("\n".join(c.get("doan", [])) for c in json.loads((NGUON / "thanso_balliett_philosophy_1908.json").read_text("utf-8"))["chuong"])
    ts_kb = json.loads((KB_DIR / "thanso_da_phai_kb.json").read_text("utf-8"))["trich_co_dien"]
    assert ts_kb["westcott_1911"]["nguyen_van_en"] in wc_full
    assert ts_kb["sepharial_kabala"]["nguyen_van_en"] in sp_full
    for k in ("nguyen_van_1", "nguyen_van_4", "nguyen_van_8"):
        assert ts_kb["balliett_1908"][k] in bl_full


def test_tarot_56_an_phu_nguoc_khop_waite_1910_va_mathers_1888():
    tw = json.loads((NGUON / "tarot_waite_1910.json").read_text("utf-8"))
    tm = json.loads((NGUON / "tarot_mathers_1888.json").read_text("utf-8"))
    tr_kb = json.loads((KB_DIR / "tarot_an_phu_nguoc_kb.json").read_text("utf-8"))
    assert len(tr_kb["la_an_phu"]) == 56
    for cid, m in tr_kb["la_an_phu"].items():
        w_expected = tw[cid]["y_nguoc"] or tw[cid].get("them_nguoc")
        assert m["trich_waite_1910_nguoc"] == w_expected, cid
        assert m["trich_mathers_1888_nguoc"] == tm[cid]["y_nguoc"], cid


def test_api_tuong_menh_doi_chieu_song_ngu_va_tuoi_16():
    nho = _C.post("/v1/nhan-tuong/doi-chieu-menh", json={"ngay_sinh": "2014-05-10", "ngay_xem": "2026-11-27"}).json()
    assert nho["chuyen_huong_tuoi"]["tuoi"] < 16 and "goc_menh_nam_nay" not in nho

    p = {
        "ngay_sinh": "1990-05-15",
        "gioi_tinh": "nam",
        "gio_sinh": "08:30",
        "do_lech_hai_tay": "thuan_troi",
        "ngay_xem": "2026-11-27",
    }
    vi = _C.post("/v1/nhan-tuong/doi-chieu-menh", json=p).json()
    en = _C.post("/v1/nhan-tuong/doi-chieu-menh", json=p, headers={"x-ngon-ngu": "en"}).json()
    assert "diem" not in vi and vi["goc_tuong_luu_nien"]["tuoi_mu"] == 37
    assert len(vi["goc_chi_tay_dong_tay"]["diem_doi_chieu"]) == 3
    assert not _VIET.search(json.dumps(en, ensure_ascii=False)), en
    assert dr.khung(vi) == dr.khung(en)


def test_api_thanso_5_phai_va_tarot_chieu_sau_song_ngu():
    p_ts = {"ngay_sinh": "1988-11-22", "ho_ten": "Nguyen Van Minh", "ngay_xem": "2026-11-27"}
    vi_ts = _C.post("/v1/thanso/doi-chieu-phai", json=p_ts).json()
    en_ts = _C.post("/v1/thanso/doi-chieu-phai", json=p_ts, headers={"x-ngon-ngu": "en"}).json()
    assert len(vi_ts["nam_phai"]) == 5 and "diem" not in vi_ts
    assert not _VIET.search(json.dumps(en_ts, ensure_ascii=False)), en_ts
    assert dr.khung(vi_ts) == dr.khung(en_ts)

    p_tr = {
        "la": [
            {"id": "gay_1", "nguoc": True},
            {"id": "kiem_3", "nguoc": False},
            {"id": "coc_2", "nguoc": True},
            {"id": "dai_0", "nguoc": True},
        ]
    }
    vi_tr = _C.post("/v1/tarot/chieu-sau", json=p_tr).json()
    en_tr = _C.post("/v1/tarot/chieu-sau", json=p_tr, headers={"x-ngon-ngu": "en"}).json()
    assert vi_tr["so_la_nguoc"] == 3
    assert [x["quan_he"] for x in vi_tr["pham_gia_nguyen_to"]] == ["tuong_tro", "trung_tinh", "trung_tinh"]
    assert not _VIET.search(json.dumps(en_tr, ensure_ascii=False)), en_tr
    # Bỏ qua trường trich_mathers_1888_nguoc=None của lá dai_0 vẫn khớp khung
    assert dr.khung(vi_tr) == dr.khung(en_tr)
