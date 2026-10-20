# -*- coding: utf-8 -*-
"""TS-V3 — hai quy ước cộng đường đời, người dùng chọn.

- `tong_het` (mặc định, phổ biến ở sách/web thần số Việt Nam): cộng MỌI chữ số ngày-tháng-năm rồi rút gọn.
- `tung_phan` (Decoz, Juno Jordan — phổ biến ở sách phương Tây; bản V3 dùng cách này): rút gọn riêng ngày, tháng,
  năm (giữ số cái) rồi cộng, rút gọn lần nữa.
Đáp án tính tay. Đổi quy ước chỉ đổi số Đường đời và những gì dẫn từ nó (mốc đỉnh 1, trưởng thành, nợ nghiệp vị trí
đường đời) — các chỉ số tên không đổi.
"""
from __future__ import annotations

import datetime as dt

import pytest
from fastapi.testclient import TestClient

from app.calc import thanso, thanso_mo_rong as mr
from app.luangiai import hoi, noi_dau, thanso as lts
from app.main import app

# (ngày, tháng, năm, tổng hết, từng phần) — tính tay:
# 24/10/1988: 2+4+1+0+1+9+8+8 = 33 (số cái) | 24→6, 10→1, 1988→26→8 → 15 → 6
# 29/2/1996:  2+9+2+1+9+9+6 = 38 → 11      | 29→11 (giữ), 2, 1996→25→7 → 20 → 2
# 17/5/1990:  1+7+5+1+9+9+0 = 32 → 5       | 17→8, 5, 1990→19→10→1 → 14 → 5
GOLDEN = [(24, 10, 1988, 33, 6), (29, 2, 1996, 11, 2), (17, 5, 1990, 5, 5)]
TEN = "Nguyễn Đức Luân"


@pytest.mark.parametrize("d,m,y,th,tp", GOLDEN)
def test_hai_quy_uoc(d, m, y, th, tp):
    assert thanso.duong_doi(d, m, y, "tong_het") == th
    assert thanso.duong_doi(d, m, y, "tung_phan") == tp
    assert thanso.chi_so_xac_dinh(TEN, d, m, y)["duong_doi"] == th            # mặc định không đổi
    assert thanso.chi_so_xac_dinh(TEN, d, m, y, "tung_phan")["duong_doi"] == tp


def test_vet_tinh_tung_phan():
    v = thanso.vet_tinh(TEN, 24, 10, 1988, "tung_phan")["duong_doi"]
    assert [x["so"] for x in v["so_hang"]] == [6, 1, 8]
    assert v["ket_qua"] == 6 and v["rut_gon"] == [15, 6]
    assert thanso.vet_tinh(TEN, 24, 10, 1988)["duong_doi"]["ket_qua"] == 33


def test_no_nghiep_duong_doi_theo_quy_uoc():
    # 19/9/1989: tổng hết 1+9+9+1+9+8+9 = 46 → 10 → 1 (không chạm 13/14/16/19);
    # từng phần 19→10→1, 9, 1989→27→9 → 19 → nợ nghiệp 19 ở vị trí đường đời.
    vt = lambda q: {x["vi_tri"]: x["so"] for x in mr.no_nghiep(None, 19, 9, 1989, q)}
    assert "duong_doi" not in vt("tong_het")
    assert vt("tung_phan")["duong_doi"] == 19


def test_luan_giai_theo_quy_uoc():
    a = lts.luan_giai([TEN], 24, 10, 1988)
    b = lts.luan_giai([TEN], 24, 10, 1988, quy_uoc="tung_phan")
    dd = lambda r: next(v for v in r["cac_vi_tri"] if v["vi_tri"] == "duong_doi")["gia_tri"]
    assert (dd(a), dd(b)) == (33, 6)
    assert a["quy_uoc_duong_doi"] == "tong_het" and b["quy_uoc_duong_doi"] == "tung_phan"
    assert a["duong_doi_hai_cach"] == b["duong_doi_hai_cach"] == {"tong_het": 33, "tung_phan": 6, "lech": True}
    # Chỉ số tên giữ nguyên.
    sm = lambda r: next(v for v in r["cac_vi_tri"] if v["vi_tri"] == "su_menh")["gia_tri"]
    assert sm(a) == sm(b) == 9


def test_hoi_dap_va_bang_noi_dau_theo_quy_uoc():
    ngay = dt.date(2026, 10, 19)
    cs = hoi._chi_so_nguoi({"ho_ten": [TEN], "ngay": 24, "thang": 10, "nam": 1988, "quy_uoc": "tung_phan"}, ngay)
    assert cs["duong_doi"] == 6
    bd = noi_dau.ban_do([TEN], 24, 10, 1988, ngay, quy_uoc="tung_phan")
    so = {s["ma"]: s["gia_tri"] for t in bd["tru"] for q in t["cau_hoi"] for s in q["so"]}
    assert so["duong_doi"] == 6


def test_api():
    c = TestClient(app)
    body = {"ho_ten": [TEN], "ngay": 24, "thang": 10, "nam": 1988}
    r = c.post("/v1/thanso/luan-giai", json={**body, "quy_uoc_duong_doi": "tung_phan"})
    assert r.status_code == 200 and r.json()["quy_uoc_duong_doi"] == "tung_phan"
    assert c.post("/v1/thanso/luan-giai", json={**body, "quy_uoc_duong_doi": "bua"}).status_code == 422
    r = c.post("/v1/thanso/hoi", json={**body, "quy_uoc_duong_doi": "tung_phan", "cau_hoi": "Số chủ đạo của tôi nói gì?"})
    assert r.status_code == 200 and "số chủ đạo (đường đời) 6" in r.json()["cau_tra_loi"]
