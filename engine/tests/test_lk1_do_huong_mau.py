# -*- coding: utf-8 -*-
"""LK-1 — hướng nhà từ MẪU la bàn thô: engine là bộ tính duy nhất (web chỉ gửi mẫu). Viết trước phần route."""
import pytest
from fastapi.testclient import TestClient

from app.calc import vi_tri_vat as vt
from app.main import app

client = TestClient(app)


def test_quanh_bac_khong_bao_gio_ra_360():
    # lỗi cũ ở web: trung bình 359,96–359,98 làm tròn thành 360 → engine từ chối, nhà hướng chính Bắc không chốt được
    r = vt.do_tu_mau([359.96, 359.97, 359.98, 359.99])
    assert r["do"] == 0.0 and 0 <= r["do"] < 360
    assert vt.do_tu_mau([359.0, 1.0])["do"] == 0.0
    assert vt.do_tu_mau([0.02, 359.99])["do"] == 0.0


def test_muc_on_dinh_theo_do_rung():
    assert vt.do_tu_mau([180, 180.4, 179.7, 180.1])["on_dinh"] == "on"
    assert vt.do_tu_mau([176, 184, 177, 183, 180])["on_dinh"] == "giu_yen"
    assert vt.do_tu_mau([170, 190, 168, 192])["on_dinh"] == "do_lai"
    # rung ±10° KHÔNG được coi là ổn (bản web cũ hiện "99 %")
    assert vt.do_tu_mau([170, 190] * 8)["on_dinh"] == "do_lai"


def test_ios_chua_hieu_chinh_khong_duoc_coi_la_tot():
    assert vt.do_tu_mau([90, 90.1], sai_so=-1)["can_hieu_chinh"] is True
    assert vt.do_tu_mau([90, 90.1], sai_so=-1)["on_dinh"] == "do_lai"
    assert vt.do_tu_mau([90, 90.1], sai_so=35)["on_dinh"] == "do_lai"
    assert vt.do_tu_mau([90, 90.1], sai_so=10)["on_dinh"] == "on"
    assert vt.do_tu_mau([90, 90.1])["can_hieu_chinh"] is False


def test_mau_ngoai_khoang_bi_tu_choi():
    with pytest.raises(ValueError):
        vt.do_tu_mau([360.0])
    with pytest.raises(ValueError):
        vt.do_tu_mau([])


def test_hai_lan_do():
    k = vt.so_hai_lan([358, 359], [1, 2])                 # vắt qua Bắc, lệch 3°
    assert k["nhieu"] is False and k["lech"] == 3.0 and k["do"] == 0.0
    k = vt.so_hai_lan([180, 180.2], [192, 192.4])
    assert k["nhieu"] is True and k["do"] is None and k["lech"] == pytest.approx(12.1, abs=0.2)


def test_route_nhan_mau_va_giu_nguyen_dau_ra_cu():
    cu = client.post("/v1/phongthuy/do-huong", json={"do_huong": 183.2}).json()
    assert "do" not in cu and "hai_lan" not in cu                       # đầu ra cũ không đổi (golden bản Việt)
    r = client.post("/v1/phongthuy/do-huong", json={"mau": [183.0, 183.4, 183.2, 183.2]})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["do_huong"] == 183.2 and d["huong"] == cu["huong"] and d["son_huong"] == cu["son_huong"]
    assert d["do"]["on_dinh"] == "on" and d["do"]["so_mau"] == 4 and d["do"]["loi"]
    # quanh Bắc
    d = client.post("/v1/phongthuy/do-huong", json={"mau": [359.96, 359.98, 359.97]}).json()
    assert d["do_huong"] == 0.0 and d["huong"] == "Bắc"


def test_route_hai_lan():
    d = client.post("/v1/phongthuy/do-huong", json={"mau": [180, 180.2], "mau_2": [181, 181.2]}).json()
    assert d["hai_lan"]["nhieu"] is False and d["do_huong"] == pytest.approx(180.6, abs=0.11)
    d = client.post("/v1/phongthuy/do-huong", json={"mau": [180, 180.2], "mau_2": [200, 200.2]}).json()
    assert d["hai_lan"]["nhieu"] is True and d["hai_lan"]["loi"]
    assert d["do_huong"] == 180.1                                       # nhiễu: giữ lần 1, không gộp
    assert d["do"]["on_dinh"] == "do_lai"                               # và không cho coi là đã chắc


def test_route_422():
    p = "/v1/phongthuy/do-huong"
    assert client.post(p, json={}).status_code == 422
    assert client.post(p, json={"do_huong": 10, "mau": [10]}).status_code == 422
    assert client.post(p, json={"mau": [361]}).status_code == 422
    assert client.post(p, json={"do_huong": 10, "mau_2": [10]}).status_code == 422
    assert client.post(p, json={"mau": [1.0] * 241}).status_code == 422
    assert client.post(p, json={"mau": [10], "sai_so": -5}).status_code == 422
