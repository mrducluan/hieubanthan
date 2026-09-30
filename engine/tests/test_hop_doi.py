# -*- coding: utf-8 -*-
"""Hợp đôi có cấu trúc (UI-5): cặp số theo vị trí + nghĩa KB. Không chấm điểm hợp/khắc."""
from fastapi.testclient import TestClient

from app.calc import thanso, thanso_mo_rong as mr
from app.luangiai import hop_doi as hd
from app.main import app

LUAN = {"ho_ten": ["Nguyễn Đức Luân"], "ngay": 24, "thang": 10, "nam": 1988}
KIA = {"ngay": 13, "thang": 5, "nam": 1990}


def test_chi_ngay_sinh_chi_co_cap_duong_doi():
    kq = hd.luan_hop_doi(LUAN, KIA)
    assert [c["vi_tri"] for c in kq["cac_cap"]] == ["duong_doi"]
    c = kq["cac_cap"][0]
    assert (c["so_a"], c["so_b"]) == (33, thanso.duong_doi(13, 5, 1990))
    assert c["cap"] == mr.cap_so(33, c["so_b"])
    assert c["nghia"] and {"hoa", "va", "cung_lam"} <= set(c["nghia"])


def test_co_ten_hai_ben_them_linh_hon_nhan_cach_su_menh():
    kq = hd.luan_hop_doi(LUAN, {**KIA, "ho_ten": ["Trần Thị Mai"]})
    assert [c["vi_tri"] for c in kq["cac_cap"]] == ["duong_doi", "linh_hon", "nhan_cach", "su_menh"]
    for c in kq["cac_cap"]:
        x, y = sorted((mr.so_goc(c["so_a"]), mr.so_goc(c["so_b"])))
        assert c["cap"] == f"{x}-{y}"


def test_khong_cham_diem_va_co_nguon():
    kq = hd.luan_hop_doi(LUAN, KIA)
    assert "diem" not in kq and "phan_tram" not in str(kq)
    assert kq["nguon"]["source_id"]
    assert kq["a"]["duong_doi"] == 33 and kq["a"]["tu_khoa"]


def test_doi_xung_cap():
    ab = hd.luan_hop_doi(LUAN, KIA)["cac_cap"][0]["cap"]
    ba = hd.luan_hop_doi(KIA, LUAN)["cac_cap"][0]["cap"]
    assert ab == ba


def test_api_hop_doi():
    c = TestClient(app)
    r = c.post("/v1/thanso/hop-doi", json={"a": LUAN, "b": KIA})
    assert r.status_code == 200 and r.json()["cac_cap"][0]["so_a"] == 33
    assert c.post("/v1/thanso/hop-doi", json={"a": LUAN, "b": {"ngay": 31, "thang": 2, "nam": 1990}}).status_code == 422


def test_tu_chi_so_trung_voi_tu_ngay_sinh():
    # Lời mời chỉ mang CON SỐ của người mời (không ngày sinh) → so cặp từ số phải khớp so từ ngày sinh.
    kia = {**KIA, "ho_ten": ["Trần Thị Mai"]}
    tu_ngay = hd.luan_hop_doi(LUAN, kia)
    cs_a = thanso.chi_so_xac_dinh("Nguyễn Đức Luân", 24, 10, 1988)
    cs_b = thanso.chi_so_xac_dinh("Trần Thị Mai", 13, 5, 1990)
    assert hd.luan_hop_doi_tu_chi_so(cs_a, cs_b)["cac_cap"] == tu_ngay["cac_cap"]


def test_api_cap_so_chan_so_khong_hop_le():
    c = TestClient(app)
    ok = c.post("/v1/thanso/cap-so", json={"a": {"duong_doi": 33, "su_menh": 9}, "b": {"duong_doi": 5}})
    assert ok.status_code == 200 and [x["vi_tri"] for x in ok.json()["cac_cap"]] == ["duong_doi"]
    assert c.post("/v1/thanso/cap-so", json={"a": {"duong_doi": 10}, "b": {"duong_doi": 5}}).status_code == 422
