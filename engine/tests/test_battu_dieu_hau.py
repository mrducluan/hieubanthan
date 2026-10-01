# -*- coding: utf-8 -*-
"""KB-3 — dụng thần điều hậu theo Cùng Thông Bảo Giám (10 nhật chủ × 12 tháng). Test viết TRƯỚC."""
from __future__ import annotations

import datetime as dt

import pytest

from app.calc import battu as bt, battu_mo_rong as mr, can_chi
from app.kb import battu_kb


def test_bang_du_120_o_hop_le():
    for can in can_chi.CAN:
        for chi in can_chi.CHI:
            ds = battu_kb.dieu_hau(can, chi)["can"]
            assert ds and all(c in can_chi.CAN for c in ds) and len(set(ds)) == len(ds), (can, chi)


@pytest.mark.parametrize("can,chi,dau", [
    ("Giáp", "Dần", ["Bính", "Quý"]), ("Bính", "Ngọ", ["Nhâm", "Canh"]), ("Quý", "Thân", ["Đinh"]),
    ("Canh", "Ngọ", ["Nhâm", "Quý"]), ("Nhâm", "Tý", ["Mậu", "Bính"]), ("Ất", "Tý", ["Bính"]),
])
def test_mau_bang(can, chi, dau):
    assert battu_kb.dieu_hau(can, chi)["can"] == dau


def test_dieu_hau_tren_la_so():
    from app.battu_api import dieu_hau
    ls = bt.la_so(dt.datetime(1990, 5, 17, 12, 30), "nam")           # Nhâm sinh tháng Tỵ
    d = dieu_hau(ls)
    assert [x["can"] for x in d["chi_tiet"]] == ["Nhâm", "Tân", "Canh", "Quý"]
    nham = d["chi_tiet"][0]
    assert nham["thap_than"] == "Tỷ Kiên" and nham["hanh"] == "Thủy" and nham["thau"] is False
    canh = next(x for x in d["chi_tiet"] if x["can"] == "Canh")
    assert canh["thau"] is True                                      # Canh lộ ở trụ năm
    assert d["mua"] == "ha" and d["mua_y"]
    assert d["nguon"].startswith("Cùng Thông Bảo Giám")


def test_api_la_so_co_dieu_hau():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).post("/v1/battu/la-so", json={"birth_date": "1990-05-17", "birth_time": "12:30",
                                                      "gender": "nam", "noi_sinh": "ha-noi"})
    assert r.json()["mo_rong"]["dieu_hau_ctbg"]["chi_tiet"][0]["can"] == "Nhâm"


def test_calc_khong_doc_kb():
    import inspect
    assert "app.kb" not in inspect.getsource(mr)


def test_hoi_dung_than_trich_ctbg():
    from app.hoidap import battu as hd
    kq = hd.tra_loi("Dụng thần của tôi là gì?", sinh={"lich": dt.datetime(1990, 5, 17, 12, 30), "gioi_tinh": "nam"})
    assert "Cùng Thông Bảo Giám" in kq["cau_tra_loi"] and "Nhâm (Tỷ Kiên" in kq["cau_tra_loi"]
