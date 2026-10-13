# -*- coding: utf-8 -*-
"""Phái Chaldea (TS-PHAI) — viết TRƯỚC hàm, đáp án tính tay ở fixtures/golden/thanso_chaldean.json."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.calc import thanso_chaldean as ch

G = json.loads((Path(__file__).parents[1] / "fixtures" / "golden" / "thanso_chaldean.json").read_text(encoding="utf-8"))
KB = json.loads((Path(__file__).parents[1] / "app" / "kb" / "data" / "thanso_chaldean.json").read_text(encoding="utf-8"))


def test_bang_chu_khop_kb_va_khong_co_so_9():
    for so, chu in KB["bang_chu"].items():
        for c in chu.split():
            assert ch.gia_tri(c) == int(so), c
    assert {ch.gia_tri(chr(c)) for c in range(65, 91)} == set(range(1, 9))


@pytest.mark.parametrize("ca", G["ca"], ids=lambda c: c["ho_ten"])
def test_golden(ca):
    kq = ch.tinh(ca["ho_ten"], ca["ngay"], ca["thang"], ca["nam"])
    for k, mong in ca.items():
        if isinstance(mong, dict):
            assert {x: kq[k][x] for x in mong} == mong, k


def test_so_kep_va_goc():
    assert ch.kep_goc(9) == (None, 9)
    assert ch.kep_goc(52) == (52, 7)
    assert ch.kep_goc(59) == (14, 5)
    assert ch.kep_goc(99) == (18, 9)     # 99 → 18 → 9
    assert ch.kep_goc(11) == (11, 2)     # không giữ số cái


def test_tat_dinh():
    a = ch.tinh("Trần Thị Yến", 3, 4, 2001)
    assert a == ch.tinh("Trần Thị Yến", 3, 4, 2001)


def test_kb_du_muc_va_dung_chuan():
    assert sorted(KB["goc"], key=int) == [str(i) for i in range(1, 10)]
    assert sorted(KB["kep"], key=int) == [str(i) for i in range(10, 53)]
    for m in list(KB["goc"].values()) + list(KB["kep"].values()):
        assert m["cau_tu_soi"].rstrip().endswith("?")
    assert KB["source"]["id"] == KB["source_id"] and KB["school_id"] and KB["trang_thai"] in ("nhap_ai", "da_duyet")


def test_luan_chaldea_du_vi_tri_va_doi_chieu():
    from app.luangiai import thanso_chaldean as lc
    kq = lc.luan_chaldea(["Nguyễn Văn An"], 15, 8, 1990)
    ma = [m["ma"] for m in kq["cac_so"]]
    assert ma == ["ten_goi", "so_ten", "ngay_sinh", "duong_doi", "linh_hon", "nhan_cach"]
    so_ten = kq["cac_so"][1]
    assert (so_ten["kep"], so_ten["goc"]) == (43, 7)
    assert so_ten["nghia_goc"]["cau_tu_soi"].endswith("?") and so_ten["nghia_kep"]["bieu_tuong"]
    assert "N(5)" in so_ten["cach_tinh"] and so_ten["cach_tinh"].endswith("gốc 7")
    dd = kq["cac_so"][3]
    assert dd["pitago"] == {"ten": "Đường đời", "so": 33, "khac": True}   # Pitago giữ số cái 33, Chaldea rút về 6
    assert kq["school_id"] == "chaldean_cheiro"


def test_ten_goi_lay_bien_the_thu_hai():
    from app.luangiai import thanso_chaldean as lc
    kq = lc.luan_chaldea(["Nguyễn Văn An", "Bin"], 15, 8, 1990)
    tg = kq["cac_so"][0]
    assert tg["ten_goi"] == "Bin" and tg["tong"] == 2 + 1 + 5


def test_ngay_chaldea():
    from app.luangiai import thanso_chaldean as lc
    d = lc.ngay_chaldea(15, 24)
    assert (d["so"], d["kep"], d["so_ngay_sinh"], d["cong_huong"]) == (6, 24, 6, True)


def test_api_chaldea():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).post("/v1/thanso/chaldea", json={"ho_ten": ["Lê Thị Hoa"], "ngay": 7, "thang": 3, "nam": 1985})
    assert r.status_code == 200
    j = r.json()
    assert j["phai"] == "chaldea" and j["cac_so"][0]["ten_goi"] == "Hoa" and j["cac_so"][0]["kep"] == 13
    assert TestClient(app).post("/v1/thanso/chaldea", json={"ho_ten": ["A"], "ngay": 31, "thang": 2, "nam": 1985}).status_code == 422
