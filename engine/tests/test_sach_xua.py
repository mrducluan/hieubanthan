# -*- coding: utf-8 -*-
"""SX-1 — "Sách xưa nói gì về lá số của bạn": mỗi câu phải là nguyên văn ĐÃ CÓ trong KB (không sinh câu mới), có tóm ý Việt,
gắn đúng dữ kiện của lá số; chỉ bản tiếng Việt; không quá 5 câu."""
from __future__ import annotations

import datetime as dt
import json

import pytest
from fastapi.testclient import TestClient

from app import ngon_ngu
from app.kb import battu_kb, tuvi_kb
from app.luangiai import sach_xua
from app.main import app

C = TestClient(app)
CA = [("1990-05-17", "09:30", "nam"), ("1985-11-02", "23:15", "nu"), ("2001-02-03", "05:00", "nu"), ("1976-08-21", "14:45", "nam")]


def _goi(duong: str, ca) -> dict:
    r = C.post(duong, json={"birth_date": ca[0], "birth_time": ca[1], "gender": ca[2]})
    assert r.status_code == 200, r.text
    return r.json()


@pytest.mark.parametrize("ca", CA)
def test_battu_co_cau_sach_dung_la_so(ca):
    ls = _goi("/v1/battu/la-so", ca)
    ds = ls["sach_xua"]
    assert 2 <= len(ds) <= sach_xua.TOI_DA
    for x in ds:
        assert set(x) >= {"loai", "ve", "sach", "han", "y"} and x["han"] and x["y"] and x["sach"], x
    nc = next(x for x in ds if x["loai"] == "nhat_chu")
    assert nc["han"] == battu_kb.co_tho(ls["nhat_chu"]["can"])["han"] and ls["nhat_chu"]["can"] in nc["ve"]
    dh = next(x for x in ds if x["loai"] == "dieu_hau")
    assert dh["han"] == ls["mo_rong"]["dieu_hau_ctbg"]["trich"]
    for x in ds:
        if x["loai"] == "than_sat":                       # chỉ sao tốt, và chỉ sao bảng engine khớp sách
            ts = next(t for t in ls["mo_rong"]["than_sat"] if t["sach"]["han"] == x["han"])
            assert ts["loai"] == "cát" and ts["sach"]["khop"]


@pytest.mark.parametrize("ca", CA)
def test_tuvi_chi_cau_co_trong_kb(ca):
    la = _goi("/v1/tuvi/an-sao", ca)
    ds = la["sach_xua"]
    assert len(ds) <= sach_xua.TOI_DA
    kho = json.dumps([tuvi_kb._d().get("phu_tinh_cung"), tuvi_kb._cc(), sach_xua._cau_phu()], ensure_ascii=False)
    ma_cat = {c["ma"] for c in la["cach_cuc"] if c.get("nhom") == "cát"}
    for x in ds:
        assert x["han"] in kho and x["y"], x
        if x["loai"] == "cach_cuc":
            assert x["ma"] in ma_cat                      # không nhắc lại lời nặng của cách "cần lưu ý"


def test_khong_tu_doa():
    cam = ("chết", "yểu", "nghèo hèn", "ăn mày", "tù", "hình khắc", "sẽ ")
    for ca in CA:
        for x in _goi("/v1/battu/la-so", ca)["sach_xua"] + _goi("/v1/tuvi/an-sao", ca)["sach_xua"]:
            assert not any(t in (x["y"] + x["ve"]).lower() for t in cam), x


def test_ban_anh_bat_tu_cung_khung_khong_chu_viet():
    b = {"birth_date": "1990-05-17", "birth_time": "09:30", "gender": "nam"}
    vi = C.post("/v1/battu/la-so", json=b).json()["sach_xua"]
    en = C.post("/v1/battu/la-so", json=b, headers={"x-ngon-ngu": "en"}).json()["sach_xua"]
    assert [(x["loai"], x["han"]) for x in vi] == [(x["loai"], x["han"]) for x in en]
    import re
    for x in en:
        assert not re.search(r"[ăâđêôơưĂÂĐÊÔƠƯàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]", x["ve"] + x["y"] + x["sach"]), x
    assert not C.post("/v1/tuvi/an-sao", json=b, headers={"x-ngon-ngu": "en"}).json()["sach_xua"]
