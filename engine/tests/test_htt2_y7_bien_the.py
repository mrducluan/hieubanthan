# -*- coding: utf-8 -*-
"""Ý7 (HTT-2 mục 8, 2026-11-09) — biến thể bản phủ theo thị trường ("en-us" chồng lên "en"), phiếu mang biến thể,
`lech_ngon_ngu` so A/B biến thể với bản gốc của ngôn ngữ. Viết trước mã."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app import ngon_ngu
from app.kb import loi, nap
from app.luangiai import lech_ngon_ngu as lnn
from app.main import app

client = TestClient(app)
DATA = Path(__file__).resolve().parents[1] / "app" / "kb" / "data"


@pytest.mark.parametrize("vao,ra", [
    (None, None), ("vi", None), ("en", None), ("en-US", "en-us"), ("en_us", "en-us"), ("EN-us", "en-us"),
    ("en-au", None),              # chưa có thư mục bản phủ → dùng bản en gốc
    ("vi-VN", None), ("zh-TW", None), ("fr-ca", None), ("xx-yy", None), ("en-us-x", None),
])
def test_bien_the_cua(vao, ra):
    assert ngon_ngu.bien_the_cua(vao) == ra


def test_dung_dat_ca_ngon_ngu_lan_bien_the():
    with ngon_ngu.dung("en-US"):
        assert ngon_ngu.hien_tai() == "en" and ngon_ngu.bien_the() == "en-us" and ngon_ngu.ma_phieu() == "en-us"
    assert ngon_ngu.bien_the() is None and ngon_ngu.ma_phieu() == "vi"
    with ngon_ngu.dung("en"):
        assert ngon_ngu.bien_the() is None and ngon_ngu.ma_phieu() == "en"


def test_ban_phu_en_us_chong_len_en():
    """en-us chỉ đổi vài chuỗi; mọi khoá khác y hệt bản en; bản vi không đổi."""
    phu = json.loads((DATA / "en-us" / "loi_khuon.json").read_text("utf-8"))
    khoa = [k for k in phu if not k.startswith("_")]
    assert khoa, "bản phủ en-us phải có ít nhất một chuỗi"
    loi.xoa_nho()
    with ngon_ngu.dung("en"):
        en = loi.bang()
    with ngon_ngu.dung("en-US"):
        us = loi.bang()
    for k in khoa:
        assert us[k] == phu[k] and en[k] != us[k], k
        assert k in en, f"biến thể không được thêm khoá mới ngoài bản en: {k}"
    assert {k: v for k, v in us.items() if k not in khoa and not k.startswith("_")} == {k: v for k, v in en.items() if k not in khoa and not k.startswith("_")}
    assert "Favorable" in us["muc.thuan"] and "Favourable" in en["muc.thuan"]
    assert loi.bang("vi") == {}


def test_nap_doc_bien_the_khong_co_tep_thi_bang_ban_en():
    nap.xoa_nho()
    with ngon_ngu.dung("en"):
        a = nap.doc("giao_thoa_kb.json")
    with ngon_ngu.dung("en-us"):
        b = nap.doc("giao_thoa_kb.json")
    assert a == b and a["mau"]["tieu_de_dien_dat"] == "Where the readings meet"


def test_nap_doc_chong_bien_the(tmp_path, monkeypatch):
    """Tệp bản phủ biến thể (giả, trong thư mục tạm) chồng lên bản en: khoá có → thay, khoá không có → giữ bản en."""
    goc = nap.DATA
    tam = tmp_path / "data"
    (tam / "en").mkdir(parents=True)
    (tam / "en-us").mkdir()
    (tam / "x.json").write_text('{"a": "vi", "b": "vi", "c": "vi"}', "utf-8")
    (tam / "en" / "x.json").write_text('{"a": "en", "b": "en"}', "utf-8")
    (tam / "en-us" / "x.json").write_text('{"a": "us"}', "utf-8")
    monkeypatch.setattr(nap, "DATA", tam)
    monkeypatch.setattr(ngon_ngu, "_co_thu_muc", lambda ma: (tam / ma).is_dir())
    nap.xoa_nho()
    try:
        assert nap.doc("x.json") == {"a": "vi", "b": "vi", "c": "vi"}
        with ngon_ngu.dung("en"):
            assert nap.doc("x.json") == {"a": "en", "b": "en", "c": "vi"}
        with ngon_ngu.dung("en-US"):
            assert nap.doc("x.json") == {"a": "us", "b": "en", "c": "vi"}
    finally:
        monkeypatch.setattr(nap, "DATA", goc)
        nap.xoa_nho()


def test_loi_L_theo_bien_the():
    with ngon_ngu.dung("en"):
        a = loi.L("muc.thuan", "Thuận lợi")
    with ngon_ngu.dung("en-us"):
        b = loi.L("muc.thuan", "Thuận lợi")
    assert (a, b) == ("Favourable", "Favorable")


def test_header_en_us_qua_middleware():
    """Header `x-ngon-ngu: en-US` → bản en-us; chuỗi tiếng Anh gốc ở chỗ khác không đổi (cùng lá, chỉ khác chính tả)."""
    r_en = client.get("/v1/tarot/bo-bai", headers={"x-ngon-ngu": "en"})
    r_us = client.get("/v1/tarot/bo-bai", headers={"x-ngon-ngu": "en-US"})
    assert r_en.status_code == r_us.status_code == 200
    assert r_en.json()["la"]["dai_0"]["ten"] == r_us.json()["la"]["dai_0"]["ten"] == "The Fool"


def test_lech_so_bien_the_voi_ban_goc_ngon_ngu():
    dong = [
        {"mau": "ds.tarot.x", "ngon_ngu": "vi", "dung": 90, "chua_dung": 10},
        {"mau": "ds.tarot.x", "ngon_ngu": "en", "dung": 85, "chua_dung": 15},
        {"mau": "ds.tarot.x", "ngon_ngu": "en-us", "dung": 40, "chua_dung": 60},
    ]
    kq = lnn.quet(dong)
    so_voi = {(x["ngon_ngu"], x["so_voi"]) for x in kq["lech"]}
    # en-us lệch so với vi (như trước) VÀ lệch so với en (A/B bản phủ); en không lệch so với vi
    assert ("en-us", "vi") in so_voi and ("en-us", "en") in so_voi and ("en", "vi") not in so_voi
    assert kq["so_ma_so"] == 3          # en↔vi, en-us↔vi, en-us↔en
    for x in kq["lech"]:
        assert x["so_voi"] in x["de_xuat"]


def test_lech_khong_so_khi_thieu_ban_goc_ngon_ngu():
    dong = [{"mau": "m", "ngon_ngu": "vi", "dung": 90, "chua_dung": 10}, {"mau": "m", "ngon_ngu": "en-us", "dung": 10, "chua_dung": 90}]
    kq = lnn.quet(dong)
    assert [x["so_voi"] for x in kq["lech"]] == ["vi"] and kq["so_ma_so"] == 1
