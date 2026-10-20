# -*- coding: utf-8 -*-
"""TS-V3 — thần số Qabalah Hermetic (phái thứ ba). Khoá bằng đáp án tính tay fixtures/golden/thanso_kabbalah.json."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import thanso_kabbalah as kb_calc
from app.luangiai import thanso_kabbalah as lkb
from app.main import app

GOLD = json.loads((Path(__file__).parents[1] / "fixtures/golden/thanso_kabbalah.json").read_text(encoding="utf-8"))
KB = json.loads((Path(__file__).parents[1] / "app/kb/data/thanso_kabbalah.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("ca", GOLD["ca"], ids=lambda c: c["ho_ten"])
def test_golden(ca):
    kq = kb_calc.tinh(ca["ho_ten"], ca["ngay"], ca["thang"], ca["nam"])
    assert [t["tong"] for t in kq["theo_tu"]] == ca["theo_tu"]
    assert kq["tong"] == ca["tong"]
    assert kq["con_duong"] == ca["con_duong"]
    assert kq["sephirah_ten"] == ca["sephirah_ten"]
    assert kq["sephirah_ngay_sinh"] == ca["sephirah_ngay_sinh"]
    assert kq["con_duong_khac"] == ca["con_duong_khac"]


def test_chu_ghep_va_vet():
    vet = kb_calc.tinh("Thị Bích", 1, 1, 2000)["theo_tu"]
    assert [(c["chu"], c["hebrew"], c["so"]) for c in vet[0]["chu"]] == [("TH", "Tav", 400), ("I", "Yod", 10)]
    assert [c["hebrew"] for c in vet[1]["chu"]] == ["Beth", "Yod", "Cheth"]


def test_rut_gon():
    assert kb_calc.ve_con_duong(22) == 22 and kb_calc.ve_con_duong(23) == 5 and kb_calc.ve_con_duong(769) == 22
    assert kb_calc.ve_sephirah(10) == 10 and kb_calc.ve_sephirah(28) == 10 and kb_calc.ve_sephirah(33) == 6


def test_kb_du_22_chu_10_sephirah_va_nguon():
    assert KB["source_id"] and KB["school_id"] == "kabbalah_hermetic" and KB["trang_thai"]
    assert sorted(int(k) for k in KB["chu"]) == list(range(1, 23))
    assert sorted(int(k) for k in KB["sephirot"]) == list(range(1, 11))
    for m in list(KB["chu"].values()) + list(KB["sephirot"].values()):
        assert m["xu_huong"] and m["mat_toi"] and m["cau_tu_soi"].endswith("?")
    assert [KB["chu"][str(i)]["ten"] for i in range(1, 23)] == kb_calc.CHU_HEBREW


def test_luan_kabbalah():
    kq = lkb.luan_kabbalah(["Nguyễn Đức Luân"], 24, 10, 1988)
    ma = {s["ma"]: s for s in kq["cac_so"]}
    assert ma["con_duong_ten"]["so"] == 7 and ma["con_duong_ten"]["nghia"]["ten"] == "Zayin"
    assert ma["sephirah_ngay_sinh"]["so"] == 6 and ma["sephirah_ngay_sinh"]["nghia"]["ten"] == "Tiferet"
    assert ma["con_duong_ten"]["khac"] == [6]
    assert ma["con_duong_ten"]["so_duong_cay"] == 17 and "con đường số 17" in ma["con_duong_ten"]["mo_ta"]
    assert kq["school_id"] == "kabbalah_hermetic"
    assert "Do Thái" in kq["gioi_thieu"]["luu_y"]


def test_api():
    r = TestClient(app).post("/v1/thanso/kabbalah", json={"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988})
    assert r.status_code == 200 and r.json()["phai"] == "kabbalah"
    assert "AI nháp" not in r.text


# ---------------------------------------------------------------- Cây của hai người + chữ của ngày (TS-V3b)
CAY = json.loads((Path(__file__).parents[1] / "fixtures/golden/thanso_kabbalah_cay.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("ca", CAY["duong_noi"], ids=lambda c: f"{c['a']}-{c['b']}")
def test_duong_noi_golden(ca):
    kq = kb_calc.duong_noi(ca["a"], ca["b"])
    assert kq["sephirot"] == ca["sephirot"]
    assert [p["chu"] for p in kq["con_duong"]] == ca["chu"]
    assert kq["so_loi"] == ca["so_loi"]


def test_cay_khop_kb_va_doi_xung():
    ten_seph = {int(k): v["ten"] for k, v in KB["sephirot"].items()}
    for n, (x, y) in kb_calc.CAY.items():
        assert KB["chu"][str(n)]["con_duong"] == f"{ten_seph[x]} – {ten_seph[y]}"
    for a in range(1, 11):
        for b in range(1, 11):
            di, ve = kb_calc.duong_noi(a, b), kb_calc.duong_noi(b, a)
            assert di["sephirot"] == ve["sephirot"][::-1] and di["so_loi"] == ve["so_loi"]
            for p in di["con_duong"]:
                assert {p["tu"], p["den"]} == set(kb_calc.CAY[p["chu"]]) and p["so_duong_cay"] == p["chu"] + 10
    with pytest.raises(ValueError):
        kb_calc.duong_noi(0, 11)


@pytest.mark.parametrize("ca", CAY["chu_cua_ngay"], ids=lambda c: f"{c['ngay']}-{c['thang']}-{c['nam']}")
def test_chu_cua_ngay_golden(ca):
    kq = kb_calc.chu_cua_ngay(ca["ngay_sinh"], ca["thang_sinh"], ca["ngay"], ca["thang"], ca["nam"])
    assert (kq["tong"], kq["chu"], kq["ten"]) == (ca["tong"], ca["chu"], ca["ten"])
