# -*- coding: utf-8 -*-
"""Gói 1A — Đối chiếu Huyền Không Phi Tinh với cổ thư Thẩm Thị Huyền Không Học & Tử Bạch Đoạn / Phi Tinh Phú."""
from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.calc import huyen_khong as hk
from app.kb import sach_ghi as sg
from app.main import app

_GOC = Path(__file__).resolve().parents[1]
_GOLDEN = json.loads((_GOC / "fixtures" / "golden" / "huyen_khong_tham_thi.json").read_text("utf-8"))
_KB_PATH = _GOC / "app" / "kb" / "data" / "phongthuy_huyen_khong.json"
client = TestClient(app)


@pytest.mark.parametrize("ca", _GOLDEN["ha_quai"], ids=lambda c: c["id"])
def test_ha_quai_khop_tham_thi(ca):
    b = hk.trach_ban(ca["nam_xay"], ca["toa"], the_quai=False)
    by_c = {c["cung"]: [c["son"], c["huong"], c["van"]] for c in b["cung"]}
    for cung, ky_vong in ca["cung"].items():
        assert by_c[cung] == ky_vong, f"{ca['id']} cung {cung}: got {by_c[cung]}, expected {ky_vong}"


@pytest.mark.parametrize("ca", _GOLDEN["the_quai"], ids=lambda c: c["id"])
def test_the_quai_khop_tham_thi(ca):
    b = hk.trach_ban(ca["nam_xay"], ca["toa"], the_quai=True)
    by_c = {c["cung"]: [c["son"], c["huong"], c["van"]] for c in b["cung"]}
    mau = ca.get("cung") or ca["cung_mau"]
    for cung, ky_vong in mau.items():
        assert by_c[cung] == ky_vong, f"{ca['id']} cung {cung}: got {by_c[cung]}, expected {ky_vong}"


@pytest.mark.parametrize("ca", _GOLDEN["thanh_mon"], ids=lambda c: c["id"])
def test_thanh_mon_khop_tham_thi(ca):
    tm = hk.thanh_mon(ca["van"], ca["toa"])
    assert tm["chinh"]["cung"] == ca["chinh_cung"]
    assert tm["chinh"]["dung_duoc"] is ca["chinh_dung"]
    assert tm["phu"]["cung"] == ca["phu_cung"]
    assert tm["phu"]["dung_duoc"] is ca["phu_dung"]
    if "chinh_son" in ca:
        assert tm["chinh"]["son"] == ca["chinh_son"]
    if "phu_son" in ca:
        assert tm["phu"]["son"] == ca["phu_son"]


def test_to_hop_81_sach_qua_bo_kiem_sx_c():
    n, loi = sg.kiem_tep(_KB_PATH)
    assert n >= 28, f"Kỳ vọng ít nhất 28 mục sách xưa trong to_hop_81, thực tế {n}"
    assert not loi, "Lỗi kiểm định SX-C:\n" + "\n".join(loi)


def test_api_huyen_khong_tra_y_cap_va_thanh_mon():
    r = client.post("/v1/phongthuy/huyen-khong", json={"nam_xay": 2024, "toa": "Ngọ"})
    assert r.status_code == 200
    d = r.json()
    assert "thanh_mon" in d
    assert d["thanh_mon"]["chinh"]["cung"] in ("Càn", "Cấn")
    assert len(d["cung"]) == 9
    for c in d["cung"]:
        yc = c["y_cap"]
        assert yc["ma"] == f"{c['son']}-{c['huong']}"
        assert yc["ten"] and yc["y"] and yc["hop_cho"]
    # Vận 8 Toạ Tý (2004) có các cặp 1-4, 2-5, 6-7, 8-9… kiểm tra sach_ghi cổ thư trả về qua API
    r2 = client.post("/v1/phongthuy/huyen-khong", json={"nam_xay": 2004, "toa": "Tý"})
    assert r2.status_code == 200
    d2 = r2.json()
    co_sach = [c["y_cap"]["sach_ghi"] for c in d2["cung"] if c["y_cap"].get("sach_ghi")]
    assert co_sach, "Ít nhất một cung trong bàn mẫu phải có trích dẫn sach_ghi cổ thư"
    assert all(x["loi"] for x in co_sach)
